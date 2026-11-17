# Auditoria de acessibilidade, performance e segurança

Data: 27/07/2026

## Resultado

A revisão cobriu navegação por teclado, foco, leitores de tela, contraste, nomes acessíveis, gráficos, lazy loading dos remotes, bundle, sessão, tokens, upload, variáveis públicas, erros HTTP e regressões funcionais.

Um achado de segurança médio (`C-AUTH-001`, CWE-602) foi confirmado e corrigido. Também foram corrigidas falhas comprovadas de acessibilidade, inicialização da sessão, tratamento HTTP, composição HTML, roteamento do shell e carregamento de fontes.

## Correções implementadas

### Acessibilidade

- Corrigidos dez CTAs com controles interativos aninhados (`a > button`) usando `Button asChild`. A árvore acessível passou a expor um único link por ação, e a inspeção no navegador encontrou zero controles interativos aninhados.
- Formulários de login agora expõem `aria-invalid`, `aria-describedby`, erro com `role="alert"`, `aria-busy` e bloqueio de reenvio.
- O contraste do token destrutivo claro mudou de `hsl(0 78% 68%)`, razão 2,98:1 contra branco, para `hsl(0 72% 42%)`, razão 6,47:1.
- Gráficos Chart.js de entradas e saídas agora ocultam o canvas decorativo de tecnologias assistivas e oferecem tabela equivalente com seis períodos, valores formatados e caption. O contrato REST fornece os dados prontos.
- Os gráficos customizados de fluxo financeiro e distribuição por categoria já possuíam tabelas acessíveis e permaneceram cobertos por testes semânticos.

### Sessão, tokens e HTTP

- O `AuthContext` deixou de comparar credenciais públicas no navegador e passou a usar `authApi.getSession/login/logout` com TanStack Query.
- Shell e layouts aguardam a consulta de sessão e não carregam o dashboard para usuário não autenticado.
- O contrato de login deixou de devolver `accessToken` ao JavaScript; o teste garante sua ausência.
- Requests JSON e multipart usam `credentials: "include"`.
- Respostas de erro vazias, não JSON ou fora do contrato são normalizadas como `RestClientError`/`INTERNAL_ERROR`.
- O app Next só monta o `AuthProvider` depois de o MSW estar pronto em desenvolvimento, eliminando a corrida que deixava a sessão pendente.

### Performance e carregamento

- O shell continua carregando apenas o remote correspondente à rota ativa; o teste de regressão confirma que o dashboard não é carregado sem sessão.
- O `@import` de Google Fonts foi removido de `createGlobalStyle` e substituído por `preconnect` e stylesheet no `<head>`, eliminando o aviso de CSSOM observado no navegador.
- O alias ausente de `@banking/shared/api-client` no remote institucional foi incluído após o primeiro build revelar a falha.
- O acréscimo das tabelas acessíveis aumentou cada rota de entradas/saídas em aproximadamente 0,24 kB, sem alterar o First Load JS de 220 kB.

## Evidência de bundle

| Rota Next | First Load JS |
| --- | ---: |
| Compartilhado | 87,3 kB |
| `/` | 188 kB |
| `/login` | 194 kB |
| `/dashboard` | 258 kB |
| `/dashboard/income` | 220 kB |
| `/dashboard/expenses` | 220 kB |
| `/dashboard/statement` | 187 kB |
| `/dashboard/profile` | 118 kB |

Os quatro builds de produção concluíram: `institutional`, `dashboard`, `banking` e `shell`.

## Upload, variáveis e controles já adequados

- Upload: máximo de cinco arquivos, 5 MB por arquivo e MIME restrito a PDF/JPEG/PNG, aplicado no formulário e no handler REST mockado.
- Variáveis expostas: apenas URLs de API/remotes, flag de mocking e atraso de mock. Nenhum segredo foi encontrado em `NEXT_PUBLIC_*`, `DefinePlugin`, storage ou fonte.
- MSW: ativação condicionada a `NODE_ENV=development` e `NEXT_PUBLIC_API_MOCKING=enabled`.
- Renderização: nenhuma ocorrência de `dangerouslySetInnerHTML`.
- Tema: o único uso de `localStorage` guarda preferência visual, não identidade ou token.

