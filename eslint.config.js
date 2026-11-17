import js from "@eslint/js";
import nx from "@nx/eslint-plugin";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const RXJS_MESSAGE =
  "Importe RxJS somente em libs/shared/reactive; use os hooks de @banking/shared/reactive.";
const rxjsRestrictedPaths = [{ name: "rxjs", message: RXJS_MESSAGE }];
const rxjsRestrictedPatterns = [{ group: ["rxjs/*"], message: RXJS_MESSAGE }];

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/.swc/**",
      "**/*.d.ts",
      "**/public/mockServiceWorker.js",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@nx": nx,
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          allow: [
            "^\\.\\./\\.\\./tools/module-federation/shared$",
            "^\\.\\./\\.\\./\\.\\./tools/module-federation/shared$",
          ],
          depConstraints: [
            {
              sourceTag: "type:app",
              onlyDependOnLibsWithTags: ["type:shared"],
            },
            // Clean Architecture: as dependências apontam sempre para o domínio.
            // domain -> domain
            {
              sourceTag: "layer:domain",
              onlyDependOnLibsWithTags: ["layer:domain"],
            },
            // application -> application, domain (nunca infraestrutura)
            {
              sourceTag: "layer:application",
              onlyDependOnLibsWithTags: ["layer:application", "layer:domain"],
            },
            // infrastructure -> infrastructure, application, domain
            {
              sourceTag: "layer:infrastructure",
              onlyDependOnLibsWithTags: [
                "layer:infrastructure",
                "layer:application",
                "layer:domain",
              ],
            },
            // presentation -> presentation, application, domain
            {
              sourceTag: "layer:presentation",
              onlyDependOnLibsWithTags: [
                "layer:presentation",
                "layer:application",
                "layer:domain",
              ],
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // RxJS fica confinado a libs/shared/reactive (ver AGENTS.md).
      "no-restricted-imports": [
        "error",
        { paths: rxjsRestrictedPaths, patterns: rxjsRestrictedPatterns },
      ],
    },
  },
  // Web federada: `@banking/shared/api-client` é singleton no share scope
  // (sessão em memória). Importar subcaminhos criaria uma segunda instância
  // do cliente HTTP dentro do remote, com outro store de tokens.
  {
    files: ["apps/{shell,dashboard,institutional}/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: rxjsRestrictedPaths,
          patterns: [
            ...rxjsRestrictedPatterns,
            {
              group: [
                "@banking/shared/api-client/*",
                "!@banking/shared/api-client/endpoints",
              ],
              message:
                "Importe de @banking/shared/api-client (raiz, singleton federado).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["libs/shared/reactive/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
);
