// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { RsbuildPluginAPI, Rspack } from '@rsbuild/core'

/**
 * The context passed to the {@link LynxFilename.bundle} function.
 *
 * @public
 */
export interface BundleFilenameContext {
  /**
   * Whether the filename is being resolved for a lazy bundle (async chunk)
   * instead of the main bundle of an entry.
   */
  lazyBundle: boolean

  /**
   * The name of the entry.
   *
   * @remarks
   *
   * It is `undefined` for lazy bundles, since a lazy bundle name is resolved
   * per async chunk instead of per entry.
   */
  entryName?: string | undefined

  /**
   * The name of the Rsbuild environment.
   */
  platform: string
}

/**
 * The name of the bundle files.
 *
 * @public
 */
export type BundleFilename =
  | string
  | ((context: BundleFilenameContext) => string)

/**
 * The names of the files emitted by the Lynx build engine.
 *
 * @public
 */
export interface LynxFilename {
  /**
   * The name of the bundle files.
   *
   * @defaultValue `'[name].[platform].bundle'`
   *
   * @remarks
   *
   * The following placeholders are supported:
   *
   * - `[name]`: the name of the entry.
   * - `[platform]`: the name of the Rsbuild environment.
   */
  bundle?: BundleFilename | undefined
}

/**
 * The minifier options of the Lynx threads.
 *
 * @public
 *
 * @remarks
 *
 * Lynx emits one bundle per thread, and each thread may need different
 * minifier settings. These are merged on top of the Rsbuild
 * `output.minify.jsOptions` and applied to that thread only.
 */
export interface LynxMinify {
  /**
   * The minifier options of the main thread.
   */
  mainThreadOptions?: Rspack.SwcJsMinimizerRspackPluginOptions | undefined

  /**
   * The minifier options of the background thread.
   */
  backgroundOptions?: Rspack.SwcJsMinimizerRspackPluginOptions | undefined
}

/**
 * The build outputs of the Lynx build engine.
 *
 * @public
 */
export interface LynxOutput {
  /**
   * The names of the emitted files.
   */
  filename?: LynxFilename | undefined

  /**
   * The per-thread minifier options.
   */
  minify?: LynxMinify | undefined
}

/**
 * The options of `pluginLynx`.
 *
 * @public
 */
export interface LynxPluginOptions {
  /**
   * The build outputs.
   */
  output?: LynxOutput | undefined
}

/**
 * The API that `pluginLynx` exposes to other plugins.
 *
 * @public
 *
 * @example
 *
 * ```js
 * const lynx = getLynxApi(api)
 * const filename = lynx.resolveBundleFilename({
 *   lazyBundle: false,
 *   entryName: 'main',
 *   platform: environment.name,
 * })
 * ```
 */
export interface LynxApi {
  /**
   * Resolve the name of a bundle file.
   */
  resolveBundleFilename(context: BundleFilenameContext): string

  /**
   * Resolve the name of a lazy bundle file.
   *
   * @returns The resolved name, or `undefined` when
   * {@link LynxFilename.bundle} is not a function. A lazy bundle name can only
   * be customized by a function, since it is resolved per async chunk.
   */
  resolveLazyBundleFilename(
    context: BundleFilenameContext,
  ): string | undefined

  /**
   * The per-thread minifier options, or `undefined` when none were configured.
   */
  readonly minify: LynxMinify | undefined
}

/**
 * The key that `pluginLynx` exposes its {@link LynxApi} with. Read it with
 * {@link getLynxApi} instead of `api.useExposed` unless you are providing the
 * API yourself.
 *
 * @public
 */
export const LYNX_API: symbol = Symbol.for('@lynx-js/rsbuild-plugin:api')

/**
 * Get the {@link LynxApi} exposed by `pluginLynx`.
 *
 * @param api - The Rsbuild plugin API.
 *
 * @returns The {@link LynxApi}. When `pluginLynx` is not applied, an instance
 * using the Lynx defaults is returned.
 *
 * @public
 */
export function getLynxApi(api: RsbuildPluginAPI): LynxApi {
  return api.useExposed<LynxApi>(LYNX_API) ?? DEFAULT_LYNX_API
}

const DEFAULT_BUNDLE_FILENAME = '[name].[platform].bundle'

/**
 * Create the {@link LynxApi} described by `options`.
 *
 * @remarks
 *
 * A DSL plugin builds the API from its own options with this and exposes the
 * result with {@link LYNX_API}. A DSL plugin sets up before the engine does, so
 * the API it exposes is the one `pluginLynx` and every other plugin resolve
 * filenames through.
 *
 * @example
 *
 * ```js
 * setup(api) {
 *   if (options.output?.filename?.bundle !== undefined) {
 *     api.expose(LYNX_API, createLynxApi(options))
 *   }
 * }
 * ```
 *
 * @public
 */
export function createLynxApi(options: LynxPluginOptions): LynxApi {
  const bundle = options.output?.filename?.bundle

  function resolve(context: BundleFilenameContext): string {
    const filename = typeof bundle === 'function'
      ? bundle(context)
      : bundle ?? DEFAULT_BUNDLE_FILENAME

    const entryName = context.entryName

    return filename.replaceAll(
      /\[(?:name|platform)\]/g,
      match => match === '[platform]' ? context.platform : entryName ?? match,
    )
  }

  return {
    resolveBundleFilename: resolve,

    resolveLazyBundleFilename(context) {
      return typeof bundle === 'function' ? resolve(context) : undefined
    },

    minify: options.output?.minify,
  }
}

export const DEFAULT_LYNX_API: LynxApi = createLynxApi({})