## Riscos que dependem do backend/deploy

- O backend real deve validar assinatura/conteúdo dos arquivos, aplicar antivírus quando apropriado, gerar nomes opacos, impor quotas e autorização por objeto e servir downloads com headers seguros. MIME e tamanho no cliente/MSW não substituem esses controles.
- Sessão por cookie exige `HttpOnly`, `Secure`, `SameSite`, expiração/rotação e proteção CSRF nas operações mutáveis. Esses controles não podem ser comprovados sem o backend.
- Remotes de Module Federation executam como código first-party. Produção deve limitar origens HTTPS, proteger o pipeline/hosting e aplicar CSP compatível.

Esses itens foram mantidos como requisitos de produção, não como vulnerabilidades confirmadas no código disponível.

## Gates finais

Executados no estado final:

- `npm run lint`: 10/10 projetos, zero warnings/erros.
- `npm run typecheck`: 10/10 projetos, zero erros TypeScript.
- `npm test -- --runInBand`: 24 suítes, 72 testes, todos aprovados.
- `npm run build`: 4/4 projetos, todos aprovados.

O primeiro build detectou a ausência do alias do cliente de API no remote institucional. Após a correção, o build completo foi repetido sem cache e passou.

## Fase 4 – lazy loading e pré-carregamento

Data: 17/11/2026

Requisito: "Melhorar o tempo de carregamento aplicando lazy loading e pré-carregamento". Escopo: `apps/shell` (host) e `apps/dashboard` (remote).

### Metodologia

- Builds de produção (`rspack build --mode=production`) de `dashboard` e `shell`, antes e depois da mudança, na mesma máquina.
- O que o shell baixa ao abrir `dashboard/App` vem de `apps/dashboard/dist/mf-stats.json` (`exposes[./App].assets.js.sync`/`async`). O grafo dos chunks lazy foi confirmado pelos `__webpack_require__.e(...)` emitidos em cada chunk.
- Tamanhos brutos e em gzip (nível 9) de cada `.js` emitido. `remoteEntry.js` (113,4 KiB / 32,2 KiB gzip) e os chunks compartilhados (React, React DOM, styled-components, TanStack Query e auth, fornecidos pelo shell no share scope) não mudaram e ficam fora das tabelas por rota.

### O que mudou

- **Páginas do dashboard**: Overview, Statement, Income, Expenses e Profile viraram chunks `React.lazy` (`apps/dashboard/src/routes/dashboardRoutes.ts`). O `Suspense` fica dentro do `DashboardLayout`, então sidebar e cabeçalho continuam visíveis. O fallback (`PageFallback`) usa `QueryState` (`role="status"`, "Carregando página...") e blocos `Skeleton` decorativos (`aria-hidden`).
- **Modais do extrato**: `TransactionFormModal` (com react-hook-form + zod), `TransactionDetailsModal` e `DeleteTransactionModal` são lazy. Cada modal só monta na primeira abertura e depois continua montado, preservando a animação de fechamento do Radix. O fallback é um `role="status"` visualmente oculto. O chunk do formulário é pré-carregado no hover/foco de "Nova Transação".
- **Gráficos**: o registro do chart.js saiu de `lib/chart-theme.ts` (que importava a biblioteca como efeito colateral) e foi para `components/dashboard/TrendLineChart`, carregado sob demanda nas páginas de entradas e saídas, com `Skeleton` decorativo como fallback. A tabela acessível equivalente continua renderizada pela página. Os gráficos da visão geral (`FinancialFlowChart` e `CategoryDistributionChart`) são CSS puro, sem chart.js nem recharts, somam poucos KiB e continuam eager. O recharts não é usado no dashboard.
- **Pré-carregamento do remote (shell)**: `loadRemoteComponentOnce("dashboard", "App")` (`apps/shell/src/mf.ts`) usa `loadRemote` uma única vez e compartilha a promessa com a renderização da rota; falhas descartam a promessa e liberam nova tentativa. Ele dispara quando o login tem sucesso (`user` deixa de ser `null` fora do dashboard) e no hover/foco de links para `/login` ou `/dashboard/*` (CTAs "Entrar") e do botão de envio do login. O shell consome o remote via `remoteEntry.js`, sem manifest, então `preloadRemote` só conseguiria baixar o entry, não os chunks do expose. Por isso foi usado `loadRemote`, que avalia o módulo sem renderizá-lo.
- **Prefetch na sidebar**: no hover/foco de cada link da `AppSidebar`, `usePrefetchDashboardRoute` baixa o chunk da página (`preload()`) e chama `queryClient.prefetchQuery` com as mesmas fábricas de opções usadas pelos hooks (`features/*/api/queryOptions.ts`), então key e `queryFn` são idênticas. O prefetch usa `staleTime` mínimo de 30 s para que hovers repetidos não refaçam a requisição. O `staleTime` das páginas não mudou.

