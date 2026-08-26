// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { createRsbuild } from '@rsbuild/core'
import type { RsbuildPluginAPI } from '@rsbuild/core'
import { describe, expect, test } from '@rstest/core'

import { createStubRsbuild } from './createStubRsbuild.js'
import {
  LYNX_API,
  createLynxApi,
  getLynxApi,
  pluginLynx,
} from '../src/index.js'
import type { LynxApi, LynxPluginOptions } from '../src/index.js'

async function usingLynxApi(options?: LynxPluginOptions): Promise<LynxApi> {
  let lynx: LynxApi | undefined

  const rsbuild = await createStubRsbuild(
    {
      plugins: [{
        name: 'test:capture',
        setup(api: RsbuildPluginAPI) {
          lynx = getLynxApi(api)
        },
      }],
    },
    undefined,
    options,
  )

  await rsbuild.initConfigs()

  return lynx!
}

describe('pluginAPI', () => {
  test('resolves the default bundle filename', async () => {
    const lynx = await usingLynxApi()

    expect(lynx.resolveBundleFilename({
      lazyBundle: false,
      entryName: 'main',
      platform: 'lynx',
    })).toBe('main.lynx.bundle')
  })

  test('resolves a string bundle filename', async () => {
    const lynx = await usingLynxApi({
      output: {
        filename: { bundle: '[name].[platform].custom.bundle' },
      },
    })

    expect(lynx.resolveBundleFilename({
      lazyBundle: false,
      entryName: 'main',
      platform: 'web',
    })).toBe('main.web.custom.bundle')
  })

  test('resolves a function bundle filename', async () => {
    const lynx = await usingLynxApi({
      output: {
        filename: {
          bundle: ({ lazyBundle, entryName, platform }) =>
            lazyBundle
              ? `lazy/[name].${platform}.bundle`
              : `from-function/${entryName!}.${platform}.bundle`,
        },
      },
    })

    expect(lynx.resolveBundleFilename({
      lazyBundle: false,
      entryName: 'main',
      platform: 'lynx',
    })).toBe('from-function/main.lynx.bundle')
  })

  test('keeps [name] when there is no entry name', async () => {
    const lynx = await usingLynxApi({
      output: {
        filename: { bundle: 'lazy/[name].[platform].bundle' },
      },
    })

    expect(lynx.resolveBundleFilename({
      lazyBundle: true,
      entryName: undefined,
      platform: 'lynx',
    })).toBe('lazy/[name].lynx.bundle')
  })

  test('inserts the context values literally', async () => {
    const lynx = await usingLynxApi({
      output: {
        filename: { bundle: '[name].[platform].bundle' },
      },
    })

    expect(lynx.resolveBundleFilename({
      lazyBundle: false,
      entryName: 'a$&b',
      platform: 'x$$y',
    })).toBe('a$&b.x$$y.bundle')
  })

  test('does not resolve placeholders inserted by other placeholders', async () => {
    const lynx = await usingLynxApi({
      output: {
        filename: { bundle: '[name].[platform].bundle' },
      },
    })

    expect(lynx.resolveBundleFilename({
      lazyBundle: false,
      entryName: 'e[platform]',
      platform: 'p[name]',
    })).toBe('e[platform].p[name].bundle')
  })

  test('does not resolve a lazy bundle filename for a string', async () => {
    const lynx = await usingLynxApi({
      output: {
        filename: { bundle: '[name].[platform].bundle' },
      },
    })

    expect(lynx.resolveLazyBundleFilename({
      lazyBundle: true,
      entryName: undefined,
      platform: 'lynx',
    })).toBeUndefined()
  })

  test('resolves a lazy bundle filename for a function', async () => {
    const lynx = await usingLynxApi({
      output: {
        filename: {
          bundle: ({ lazyBundle }) =>
            lazyBundle ? 'lazy/[name].[platform].bundle' : '[name].bundle',
        },
      },
    })

    expect(lynx.resolveLazyBundleFilename({
      lazyBundle: true,
      entryName: undefined,
      platform: 'lynx',
    })).toBe('lazy/[name].lynx.bundle')
  })

  test('keeps the API a DSL plugin already provided', async () => {
    let lynx: LynxApi | undefined

    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        environments: { lynx: {} },
        plugins: [
          {
            name: 'test:dsl',
            setup(api: RsbuildPluginAPI) {
              api.expose(
                LYNX_API,
                createLynxApi({
                  output: { filename: { bundle: 'from-dsl/[name].bundle' } },
                }),
              )
            },
          },
          ...pluginLynx({
            output: { filename: { bundle: 'from-engine/[name].bundle' } },
          }),
          {
            name: 'test:capture',
            setup(api: RsbuildPluginAPI) {
              api.modifyBundlerChain(() => {
                lynx = getLynxApi(api)
              })
            },
          },
        ],
      },
    })

    await rsbuild.initConfigs()

    expect(lynx!.resolveBundleFilename({
      lazyBundle: false,
      entryName: 'main',
      platform: 'lynx',
    })).toBe('from-dsl/main.bundle')
  })

  test('falls back to the defaults when pluginLynx is not applied', async () => {
    let lynx: LynxApi | undefined

    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        environments: { lynx: {} },
        plugins: [{
          name: 'test:capture',
          setup(api: RsbuildPluginAPI) {
            lynx = getLynxApi(api)
          },
        }],
      },
    })

    await rsbuild.initConfigs()

    expect(lynx!.resolveBundleFilename({
      lazyBundle: false,
      entryName: 'main',
      platform: 'lynx',
    })).toBe('main.lynx.bundle')
  })
})
