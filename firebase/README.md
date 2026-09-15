# Firebase local da fase 3

Esta infraestrutura usa exclusivamente o projeto de demonstração `demo-bytebank`.
Por ter o prefixo `demo-`, ele não possui recursos Firebase reais e evita fallback
acidental para produção durante o desenvolvimento e os testes.

## Pré-requisitos

- Node.js 20, 22 ou 24;
- Java 21 ou superior no `PATH`, exigido pelos emuladores Firestore e Storage;
- dependências instaladas com `npm install` na raiz.

Copie `apps/mobile/.env.example` para `apps/mobile/.env.local`. O valor
`EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` ativa Auth, Firestore e Storage locais.
Para um aparelho físico, configure `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` com o IP
LAN da maquina. Sem override, o mobile usa `10.0.2.2` no emulador Android e
`localhost` no web e no simulador iOS.

## Comandos

```bash
npm run firebase:emulators:start
npm run firebase:seed
npm run firebase:emulators:clear
npm run firebase:emulators:export
npm run firebase:rules:test
npm run firebase:mobile:test
```

O teste mobile cria uma conta temporária e valida login, paginação, filtros,
criação, edição, upload, remoção de comprovante e exclusão. Todos os dados
temporários são removidos ao final da execução bem-sucedida.

Para desenvolver apenas autenticação, sem instalar Java, inicie somente o Auth
Emulator e carregue a conta de demonstração em outro terminal:

```bash
npm run firebase:auth:start
npm run firebase:auth:seed
```

O modo completo continua exigindo Java 21 ou superior por causa dos emuladores
de Firestore e Storage.

`firebase:emulators:start` importa automaticamente `firebase/.emulator-data`
quando existe um export válido e exporta o estado novamente ao encerrar. Use
`firebase:emulators:fresh` para ignorar o import existente. O comando de limpeza
atua somente nos endpoints locais e recusa IDs que não comecem com `demo-`.

A interface da Emulator Suite fica em `http://localhost:4000`.

Firebase real, variáveis públicas, proteção dos testes e builds Expo/EAS estão
documentados em [`../docs/MOBILE_BUILD.md`](../docs/MOBILE_BUILD.md).

## Conta de demonstração

Após executar `npm run firebase:seed`, use exclusivamente no ambiente local:

- e-mail: `demo@bytebank.test`;
- senha: `ByteBank123!`.

A senha é fixa e pública porque pertence ao projeto descartável `demo-bytebank`.
Ela não deve ser reutilizada em nenhum ambiente real.
