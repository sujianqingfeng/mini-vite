"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

// src/node/cli.ts
var import_cac = __toESM(require("cac"));

// src/node/server/index.ts
var import_connect = __toESM(require("connect"));
var import_picocolors2 = require("picocolors");

// src/node/optimizer/index.ts
var import_path3 = __toESM(require("path"));
var import_esbuild = require("esbuild");
var import_picocolors = require("picocolors");

// src/node/constants.ts
var import_path = __toESM(require("path"));
var EXTERNAL_TYPES = [
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
  "avif"
];
var BARE_IMPORT_RE = /^[\w@][^:]/;
var PRE_BUNDLE_DIR = import_path.default.join("node_modules", ".m-vite");
var JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/;
var QUERY_RE = /\?.*$/s;
var HASH_RE = /#.*$/s;
var DEFAULT_EXTENSIONS = [".ts", ".js", ".tsx", ".jsx"];

// src/node/optimizer/scanPlugin.ts
function scanPlugin(deps) {
  return {
    name: "esbuild:scan-deps",
    setup(build2) {
      build2.onResolve({ filter: new RegExp(`\\.(${EXTERNAL_TYPES.join("|")})$`) }, (resolveInfo) => {
        return {
          path: resolveInfo.path,
          external: true
        };
      });
      build2.onResolve({ filter: BARE_IMPORT_RE }, (resolveInfo) => {
        const { path: id } = resolveInfo;
        deps.add(id);
        return {
          path: id,
          external: true
        };
      });
    }
  };
}

// src/node/optimizer/preBundlePlugin.ts
var import_path2 = __toESM(require("path"));
var import_es_module_lexer = require("es-module-lexer");
var import_resolve = __toESM(require("resolve"));
var import_fs_extra = __toESM(require("fs-extra"));
var import_debug = __toESM(require("debug"));
var debug = (0, import_debug.default)("dev");
function preBundlePlugin(deps) {
  return {
    name: "esbuild:pre-bundle",
    setup(build2) {
      build2.onResolve({ filter: BARE_IMPORT_RE }, (resolveInfo) => {
        const { path: id, importer } = resolveInfo;
        const isEntry = !importer;
        if (deps.has(id)) {
          return isEntry ? {
            path: id,
            namespace: "dep"
          } : {
            path: import_resolve.default.sync(id, { basedir: process.cwd() })
          };
        }
      });
      build2.onLoad({ filter: /.*/, namespace: "dep" }, async (loadInfo) => {
        await import_es_module_lexer.init;
        const id = loadInfo.path;
        const root = process.cwd();
        const entryPath = import_resolve.default.sync(id, { basedir: root });
        const code = await import_fs_extra.default.readFile(entryPath, "utf-8");
        const [imports, exports] = await (0, import_es_module_lexer.parse)(code);
        const proxyModule = [];
        if (!imports.length && !exports.length) {
          const res = require(entryPath);
          const specifiers = Object.keys(res);
          proxyModule.push(`export { ${specifiers.join(",")} } from "${entryPath}"`, `export default require("${entryPath}")`);
        } else {
          if (exports.includes("default")) {
            proxyModule.push(`import d from "${entryPath}";export default d`);
          }
          proxyModule.push(`import * from "${entryPath}"`);
        }
        debug("\u4EE3\u7406\u6A21\u5757\u5185\u5BB9\uFF1A%o", proxyModule.join("\n"));
        const loader = import_path2.default.extname(entryPath).slice(1);
        return {
          loader,
          contents: proxyModule.join("\n"),
          resolveDir: root
        };
      });
    }
  };
}

// src/node/optimizer/index.ts
async function optimizer(root) {
  const entry = import_path3.default.resolve(root, "src/main.tsx");
  const deps = /* @__PURE__ */ new Set();
  await (0, import_esbuild.build)({
    entryPoints: [entry],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)]
  });
  console.log(`
  ${(0, import_picocolors.green)("\u9700\u8981\u9884\u6784\u5EFA\u7684\u4F9D\u8D56")}:

 ${[...deps].map(import_picocolors.green).map((item) => ` ${item}`).join("\n")}
  `);
  await (0, import_esbuild.build)({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: "esm",
    splitting: true,
    outdir: import_path3.default.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)]
  });
}

// src/node/utils.ts
var import_path4 = __toESM(require("path"));
var isJsRequest = (id) => {
  id = clearUrl(id);
  if (JS_TYPES_RE.test(id)) {
    return true;
  }
  if (!import_path4.default.extname(id) && !id.endsWith("/")) {
    return true;
  }
  return false;
};
var isCssRequest = (id) => clearUrl(id).endsWith(".css");
var isImportRequest = (id) => id.endsWith("?import");
function removeImportQuery(url) {
  return url.replace(/\?import$/, "");
}
var clearUrl = (url) => {
  return url.replace(HASH_RE, "").replace(QUERY_RE, "");
};

