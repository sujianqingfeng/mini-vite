import { NextHandleFunction } from "connect"
import path from "path"
import { fstat, pathExists, readFile } from "fs-extra"

import { ServerContext } from "../index"

export function indexHtmlMiddleware(
  serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.url === "/") {
      const { root } = serverContext
      // 默认使用根目录下的index.html
      const indexHtmlPath = path.join(root, "index.html")

      if (await pathExists(indexHtmlPath)) {
        const rawHtml = await readFile(indexHtmlPath, "utf-8")

        let html: any = rawHtml

        for (const plugin of serverContext.plugins) {
          if (plugin.transformHtml) {
            html = plugin.transformHtml(html)
          }
        }

        res.statusCode = 200
        res.setHeader("Content-Type", "text/html")

        return res.end(html)
      }
    }
    return next()
  }
}