### Comparação (dashboard)

O shell baixa isto ao abrir uma rota do dashboard, sem contar `remoteEntry.js` e os singletons compartilhados:

| Rota | Antes (bruto / gzip) | Depois (bruto / gzip) | Redução (gzip) |
| --- | ---: | ---: | ---: |
| Expose `./App` síncrono (App, layout, sidebar) | 485,3 / 143,7 KiB | 159,8 / 49,0 KiB | −66 % |
| `/dashboard` (visão geral) | 485,3 / 143,7 KiB | 176,7 / 52,2 KiB | −64 % |
| `/dashboard/statement` | 485,3 / 143,7 KiB | 182,5 / 56,3 KiB | −61 % |
| `/dashboard/profile` | 485,3 / 143,7 KiB | 163,4 / 50,5 KiB | −65 % |
| `/dashboard/income` e `/expenses` (com gráfico) | 485,3 / 143,7 KiB | 330,4 / 108,5 KiB | −24 % |

Antes, todas as rotas baixavam os mesmos três arquivos síncronos (`727.js` 354,4 KiB e `653.js` 130,2 KiB, além do expose). Depois, o expose síncrono tem 159,8 KiB e 12 chunks assíncronos somam 337,2 KiB, baixados sob demanda:

| Chunk sob demanda | Bruto | Gzip | Quando é baixado |
| --- | ---: | ---: | --- |
| Gráfico (chart.js + react-chartjs-2) | 155,1 KiB | 54,3 KiB | ao renderizar o gráfico de entradas/saídas |
| Formulário de transação (react-hook-form + zod) | 118,9 KiB | 33,6 KiB | hover/foco/clique em "Nova Transação" ou ao editar |
| Página de extrato (inclui a tabela compartilhada) | 22,7 KiB | 7,3 KiB | rota ou hover/foco no link |
| Página de visão geral | 16,8 KiB | 3,2 KiB | rota ou hover/foco no link |
| Páginas de entradas / saídas | 15,5 KiB cada | 5,3 KiB cada | rota ou hover/foco no link |
| Detalhes da transação | 5,4 KiB | 1,8 KiB | ao abrir detalhes |
| Página de perfil | 3,6 KiB | 1,5 KiB | rota ou hover/foco no link |
| Exclusão de transação | 3,4 KiB | 1,4 KiB | ao abrir a exclusão |

O total emitido pelo dashboard foi de 933,5 para 945,5 KiB brutos (282,0 → 294,2 KiB gzip), ou +1,3 %, por causa do runtime de chunks e de código duplicado entre chunks. É o custo esperado da divisão: nenhum usuário baixa tudo de uma vez.

### Comparação (shell)

| Métrica | Antes | Depois |
| --- | ---: | ---: |
| `main.js` (script do `index.html`) | 113,3 KiB / 32,3 KiB gzip | 113,3 KiB / 32,3 KiB gzip |
| Total de JS emitido | 336,5 KiB / 107,0 KiB gzip | 337,0 KiB / 107,2 KiB gzip |

O chunk do `App` do shell cresceu 0,5 KiB por causa da detecção de intenção e do pré-carregamento. O carregamento inicial do shell não mudou.

### Testes