// src/node/plugins/assets.ts
function assetPlugin() {
  return {
    name: "m-vite:asset",
    async load(id) {
      const cleanedId = removeImportQuery(clearUrl(id));
      if (cleanedId.endsWith(".svg")) {
        return {
          code: `export default "${cleanedId}"`
        };
      }
    }
  };
}

// src/node/plugins/css.ts
var import_fs_extra2 = require("fs-extra");
function cssPlugin() {
  return {
    name: "m-vite:css",
    load(id) {
      if (id.endsWith(".css")) {
        return (0, import_fs_extra2.readFile)(id, "utf-8");
      }
    },
    async transform(code, id) {
      if (id.endsWith(".css")) {
        const jsContent = `
          const css = "${code.replace(/\n/g, "")}";
          const style = document.createElement("style");
          style.setAttribute("type", "text/css");
          style.innerHTML = css;
          document.head.appendChild(style);
          export default css;
          `.trim();
        return {
          code: jsContent
        };
      }
      return null;
    }
  };
}

// src/node/plugins/esbuild.ts
var import_path5 = __toESM(require("path"));
var import_esbuild2 = __toESM(require("esbuild"));
var import_fs_extra3 = require("fs-extra");
function esbuildTransformPlugin() {
  return {
    name: "m-vite:esbuild-transform",
    async load(id) {
      if (isJsRequest(id)) {
        try {
          const code = await (0, import_fs_extra3.readFile)(id, "utf-8");
          return code;
        } catch (e) {
          return null;
        }
      }
    },
    async transform(code, id) {
      if (isJsRequest(id)) {
        const extname = import_path5.default.extname(id).slice(1);
        const { code: transformCode, map } = await import_esbuild2.default.transform(code, {
          target: "esnext",
          format: "esm",
          sourcemap: true,
          loader: extname
        });
        return {
          code: transformCode,
          map
        };
      }
      return null;
    }
  };
}

// src/node/plugins/importAnalysis.ts
var import_es_module_lexer2 = require("es-module-lexer");
var import_path6 = __toESM(require("path"));
var import_magic_string = __toESM(require("magic-string"));
function importAnalysisPlugin() {
  let serverContext;
  return {
    name: "m-vite:import-analysis",
    configureServer(s) {
      serverContext = s;
    },
    async transform(code, id) {
      if (!isJsRequest(id)) {
        return null;
      }
      await import_es_module_lexer2.init;
      const [imports] = (0, import_es_module_lexer2.parse)(code);
      const ms = new import_magic_string.default(code);
      for (const importInfo of imports) {
        const { s: modStart, e: modEnd, n: modSource } = importInfo;
        if (!modSource)
          continue;
        if (modSource.endsWith(".svg")) {
          const resolveUrl = import_path6.default.join(import_path6.default.dirname(id), modSource);
          ms.overwrite(modStart, modEnd, `${resolveUrl}?import`);
          continue;
        }
        if (BARE_IMPORT_RE.test(modSource)) {
          const bundlePath = import_path6.default.join(serverContext.root, PRE_BUNDLE_DIR, `${modSource}.js`);
          ms.overwrite(modStart, modEnd, bundlePath);
        } else if (modSource.startsWith(".") || modSource.startsWith("/")) {
          const resolved = await this.resolve(modSource, id);
          if (resolved) {
            ms.overwrite(modStart, modEnd, resolved.id);
          }
        }
      }
      return {
        code: ms.toString(),
        map: ms.generateMap()
      };
    }
  };
}

