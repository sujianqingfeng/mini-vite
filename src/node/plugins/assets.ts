import { Plugin } from "../plugin"
import { clearUrl, removeImportQuery } from "../utils"

export function assetPlugin(): Plugin {
  return {
    name: "m-vite:asset",
    async load(id) {
      const cleanedId = removeImportQuery(clearUrl(id))

      if (cleanedId.endsWith(".svg")) {
        return {
          code: `export default "${cleanedId}"`,
        }
      }
    },
  }
}
