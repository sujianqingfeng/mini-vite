import { LoadResult, PartialResolvedId, SourceDescription } from "rollup"

import { ServerContext } from "./server/index"

export type ServerHook = (
  server: ServerContext
) => () => void | void | Promise<(() => void) | void>

export interface Plugin {
  name: string
  configureServer?: ServerHook
  resolved?: (
    id: string,
    importer?: string
  ) => Promise<PartialResolvedId | null> | PartialResolvedId | null
  load?: (id: string) => Promise<LoadResult | null> | LoadResult | null
  transform?: (
    code: string,
    id: string
  ) => Promise<SourceDescription | null> | SourceDescription | null
  transformHtml?: (raw: string) => Promise<string> | string
}