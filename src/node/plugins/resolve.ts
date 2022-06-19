import resolve from "resolve"
import path from "path"
import { pathExists } from "fs-extra"

import { Plugin } from "../plugin"
import { ServerContext } from "../server"
import { clearUrl } from "../utils"
import { DEFAULT_EXTENSIONS } from "../constants"

export function resolvePlugin(): Plugin {
  let serverContext: ServerContext

  return {
    name: "m-vite:resolve",
    configureServer(s) {
      serverContext = s
    },
    async resolveId(id: string, importer?: string) {
      // 绝对路径
      if (path.isAbsolute(id)) {
        if (await pathExists(id)) {
          return { id }
        }

        // 如果上面不能匹配
        // 加上root，检测是不是在项目里

        id = path.join(serverContext.root, id)
        if (await pathExists(id)) {
          return { id }
        }
      }
      // 相对路径
      else if (id.startsWith(".")) {
        if (!importer) {
          throw new Error("`importer` should not be undefined")
        }

        const hasExtension = path.extname(id).length > 1

        let resolveId: string

        // 有后缀
        if (hasExtension) {
          resolveId = resolve.sync(id, { basedir: path.dirname(importer) })
          if (await pathExists(resolveId)) {
            return { id: resolveId }
          }
        } else {
          // 没有后缀 用默认的后缀来解析
          for (const extname of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${extname}`
              resolveId = resolve.sync(withExtension, {
                basedir: path.dirname(importer),
              })

              if (await pathExists(resolveId)) {
                return { id: resolveId }
              }
            } catch (error) {
              continue
            }
          }
        }
      }

      return null
    },
  }
}
