# Containers e Docker Compose

## Visão geral

O workspace possui um Dockerfile multi-stage para cada aplicação federada
implantável:

- `apps/shell/Dockerfile`;
- `apps/institutional/Dockerfile`;
- `apps/dashboard/Dockerfile`.

Cada Dockerfile oferece os estágios `development`, `build` e `production`. O
estágio final contém somente Nginx e os arquivos estáticos gerados pelo Rspack;
Node.js, Nx, compiladores, fontes e `node_modules` permanecem fora da imagem de
produção.

O arquivo `compose.yaml` usa os estágios de produção. O arquivo
`compose.dev.yaml` usa os estágios de desenvolvimento e ativa o MSW no shell,
permitindo executar os contratos REST mockados no navegador.

## Variáveis de ambiente

Copie o exemplo se precisar alterar os valores padrão:

```bash
cp .env.docker.example .env.docker
```

No PowerShell:

```powershell
Copy-Item .env.docker.example .env.docker
```

Passe o arquivo aos comandos com `--env-file .env.docker`.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `SHELL_PORT` | `4200` | Porta pública do shell |
| `INSTITUTIONAL_PORT` | `8101` | Porta pública do remote institucional |
| `DASHBOARD_PORT` | `8102` | Porta pública do remote de dashboard |
| `NEXT_PUBLIC_API_BASE_URL` | vazio | URL pública da API REST |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` no Compose de desenvolvimento | Ativação do MSW |
| `NEXT_PUBLIC_API_MOCK_DELAY_MS` | `150` | Latência padrão dos handlers MSW |
| `NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS` | `300` | Vida do access token emitido pelo MSW (somente com mocks) |
| `NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS` | `600` | Tempo total sem atividade até o logout automático (shell) |
| `NEXT_PUBLIC_IDLE_WARNING_SECONDS` | `60` | Duração do aviso antes do logout; precisa ser menor que o timeout |
| `INSTITUTIONAL_REMOTE_URL` | `http://127.0.0.1:8101/remoteEntry.js` | Entrada pública do remote institucional |
| `DASHBOARD_REMOTE_URL` | `http://127.0.0.1:8102/remoteEntry.js` | Entrada pública do remote de dashboard |
| `CSP_REMOTE_ORIGINS` | `http://127.0.0.1:8101 http://127.0.0.1:8102` (shell) | Origens dos remotes liberadas em `script-src`/`connect-src` da CSP do shell (lida pelo nginx na partida do container) |
| `CSP_API_ORIGIN` | vazio | Origem da API na CSP, quando diferente da origem da página |
| `IMAGE_TAG` | `local` | Tag das imagens de produção |

As URLs dos remotes e da API são incorporadas ao bundle durante o build de
produção. Portanto, gere uma imagem por ambiente quando esses endereços forem
diferentes. As URLs precisam ser acessíveis pelo navegador; nomes como
`institutional` e `dashboard` existem apenas na rede interna do Compose e não
devem ser usados nas entradas federadas.

## Imagens de produção

Gerar as três imagens sem iniciar containers:

```bash
docker compose --env-file .env.docker build
```

Gerar e iniciar em segundo plano:

```bash
docker compose --env-file .env.docker up --build --detach
```

Inspecionar o estado e os health checks:

```bash
docker compose --env-file .env.docker ps
```

Ver logs:

```bash
docker compose --env-file .env.docker logs --follow
```

Encerrar os containers:

```bash
docker compose --env-file .env.docker down
```

O Compose de produção sempre desativa o MSW. Configure
`NEXT_PUBLIC_API_BASE_URL` com a API do ambiente antes de gerar imagens que
serão usadas fora da validação estática local.

## Desenvolvimento com os mocks REST

Iniciar os três servidores Rspack em containers e ativar o MSW:

```bash
docker compose --env-file .env.docker -f compose.dev.yaml up --build
```

O shell fica disponível em `http://localhost:4200`; os remotes ficam em
`http://localhost:8101` e `http://localhost:8102`. O worker do MSW é servido
pelo shell e intercepta os endpoints `/api/*` usando os mesmos handlers dos
testes.

Para usar uma API real no modo de desenvolvimento, defina
`NEXT_PUBLIC_API_MOCKING=disabled` e informe uma
`NEXT_PUBLIC_API_BASE_URL` pública.

Encerrar o ambiente de desenvolvimento:

```bash
docker compose --env-file .env.docker -f compose.dev.yaml down
```

## Health checks

As imagens de produção expõem `GET /healthz` na porta interna `8080`. O shell
só inicia após os dois remotes ficarem saudáveis. No Compose de desenvolvimento,
os checks consultam a página do shell e o `remoteEntry.js` de cada provider.

Para uma verificação manual:

```bash
curl http://localhost:4200/healthz
curl http://localhost:8101/healthz
curl http://localhost:8102/healthz
```

Cada resposta deve ter status `200`; o endpoint retorna `healthy` nas imagens
de produção.