- `apps/dashboard/src/App/App.test.tsx`: o fallback do `Suspense` aparece com `role="status"` enquanto o chunk da página carrega, a página substitui o fallback, e rotas desconhecidas continuam caindo na visão geral.
- `apps/dashboard/src/lib/lazyWithPreload.test.tsx`: `preload()` e a renderização compartilham um único `import()`, o fallback aparece até o chunk resolver e uma nova tentativa funciona depois de uma falha.
- `apps/dashboard/src/components/dashboard/AppSidebar/AppSidebar.test.tsx` (RTL + MSW): o hover em "Perfil" e o foco em "Extrato" disparam `preload()` do chunk e `prefetchQuery`. As requisições interceptadas pelo MSW e o cache do `QueryClient` comprovam o prefetch, e um segundo hover dentro da janela de frescor não refaz a requisição.
- `apps/dashboard/src/views/dashboard/StatementPage/StatementPage.test.tsx`: o modal de criação só existe depois do clique e é carregado sob demanda.
- `apps/shell/src/App/App.preload.test.tsx`: o dashboard é pré-carregado no hover do CTA "Entrar", no foco do botão de envio do login e no login com sucesso; não é pré-carregado sem intenção, e pré-carregar não renderiza o remote.

### Gates

- `npm run lint`: 16/16 projetos aprovados.
- `npm run typecheck`: 16/16 projetos aprovados.
- `npm test -- --runInBand`: 10/10 projetos, 51 suítes, 188 testes aprovados.
- `npm run build`: 5/5 projetos aprovados.

## Fase 4 – autenticação segura e criptografia de dados sensíveis

Data: 17/11/2026

Requisito: "autenticação segura e criptografia de dados sensíveis". Escopo: web federada (`shell`, `institutional`, `dashboard`) e `libs/shared/*`. O `banking` (Next) recebeu só a adaptação mínima para continuar compilando (`login` agora devolve um resultado tipado) e os headers do `vercel.json`.

> Esta seção revisa uma decisão da auditoria anterior. Antes, o login não devolvia `accessToken` ao JavaScript e a sessão era um cookie. Agora o login devolve um access token de 5 minutos, mantido **apenas em memória**, e a sessão longa fica no refresh token em cookie `HttpOnly` (rotacionado). Um token roubado vale por pouco tempo, e o refresh não é legível por scripts.

### Contrato de autenticação (MSW ⇄ cliente)

Tipos em `libs/shared/types/src/auth.ts`, endpoints em `libs/shared/api-client/src/endpoints.ts`, handlers em `libs/shared/testing/src/mocks/handlers/auth.ts` e estado do "servidor" em `libs/shared/testing/src/mocks/authState.ts`.

| Endpoint | Exige | Resposta |
| --- | --- | --- |
| `GET /api/auth/csrf` | — | `{ csrfToken }` e cookie `bb_csrf` (double-submit) |
| `POST /api/auth/login` | `X-CSRF-Token` | `AuthTokenResponse`: `accessToken` (JWT simulado, `expiresIn: 300`), `tokenType: "Bearer"`, `csrfToken` (novo a cada login), `sessionKey` e `session`; cookie `bb_refresh` `HttpOnly; Secure; SameSite=Strict; Path=/api/auth` |
| `POST /api/auth/refresh` | `X-CSRF-Token` e cookie de refresh | Nova concessão com o refresh token rotacionado. Reusar um refresh já rotacionado revoga a sessão inteira |
| `GET /api/auth/session` | `Authorization: Bearer` | `AuthSession` (401 sem token válido) |
| `POST /api/auth/logout` | `X-CSRF-Token` | Revoga a sessão e limpa os cookies |
| Demais `/api/*` | Bearer; `X-CSRF-Token` em POST/PUT/PATCH/DELETE | 401 `UNAUTHORIZED` com `WWW-Authenticate: Bearer error="invalid_token"`; 403 `CSRF_TOKEN_INVALID` |

Bloqueio: 5 falhas seguidas para o mesmo e-mail bloqueiam o login por 15 minutos (`429 ACCOUNT_LOCKED`, com `Retry-After` e `meta.retryAfterSeconds`). Durante o bloqueio, nem a senha correta entra. As falhas anteriores devolvem `401 INVALID_CREDENTIALS` com `meta.remainingAttempts`. E-mails inexistentes contam do mesmo modo, para não revelar quais contas existem. `ApiError.meta` é o novo campo estruturado e não carrega dados pessoais.

