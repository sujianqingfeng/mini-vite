import { NextHandleFunction } from "connect"
// 用于加载静态资源的中间件
import sirv from "sirv"

import { isImportRequest } from "../../utils"

export function staticMiddle(): NextHandleFunction {
  const serveFromRoot = sirv("/", { dev: true })

  return (req, res, next) => {
    const url = req.url

    if (!url) {
      return
    }

    if (isImportRequest(url)) {
      return
    }

    serveFromRoot(req, res, next)
  }
}
