import { defineConfig } from 'tsdown'

/**
 * Self-contained tsdown config for the dsh-archived-panel client bundle.
 *
 * The browser half (`src/client/index.ts`) is bundled to `lib/client.cjs`,
 * then `scripts/wrap-client.mjs` wraps it as a current DSH Module Loader
 * factory at `lib/client.js`. Only React is resolved by that loader at
 * runtime. DSH Client imports in this package are type-only: no Harness
 * Client implementation is bundled or required in the browser.
 *
 * This file intentionally does NOT import the harness monorepo's tsdown
 * preset (`packages/client/tsdown.client.ts`); it stands alone so the plugin
 * repo builds without a sibling harness checkout.
 */

/** Only the host-provided React runtime may remain a browser require. */
const EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

export default defineConfig([
  {
    name: 'dsh-archived-panel/host',
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    dts: false,
    sourcemap: true,
    clean: false,
  },
  {
    name: 'dsh-archived-panel/client',
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: [...EXTERNALS],
      alwaysBundle: (id: string) => (EXTERNALS.includes(id) ? undefined : true),
    },
    // The loader table answers tsdown's auto-externalized package deps; a
    // require the table cannot answer is a guaranteed runtime throw, so the
    // rule is the table list itself: external wins above, bundle everything
    // else (pure wire/type layers inline).
    // zustand/immer (via runtime) read process.env.NODE_ENV and probe
    // import.meta.env.MODE; a CJS output cannot carry import.meta, so define
    // both substitutions or the factory throws at boot.
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
  },
])
