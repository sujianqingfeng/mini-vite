import path from "path"

// 不处理
export const EXTERNAL_TYPES = [
  "css",
  "less",
  "sass",
  "scss",
  "styl",
  "stylus",
  "pcss",
  "postcss",
  "vue",
  "svelte",
  "marko",
  "astro",
  "png",
  "jpe?g",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",
]

// 裸模块  就是没有绝对路径或者相对路径
export const BARE_IMPORT_RE = /^[\w@][^:]/

// 预构建存放的位置
export const PRE_BUNDLE_DIR = path.join("node_modules", ".m-vite")

export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/
export const QUERY_RE = /\?.*$/s
export const HASH_RE = /#.*$/s

export const DEFAULT_EXTENSIONS = [".ts", ".js", ".tsx", ".jsx"]
