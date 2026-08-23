import { defineConfig } from 'tsdown'

/**
 * Self-contained tsdown config for the dsh-archived-panel client bundle.
 *
 * The browser half (`src/client/index.ts`) is bundled to `lib/client.js` as a
 * closure-factory artifact that the DSH client module loader loads and
 * resolves through its frozen module table. Only the DSH platform modules may
 * be left external — everything else must inline, because a cross-plugin
 * `@deepseek-ai/*` value import would either inline a duplicate runtime
 * instance or require a specifier the loader table cannot answer.
 *
 * This file intentionally does NOT import the harness monorepo's tsdown
 * preset (`packages/client/tsdown.client.ts`); it stands alone so the plugin
 * repo builds without a sibling harness checkout.
 */

/** Specifiers the DSH client module table resolves at runtime (leave external). */
const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
]

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