**Cookie HttpOnly simulado.** O mock não envia `Set-Cookie` real. O MSW 2 guarda cookies de respostas mockadas em `localStorage` (`__msw-cookie-store__`), o que contradiz um cookie `HttpOnly` e colocaria o refresh token em storage. Por isso `authState.ts` simula o jar de cookies do navegador em memória do mock, legível apenas pelos handlers. Consequência em desenvolvimento: recarregar a página zera o mock e encerra a sessão simulada, como já acontecia com o boolean anterior. Com a API real, o cookie sobrevive à recarga e a sessão é restaurada pelo refresh.

### Cliente: token em memória, refresh single-flight e CSRF

- `AuthSessionStore` (`libs/shared/api-client/src/session.ts`) guarda o access token e o token anti-CSRF em campos privados de uma instância de módulo. Nada vai para `localStorage`, `sessionStorage` ou cookies legíveis. O store emite eventos sem tokens: `established` (com `sessionKey`), `renewed` e `ended` (com o motivo).
- `authApi.login` aplica a concessão no store e devolve só a `AuthSession`. O token não chega ao React nem ao cache do TanStack Query, incluindo o `MutationCache`.
- `RestClient` (`client.ts`) envia `Authorization: Bearer` em todas as requisições. Em POST/PUT/PATCH/DELETE, envia também `X-CSRF-Token`, obtido uma vez via `GET /api/auth/csrf` quando ainda não há sessão. JSON e multipart passam pelo mesmo caminho.
- **401 → refresh single-flight**: requisições concorrentes aguardam a mesma promessa de renovação, e cada uma é repetida **uma vez** com o novo token. Se o refresh é rejeitado (401), a sessão termina (`ended: expired`). Nesse caso o `AuthProvider` cancela as queries em voo, remove todo dado de servidor do cache, limpa o `MutationCache` e marca a sessão como anônima. Falhas transitórias do refresh (rede ou 5xx) não derrubam a sessão.
- **Corridas tratadas**:
  - O store tem uma "geração" que muda a cada nova sessão ou fim de sessão. O resultado de um refresh iniciado em outra geração é descartado, então um refresh antigo que falhe não encerra uma sessão aberta depois dele.
  - O login cancela a verificação de sessão em voo. Sem isso, ela poderia sobrescrever a sessão recém-criada com "anônimo".
  - Um `403 CSRF_TOKEN_INVALID` renova o token anti-CSRF e repete a requisição uma vez.
- **Module Federation**: `@banking/shared/api-client` passou a ser singleton no share scope (`tools/module-federation/shared.ts`), ao lado de `@banking/shared/auth`. Sem isso, cada remote teria o próprio store de tokens. Os `mf-stats.json` dos três builds listam o pacote como singleton. Uma regra `no-restricted-imports` impede os apps federados de importar subcaminhos (`@banking/shared/api-client/*`, exceto `endpoints`), que criariam uma segunda instância dentro do remote. O dashboard passou a importar da raiz.

### Interface

- **LoginPage** (`apps/institutional`): a mensagem de erro (`role="alert"`, ligada aos campos por `aria-describedby`, com `aria-invalid`) informa as tentativas restantes, o bloqueio com os minutos de espera ou a indisponibilidade do serviço, em pt/en/es.
- **Logout por inatividade** (`apps/shell/src/components/IdleSessionGuard`), ativo só com sessão:
  - Após 9 minutos sem atividade, abre um `AlertDialog` do Radix ("Sua sessão está prestes a expirar") com contagem regressiva (`role="timer"`, sem anúncio a cada segundo). Se nada for feito em 60 segundos, chama `logout("idle")`, totalizando 10 minutos.
  - O foco inicial fica em "Continuar conectado", a ação segura.
  - Mover o mouse não fecha o aviso. Ele exige uma ação explícita (Continuar, Esc ou "Sair agora"), atendendo ao WCAG 2.2.1.
  - O prazo usa horário absoluto, então continua correto com a aba em segundo plano.
  - `libs/shared/reactive` ganhou `useIdleTimer`, com `reset()`. Alguns leitores de tela ativam botões com um clique sem `mousedown`/`keydown`, que não passa pelo stream de atividade; sem o `reset()`, o aviso reabriria imediatamente. O teste cobre esse caso.
