# ByteBank — Tech Challenge fase 3

O ByteBank é uma plataforma de controle financeiro pessoal com aplicações **web e mobile** no mesmo workspace Nx. A fase 3 preserva a experiência web e adiciona um aplicativo Expo para Android e iOS, conectado ao Firebase Authentication, Cloud Firestore e Cloud Storage.

## Requisitos atendidos

- Login, sessão persistente e rotas protegidas no mobile.
- Dashboard com saldo, entradas, saídas, gráficos e transações recentes.
- Extrato com paginação infinita, filtros e estados de loading, vazio e erro.
- Cadastro, consulta, edição e exclusão de transações.
- Inclusão e remoção de comprovantes.
- Firebase Emulator Suite para desenvolvimento e testes.
- Configuração segura para Firebase real e builds Expo/EAS.
- Security Rules de Firestore e Storage testadas automaticamente.
- Aplicação web da fase anterior preservada.
- Estado de servidor no TanStack Query; Context restrito a autenticação, tema e UI.

## Arquitetura

```text
                              ByteBank
                                 |
                +----------------+----------------+
                |                                 |
        Web · React 18                    Mobile · React 19
     shell + dois remotes                    Expo SDK 55
                |                                 |
     cliente REST + MSW              repositórios Firebase tipados
                |                                 |
                +------ domínio, validações ------+
                       e tokens compartilhados
```

Na web, o `shell` compõe `institutional` e `dashboard` por Module Federation. Os dados passam por um cliente REST tipado e são simulados com MSW em desenvolvimento e testes. O app Next.js `banking` permanece independente.

No mobile, o Expo Router separa rotas públicas e protegidas. Telas usam hooks TanStack Query sobre repositórios tipados; componentes não acessam Firestore ou Storage diretamente. O Context mantém apenas a sessão, e as Security Rules são a fronteira real de autorização.

As plataformas compartilham apenas código independente de UI. Componentes, roteamento, acesso a dados e builds ficam separados. Veja [arquitetura geral](docs/ARCHITECTURE.md) e [arquitetura mobile](docs/MOBILE_ARCHITECTURE.md).

## Aplicações e workspace

| Aplicação | Responsabilidade | Desenvolvimento |
| --- | --- | --- |
| `mobile` | App Expo para Android e iOS | Metro/Expo |
| `shell` | Host da experiência web | `http://localhost:4200` |
| `institutional` | Landing page e login web | `http://localhost:8101` |
| `dashboard` | Área financeira web | `http://localhost:8102` |
| `banking` | App Next.js independente | `http://localhost:3000` |
| `shell-e2e` | Playwright da composição web | — |

```text
.
├── apps/
│   ├── mobile/                 # Expo Router, telas e Firebase
│   ├── shell/                  # host web
│   ├── institutional/          # remote público web
│   ├── dashboard/              # remote autenticado web
│   ├── banking/                # Next.js independente
│   └── shell-e2e/              # Playwright
├── libs/shared/
│   ├── api-client/ auth/ query/ testing/  # infraestrutura web
│   ├── domain/ validation/                # regras compartilháveis
│   ├── design-tokens/ theme/              # tokens e temas
│   └── types/ ui/                         # tipos e UI web
├── firebase/                   # emuladores, rules, índices, seed e testes
├── docs/
├── nx.json
└── package.json
```

## Tecnologias

- Web: React 18, Next.js 14 App Router, Radix UI, `styled-components`, Rspack e Module Federation.
- Mobile: Expo SDK 55, React Native 0.83, React 19, Expo Router e NativeWind 4.
- Dados: TanStack Query, Firebase JS SDK no mobile e REST/MSW na web.
- Formulários: React Hook Form e Zod.
- Qualidade: TypeScript, ESLint, Jest, React Testing Library e Playwright.
- Workspace: Nx 23 e npm workspaces.

> **NativeWind é exclusivo de `apps/mobile`.** A web continua usando Radix UI e `styled-components`; Tailwind/NativeWind não são carregados nos projetos web.

