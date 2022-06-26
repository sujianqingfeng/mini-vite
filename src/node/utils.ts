import path from 'path'

import { HASH_RE, JS_TYPES_RE, QUERY_RE } from './constants'

export const isJsRequest = (id: string) => {
  id = clearUrl(id)

  if (JS_TYPES_RE.test(id)) {
    return true
  }

  // 没有后缀 并且不是/结尾
  if (!path.extname(id) && !id.endsWith('/')) {
    return true
  }

  return false
}

export const isCssRequest = (id: string): boolean =>
  clearUrl(id).endsWith('.css')

export const isImportRequest = (id: string): boolean => id.endsWith('?import')

export function removeImportQuery(url: string) {
  return url.replace(/\?import$/, '')
}

/**
 * 去除查询和哈希
 *
 * @param url
 * @returns
 */
export const clearUrl = (url: string) => {
  return url.replace(HASH_RE, '').replace(QUERY_RE, '')
}


export function getShortName(file: string, root: string) {
  // posix 跨平台
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file
}
