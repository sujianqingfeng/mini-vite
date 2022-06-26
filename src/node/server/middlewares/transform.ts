import { NextHandleFunction } from 'connect'
import createDebug from 'debug'

import {
  isJsRequest,
  isCssRequest,
  clearUrl,
  isImportRequest
} from '../../utils'
import { ServerContext } from '../index'

const debug = createDebug('dev')

export async function transformRequest(
  url: string,
  serverContext: ServerContext
) {
  const { pluginContainer, moduleGraph } = serverContext

  url = clearUrl(url)
  let mod = moduleGraph.getModuleByUrl(url)

  // 如果存在缓存的结果 就直接返回
  if (mod && mod.transformResult) {
    return mod.transformResult
  }

  // 依次调用 resolveId load transform
  const resolvedResult = await pluginContainer.resolveId(url)
  let transformResult: any
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id)
    if (typeof code === 'object' && code != null) {
      code = code.code
    }
    // 注册模块
    mod = await moduleGraph.ensureEntryFromUrl(url)
    if (code) {
      transformResult = await pluginContainer.transform(code, resolvedResult.id)
    }
  }

  if(mod){
    mod.transformResult = transformResult
  }
  return transformResult
}

export function transformMiddleware(
  serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url) {
      return next()
    }

    const url = req.url

    debug('transformMiddleware:s%', url)

    if (isJsRequest(url) || isCssRequest(url) || isImportRequest(url)) {
      let result = await transformRequest(url, serverContext)

      if (!result) {
        return next()
      }

      if (result && typeof result !== 'string') {
        result = result.code
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/javascript')
      res.end(result)
    }

    next()
  }
}
