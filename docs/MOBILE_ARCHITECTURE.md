# Arquitetura mobile — fase 3

## Status da decisão

- Status: arquitetura implementada na fase 3 e validada pelos gates do workspace.
- Data da análise: 13 de setembro de 2026.
- Escopo: adicionar uma aplicação mobile em `apps/mobile` sem migrar, substituir ou remover a aplicação web existente.
- Exceção explícita: NativeWind será usado somente em `apps/mobile`. A web continuará usando Radix UI e `styled-components`.
- Este documento preserva as decisões e a sequência incremental usadas na implementação mobile.

## Baseline inspecionado

O repositório estava sem alterações locais no início da análise, na branch `feature/FIAP-FRONT-3-MOBILE`.

O workspace real da fase 2 contém:

- `apps/banking`: aplicação Next.js 14 mantida durante a migração;
- `apps/shell`: host React da federação;
- `apps/institutional`: remote da landing page e login;
- `apps/dashboard`: remote do dashboard autenticado;
- `apps/shell-e2e`: testes Playwright da composição federada;
- `libs/shared/{api-client,auth,query,testing,types,ui}`.

As versões resolvidas relevantes no `package-lock.json` são React 18.3.1, React DOM 18.3.1, Next.js 14.2.35, Nx 23.1.0, TanStack Query 5.100.9, React Hook Form 7.75.0, Zod 3.25.76 e MSW 2.15.0. O lockfile é versão 3.

O fluxo web atual possui autenticação REST simulada por MSW, rota protegida no shell, queries e mutations centralizadas por domínio, listagem REST paginada por número de página, filtros em `URLSearchParams`, formulários web com React Hook Form/Zod e anexos baseados no tipo DOM `File`. O dashboard recebe da API REST um contrato já preparado para apresentação.

Consequências para o mobile:

- `libs/shared/auth` não é reutilizável, pois depende do cliente REST e de comportamento web;
- `libs/shared/api-client` não é reutilizável no caminho principal, pois o mobile acessará Firebase diretamente;
- os componentes e estilos de `libs/shared/ui` não são reutilizáveis em React Native;
- o contrato de anexos atual não pode ser importado integralmente pelo mobile, pois expõe `File`;
- as query keys atuais representam paginação REST e URL web, não cursores do Firestore;
- tipos de domínio, regras puras, validações sem APIs do navegador e tokens primitivos podem ser extraídos e compartilhados de forma incremental.

## 1. Estrutura de `apps/mobile`

