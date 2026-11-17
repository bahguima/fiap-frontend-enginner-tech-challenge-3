# ByteBank — Tech Challenge fase 4

O ByteBank é uma plataforma de controle financeiro pessoal construída em um workspace Nx. A fase 4 consolida a **web federada** — o host `shell` compondo os remotes `institutional` e `dashboard` por Module Federation — com Clean Architecture, programação reativa, cache por domínio no TanStack Query, lazy loading com prefetch e autenticação segura com criptografia no cliente.

O aplicativo mobile (Expo) e o app Next.js `banking` continuam no repositório, compilando e com testes verdes, mas fora do escopo desta fase.

## Requisitos atendidos na fase 4

- **Clean Architecture** em quatro camadas (domínio, aplicação, infraestrutura e apresentação), com dependências apontando para dentro e verificação automática por `@nx/enforce-module-boundaries`.
- **Casos de uso e portas**: `TransactionsRepository` no domínio, casos de uso em `libs/shared/application` e `RestTransactionsRepository` na infraestrutura, injetados por `TransactionUseCasesProvider`.
- **Programação reativa com RxJS** isolada em `libs/shared/reactive`, exposta apenas como hooks (busca com debounce no extrato, detecção de inatividade e status de conectividade).
- **Cache otimizado** com políticas por domínio, retry inteligente, revalidação condicional por ETag e persistência cifrada entre recargas.
- **Atualização otimista com rollback** em criar, editar e excluir transação.
- **Performance**: remotes carregados por rota, `React.lazy` para gráficos, modais e formulários, e prefetch por intenção do usuário.
- **Segurança**: access token somente em memória, refresh por cookie `HttpOnly` com single-flight, token anti-CSRF double-submit, logout por inatividade e criptografia exclusivamente via Web Crypto API.
- **Acessibilidade** auditada, com alternativas tabulares para gráficos e estados anunciados por `role="status"`.

Detalhes e evidências em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (seção "Fase 4 – arquitetura alvo") e [docs/AUDIT_ACCESSIBILITY_PERFORMANCE_SECURITY.md](docs/AUDIT_ACCESSIBILITY_PERFORMANCE_SECURITY.md).

## Arquitetura

```text
          Navegador
              |
        shell :4200  ──────  QueryClient único + autenticação
         /        \
   rota "/"      rota "/dashboard"
      |                |
institutional     dashboard
   :8101             :8102
      \                /
   React, React DOM, styled-components e TanStack Query
            compartilhados como singletons
```

As camadas da Clean Architecture:

| Camada | Onde fica | Tag Nx |
| --- | --- | --- |
| Domínio | `libs/shared/types`, `libs/shared/domain`, `libs/shared/validation` | `layer:domain` |
| Aplicação | `libs/shared/application`, `libs/shared/query` e hooks por feature nos apps | `layer:application` |
| Infraestrutura | `libs/shared/api-client`, `libs/shared/auth`, `libs/shared/reactive`, `libs/shared/security`, `libs/shared/testing` | `layer:infrastructure` |
| Apresentação | views e componentes dos apps, `libs/shared/ui`, `libs/shared/design-tokens` | `layer:presentation` |

O domínio é puro: sem React, DOM, `fetch` ou storage. Componentes consomem hooks da camada de aplicação, nunca o cliente HTTP. Os apps são os composition roots e os únicos pontos que conhecem implementações concretas.

## Aplicações e workspace

| Aplicação | Responsabilidade | Desenvolvimento |
| --- | --- | --- |
| `shell` | Host da experiência web, providers globais e roteamento dos remotes | `http://localhost:4200` |
| `institutional` | Landing page e login federados | `http://localhost:8101` |
| `dashboard` | Área financeira autenticada | `http://localhost:8102` |
| `shell-e2e` | Playwright da composição federada | — |
| `banking` | App Next.js independente (fora do escopo da fase 4) | `http://localhost:3000` |
| `mobile` | App Expo para Android e iOS (fora do escopo da fase 4) | Metro/Expo |

```text
.
├── apps/
│   ├── shell/                  # host web federado
│   ├── institutional/          # remote público
│   ├── dashboard/              # remote autenticado
│   ├── shell-e2e/              # Playwright
│   ├── banking/                # Next.js independente
│   └── mobile/                 # Expo Router + Firebase
├── libs/shared/
│   ├── types/ domain/ validation/         # domínio
│   ├── application/ query/                # aplicação
│   ├── api-client/ auth/ reactive/        # infraestrutura
│   ├── security/ testing/                 # infraestrutura
│   └── ui/ design-tokens/ theme/          # apresentação
├── tools/module-federation/    # share scope e configuração federada
├── docker/ compose.yaml compose.dev.yaml
├── firebase/                   # emuladores e rules do mobile
├── docs/
├── nx.json
└── package.json
```

