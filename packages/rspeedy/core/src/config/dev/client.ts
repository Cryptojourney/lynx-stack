// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * {@inheritdoc Dev.client}
 *
 * @public
 */
export interface Client {
  /**
   * The path to websocket.
   *
   * @deprecated
   *
   * Rsbuild does not know this option. Configure it on the DSL plugin instead,
   * which owns it together with the rest of the Lynx build options:
   *
   * ```js
   * pluginReactLynx({
   *   dev: {
   *     client: { websocketTransport: './my-websocket.js' },
   *   },
   * })
   * ```
   *
   * Setting it on the DSL plugin takes precedence over this option.
   *
   * @defaultValue `require.resolve('@lynx-js/websocket')`
   */
  websocketTransport?: string | undefined
}