```text
apps/mobile/
|-- src/
|   |-- app/
|   |   |-- _layout.tsx                  # providers e resolução inicial da sessão
|   |   |-- +not-found.tsx
|   |   |-- (public)/
|   |   |   `-- sign-in.tsx
|   |   `-- (protected)/
|   |       |-- _layout.tsx              # guarda de autenticação
|   |       |-- (tabs)/
|   |       |   |-- _layout.tsx
|   |       |   |-- index.tsx            # dashboard
|   |       |   `-- transactions.tsx     # lista e scroll infinito
|   |       `-- transactions/
|   |           |-- new.tsx
|   |           |-- [id].tsx
|   |           `-- [id]/edit.tsx
|   |-- components/                      # UI React Native reutilizável só no mobile
|   |-- features/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   `-- transactions/
|   |       |-- components/
|   |       |-- data/                    # repositórios Firestore/Storage e mappers
|   |       |-- hooks/                   # queries e mutations TanStack Query
|   |       |-- schemas/                 # schemas específicos do formulário mobile
|   |       `-- types/
|   |-- providers/                       # QueryClient e AuthProvider mobile
|   |-- services/firebase/               # inicialização, emuladores e converters
|   |-- theme/                           # tokens e integração NativeWind
|   `-- utils/
|-- assets/
|-- app.config.ts
|-- babel.config.cjs
|-- global.css
|-- jest.config.cjs
|-- metro.config.cjs
|-- nativewind-env.d.ts
|-- package.json
|-- project.json
|-- tailwind.config.cjs
`-- tsconfig.json
```

As rotas devem permanecer finas. Telas compõem componentes e hooks; consultas Firebase ficam atrás de repositórios tipados. A UI nunca importa instâncias do Firestore ou do Storage diretamente.

## 2. Compatibilidade de React

### Recomendação

Usar Expo SDK **55.0.31**, React Native **0.83.10** e React **19.2.0** no mobile.

Essa combinação é intencional:

- o SDK 55 é estável;
- a documentação do Nx 23.1 aceita oficialmente Expo 53, 54 e 55;
- o SDK 57 é estável na data desta análise, mas fica fora da matriz documentada pelo Nx 23.1;
- atualizar Nx e todas as integrações web apenas para adotar o SDK 57 ampliaria o risco e contrariaria a preservação integral da fase 2.

A web permanece em React/React DOM 18.3.1. Não há incompatibilidade arquitetural porque os bundles não se misturam: a federação web continua compartilhando React 18 como singleton, enquanto Metro gera um bundle mobile independente com React 19.2.

Regras obrigatórias para evitar duas cópias de React dentro do bundle mobile:

- declarar React 19.2.0 explicitamente em `apps/mobile/package.json`;
- manter React 18.3.1 como dependência da aplicação web na raiz;
- não importar no mobile bibliotecas React web ou componentes federados;
- manter o `tsconfig` do mobile baseado na configuração Expo, sem herdar tipos DOM/React 18 da raiz de forma indiscriminada;
- validar a árvore com `npm ls react react-native --all` e o bundle com `expo-doctor`.

O Node local observado é 26.7.0 e não está normalizado pelo repositório. A implementação deve fixar uma versão LTS suportada simultaneamente pelas ferramentas, preferencialmente Node 22 LTS, respeitando o mínimo 20.19.x do SDK 55, e reproduzi-la em CI.

## 3. Isolamento de dependências

Será usado um npm workspace explícito apenas para `apps/mobile`, preservando um único `package-lock.json` na raiz. Não se deve declarar `apps/*` genericamente, pois `shell`, `dashboard` e `institutional` já possuem manifests usados pela federação e não devem mudar de semântica por acidente.

Diretrizes:

- `apps/mobile/package.json` declara as dependências de runtime mobile, com versões fixas ou faixas controladas registradas pelo lockfile;
- `nativewind`, Tailwind, Expo, React Native e módulos Expo ficam declarados somente no pacote mobile;
- não adicionar NativeWind, Tailwind ou configuração PostCSS aos projetos web;
- dependências de ferramentas realmente globais continuam na raiz;
- não usar a tag `latest` em comandos, manifests ou documentação reproduzível;
- instalar módulos nativos com a versão indicada pelo mapa do SDK 55 e validar com `expo-doctor`;
- não manter um segundo lockfile em `apps/mobile`.

O npm pode instalar versões fisicamente em diferentes níveis de `node_modules`; a fonte de verdade é o manifesto de cada workspace e o lockfile. O aceite exige uma única resolução de React 19 no grafo mobile, ainda que React 18 continue existindo para a web.

## 4. Configuração esperada de Nx e Metro

### Nx

Adicionar `apps/mobile/project.json` com `projectType: application` e tags como `type:app`, `scope:mobile` e `platform:mobile`.

Os targets esperados são:

| Target | Responsabilidade |
| --- | --- |
| `start` | iniciar Expo/Metro a partir de `apps/mobile` |
| `android` | iniciar no Android |
| `ios` | iniciar no iOS quando o host permitir |
| `export` | gerar o bundle estático Expo |
| `build` | executar o export verificável usado pelo comando raiz; EAS deve ter target separado |
| `lint` | aplicar ESLint ao código mobile |
| `typecheck` | validar o `tsconfig` mobile |
| `test` | executar Jest com `jest-expo` |
| `test-rules` | validar regras do Firestore e Storage contra emuladores |
| `doctor` | executar as verificações do Expo sem usar versões implícitas |

A recomendação inicial é usar targets `nx:run-commands`, padrão já utilizado no repositório, chamando os scripts do workspace mobile. Isso evita introduzir o peer graph do `@nx/expo` na raiz apenas para executar comandos. O uso futuro de `@nx/expo@23.1.0` é aceitável com SDK 55, mas só deve ocorrer depois de uma instalação experimental limpa e da comprovação de que não altera a resolução React 18 da web.

O `npm run build` existente usa `nx run-many -t build`; portanto o mobile deve expor um target `build` determinístico, baseado em `expo export`, sem confundi-lo com a geração de binários assinados. Builds EAS e submissões às lojas ficam fora do comando de qualidade local.

### Metro e NativeWind

Expo SDK 52 ou superior detecta workspaces e configura monorepos automaticamente. O `metro.config.cjs` do mobile deve:

1. partir de `getDefaultConfig` de `expo/metro-config` usando `apps/mobile` como diretório do projeto;
2. envolver essa configuração com `withNativeWind`, apontando para o `global.css` mobile;
3. não definir manualmente `watchFolders`, `nodeModulesPaths`, `extraNodeModules` ou `disableHierarchicalLookup` sem uma falha reproduzível;
4. não incluir código web no conteúdo escaneado pelo Tailwind.

O `tailwind.config.cjs` deve usar `nativewind/preset` e limitar `content` a `apps/mobile/src`. O Babel deve seguir a configuração estável do NativeWind 4 para Expo. Os arquivos de configuração em CommonJS evitam conflito com o `type: module` da raiz.

## 5. Versão estável do NativeWind

Usar **NativeWind 4.2.6**.

Justificativa:

- é a versão marcada como estável no npm na data da análise;
- NativeWind 5.0.0 está em RC e fica excluído pela decisão de não usar preview, beta ou canary;
- a documentação da versão 4 suporta Expo e exige Tailwind CSS 3, `react-native-reanimated` e `react-native-safe-area-context`;
- o SDK 55 fornece React Native 0.83.10, Reanimated 4.2.1 e Safe Area Context 5.6.x compatíveis com a configuração recomendada.

Usar Tailwind CSS **3.4.17** no workspace mobile. Instalar os módulos nativos nas versões compatíveis com o SDK 55, entre elas Reanimated 4.2.1 e Safe Area Context `~5.6.2`. Embora Reanimated seja peer do NativeWind, as animações funcionais exigidas pela fase 3 serão implementadas com `Animated` do React Native, conforme decisão do projeto.

## 6. Código que poderá ser compartilhado

O compartilhamento será source-level e limitado a módulos independentes de plataforma:

- enums e tipos de domínio: tipo, status e campos editáveis de transação;
- constantes de limites: valor mínimo/máximo, tamanho e quantidade de comprovantes, MIME types permitidos;
- schema Zod da parte puramente transacional;
- funções puras para datas de calendário, moeda em centavos, normalização de busca e geração de tokens;
- mapeamentos de rótulos e regras de categoria que não dependam de UI;
- tokens primitivos de cor, espaçamento, raio e tipografia, sem CSS, Radix ou React Native;
- factories de dados de teste puras, desde que não dependam de MSW ou DOM.

A extração deve ser incremental, com testes de caracterização no web antes de mudar imports. É preferível criar uma biblioteca neutra, por exemplo `libs/shared/domain`, a tornar `libs/shared/types` mais dependente de Zod ou Firebase.

## 7. Código que deverá permanecer separado

- todos os componentes visuais;
- Radix UI, `styled-components`, HTML, CSS web e Framer Motion;
- NativeWind, componentes React Native e estilos mobile;
- Expo Router e o roteamento/federação web;
- `libs/shared/auth`, pois implementa sessão REST web;
- cliente REST, endpoints e handlers MSW;
- adaptadores Firebase, converters Firestore e upload Storage;
- QueryClient e integração de foco/rede do mobile;
- query keys web e mobile, pois paginação, filtros e fontes são diferentes;
- schemas que validam `File`, `HTMLInputElement`, `FormData` web ou objetos do Document Picker;
- contratos de resposta formatados para os gráficos web.

O mobile não deve importar o barrel atual de anexos enquanto ele expuser `File`. O objeto retornado por `expo-document-picker` deve ser mapeado para um tipo mobile próprio.

## 8. Modelo de dados do Firestore

### Coleções

```text
users/{uid}
users/{uid}/transactions/{transactionId}
users/{uid}/transactions/{transactionId}/attachments/{attachmentId}
transactionCategories/{categoryId}
```

`users/{uid}` guarda somente perfil remoto e preferências que realmente precisem de sincronização. Categorias globais são leitura autenticada e escrita administrativa; se futuramente forem personalizáveis, passam para uma subcoleção do usuário sem alterar o contrato da transação.

### Documento de transação

| Campo | Tipo | Observação |
| --- | --- | --- |
| `description` | string | 3 a 120 caracteres |
| `descriptionNormalized` | string | normalização determinística para ordenação |
| `searchTokens` | string[] | prefixos normalizados para busca limitada no Firestore |
| `amountInCents` | integer | valor absoluto em centavos; nunca `float` monetário |
| `incomeAmountInCents` | integer | `amountInCents` para entrada, senão zero |
| `expenseAmountInCents` | integer | `amountInCents` para saída, senão zero |
| `type` | `income` ou `expense` | enum validado nas rules |
| `categoryId` | string | chave estável da categoria |
| `categoryName` | string | snapshot para exibição histórica |
| `occurredOn` | string `YYYY-MM-DD` | data civil sem deslocamento de fuso |
| `status` | `completed`, `pending` ou `failed` | enum validado |
| `observation` | string | até 500 caracteres; isentar de índice |
| `attachmentCount` | integer | 0 a 5, mantido com a metadata |
| `createdAt` | Timestamp | `serverTimestamp` |
| `updatedAt` | Timestamp | `serverTimestamp` |
| `schemaVersion` | integer | inicia em 1 |

Os campos de entrada/saída desnormalizados permitem somar ambos em uma única aggregation query. As regras devem validar a coerência entre `type`, `amountInCents`, `incomeAmountInCents` e `expenseAmountInCents`.

### Documento de anexo

| Campo | Tipo | Observação |
| --- | --- | --- |
| `storagePath` | string | fonte de verdade para localizar o objeto |
| `originalName` | string | nome somente para exibição |
| `contentType` | string | PDF, JPEG ou PNG |
| `sizeBytes` | integer | maior que zero e no máximo 5 MB |
| `status` | `pending`, `ready` ou `failed` | suporta upload parcial e retentativa |
| `createdAt` | Timestamp | `serverTimestamp` |
| `updatedAt` | Timestamp | `serverTimestamp` |

Não persistir download URL como identidade do arquivo. Ela deve ser obtida pelo `storagePath` quando necessária e pode ser cacheada temporariamente pelo TanStack Query.

### Regras e índices

As regras do Firestore devem negar tudo por padrão e permitir acesso somente quando `request.auth.uid` corresponder ao `{uid}` do caminho. Elas também devem validar conjunto de campos, tipos, enums, limites e campos imutáveis.

`firestore.indexes.json` deve versionar somente planos de consulta efetivamente usados. Os índices compostos serão definidos por igualdade (`type`, `status`, `categoryId`), campo de busca quando presente, campo ordenado e desempates. `observation`, tokens não consultados e metadata grande devem receber isenções apropriadas.

## 9. Estrutura do Firebase Storage

```text
users/{uid}/transactions/{transactionId}/{attachmentId}-{safeFileName}
```

O `attachmentId` é criado antes do upload e torna a operação idempotente. `safeFileName` é higienizado e nunca é usado como chave de autorização.

Fluxo de upload:

1. validar nome, MIME, tamanho e quantidade no Zod;
2. criar metadata `pending` no Firestore;
3. converter a URI local do Document Picker para `Blob` ou `Uint8Array` aceito pelo Firebase JS SDK;
4. enviar com upload retomável e progresso;
5. atualizar a metadata para `ready` e o contador da transação;
6. em falha, marcar `failed` e permitir reenviar somente o arquivo pendente.

As Storage Rules devem restringir o caminho ao UID autenticado e revalidar `contentType` e tamanho máximo. A validação da UI é apenas experiência; as rules são a barreira de segurança.

Não existe atomicidade entre Firestore e Storage. Exclusão e cancelamento precisam de compensação: remover o blob e depois a metadata, registrar falha recuperável e oferecer retry. Uma limpeza automática por Cloud Function pode ser adicionada posteriormente como hardening, mas não faz parte do caminho principal sem API própria.

## 10. Estratégia de autenticação

Usar Firebase JS SDK **12.19.0**, estável e superior ao mínimo 12 requerido pelo Expo atual, com email e senha no primeiro incremento.

O `AuthProvider` mobile deve:

- inicializar Auth com persistência React Native baseada em AsyncStorage;
- assinar `onAuthStateChanged` como fonte de verdade;
- expor somente usuário, estado de inicialização, login e logout;
- não armazenar perfil Firestore, transações ou dashboard no Context;
- limpar ou segmentar caches TanStack por UID no logout.

O perfil remoto é uma query TanStack separada. A autenticação pode usar Context porque é uma das responsabilidades explicitamente permitidas.

O Expo Router separa `(public)` e `(protected)`. O layout protegido redireciona usuários anônimos; o público redireciona usuários autenticados. A splash screen permanece visível enquanto a primeira resolução da sessão está pendente, evitando piscar conteúdo protegido. Essa guarda melhora a navegação, mas a autorização real é aplicada pelas Firebase Security Rules.

Em desenvolvimento, Auth conecta ao emulator antes de qualquer uso da instância. O host deve ser configurável para simulador iOS, emulador Android e dispositivo físico. Credenciais e UIDs do emulador jamais serão reutilizados como configuração de produção.

## 11. Estratégia de filtros e paginação

### Filtros

O estado do formulário de filtros permanece local ou em Context estritamente visual. Somente os filtros aplicados entram na query key.

Filtros previstos:

- busca textual por prefixos normalizados;
- tipo;
- categoria;
- status;
- período inicial/final;
- valor mínimo/máximo;
- ordenação por data, valor ou descrição.

Firestore não oferece busca textual arbitrária. `searchTokens` permite prefixo por palavra com `array-contains`; não promete substring, fuzzy search ou frases completas. Essa limitação deve aparecer no README e na UI. Busca mais sofisticada exigiria um serviço de pesquisa ou backend, fora do caminho principal aprovado.

Combinações de filtros devem passar por um construtor de query que aceita somente planos suportados. Cada plano terá testes e índice versionado. A UI deve explicar combinações incompatíveis, em vez de buscar uma página ampla e filtrar silenciosamente no aparelho, o que produziria paginação e totais incorretos.

### Cursor e `useInfiniteQuery`

A query key segue o formato conceitual `mobile/users/{uid}/transactions/infinite/{filtrosNormalizados}`. Alterar qualquer filtro cria outra query e reinicia a paginação.

Cada consulta usa `limit(pageSize)` e ordenação determinística por:

1. campo selecionado e direção;
2. `createdAt` como desempate;
3. ID do documento como desempate final.

O `pageParam` guarda os valores do último documento necessários ao `startAfter`, não um número de página. `getNextPageParam` retorna `undefined` quando a página vier menor que o limite. O `onEndReached` só chama `fetchNextPage` quando houver próxima página e nenhuma busca já estiver em andamento.

## 12. Estratégia do dashboard

O dashboard terá query keys próprias, sempre segmentadas por UID e período. Nenhum agregado será mantido em Context.

Estratégia inicial sem API própria:

- cards de saldo, entradas, saídas e quantidade usam `getAggregateFromServer` com `sum`/`count` sobre campos indexados;
- cada um dos seis meses do gráfico usa uma aggregation query que soma `incomeAmountInCents` e `expenseAmountInCents` na mesma chamada;
- distribuição de despesas executa somas por categoria para o período exibido;
- transações recentes usam consulta separada ordenada por data, com limite pequeno;
- queries independentes podem executar em paralelo e ficam cacheadas com `staleTime` explícito;
- mutations de transações e anexos invalidam as chaves de lista, detalhe e dashboard afetadas.

As agregações transferem apenas o resultado, evitando baixar todo o extrato. Elas ainda escaneiam índices e podem ficar caras ou lentas com grande volume. Se a medição mostrar esse limite, a evolução recomendada é materializar resumos por período com funções confiáveis no backend. Não permitir que o cliente altere livremente totais financeiros materializados.

Os gráficos mobile serão construídos com `react-native-svg` e componentes pequenos, evitando importar Chart.js/Recharts da web. Toda visualização terá resumo textual acessível e tabela/lista alternativa. Entrada e troca de seções usam `Animated` do React Native, respeitam a preferência de redução de movimento e não bloqueiam interação nem leitura por tecnologia assistiva.

## 13. Estratégia de testes

### Web preservada

- manter o Jest/React Testing Library com `jest-environment-jsdom` e MSW;
- não carregar Firebase, Metro, NativeWind ou presets Expo no Jest web;
- manter os testes Playwright da federação;
- executar os quatro comandos de baseline após cada incremento.

### Mobile

- Jest com `jest-expo` e React Native Testing Library em configuração própria;
- testes unitários para schemas Zod, dinheiro em centavos, datas, tokens de busca, cursores e mappers;
- testes de componentes por papel, rótulo, texto, estado de loading/erro/vazio e ações do usuário;
- testes de hooks com QueryClient isolado, retries desabilitados e caches limpos;
- testes de integração dos repositórios com Firebase Emulator Suite;
- testes das Firestore/Storage Rules com `@firebase/rules-unit-testing`, cobrindo isolamento entre dois UIDs, usuário anônimo, campos inválidos, tamanho/MIME e operações permitidas;
- testes de autenticação contra Auth Emulator para sessão, logout e proteção de rotas;
- smoke tests manuais em Android e iOS para Document Picker, upload, scroll infinito, teclado, safe areas e animações.

MSW continua exclusivo do caminho REST web. No mobile, a infraestrutura equivalente de desenvolvimento/teste é a Emulator Suite. Mocks unitários podem substituir o contrato de repositório, mas não a validação integrada das rules.

## 14. Riscos técnicos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| React 18 web e React 19 mobile | resolução duplicada ou hook inválido | workspace explícito, UI separada, inspeção do grafo e smoke do bundle |
| Expo mais novo que a matriz Nx | regressão na web ou tooling sem suporte | fixar SDK 55 e adiar upgrade conjunto Nx/Expo |
| Node 26 local | comportamento fora da matriz testada | normalizar Node 22 LTS em desenvolvimento e CI |
| Metro em monorepo | imports ou módulos nativos duplicados | usar detecção automática do SDK 55 e evitar overrides legados |
| NativeWind/Reanimated | incompatibilidade de Babel/Metro | fixar 4.2.6 e versões do SDK; validar `expo-doctor` e ambas as plataformas |
| Combinações de filtros | explosão de índices e consultas recusadas | planos de query explícitos, índices versionados e UX para limites |
| Busca textual do Firestore | experiência inferior a full-text | prefixos documentados; serviço de busca somente em evolução futura |
| Cursor com valores repetidos | duplicação ou salto de item | ordenação estável com desempates e testes de concorrência |
| Data e fuso horário | transação exibida no dia errado | `occurredOn` como data civil e Timestamp apenas para auditoria |
| Valores monetários em ponto flutuante | arredondamento incorreto | inteiros em centavos em persistência e cálculo |
| Upload em React Native | memória, URI inválida ou falha parcial | limite de 5 MB, conversão testada por plataforma, progresso e retry idempotente |
| Firestore + Storage não atômicos | metadata/blob órfão | estados de upload, compensação e limpeza futura |
| Cache após troca de usuário | vazamento visual entre sessões | query keys com UID e remoção de cache no logout |
| Firebase direto do cliente | acesso indevido ou dados adulterados | deny-by-default, rules testadas e App Check como hardening |
| Dashboard por agregações | custo/latência com volume alto | período limitado, cache, medição e futura materialização confiável |
| Emulador em aparelho físico | `localhost` aponta para o aparelho | host explícito por ambiente e documentação para LAN/Android emulator |
| Variáveis Expo públicas | falsa expectativa de segredo | tratar configuração Firebase como identificador público; regras protegem dados |
| Preservação da web | regressão causada por config global | nenhuma configuração NativeWind global e gates web a cada etapa |

## 15. Sequência incremental de implementação

### Incremento 0 — decisão e baseline

1. manter este documento como fonte de decisão;
2. registrar versões e runtime Node alvo;
3. executar e registrar o baseline web antes de alterações funcionais.

### Incremento 1 — scaffold isolado

1. criar o workspace `apps/mobile` com Expo SDK 55, Expo Router e TypeScript;
2. configurar targets Nx, Metro, Babel e NativeWind 4.2.6;
3. criar uma tela mínima e validar Android, iOS quando disponível, lint, typecheck, teste e export;
4. comprovar que os quatro comandos web continuam verdes.

### Incremento 2 — Firebase e emuladores

1. adicionar Firebase JS SDK e configuração por `EXPO_PUBLIC_*`;
2. versionar `firebase.json`, rules, índices e arquivos de exemplo de ambiente sem segredos;
3. conectar Auth, Firestore e Storage aos emuladores somente em desenvolvimento/teste;
4. criar testes de isolamento das rules antes das telas de dados.

### Incremento 3 — autenticação e navegação protegida

1. implementar persistência Auth e listener de sessão;
2. criar login validado com React Hook Form/Zod;
3. proteger grupos de rotas e tratar splash, logout, loading e erro;
4. testar acesso direto, restauração de sessão e troca de usuário.

### Incremento 4 — domínio e validações compartilháveis

1. caracterizar as regras existentes da web;
2. extrair apenas tipos, constantes, schemas e funções puras neutras;
3. manter adaptadores `File` web e Document Picker mobile separados;
4. validar todas as aplicações afetadas no Nx.

### Incremento 5 — leitura de transações

1. criar converters e repositório Firestore;
2. centralizar query keys mobile;
3. implementar filtros suportados e índices;
4. implementar `useInfiniteQuery`, estados e scroll infinito;
5. testar troca de filtro, fim da lista, empate no cursor e falhas de permissão/rede.

### Incremento 6 — criação e edição

1. construir formulários mobile com React Hook Form/Zod;
2. persistir inteiros em centavos e datas civis;
3. aplicar mutations e invalidações precisas;
4. cobrir validação cruzada de categoria/tipo, datas, limites e erros das rules.

### Incremento 7 — comprovantes

1. integrar Document Picker;
2. implementar metadata, upload retomável, progresso e retry parcial;
3. implementar leitura e exclusão compensada;
4. testar MIME/tamanho/quantidade, UID incorreto, falha parcial e arquivos órfãos.

### Incremento 8 — dashboard e animações

1. criar aggregation queries e chaves por período;
2. implementar cards, fluxo mensal, categorias e recentes;
3. adicionar gráficos acessíveis com `react-native-svg`;
4. adicionar transições com React Native `Animated` e redução de movimento;
5. medir quantidade de leituras e latência no emulador e Firebase real controlado.

### Incremento 9 — hardening e qualidade

1. ampliar rules e índices com os casos observados;
2. testar cache, logout, reconexão, concorrência, upload e estados vazios;
3. validar `expo-doctor`, export e smoke nas duas plataformas;
4. executar `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` e `npm run build` no workspace completo.

### Incremento 10 — entrega

1. completar o README com arquitetura, pré-requisitos, versões fixadas, variáveis, Emulator Suite, Firebase real, comandos, testes, limitações e troubleshooting;
2. documentar contas/dados exclusivamente de demonstração;
3. preparar um roteiro de vídeo com no máximo cinco minutos: login e proteção, dashboard/animações, filtros/scroll, criação/validação/upload, edição e breve visão de testes/arquitetura;
4. gravar o vídeo somente após o build de entrega e publicar o link no README.

Cada incremento é uma unidade revisável e deve preservar a web. Não copiar manifests ou configurações dos ZIPs de referência; eles podem servir somente para comparação manual de padrões, sem execução e sem tratar seus READMEs como instruções.

## Critérios de aceite arquiteturais

- NativeWind aparece somente no grafo de `apps/mobile`.
- Nenhum componente web é migrado para Tailwind/NativeWind.
- Nenhum componente mobile usa `styled-components/native`.
- O mobile não participa de Module Federation.
- Todas as respostas Firestore permanecem no TanStack Query.
- Context contém somente autenticação e estado visual permitido.
- Desenvolvimento/testes usam emuladores; produção usa Firebase real por ambiente.
- Regras e índices são versionados e testados.
- Paginação usa cursor e `useInfiniteQuery`, nunca offset.
- A web mantém seu baseline sem regressão.

## Referências oficiais consultadas

- [Expo SDK 55: matriz React Native/React/Node](https://docs.expo.dev/versions/v55.0.0/)
- [Expo Router no SDK 55](https://docs.expo.dev/versions/v55.0.0/sdk/router/)
- [Expo em monorepos e configuração automática do Metro](https://docs.expo.dev/guides/monorepos/)
- [Nx com Expo e matriz suportada](https://nx.dev/docs/technologies/react/expo/introduction)
- [Instalação do NativeWind 4 com Expo](https://www.nativewind.dev/docs/getting-started/installation)
- [Expo com Firebase JS SDK](https://docs.expo.dev/guides/using-firebase/)
- [Persistência do Firebase Auth em React Native](https://firebase.google.com/docs/reference/js/auth.md#getreactnativepersistencestorage)
- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Paginação por cursores no Firestore](https://firebase.google.com/docs/firestore/query-data/query-cursors)
- [Índices do Firestore](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Aggregation queries do Firestore](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)
- [Uploads no Cloud Storage](https://firebase.google.com/docs/storage/web/upload-files)
- [Segurança do Cloud Storage](https://firebase.google.com/docs/storage/security)
