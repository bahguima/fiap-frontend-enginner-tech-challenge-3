import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sharedDependencies } from '../../tools/module-federation/shared';

// __dirname is undefined when @rspack/cli loads this config as ESM (it
// does, because the file uses `import` statements). Derive it from the
// module URL so the config works regardless of how the loader interprets it.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 8101;
const NAME = 'institutional';
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');

// Read mode from the rspack CLI arg (`--mode=development|production`) so the
// config works the same on Windows + POSIX without depending on a shell
// `NODE_ENV=...` prefix.
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
    devServer: {
      host: '0.0.0.0',
      port: PORT,
      historyApiFallback: true,
      hot: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
    },
    resolve: {
      extensions: ['...', '.ts', '.tsx', '.jsx'],
      alias: {
        '@institutional': path.resolve(__dirname, 'src'),
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
      // excludeChunks is REQUIRED on a provider: without it the federation
      // remoteEntry chunk gets injected into the standalone HTML and breaks
      // direct serves.
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
