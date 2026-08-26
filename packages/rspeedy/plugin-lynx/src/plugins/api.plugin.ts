// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { RsbuildPlugin } from '@rsbuild/core'

import { LYNX_API, createLynxApi } from '../config.js'
import type { LynxApi, LynxPluginOptions } from '../config.js'

export function pluginAPI(options: LynxPluginOptions): RsbuildPlugin {
  return {
    name: 'lynx:rsbuild:api',
    setup(api) {
      // A DSL plugin sets up before the engine does, so an API it provided
      // takes precedence over the one built from these options.
      if (api.useExposed<LynxApi>(LYNX_API) === undefined) {
        api.expose(LYNX_API, createLynxApi(options))
      }
    },
  }
}
