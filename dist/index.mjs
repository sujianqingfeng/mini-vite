"use strict";

// src/node/cli.ts
import cac from "cac";

// src/node/server/index.ts
import connect from "connect";
import { blue, green } from "picocolors";
async function startDevServer() {
  const app = connect();
  const root = process.cwd();
  console.log("root", root);
  const startTime = Date.now();
  app.listen(3e3, async () => {
    console.log(green("No-Bundle Server start!"), `\u8017\u65F6\uFF1A${Date.now() - startTime}ms`);
    console.log(`\u672C\u5730\u8BBF\u95EE\u8DEF\u5F84\uFF1A${blue("http://localhost:3000")}`);
  });
}

// src/node/cli.ts
var cli = cac();
cli.command("[root]", "Run the development server").alias("serve").alias("dev").action(async () => {
  await startDevServer();
});
cli.help();
cli.parse();
//# sourceMappingURL=index.mjs.map