- **Ocultar valores** (`apps/dashboard`): botão de alternância no cabeçalho, com `aria-pressed` e rótulo estável "Ocultar valores". O estado é só visual (`ValuesVisibilityContext`) e não toca no cache. `SensitiveValue` troca o valor por `R$ ••••••` (`aria-hidden`) e anuncia "Valor oculto". Aplicado aos cartões de métricas, transações recentes, tabela e detalhes de transações, páginas de entradas e saídas e tabelas acessíveis dos gráficos. As alturas das barras dos gráficos continuam revelando proporções relativas.

### Criptografia de dados sensíveis no cliente

O novo projeto Nx `shared-security` (`libs/shared/security`, `layer:infrastructure`) usa exclusivamente `crypto.subtle`:

- `deriveSessionKey(sessionKey)`: deriva por HKDF-SHA-256 (salt e `info` fixos e versionados) uma chave **AES-GCM de 256 bits não extraível**: `extractable` é `false` e `exportKey` falha. A cópia do material é zerada após a derivação.
- `encryptString` e `decryptString`: IV aleatório de 96 bits por mensagem e AAD com o nome do item, o que impede mover o ciphertext para outra chave de storage. O payload é `{ v: 1, iv, ct }`, e o GCM rejeita adulteração.
- `createSessionKeyring`: mantém a chave só em memória. `destroy()` a descarta no logout, e uma derivação que termine depois do logout é ignorada.
- `createEncryptedStorage`: sem chave, não lê nem grava. Itens que não decifram (outra sessão, adulteração ou o cache em claro da fase anterior) são removidos.

O `sessionKey` vem da API, é vinculado à sessão do servidor, permanece estável entre renovações e é revogado no logout. Assim, a mesma sessão restaurada após recarregar deriva a mesma chave e decifra o cache, e nenhuma outra sessão consegue. O material nunca é gravado.

**Persister**: o shell usa `createAsyncStoragePersister` (`libs/shared/query/src/persistence.ts`) sobre o storage cifrado. Ele tem throttle, e `removeClient` cancela gravações pendentes. `apps/shell/src/session/encryptedQueryPersistence.ts` liga a persistência ao ciclo da sessão:

- em `established`, deriva a chave, restaura o cache e passa a persistir `ENCRYPTED_PERSISTED_CACHE_DOMAINS` (`categories` e `dashboard`, que inclui o resumo de saldos);
- em `ended`, para a persistência, descarta a chave e apaga o blob.

A persistência de categorias em texto claro da fase de cache foi substituída. Transações e sessão continuam só em memória.

### Headers de segurança

| Header | `docker/nginx.conf` (shell e remotes) | `vercel.json` (banking) |
| --- | --- | --- |
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self' ${CSP_REMOTE_ORIGINS}`; `connect-src 'self' ${CSP_REMOTE_ORIGINS} ${CSP_API_ORIGIN}`; `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`; `font-src 'self' https://fonts.gstatic.com data:`; `img-src 'self' data: blob:`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'` | Igual, exceto `script-src 'self' 'unsafe-inline'` (scripts inline de hidratação do App Router, sem nonce), `connect-src 'self'` e mais `upgrade-insecure-requests` |
| `X-Frame-Options` | `DENY` | `DENY` |
| `X-Content-Type-Options` | `nosniff` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Câmera, microfone, geolocalização, pagamento, USB, sensores e `browsing-topics` desativados | Igual |
| `Cross-Origin-Opener-Policy` | `same-origin` | `same-origin` |
| `Strict-Transport-Security` | — (o TLS termina antes do container) | `max-age=63072000; includeSubDomains` |

Compatibilidade com Module Federation:

- O `remoteEntry.js` e os chunks dos remotes são carregados por `<script>` no documento do shell. Por isso as origens dos remotes entram em `script-src` e também em `connect-src`, usada pelo runtime.
- As URLs dos remotes variam por ambiente. Por isso `docker/nginx.conf` virou template da imagem oficial do nginx (`/etc/nginx/templates/default.conf.template`), processado na partida por `envsubst`. Só variáveis de ambiente definidas são substituídas, então `$uri` permanece.
- Os Dockerfiles definem `CSP_REMOTE_ORIGINS` e `CSP_API_ORIGIN` vazios por padrão. O `compose.yaml` passa ao shell `http://127.0.0.1:8101 http://127.0.0.1:8102`, e `.env.docker.example` documenta as variáveis.
- Um `add_header` dentro de `location` anula a herança dos headers do servidor. Por isso o bloco do `remoteEntry.js` repete os headers aplicáveis a scripts.
- No shell, `script-src` não tem `'unsafe-inline'` nem `'unsafe-eval'`. Já `style-src 'unsafe-inline'` é necessário porque styled-components e Radix (`react-remove-scroll`) injetam `<style>`.

