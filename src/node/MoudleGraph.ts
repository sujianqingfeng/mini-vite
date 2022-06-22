import { PartialResolvedId, TransformResult } from "rollup"

import { clearUrl } from "./utils"

export class ModuleNode {
  id: string | null = null

  importers = new Set<ModuleNode>()
  importedModules = new Set<ModuleNode>()
  transformResult: TransformResult | null = null
  lastHMRTimestamp = 0

  constructor(public url: string) {}
}

export class ModuleGraph {
  urlToModuleMap = new Map<string, ModuleNode>()
  idToModuleMap = new Map<string, ModuleNode>()

  constructor(
    private resolveId: (url: string) => Promise<PartialResolvedId | null>
  ) {}

  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(id)
  }

  getModuleByUrl(url: string): ModuleNode | undefined {
    return this.urlToModuleMap.get(url)
  }
}
