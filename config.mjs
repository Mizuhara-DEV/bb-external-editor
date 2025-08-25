import {context} from "esbuild";
import {BitburnerPlugin} from "esbuild-bitburner-plugin";
import ignorePlugin from "esbuild-plugin-ignore";

const createContext = async () =>
  await context({
    entryPoints: ["servers/**/*.js", "servers/**/*.jsx", "servers/**/*.ts", "servers/**/*.tsx"],
    outbase: "./servers",
    outdir: "./build",
    plugins: [
      BitburnerPlugin({
        port: 17474,
        types: "NetscriptDefinitions.d.ts",
        mirror: {
          "syncing": ["home"],
        },
      }),
      ignorePlugin([
        {
          resourceRegExp: /\.json$/, // Ignore tất cả các file .json
        },
      ]),
    ],
    bundle: true,
    format: "esm",
    platform: "browser",
    logLevel: "info",
  });

let ctx = await createContext();
ctx.watch();
