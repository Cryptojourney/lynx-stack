import { pluginLynxConfig } from '@lynx-js/config-rsbuild-plugin';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';
import { configKeys as defaultConfigKeys } from '@lynx-js/type-config';

export default defineConfig({
  plugins: [
    pluginReactLynx(),
    // `enableSplitChunksSharing` ships with lynx-core; listing it explicitly
    // keeps validation happy until `@lynx-js/type-config` picks the key up
    // from the engine release that carries it.
    pluginLynxConfig({ enableSplitChunksSharing: true }, {
      configKeys: [...defaultConfigKeys, 'enableSplitChunksSharing'],
      validate: (input) => input,
    }),
    pluginQRCode({
      schema(url) {
        // Cards opened with the same group share one JS context, which is what
        // makes the two pages observe the same store instance.
        return `${url}?fullscreen=true&group=shared-context-demo`;
      },
    }),
  ],
  source: {
    entry: {
      pageA: './src/pageA.tsx',
      pageB: './src/pageB.tsx',
    },
  },
  // Both entries import the store, so `minChunks: 2` splits it into a chunk the
  // pages load through `requireModuleAsync` — the path that shares module
  // instances across the group. The framework stays in each entry, so every
  // page keeps its own renderer state.
  splitChunks: {
    chunks: 'all',
    minSize: 0,
    minSizeReduction: 0,
    maxInitialRequests: 100000,
    maxAsyncRequests: 100000,
    cacheGroups: {
      default: false,
      defaultVendors: false,
      shared: {
        test: /[\\/]src[\\/]store\.ts$/,
        minChunks: 2,
        enforce: true,
      },
    },
  },
  environments: {
    lynx: {},
  },
});