### Testes

- `libs/shared/testing/src/tests/auth-security.test.tsx` (MSW):
  - três requisições simultâneas com token expirado geram **um** `POST /api/auth/refresh`, cada requisição original é repetida uma única vez e o evento emitido é `renewed`;
  - o cliente envia `Authorization: Bearer` com o token em memória;
  - quando o refresh é rejeitado, a requisição falha com 401, o `AuthProvider` passa a "Desconectado", o store fica sem token, os dados do dashboard saem do cache e a sessão vira anônima;
  - a sessão é restaurada pelo cookie simulado após "recarregar";
  - um POST sem `X-CSRF-Token`, um POST com token forjado e um login sem token são rejeitados com 403 `CSRF_TOKEN_INVALID`, e o cliente envia o header em POST e DELETE;
  - o login anônimo busca o token anti-CSRF antes de enviar as credenciais;
  - as quatro primeiras falhas devolvem `remainingAttempts` de 4 a 1, a quinta bloqueia (429, 900 s) e a senha correta continua bloqueada;
  - o logout revoga o cookie de refresh.
- `libs/shared/security/src/sessionCipher.test.ts`:
  - ida e volta encrypt/decrypt sem texto claro no payload, com IV aleatório a cada mensagem;
  - chave não extraível e determinística por sessão;
  - rejeição de outra chave, de AAD diferente e de conteúdo adulterado;
  - recusa de material curto ou inválido;
  - storage cifrado: grava só o payload, não lê nem grava sem chave após o logout e remove itens que não decifram;
  - derivação tardia ignorada após o logout.
- `apps/shell/src/session/encryptedQueryPersistence.test.ts`:
  - o resumo do dashboard é persistido cifrado e restaurado após "recarregar", e as transações não são persistidas;
  - o logout apaga o blob e impede novas gravações;
  - **nenhum token em storage**: os access tokens, tokens anti-CSRF e `sessionKey` de todas as concessões (login e refresh) não aparecem em `localStorage`, `sessionStorage`, `document.cookie` nem nos dados do cache do Query. Também não há JWT nem as palavras `refresh`, `bearer` ou `access_token` em storage.
- `apps/shell/src/components/IdleSessionGuard/IdleSessionGuard.test.tsx`:
  - o diálogo tem nome e descrição acessíveis, timer e foco inicial em "Continuar conectado";
  - mover o mouse não fecha o aviso, e o logout por inatividade acontece no fim da contagem;
  - "Continuar conectado" mantém a sessão e reinicia a contagem, inclusive com clique sem `mousedown`;
  - "Sair agora" encerra na hora;
  - sem sessão, a inatividade não é observada.
- `apps/institutional/src/views/LoginPage/LoginPage.test.tsx`: mensagens acessíveis de tentativas restantes e de bloqueio, com `aria-invalid` e `aria-describedby`.
- `apps/dashboard/src/components/ValuesVisibilityToggle/ValuesVisibilityToggle.test.tsx`: `aria-pressed`, máscara `aria-hidden` e "Valor oculto".
- `apps/shell/src/ModuleFederation.test.ts`: `@banking/shared/api-client` é singleton.

Por padrão, cada teste começa autenticado (`signInTestSession` em `libs/shared/testing/src/setup/setup.ts`), como um usuário que já entrou no dashboard. Os testes do fluxo anônimo chamam `signOutTestSession()`. O setup também expõe `crypto.subtle` no jsdom, usando a Web Crypto do Node.

### Verificação no navegador

Não foi possível exercitar a composição federada no navegador embutido usado nesta revisão:

