import path from "path"

import { HASH_RE, JS_TYPES_RE, QUERY_RE } from "./constants"

export const isJsRequest = (id: string) => {
  id = clearUrl(id)

  if (JS_TYPES_RE.test(id)) {
    return true
  }

  // 没有后缀 并且不是/结尾
  if (!path.extname(id) && !id.endsWith("/")) {
    return true
  }

  return false
}

/**
 * 去除查询和哈希
 *
 * @param url
 * @returns
 */
export const clearUrl = (url: string) => {
  return url.replace(HASH_RE, "").replace(QUERY_RE, "")
}
