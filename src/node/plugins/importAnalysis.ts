import { init, parse } from "es-module-lexer"
import path from "path"
import { pathExists } from "fs-extra"
import resolve from "resolve"
import MagicString from "magic-string"

import {
  BARE_IMPORT_RE,
  DEFAULT_EXTENSIONS,
  PRE_BUNDLE_DIR,
} from "../constants"
import { clearUrl, isJsRequest } from "../utils"
import { ServerContext } from "../server/index"
import { Plugin } from "../plugin"
import { transform } from "esbuild"

export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext

  return {
    name: "m-vite:import-analysis",
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

      for (const importInfo of imports) {
        const { s: modStart, e: modEnd, n: modSource } = importInfo
        if (!modSource) continue

        // 静态资源
        if (modSource.endsWith(".svg")) {
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
          ms.overwrite(modStart, modEnd, bundlePath)
        }
        // 项目里面的文件
        else if (modSource.startsWith(".") || modSource.startsWith("/")) {
          const resolved = await this.resolve(modSource, id)
          if (resolved) {
            ms.overwrite(modStart, modEnd, resolved.id)
          }
        }
      }

      return {
        code: ms.toString(),
        map: ms.generateMap(),
      }
    },
  }
}
