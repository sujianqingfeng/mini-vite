import { init, parse } from 'es-module-lexer'
import path from 'path'
import { pathExists } from 'fs-extra'
import resolve from 'resolve'
import MagicString from 'magic-string'

import {
  BARE_IMPORT_RE,
  DEFAULT_EXTENSIONS,
  PRE_BUNDLE_DIR,
  CLIENT_PUBLIC_PATH
} from '../constants'
import { clearUrl, isJsRequest, getShortName } from '../utils'
import { ServerContext } from '../server/index'
import { Plugin } from '../plugin'
import { transform } from 'esbuild'

export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext

  return {
    name: 'm-vite:import-analysis',
    configureServer(s) {
      serverContext = s
    },
    async transform(code: string, id: string) {
      if (!isJsRequest(id)) {
        return null
      }

      await init

      const [imports] = parse(code)
      const ms = new MagicString(code)

      const resolve = async (id: string, importer?: string) => {
        const resolved = await this.resolve(id, importer)

        if (!resolved) {
          return
        }

        const cleanedId = clearUrl(resolved.id)
        const mod = moduleGraph.getModuleById(cleanedId)
        let resolvedId = `/${getShortName(resolved.id, serverContext.root)}`
        if (mod && mod.lastHMRTimestamp > 0) {
          resolvedId += '?t=' + mod.lastHMRTimestamp
        }
        return resolvedId
      }

      const { moduleGraph } = serverContext
      const curMod = moduleGraph.getModuleById(id)!
      const importedModules = new Set<string>()

      for (const importInfo of imports) {
        const { s: modStart, e: modEnd, n: modSource } = importInfo
        if (!modSource) continue

        // 静态资源
        if (modSource.endsWith('.svg')) {
          const resolveUrl = path.join(path.dirname(id), modSource)
          // 打一个import 标记
          ms.overwrite(modStart, modEnd, `${resolveUrl}?import`)
          continue
        }

        // 三方库
        if (BARE_IMPORT_RE.test(modSource)) {
          const bundlePath = path.join(
            serverContext.root,
            PRE_BUNDLE_DIR,
            `${modSource}.js`
          )
          importedModules.add(bundlePath)
          ms.overwrite(modStart, modEnd, bundlePath)
        }
        // 项目里面的文件
        else if (modSource.startsWith('.') || modSource.startsWith('/')) {
          const resolved = await resolve(modSource, id)
          if (resolved) {
            ms.overwrite(modStart, modEnd, resolved)
            importedModules.add(resolved)
          }
        }
      }

      if (!id.includes('node_modules') && id !== CLIENT_PUBLIC_PATH) {
        ms.prepend(
          `import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";` +
            `import.meta.hot = __vite__createHotContext(${JSON.stringify(
              clearUrl(curMod.url)
            )});`
        )
      }

      moduleGraph.updateModuleInfo(curMod, importedModules)

      return {
        code: ms.toString(),
        map: ms.generateMap()
      }
    }
  }
}
