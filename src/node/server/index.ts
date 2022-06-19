// connect是一个具有中间件的node框架
// 可以作为服务器 也可以接入具有中间件的框架当中
import connect from "connect"

// 命令行着色工具
import { blue, green } from "picocolors"

import { optimizer } from "../optimizer/index"

import { Plugin } from "../plugin"
import { resolvePlugins } from "../plugins/index"
import { createPluginContainer, PluginContainer } from "../pluginContainer"
import { indexHtmlMiddleware } from "./middlewares/indexHtml"
import { transformMiddleware } from "./middlewares/transform"

export interface ServerContext {
  root: string
  pluginContainer: PluginContainer
  app: connect.Server
  plugins: Plugin[]
}

export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  console.log("root", root)

  const startTime = Date.now()

  const plugins = resolvePlugins()
  const pluginContainer = createPluginContainer(plugins)

  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
  }

  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext)
    }
  }

  app.use(transformMiddleware(serverContext))
  app.use(indexHtmlMiddleware(serverContext))
  app.listen(3000, async () => {
    await optimizer(root)

    console.log(
      green("No-Bundle Server start!"),
      `耗时：${Date.now() - startTime}ms`
    )

    console.log(`本地访问路径：${blue("http://localhost:3000")}`)
  })
}
