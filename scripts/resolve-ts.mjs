/** Let Node's test runner follow extensionless relative imports used by Vite/TS source. */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    for (const ext of [".ts", ".tsx", ".js", ".mjs"]) {
      try {
        return await nextResolve(specifier + ext, context);
      } catch {
        /* try next */
      }
    }
  }
  return nextResolve(specifier, context);
}
