import { PartialResolvedId, TransformResult } from "rollup";

import { clearUrl } from "./utils";

export class ModuleNode {
  id: string | null = null;

  // 哪些模块引用了当前模块
  importers = new Set<ModuleNode>();
  // 当前模块所依赖的模块
  importedModules = new Set<ModuleNode>();
  transformResult: TransformResult | null = null;
  lastHMRTimestamp = 0;

  constructor(public url: string) {}
}

export class ModuleGraph {
  urlToModuleMap = new Map<string, ModuleNode>();
  idToModuleMap = new Map<string, ModuleNode>();

  constructor(
    private resolveId: (url: string) => Promise<PartialResolvedId | null>
  ) {}

  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(id);
  }

  getModuleByUrl(url: string): ModuleNode | undefined {
    return this.urlToModuleMap.get(url);
  }

  // 确定模块
  async ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode> {
    const { url, resolveId } = await this._resolve(rawUrl);

    if (this.urlToModuleMap.has(url)) {
      return this.urlToModuleMap.get(url) as ModuleNode;
    }

    const mod = new ModuleNode(url);
    mod.id = resolveId;
    this.urlToModuleMap.set(url, mod);
    this.idToModuleMap.set(resolveId, mod);

    return mod;
  }

  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>
  ) {
    const prevImports = mod.importedModules;

    for (const curImports of importedModules) {
      // 获取依赖key
      const dep =
        typeof curImports === "string"
          ? await this.ensureEntryFromUrl(clearUrl(curImports))
          : curImports;

      if (dep) {
        mod.importedModules.add(dep);
        dep.importers.add(mod);
      }
    }

    // 移除不需要的依赖
    for (const prevImport of prevImports) {
      if (!importedModules.has(prevImport.url)) {
        prevImport.importers.delete(mod);
      }
    }
  }

  // 热更新调用
  invalidateModule(file: string) {
    const mod = this.idToModuleMap.get(file);
    if (mod) {
      mod.lastHMRTimestamp = Date.now();
      mod.transformResult = null;
      mod.importers.forEach((importer) => {
        this.invalidateModule(importer.url);
      });
    }
  }

  private async _resolve(
    url: string
  ): Promise<{ url: string; resolveId: string }> {
    const resolved = await this.resolveId(url);
    const resolveId = resolved?.id || url;
    return { url, resolveId };
  }
}