- O shell carregou, o MSW registrou o worker e a restauração anônima de sessão respondeu como esperado (401 sem cookie).
- Todas as requisições do documento do shell para as portas dos remotes (`127.0.0.1:8101` e `:8102`) falharam com `net::ERR_FAILED`, inclusive um `fetch` do próprio `remoteEntry.js`. Os mesmos arquivos respondem 200 via `curl`.
- O remote institucional standalone também não sobe com mocks, porque o dev server dele não serve `mockServiceWorker.js`. O do dashboard copia esse arquivo.

Nenhum dos dois problemas vem desta mudança. Os comportamentos foram comprovados pelos testes de integração acima (RTL + MSW).

### Configuração para demonstração

Seguindo o padrão de `NEXT_PUBLIC_API_MOCK_DELAY_MS` (`DefinePlugin` nos `rspack.config.ts`, documentado em `.env.example`, `.env.docker.example` e `docs/CONTAINERS.md`):

| Variável | Padrão | Lida por |
| --- | --- | --- |
| `NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS` | `300` | `resolveAccessTokenTtlSeconds` em `libs/shared/testing/src/mocks/authState.ts`, a cada login/refresh do MSW (definida no shell, no dashboard e no institutional, que também empacotam os handlers) |
| `NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS` | `600` | `resolveIdleConfig` (`apps/shell/src/components/IdleSessionGuard/config.ts`), padrão do `IdleSessionGuard` |
| `NEXT_PUBLIC_IDLE_WARNING_SECONDS` | `60` | Idem; o aviso abre em `TIMEOUT - WARNING` |

Valores inválidos caem no padrão. O TTL e o aviso precisam ser inteiros positivos, e o timeout precisa ser um inteiro de pelo menos 2. Um aviso maior ou igual ao timeout também é inválido: nesse caso vale 60 s, ou metade do timeout quando ele tiver até 60 s. Exemplo para o vídeo: TTL `30`, timeout `30` e aviso `10`. O token renova sozinho após 30 s, o aviso aparece após 20 s sem atividade e o logout acontece 10 s depois.

Após o logout por inatividade, o `AuthProvider` expõe `sessionEndReason: "idle"`, e a LoginPage mostra "Sessão encerrada por inatividade" com `role="status"` (pt/en/es). O aviso some no próximo login, quando há erro de credenciais e quando o logout foi voluntário. Testes: `libs/shared/testing/src/tests/access-token-ttl.test.ts` (parsing e renovação aos 31 s com TTL de 30 s), `apps/shell/src/components/IdleSessionGuard/config.test.ts`, o caso do guard sem props lendo as variáveis e dois casos novos em `LoginPage.test.tsx`.

### Riscos residuais e requisitos de produção

- **Backend**: precisa emitir o cookie de refresh com `HttpOnly; Secure; SameSite=Strict` e caminho restrito, rotacioná-lo e detectar reuso. Também precisa assinar e validar o JWT (o mock não verifica assinatura), validar o double-submit CSRF e aplicar o bloqueio no servidor, inclusive por IP ou dispositivo. O cliente não substitui esses controles.
- **XSS**: continua sendo a ameaça principal. Um script injetado pode usar a sessão enquanto a página está aberta e ler dados já decifrados. Token em memória, CSP sem script inline no shell e chave não extraível reduzem o impacto, porque não há token persistente nem chave para exfiltrar, mas não o eliminam.
- **CSP do `banking`**: usa `script-src 'unsafe-inline'`. A melhoria recomendada é CSP com nonce via middleware do Next.
- **Estilos inline**: `style-src 'unsafe-inline'` permanece por causa dos estilos injetados em runtime.
- **Modos standalone**: o logout por inatividade e o aviso estão no shell. Os modos standalone dos remotes, usados só em desenvolvimento, não têm o aviso.

### Gates

Executados no estado final:

- `npm run lint`: 18/18 projetos aprovados.
- `npm run typecheck`: 18/18 projetos aprovados.
- `npm test -- --runInBand`: 13/13 projetos, 71 suítes, 281 testes aprovados.
- `npm run build`: 5/5 projetos aprovados. Os `mf-stats.json` de shell, institutional e dashboard listam `@banking/shared/api-client` como singleton.
