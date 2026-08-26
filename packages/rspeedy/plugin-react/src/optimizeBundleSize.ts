// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { mergeRsbuildConfig } from '@rsbuild/core'
import type { Rspack } from '@rsbuild/core'

import type { LynxMinify } from '@lynx-js/rsbuild-plugin'

import type { PluginReactLynxOptions } from './pluginReactLynx.js'

type MinimizerOptions = Rspack.SwcJsMinimizerRspackPluginOptions

export function toOptimizeBundleSizeMinify(
  optimizeBundleSize: Required<PluginReactLynxOptions>['optimizeBundleSize'],
  minify: LynxMinify | undefined,
): LynxMinify | undefined {
  const optimizeBackground = typeof optimizeBundleSize === 'boolean'
    ? optimizeBundleSize
    : optimizeBundleSize?.background
  const optimizeMainThread = typeof optimizeBundleSize === 'boolean'
    ? optimizeBundleSize
    : optimizeBundleSize?.mainThread

  if (!optimizeBackground && !optimizeMainThread) {
    return minify
  }

  const optimized: LynxMinify = { ...minify }

  if (optimizeBackground) {
    optimized.backgroundOptions = mergeMinimizerOptions(
      optimized.backgroundOptions,
      {
        minimizerOptions: {
          compress: {
            pure_funcs: ['lynx.registerDataProcessors'],
          },
        },
      },
    )
  }

  if (optimizeMainThread) {
    optimized.mainThreadOptions = mergeMinimizerOptions(
      optimized.mainThreadOptions,
      {
        minimizerOptions: {
          compress: {
            pure_funcs: ['NativeModules.call', 'lynx.getJSModule'],
          },
        },
      },
    )
  }

  return optimized
}

function mergeMinimizerOptions(
  base: MinimizerOptions | undefined,
  optimized: MinimizerOptions,
): MinimizerOptions {
  const merged = mergeRsbuildConfig(
    { output: { minify: { jsOptions: base } } },
    { output: { minify: { jsOptions: optimized } } },
  )

  return (merged.output?.minify as { jsOptions?: MinimizerOptions } | undefined)
    ?.jsOptions ?? {}
}