// src/node/plugins/resolve.ts
var import_resolve2 = __toESM(require("resolve"));
var import_path7 = __toESM(require("path"));
var import_fs_extra4 = require("fs-extra");
function resolvePlugin() {
  let serverContext;
  return {
    name: "m-vite:resolve",
    configureServer(s) {
      serverContext = s;
    },
    async resolveId(id, importer) {
      if (import_path7.default.isAbsolute(id)) {
        if (await (0, import_fs_extra4.pathExists)(id)) {
          return { id };
        }
        id = import_path7.default.join(serverContext.root, id);
        if (await (0, import_fs_extra4.pathExists)(id)) {
          return { id };
        }
      } else if (id.startsWith(".")) {
        if (!importer) {
          throw new Error("`importer` should not be undefined");
        }
        const hasExtension = import_path7.default.extname(id).length > 1;
        let resolveId;
        if (hasExtension) {
          resolveId = import_resolve2.default.sync(id, { basedir: import_path7.default.dirname(importer) });
          if (await (0, import_fs_extra4.pathExists)(resolveId)) {
            return { id: resolveId };
          }
        } else {
          for (const extname of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${extname}`;
              resolveId = import_resolve2.default.sync(withExtension, {
                basedir: import_path7.default.dirname(importer)
              });
              if (await (0, import_fs_extra4.pathExists)(resolveId)) {
                return { id: resolveId };
              }
            } catch (error) {
              continue;
            }
          }
        }
      }
      return null;
    }
  };
}

// src/node/plugins/index.ts
function resolvePlugins() {
  return [
    resolvePlugin(),
    esbuildTransformPlugin(),
    importAnalysisPlugin(),
    cssPlugin(),
    assetPlugin()
  ];
}

// src/node/pluginContainer.ts
var createPluginContainer = (plugins) => {
  class Context {
    async resolve(id, importer) {
      let out = await pluginContainer.resolveId(id, importer);
      if (typeof out === "string") {
        out = { id: out };
      }
      return out;
    }
  }
  const pluginContainer = {
    async resolveId(id, importer) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const newId = await plugin.resolveId.call(ctx, id, importer);
          if (newId) {
            id = typeof newId === "string" ? newId : newId.id;
            return { id };
          }
        }
      }
      return null;
    },
    async load(id) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.load) {
          const result = await plugin.load.call(ctx, id);
          if (result) {
            return result;
          }
        }
      }
      return null;
    },
    async transform(code, id) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.transform) {
          const result = await plugin.transform.call(ctx, code, id);
          if (!result)
            continue;
          if (typeof result === "string") {
            code = result;
          } else if (result.code) {
            code = result.code;
          }
        }
      }
      return { code };
    }
  };
  return pluginContainer;
};

// src/node/server/middlewares/indexHtml.ts
var import_path8 = __toESM(require("path"));
var import_fs_extra5 = require("fs-extra");
function indexHtmlMiddleware(serverContext) {
  return async (req, res, next) => {
    if (req.url === "/") {
      const { root } = serverContext;
      const indexHtmlPath = import_path8.default.join(root, "index.html");
      if (await (0, import_fs_extra5.pathExists)(indexHtmlPath)) {
        const rawHtml = await (0, import_fs_extra5.readFile)(indexHtmlPath, "utf-8");
        let html = rawHtml;
        for (const plugin of serverContext.plugins) {
          if (plugin.transformHtml) {
            html = plugin.transformHtml(html);
          }
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        return res.end(html);
      }
    }
    return next();
  };
}

// src/node/server/middlewares/transform.ts
var import_debug2 = __toESM(require("debug"));
var debug2 = (0, import_debug2.default)("dev");
async function transformRequest(url, serverContext) {
  const { pluginContainer } = serverContext;
  url = clearUrl(url);
  const resolvedResult = await pluginContainer.resolveId(url);
  let transformResult;
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id);
    if (typeof code === "object" && code != null) {
      code = code.code;
    }
    if (code) {
      transformResult = await pluginContainer.transform(code, resolvedResult.id);
    }
  }
  return transformResult;
}
function transformMiddleware(serverContext) {
  return async (req, res, next) => {
    if (req.method !== "GET" || !req.url) {
      return next();
    }
    const url = req.url;
    debug2("transformMiddleware:s%", url);
    if (isJsRequest(url) || isCssRequest(url) || isImportRequest(url)) {
      let result = await transformRequest(url, serverContext);
      if (!result) {
        return next();
      }
      if (result && typeof result !== "string") {
        result = result.code;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/javascript");
      res.end(result);
    }
    next();
  };
}

// src/node/server/middlewares/static.ts
var import_sirv = __toESM(require("sirv"));
function staticMiddle() {
  const serveFromRoot = (0, import_sirv.default)("/", { dev: true });
  return (req, res, next) => {
    const url = req.url;
    if (!url) {
      return;
    }
    if (isImportRequest(url)) {
      return;
    }
    serveFromRoot(req, res, next);
  };
}

// src/node/server/index.ts
async function startDevServer() {
  const app = (0, import_connect.default)();
  const root = process.cwd();
  console.log("root", root);
  const startTime = Date.now();
  const plugins = resolvePlugins();
  const pluginContainer = createPluginContainer(plugins);
  const serverContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins
  };
  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext);
    }
  }
  app.use(transformMiddleware(serverContext));
  app.use(staticMiddle());
  app.use(indexHtmlMiddleware(serverContext));
  app.listen(3e3, async () => {
    await optimizer(root);
    console.log((0, import_picocolors2.green)("No-Bundle Server start!"), `\u8017\u65F6\uFF1A${Date.now() - startTime}ms`);
    console.log(`\u672C\u5730\u8BBF\u95EE\u8DEF\u5F84\uFF1A${(0, import_picocolors2.blue)("http://localhost:3000")}`);
  });
}

// src/node/cli.ts
var cli = (0, import_cac.default)();
cli.command("[root]", "Run the development server").alias("serve").alias("dev").action(async () => {
  await startDevServer();
});
cli.help();
cli.parse();
//# sourceMappingURL=index.js.map