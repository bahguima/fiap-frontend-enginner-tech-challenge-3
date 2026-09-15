# Mapeamento da interface web para mobile

## Escopo e princípios

Esta etapa traduz a apresentação do dashboard existente para `apps/mobile`, com React Native, Expo Router e NativeWind. A implementação não importa componentes do dashboard web nem usa DOM. Os dados vêm de repositórios Firebase tipados, consumidos por queries e mutations TanStack Query; autenticação, persistência, upload e gráficos estão conectados.

Os tokens de `libs/shared/design-tokens` são a fonte semântica de cores, espaçamentos, tipografia, bordas, raios e sombra. A configuração do NativeWind espelha esses valores em classes para manter os bundles web e mobile independentes.

## Mapeamento de componentes

| Componente web | Componente mobile correspondente | Conteúdo preservado | Adaptação realizada | Justificativa de usabilidade |
| --- | --- | --- | --- | --- |
| `DashboardLayout` | `ScreenContainer` + `MobileAppHeader` + layout de tabs | Safe Area, saudação, tema e área principal | Cabeçalho compacto, scroll vertical e largura máxima para tablet | Evita conteúdo sob recortes do aparelho e mantém leitura confortável em qualquer largura |
| `AppSidebar` | `MobileBottomNavigation` | Início, transações e perfil | Sidebar vira tabs inferiores; adicionar transação recebe ação central destacada | Os destinos principais permanecem ao alcance do polegar e a ação mais frequente fica sempre acessível |
| `OverviewPage` | `DashboardScreen` | Título, subtítulo, período, indicadores, análises e recentes | Grid vira sequência vertical com ordem explícita | Preserva hierarquia e reduz varredura horizontal em telas estreitas |
| `FinancialMetricCard` | `FinancialMetricCard` mobile | Rótulo, valor, comparação, tom e ícone | Saldo vira card principal preenchido; entradas e saídas ficam em dois cards compactos | Destaca o saldo e mantém a comparação imediata entre receitas e despesas |
| Grid de três indicadores | `FinancialMetricsSection` | Saldo, receitas e despesas | Saldo ocupa toda a largura; receitas e despesas dividem a linha seguinte | Dá prioridade ao saldo sem aumentar excessivamente o scroll |
| `FinancialFlowChart` | `FinancialFlowCard` | Seis períodos, receitas, despesas, legenda e descrição textual | `BarChart` responsivo em card de largura total, com tabela acessível expansível | Mantém a comparação mensal legível e oferece alternativa não visual |
| `CategoryDistributionChart` | `CategoryDistributionCard` | Categorias, valores, percentuais, tons e descrição textual | `PieChart` em formato donut, legenda visual e tabela acessível expansível | Resume a distribuição sem depender apenas de cor ou do gráfico |
| `RecentTransactions` | `RecentTransactionsList` | Título e transações recentes | Tabela vira `FlatList` | Listas verticais são mais fáceis de ler, tocar e ampliar com fonte dinâmica |
| Linha da tabela recente | `RecentTransactionItem` | Descrição, categoria, data, status, tipo e valor | Cada linha vira item com ícone, metadados agrupados e valor alinhado | Mantém as informações essenciais com alvo de toque de pelo menos 44 pontos |
| `StatementPage` | `TransactionsScreen` | Extrato, diferenciação entre entradas e saídas e ação de criação | Filtros ficam em modal; a tabela vira `FlatList` com paginação por cursor e scroll infinito | Filtragem direta e lista vertical se ajustam melhor a uso com uma mão |
| `IncomePage` | Filtro `Entradas` em `TransactionsScreen` + atalho no dashboard | Transações e cor positiva de entradas | Área dedicada é representada por filtro/atalho, sem duplicar uma tela | Reduz profundidade de navegação mantendo acesso imediato |
| `ExpensesPage` | Filtro `Saídas` em `TransactionsScreen` + atalho no dashboard | Transações e cor de despesas | Área dedicada é representada por filtro/atalho, sem duplicar uma tela | Mantém consistência com entradas e simplifica a navegação móvel |
| `ProfilePage` | `ProfileScreen` | Nome, e-mail, plano, tempo de conta, idioma e tema | Cards em grid viram lista de informações e preferências tocáveis | A ordem linear melhora leitura por tela pequena e leitor de tela |
| Botão “Nova transação” | `QuickActionButton`, botão central e `NewTransactionScreen` | Intenção de adicionar transação | Ação aparece no dashboard, extrato e navegação persistente | Reduz esforço para a tarefa principal |
| `QueryState` web | `QueryState` mobile | Loading, erro, vazio, sucesso e retry | Ícones, mensagem central e botão de retry nativos | Estados ficam inequívocos e são anunciados por tecnologias assistivas |

## Decisões responsivas e visuais

- Em celular e largura pequena, todo o conteúdo analítico ocupa a largura disponível e os gráficos são empilhados.
- Em tablet, o conteúdo recebe largura máxima e margens laterais maiores; os cards não se estendem indefinidamente.
- O saldo é o único card preenchido para preservar a maior prioridade visual. Entradas usam verde e saídas usam vermelho, como no dashboard web.
- O tema claro usa fundo quase branco e cards cinza-claro. O tema escuro replica os semânticos existentes do dashboard web e pode ser alternado no cabeçalho.
- A tipografia preserva a diferença entre títulos, valores financeiros, rótulos e metadados. Valores longos usam ajuste de fonte controlado, sem desativar escala do sistema.
- Os gráficos têm `accessibilityLabel` completo com período, receitas/despesas ou categorias/percentuais. A representação puramente visual é ocultada da árvore acessível.
- Tabs, chips, atalhos e linhas de transação têm papéis e rótulos semânticos, ordem de leitura lógica e áreas de toque mínimas.

## Validação visual realizada

O bundle Expo local foi inspecionado em 320 × 720 px (tela pequena), 390 × 844 px (celular corrente) e 768 × 1024 px (tablet). Foram conferidos dashboard, extrato e perfil nos temas claro e escuro. Nas três larguras, o documento permaneceu sem overflow horizontal; o conteúdo manteve scroll vertical, Safe Area, tabs acessíveis e largura centralizada. Durante essa inspeção, o fundo raiz do tema escuro foi corrigido para acompanhar os cards e os valores monetários foram ajustados para permanecer legíveis na menor largura.

## Integrações concluídas

- repositórios e queries do Firestore via TanStack Query;
- agregações de saldo, período, fluxo mensal, categorias e transações recentes;
- paginação por cursor, scroll infinito, filtros e estados de atualização;
- formulário compartilhando validações Zod, mutations e invalidação de cache;
- Firebase Authentication, Security Rules, Storage e upload de comprovantes;
- gráficos conectados com descrições e tabelas alternativas acessíveis.
