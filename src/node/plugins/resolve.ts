import resolve from "resolve"
import path from "path"
import { pathExists } from "fs-extra"

import { Plugin } from "../plugin"
import { ServerContext } from "../server"
import { clearUrl } from "../utils"
