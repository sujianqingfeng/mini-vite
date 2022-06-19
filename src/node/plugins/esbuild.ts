import path from "path"
import esbuild from "esbuild"
import { readFile } from "fs-extra"

import { Plugin } from "../plugin"
import { isJsRequest } from "../utils"

export function esbuildTransformPlugin(): Plugin {
  return {
    name: "m-vite:esbuild-transform",
    async load(id) {
      if (isJsRequest(id)) {
        try {
          const code = await readFile(id, "utf-8")
          return code
        } catch (e) {
          return null
        }
      }
    },
    async transform(code, id) {
      if (isJsRequest(id)) {
        const extname = path.extname(id).slice(1)

        const { code: transformCode, map } = await esbuild.transform(code, {
          target: "esnext",
          format: "esm",
          sourcemap: true,
          loader: extname as "js" | "ts" | "jsx" | "tsx",
        })

        return {
          code: transformCode,
          map,
        }
      }

      return null
    },
  }
}