## Instalação

Pré-requisitos: Node.js 20, 22 ou 24 (22 LTS recomendado), npm, Java 21+ para Firestore/Storage Emulator, Android Studio para Android e macOS/Xcode para iOS local.

```bash
git clone https://github.com/bahguima/fiap-frontend-enginner-tech-challenge-2.git
cd fiap-frontend-enginner-tech-challenge-2
npm install
cp apps/mobile/.env.example apps/mobile/.env.local
```

No PowerShell, substitua o último comando por:

```powershell
Copy-Item apps/mobile/.env.example apps/mobile/.env.local
```

## Expo, Android e iOS

Inicie o Metro e escolha a plataforma no terminal ou leia o QR code:

```bash
npm run mobile:doctor
npm run mobile:start
```

O Expo Doctor pode apontar React duplicado. Isso é esperado: a web usa React 18 e o bundle Expo SDK 55 usa React 19.

Com um Android Emulator aberto:

```bash
npm run mobile:android
```

O Android Emulator usa `10.0.2.2` para alcançar a máquina host. Não use `localhost`, que aponta para o próprio emulador.

Em macOS, com o Xcode:

```bash
npm run mobile:ios
```

O iOS Simulator usa `localhost`. Windows e Linux precisam de dispositivo físico ou build EAS para iOS; o build local exige macOS.

### Dispositivo físico e IP LAN

Telefone e computador devem estar na mesma rede. Descubra o IPv4 LAN do computador (`ipconfig` no Windows ou `ifconfig`/`ip addr` no macOS/Linux) e informe somente o IP, sem protocolo ou porta:

```dotenv
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=192.168.1.10
```

Reinicie o Metro após mudar variáveis e libere no firewall as portas do Expo/Firebase. `localhost` no telefone significa o próprio telefone.

## Firebase Emulator, seed e demonstração

O ambiente local força o projeto descartável `demo-bytebank`, evitando fallback acidental para produção.

```bash
# terminal 1
npm run firebase:emulators:start

# terminal 2
npm run firebase:seed
npm run mobile:start
```

A interface da Emulator Suite fica em `http://localhost:4000`. O comando importa `firebase/.emulator-data`, se existir, e exporta ao encerrar. Use `npm run firebase:emulators:fresh` para ignorar dados anteriores ou `npm run firebase:emulators:clear` para limpar os emuladores ativos.

Sem Java, é possível trabalhar apenas com autenticação:

```bash
npm run firebase:auth:start
npm run firebase:auth:seed
```

O seed é idempotente. A conta local é:

```text
E-mail: demo@bytebank.test
Senha: ByteBank123!
```

Ela pertence somente a `demo-bytebank` e não deve ser reutilizada em ambiente real.

## Firebase real e variáveis

Crie um projeto Firebase e um app do tipo **Web**, ative Email/Password, Firestore e Storage, publique rules/índices e configure:

| Variável | Uso |
| --- | --- |
| `EXPO_PUBLIC_USE_FIREBASE_EMULATORS` | `true` (ou ausente) usa emuladores; `false` exige Firebase real |
| `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` | vazio seleciona `localhost` ou `10.0.2.2`; dispositivo físico usa IP LAN |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` do app Firebase Web |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | projeto real; IDs `demo-` são recusados |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | bucket do Storage |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | identificador do remetente |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | identificador do app |

Com `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false` e as seis variáveis preenchidas:

```bash
npm run export:real --workspace=@bytebank/mobile
```

`EXPO_PUBLIC_*` é incorporado ao bundle e **não é segredo**. Nunca inclua service account, chave privada, senha, token, client secret ou credenciais de assinatura. A autorização depende de Authentication e Security Rules.

Para EAS, associe `apps/mobile` à conta Expo com `npx eas-cli@24.3.0 init`, cadastre as variáveis por ambiente e execute:

```bash
npm run mobile:eas:development
npm run mobile:eas:preview
npm run mobile:eas:production
```

`preview` e `production` exigem Firebase real. Consulte [Firebase real e builds Expo/EAS](docs/MOBILE_BUILD.md).

## Aplicações web

```bash
npm run dev
```

A experiência integrada abre em `http://localhost:4200`. Use `dev:shell`, `dev:institutional` ou `dev:dashboard` para projetos isolados; `npm run dev:banking` abre o Next.js em `http://localhost:3000`.