## Tecnologias utilizadas

**Base**

- [React 18](https://react.dev/) e [TypeScript 5](https://www.typescriptlang.org/) em todos os projetos web.
- [Nx 23](https://nx.dev/) como monorepo: cada app e lib é um projeto com `project.json`, tags de camada e targets `lint`, `typecheck`, `test` e `build`.
- [Rspack 2](https://rspack.dev/) como bundler e dev server.

**Microfrontends**

- [Module Federation](https://module-federation.io/) via `@module-federation/enhanced`, com registro dinâmico de remotes e `loadRemote` por rota.
- React, React DOM, `styled-components`, TanStack Query, `@banking/shared/auth` e `@banking/shared/api-client` compartilhados como singletons (`tools/module-federation/shared.ts`).

**Interface**

- [Radix UI](https://www.radix-ui.com/) como base de componentes acessíveis.
- [styled-components 6](https://styled-components.com/) para estilos, sobre os tokens de `libs/shared/design-tokens`.
- [Recharts](https://recharts.org/) e [Chart.js](https://www.chartjs.org/) nos gráficos financeiros, sempre com alternativa tabular acessível.
- [Framer Motion](https://motion.dev/) para animações e [Lucide](https://lucide.dev/) para ícones.

**Dados e estado**

- [TanStack Query 5](https://tanstack.com/query) para todo estado de servidor, com políticas de cache por domínio, retry inteligente, atualização otimista e persistência cifrada.
- [RxJS 7](https://rxjs.dev/) restrito a `libs/shared/reactive`, exposto apenas como hooks React.
- Context API apenas para autenticação, tema, idioma, estado visual e injeção de dependências.
- [MSW 2](https://mswjs.io/) interceptando os mesmos contratos REST da API real em desenvolvimento e testes.

**Formulários e validação**

- [React Hook Form](https://react-hook-form.com/) com [Zod](https://zod.dev/) através de `@hookform/resolvers`.

**Segurança**

- Web Crypto API (`crypto.subtle`) para a criptografia do cache persistido, em `libs/shared/security`.
- Access token em memória, refresh token em cookie `HttpOnly` e token anti-CSRF em header, com o MSW validando o mesmo contrato.

**Qualidade**

- [Jest 30](https://jestjs.io/) e [React Testing Library](https://testing-library.com/) para testes unitários e de integração.
- [Playwright](https://playwright.dev/) em `apps/shell-e2e` para a composição federada.
- [ESLint 9](https://eslint.org/) com `typescript-eslint` e as regras de fronteira do Nx.
- [Storybook 8](https://storybook.js.org/) para as primitivas de UI.

**Infraestrutura**

- [Docker](https://www.docker.com/) e Docker Compose, com um Dockerfile multi-stage por app federado e Nginx nas imagens de produção.
- Deploy web na [Vercel](https://vercel.com/) (`vercel.json`); o mobile usa Expo/EAS e Firebase.

## Passo a passo para rodar localmente

### 1. Pré-requisitos

- [Git](https://git-scm.com/).
- [Node.js](https://nodejs.org/) 20, 22 ou 24 — a versão 22 LTS é a recomendada.
- npm 10 ou superior, já incluído no Node.js.
- Opcional: [Docker Desktop](https://www.docker.com/products/docker-desktop/), caso prefira rodar em containers.

Não é necessário instalar o Nx globalmente: os scripts da raiz usam a versão do projeto.

### 2. Clonar e instalar

```bash
git clone https://github.com/bahguima/fiap-frontend-enginner-tech-challenge-3.git
```

```bash
cd fiap-frontend-enginner-tech-challenge-3
```

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Os valores padrão já atendem o desenvolvimento local com os mocks REST. Copie o exemplo apenas se quiser alterá-los:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Variáveis mais usadas no ambiente local:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` | Ativa o MSW no navegador |
| `NEXT_PUBLIC_API_BASE_URL` | vazio | URL da API real; vazio usa a mesma origem |
| `NEXT_PUBLIC_API_MOCK_DELAY_MS` | `150` | Latência simulada dos handlers |
| `NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS` | `300` | Vida do access token emitido pelo MSW |
| `NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS` | `600` | Tempo sem atividade até o logout automático |
| `NEXT_PUBLIC_IDLE_WARNING_SECONDS` | `60` | Duração do aviso prévio de logout |
| `INSTITUTIONAL_REMOTE_URL` | `http://127.0.0.1:8101/remoteEntry.js` | Entrada federada do remote institucional |
| `DASHBOARD_REMOTE_URL` | `http://127.0.0.1:8102/remoteEntry.js` | Entrada federada do remote de dashboard |
| `SHELL_PUBLIC_URL` | `http://127.0.0.1:4200` | URL do shell usada pelo dashboard em modo standalone |

Para demonstrar a renovação silenciosa e o logout por inatividade, reduza os tempos — por exemplo TTL `30`, timeout `30` e aviso `10`.

### 4. Subir a aplicação federada

```bash
npm run dev
```

O comando inicia os três servidores Rspack (`shell`, `institutional` e `dashboard`). Aguarde as três compilações terminarem e abra:

**http://localhost:4200**

O shell carrega o remote `institutional` na rota `/` e o `dashboard` na rota `/dashboard`, sob demanda.

Credenciais do login mockado pelo MSW:

```text
E-mail: email@teste.com
Senha: 123
```

### 5. Navegar pela aplicação

1. A landing page institucional abre em `/`.
2. Faça login com as credenciais acima para entrar na área autenticada.
3. A Home mostra saldo, entradas, saídas, comparativos, fluxo financeiro e categorias.
4. O extrato permite filtrar (com debounce reativo refletido na URL), paginar e abrir o detalhe de cada transação.
5. Criar, editar e excluir transações atualizam a lista otimisticamente, com rollback em caso de erro.

### Executando apps isolados (opcional)

```bash
npm run dev:shell
```

```bash
npm run dev:institutional
```

```bash
npm run dev:dashboard
```

Cada remote também roda standalone, útil para desenvolver uma parte sem subir a composição inteira. O app Next.js independente sobe com `npm run dev:banking` em `http://localhost:3000`.

### Rodando com Docker (opcional)

Ambiente de desenvolvimento com MSW ativo nos containers:

```bash
npm run docker:dev
```

Imagens de produção com Nginx:

```bash
npm run docker:up
```

Encerrar:

```bash
npm run docker:down
```

O shell fica em `http://localhost:4200` e os remotes em `http://localhost:8101` e `http://localhost:8102`. As imagens de produção expõem `GET /healthz`. Consulte [docs/CONTAINERS.md](docs/CONTAINERS.md) para variáveis, estágios e health checks.

## Testes, lint, typecheck e build

Gates obrigatórios, executados na raiz:

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test -- --runInBand
```

```bash
npm run build
```

`lint` executa o ESLint com as fronteiras de camada; `typecheck` valida TypeScript sem emitir arquivos; `test` executa Jest e Testing Library; `build` gera os projetos aplicáveis.

Comandos complementares:

```bash
npm run e2e
```

```bash
npm run build:federation
```

```bash
npm run graph
```

`e2e` roda o Playwright no Chromium sobre a composição federada, incluindo o fluxo otimista de transações; `build:federation` gera apenas shell e remotes; `graph` abre o grafo de projetos do Nx.

### Mobile e Firebase (fora do escopo da fase 4)

O aplicativo Expo e o Firebase Emulator Suite continuam disponíveis:

```bash
npm run firebase:emulators:start
```

```bash
npm run mobile:start
```

O passo a passo completo, as variáveis `EXPO_PUBLIC_*` e os builds EAS estão em [docs/MOBILE_BUILD.md](docs/MOBILE_BUILD.md) e [docs/MOBILE_ARCHITECTURE.md](docs/MOBILE_ARCHITECTURE.md).

## Solução de problemas

**A tela do shell fica no fallback de carregamento do remote.** Confirme que `institutional` e `dashboard` terminaram de compilar e respondem em `http://127.0.0.1:8101/remoteEntry.js` e `http://127.0.0.1:8102/remoteEntry.js`. O fallback oferece nova tentativa sem recarregar a página.

**Porta em uso.** Encerre o processo que ocupa 4200, 8101 ou 8102, ou ajuste as portas em `.env` e nos `rspack.config.ts` correspondentes.

**O login não funciona.** Verifique `NEXT_PUBLIC_API_MOCKING=enabled`. Sem o MSW, as chamadas `/api/*` vão para a origem real e falham sem backend.

**Cache antigo após mudar o formato de dados.** O cache persistido é descartado pelo `buster`; em último caso, limpe o storage do site no navegador.

**Erros depois de trocar de branch.** Rode `npm install` novamente e, se necessário, `npx nx reset` para limpar o cache do Nx.

## Documentação complementar

- [Arquitetura geral e Fase 4](docs/ARCHITECTURE.md)
- [Auditoria de acessibilidade, performance e segurança](docs/AUDIT_ACCESSIBILITY_PERFORMANCE_SECURITY.md)
- [Containers e Docker Compose](docs/CONTAINERS.md)
- [Dívida técnica](docs/TECHNICAL_DEBT.md)
- [Arquitetura mobile](docs/MOBILE_ARCHITECTURE.md)
- [Firebase real e builds Expo/EAS](docs/MOBILE_BUILD.md)
- [Diretrizes do repositório](AGENTS.md)
