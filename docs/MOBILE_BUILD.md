# Firebase real e builds do aplicativo mobile

O aplicativo Expo fica em `apps/mobile`, usa o Firebase JavaScript SDK e mantém
o mesmo código para Android, iOS e web. Ele não precisa de Firebase Admin SDK,
service account, `google-services.json` ou `GoogleService-Info.plist` para Auth,
Firestore e Storage na arquitetura atual.

## Seleção de ambiente

`EXPO_PUBLIC_USE_FIREBASE_EMULATORS` aceita somente `true` ou `false`:

- ausente ou `true`: conecta Auth, Firestore e Storage ao Emulator Suite e força
  o projeto descartável `demo-bytebank`;
- `false`: usa Firebase real, exige toda a configuração pública de cliente e
  recusa IDs de projeto que começam com `demo-`;
- em Jest, `false` lança um erro antes de qualquer inicialização do Firebase.

O padrão deliberadamente seguro é o emulador. Para desenvolvimento local,
copie `apps/mobile/.env.example` para `apps/mobile/.env.local`. O host vazio usa
`localhost` no web/simulador iOS e `10.0.2.2` no emulador Android. Em aparelho
físico, configure `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` com o IP LAN da máquina
que executa os emuladores, sem protocolo nem porta.

## Configuração pública permitida no cliente

Cadastre um app **Web** no projeto Firebase, pois o mobile usa o Firebase
JavaScript SDK, e copie estes campos do objeto de configuração:

| Variável | Campo Firebase | Pode ficar no cliente? |
| --- | --- | --- |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` | Sim, se for a chave criada para Firebase e restrita às APIs Firebase usadas |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` | Sim |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` | Sim |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` | Sim |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | Sim |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` | Sim |

Esses valores identificam o projeto e são incorporados ao bundle. Eles não
autorizam acesso por si só. A proteção de dados depende das Firebase Security
Rules, do Firebase Authentication e, como hardening de produção, do App Check.
Restrinja a API key às APIs Firebase necessárias e não reutilize essa chave para
Google Maps, Gemini ou outra API Google.

Antes do primeiro preview real, habilite Email/Password no Authentication, crie
Firestore e Storage, publique `firebase/firestore.rules`,
`firebase/storage.rules` e `firebase/firestore.indexes.json`, e mantenha os
testes das regras verdes.

## O que jamais entra no aplicativo

Nunca coloque em `EXPO_PUBLIC_*`, `app.config.ts`, `eas.json`, assets ou código:

- JSON de service account, chave privada ou credencial do Firebase Admin SDK;
- senha de usuário, senha de keystore ou senha de conta;
- token de acesso, refresh token, ID token ou token de CI/deploy;
- client secret OAuth, chave de servidor FCM ou segredo administrativo;
- certificados, arquivos `.p12`, perfis de provisionamento ou outros arquivos
  privados de assinatura.

Variáveis `EXPO_PUBLIC_*` são públicas mesmo quando cadastradas como
`sensitive` ou `secret` no EAS. Credenciais de assinatura devem ser gerenciadas
pelo EAS Credentials/loja, nunca copiadas para o repositório.

`google-services.json` e `GoogleService-Info.plist` contêm configuração de
cliente, não uma service account, mas não são necessários pelo SDK JS atual.
Só devem ser introduzidos se uma futura biblioteca Firebase nativa exigir e
após uma revisão específica da integração.

## Expo e identificadores

`apps/mobile/app.config.ts` define:

- Android package: `com.bytebank.mobile`;
- iOS bundle identifier: `com.bytebank.mobile`;
- versão `0.1.0`, Android `versionCode` 1 e iOS `buildNumber` 1;
- ícone universal opaco, adaptive/monochrome icon Android e splash claro/escuro;
- nenhuma permissão sensível adicional.

O seletor de documentos usa a interface do sistema e não requer acesso amplo à
biblioteca de mídia. O Android ainda recebe permissões normais indispensáveis,
como acesso à internet, pelas dependências nativas.

Os identificadores precisam estar disponíveis nas contas Apple e Google Play.
Se `com.bytebank.mobile` já estiver ocupado ou não pertencer ao projeto, altere
Android e iOS antes do primeiro upload; depois de publicado, o identificador não
deve ser trocado.

## Export local e NativeWind

Na raiz do repositório:

```bash
npm run mobile:doctor
npm run mobile:export
```

Neste monorepo, o Expo Doctor valida 19 de 20 itens e reporta React/React DOM
duplicados: a web permanece no React 18 aprovado com Next.js 14, enquanto o
Expo SDK 55 exige React 19 no workspace mobile. O `.npmrc`, o autolinking e o
Metro usam instalação/resolução aninhada; uma checagem de resolução confirma
que dependências mobile carregam `apps/mobile/node_modules/react` 19.2.0. Não
deduplique essas versões atualizando a web fora de uma migração própria.

`mobile:export` executa o Metro em modo de produção para Android, iOS e web. Sem
variáveis, ele permanece apontado ao emulador por segurança. O export exercita
o `withNativeWind`, o preset Babel, a importação de `global.css` e a extração das
classes do diretório `src`; por isso é a validação de que os estilos não dependem
apenas de `expo start`.

Para exportar com Firebase real fora do EAS, carregue as seis variáveis públicas,
defina `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false` e execute:

```bash
npm run export:real --workspace=@bytebank/mobile
```

O validador interrompe o comando antes do Metro quando a configuração estiver
incompleta ou apontar para um projeto `demo-`.

## EAS Build

`apps/mobile/eas.json` fornece três perfis:

- `development`: development client interno conectado aos emuladores;
- `preview`: build interno, APK no Android, conectado ao Firebase real do
  ambiente EAS `preview`;
- `production`: build de loja, conectado ao Firebase real do ambiente EAS
  `production`, com incremento remoto do número de build.

Na primeira utilização, associe o projeto à conta Expo (isso adicionará o
`extra.eas.projectId` específico da conta):

```bash
cd apps/mobile
npx eas-cli@24.3.0 login
npx eas-cli@24.3.0 init
```

Cadastre cada uma das seis variáveis públicas da tabela nos ambientes `preview`
e `production` pelo dashboard Expo ou com `eas env:set`. Para development em
aparelho físico, cadastre também `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` no ambiente
`development`. Não cadastre credenciais administrativas.

Os builds podem ser iniciados da raiz:

```bash
npm run mobile:eas:development
npm run mobile:eas:preview
npm run mobile:eas:production
```

Os dois últimos perfis falham durante a resolução do `app.config.ts` se a
configuração Firebase real não estiver disponível. Um build EAS efetivo ainda
exige login, projeto EAS associado e credenciais de assinatura das lojas.
