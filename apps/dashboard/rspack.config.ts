import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sharedDependencies } from '../../tools/module-federation/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 8102;
const NAME = 'dashboard';
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');

export default defineConfig((_env, argv) => {
  const isDev = argv.mode !== 'production';
  return {
    context: __dirname,
    entry: { main: './src/index.ts' },
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'auto',
      uniqueName: NAME,
      clean: true,
    },
    performance: {
      maxAssetSize: 400000,
      maxEntrypointSize: 400000,
    },
    // Lazy compilation não funciona em remotes: o proxy dispara
    // /_rspack/lazy/trigger relativo à página, que roda na origem do host
    // (4200), então a compilação nunca acontece e o Suspense fica preso.
    lazyCompilation: false,
    devServer: {
      host: '0.0.0.0',
      port: PORT,
      historyApiFallback: true,
      hot: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      allowedHosts: ['localhost', '127.0.0.1'],
    },
    resolve: {
      extensions: ['...', '.ts', '.tsx', '.jsx'],
      alias: {
        '@dashboard': path.resolve(__dirname, 'src'),
        '@banking/shared/application': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/application/src'
        ),
        '@banking/shared/auth': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/auth/src'
        ),
        '@banking/shared/api-client': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/api-client/src'
        ),
        '@banking/shared/design-tokens': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/design-tokens/src'
        ),
        '@banking/shared/domain': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/domain/src'
        ),
        '@banking/shared/query': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/query/src'
        ),
        '@banking/shared/reactive': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/reactive/src'
        ),
        '@banking/shared/testing': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/testing/src'
        ),
        '@banking/shared/types': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/types/src'
        ),
        '@banking/shared/validation': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/validation/src'
        ),
        '@banking/shared/ui': path.resolve(
          WORKSPACE_ROOT,
          'libs/shared/ui/src'
        ),
      },
    },
    module: {
      rules: [
        {
          test: /\.(j|t)sx?$/,
          exclude: [/node_modules/],
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'typescript', tsx: true },
                transform: { react: { runtime: 'automatic', development: isDev } },
              },
              env: { targets: 'Chrome >= 87, Firefox >= 78, Edge >= 88, Safari >= 14' },
            },
          },
        },
      ],
    },
    plugins: [
      new rspack.HtmlRspackPlugin({ template: './index.html', excludeChunks: [NAME] }),
      new rspack.DefinePlugin({
        'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(
          process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
        ),
        'process.env.NEXT_PUBLIC_API_MOCKING': JSON.stringify(
          process.env.NEXT_PUBLIC_API_MOCKING ??
            (isDev ? 'enabled' : 'disabled')
        ),
        'process.env.NEXT_PUBLIC_API_MOCK_DELAY_MS': JSON.stringify(
          process.env.NEXT_PUBLIC_API_MOCK_DELAY_MS ?? '150'
        ),
        'process.env.NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS': JSON.stringify(
          process.env.NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS ?? '300'
        ),
        'process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS': JSON.stringify(
          process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS ?? '600'
        ),
        'process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS': JSON.stringify(
          process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS ?? '60'
        ),
        'process.env.SHELL_PUBLIC_URL': JSON.stringify(
          process.env.SHELL_PUBLIC_URL ?? 'http://127.0.0.1:4200'
        ),
      }),
      new rspack.CopyRspackPlugin({
        patterns: [
          {
            from: path.resolve(
              WORKSPACE_ROOT,
              'apps/banking/public/mockServiceWorker.js'
            ),
            to: 'mockServiceWorker.js',
          },
        ],
      }),
      new ModuleFederationPlugin({
        name: NAME,
        filename: 'remoteEntry.js',
        exposes: {
          './App': './src/App/index.tsx',
        },
        shared: sharedDependencies,
      }),
    ],
  };
});
