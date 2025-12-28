// @ts-expect-error
import { cp } from "node:fs/promises";
import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";
import { tailwindPlugin } from "esbuild-plugin-tailwindcss";
import { zip } from "zip-a-folder";

await cp("static", "dist", { recursive: true });
await build({
	entryPoints: ["src/main.tsx", "src/background.ts"],
	bundle: true,
	// outfile: "static/main.js",
	tsconfig: "tsconfig.json",
	outdir: "dist",
	plugins: [solidPlugin(), tailwindPlugin()],
});

await zip("dist", "bsky-command-palette.zip");