O login web/MSW permanece `email@teste.com` / `123` e é diferente da conta Firebase mobile.

## Testes, lint, typecheck e build

Gates obrigatórios da raiz:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

`lint` executa ESLint; `typecheck` valida TypeScript sem emitir arquivos; `test` executa Jest/Testing Library; `build` gera os projetos aplicáveis e faz `expo export` para Android, iOS e web.

Testes adicionais:

```bash
npm run firebase:rules:test
npm run firebase:mobile:test
npm run e2e
```

O teste mobile cobre login, paginação, filtros, CRUD e anexos nos três emuladores. O E2E cobre o fluxo web no Chromium.

## Security Rules

`firebase/firestore.rules` e `firebase/storage.rules` negam acesso por padrão, isolam recursos por UID e validam campos, tipos, enums e limites; uploads também validam caminho, MIME type e tamanho. Índices ficam em `firebase/firestore.indexes.json`.

Antes de usar Firebase real, mantenha `npm run firebase:rules:test` verde e publique rules e índices com o Firebase CLI. Validação da UI não substitui Security Rules.

## Roteiro do vídeo de apresentação

Prepare uma gravação de até cinco minutos, nesta ordem:

1. mostre login, restauração de sessão, proteção de rota e navegação por tabs;
2. apresente dashboard, comparativos, gráficos, alternativas acessíveis e animações;
3. abra o extrato, aplique filtros e demonstre o carregamento da próxima página por scroll;
4. crie uma transação, provoque uma validação, anexe um comprovante e conclua o cadastro;
5. edite, consulte e exclua a transação; finalize mostrando os gates, o Expo Doctor e os testes Firebase.

Antes de gravar, inicie os emuladores com seed conhecido, confirme que o dispositivo alcança o host, desative notificações, aumente a fonte apenas se continuar sem cortes e deixe preparados os terminais com os resultados dos comandos. O link da gravação deve ser adicionado aqui somente depois da publicação.

## Solução de problemas

### Não conecta aos emuladores

- Web/iOS Simulator: `localhost`.
- Android Emulator: `10.0.2.2`.
- Dispositivo físico: IP LAN do computador, por exemplo `192.168.1.10`.
- Informe somente hostname/IP, sem `http://` e sem porta.
- Confirme mesma rede, ausência de isolamento por VPN/roteador e liberação no firewall.
- Abra `http://localhost:4000` no computador para confirmar os emuladores.
- Após mudar o ambiente, reinicie com `npm run mobile:start -- --clear`.

### Expo, Metro ou NativeWind

- Rode `npm install` na raiz e `npm run mobile:doctor`.
- Não deduplique React 18 web e React 19 mobile manualmente.
- Rode `npm run mobile:export` para validar Metro, Babel, `global.css` e classes NativeWind.
- Android exige emulador ativo ou depuração USB; iOS local exige macOS/Xcode.

### Firebase real é recusado

- Defina `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false`.
- Preencha todas as seis variáveis públicas.
- Use project ID que não comece com `demo-`.
- Reinicie o Metro após alterar `.env.local`.

## Documentação complementar

- [Arquitetura geral](docs/ARCHITECTURE.md)
- [Arquitetura mobile da fase 3](docs/MOBILE_ARCHITECTURE.md)
- [Firebase real e builds Expo/EAS](docs/MOBILE_BUILD.md)
- [Firebase Emulator Suite](firebase/README.md)
- [Mapeamento da interface mobile](docs/MOBILE_UI_MAPPING.md)
- [Dívida técnica](docs/TECHNICAL_DEBT.md)
