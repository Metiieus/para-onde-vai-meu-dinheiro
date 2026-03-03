# Plano de Ação: Melhorias para o Projeto "Para Onde Vai Meu Dinheiro"

**Autor:** Manus AI
**Data:** 03 de Março de 2026

## 1. Introdução

Com base na análise aprofundada do repositório `para-onde-vai-meu-dinheiro` e compreendendo a importância de sua missão social, este documento estabelece um plano de ação detalhado para aprimorar o projeto. As melhorias propostas visam aumentar a **confiabilidade, performance, segurança, manutenibilidade e experiência do usuário**, garantindo que a aplicação seja uma ferramenta robusta e precisa para a população.

As tarefas foram categorizadas por área e priorizadas para guiar um desenvolvimento iterativo e focado no que gera mais valor e estabilidade para o sistema.

### Níveis de Prioridade

*   **Crítica:** Falhas graves que comprometem a funcionalidade, segurança ou a veracidade dos dados. Devem ser corrigidas imediatamente.
*   **Alta:** Problemas que impactam significativamente a performance, a arquitetura ou a escalabilidade do projeto.
*   **Média:** Melhorias importantes para a qualidade do código, experiência do desenvolvedor e do usuário.
*   **Baixa:** Refinamentos e otimizações que agregam valor mas não são urgentes.

## 2. Lista de Melhorias e Aprimoramentos

### 2.1. Arquitetura e Backend

| Tarefa | Problema | Solução Proposta | Prioridade |
| :--- | :--- | :--- | :--- |
| **Centralizar Lógica de Ranking** | O frontend executa um loop (N+1) para buscar despesas de cada deputado, causando lentidão extrema e sobrecarga nas APIs externas. | Mover toda a lógica de cálculo do ranking para o endpoint `/api/ranking` no backend. O frontend deve fazer uma única chamada para obter os dados já processados e cacheados. | **Crítica** |
| **Corrigir Chamadas Bloqueantes** | O backend usa a biblioteca síncrona `requests` em um ambiente assíncrono (FastAPI), bloqueando o event loop e degradando a performance. | Substituir `requests` pela biblioteca `httpx` (já presente nas dependências) para fazer chamadas de API assíncronas com `await`. | **Crítica** |
| **Proteger Endpoint de Cache** | O endpoint `/api/cache/clear` que executa `r.flushall()` está público e sem autenticação, permitindo que qualquer um apague todo o cache da aplicação. | Proteger este endpoint com um mecanismo de autenticação (ex: chave de API secreta no header) para que apenas administradores possam acessá-lo. | **Crítica** |
| **Unificar Lógica de Negócio** | Regras de cálculo de impostos e valores de referência (`VALORES_REFERENCIA`) estão duplicadas no frontend e backend, dificultando a manutenção. | Manter toda a lógica de negócio exclusivamente no backend. Criar endpoints para que o frontend consuma esses dados e resultados, garantindo uma única fonte da verdade. | **Alta** |
| **Chave de Cache Determinística** | O uso de `hash()` para gerar chaves de cache não é seguro, pois o seu resultado pode variar entre diferentes processos em ambientes com múltiplos workers (produção). | Substituir `hash()` por um algoritmo de hash determinístico, como `hashlib.sha256`, para garantir que a mesma requisição sempre gere a mesma chave de cache. | **Alta** |
| **Estruturar o Código do Backend** | Todo o código do backend está em um único arquivo (`main.py`), o que dificulta a escalabilidade e manutenção. | Refatorar o backend para uma estrutura modular, separando o código em pastas como `routers`, `services`, `models` e `core` (para cache e configurações). | **Média** |
| **Configuração de CORS Segura** | A política de CORS (`allow_origins=["*"]`) é insegura para produção. | Utilizar variáveis de ambiente para definir as origens permitidas, restringindo o acesso apenas ao domínio do frontend em produção. | **Alta** |
| **Implementar Rate Limiting** | A API não possui limite de requisições, ficando vulnerável a ataques de negação de serviço (DoS) ou uso abusivo. | Implementar uma biblioteca de rate limiting, como `slowapi`, para controlar o número de requisições que um cliente pode fazer em um determinado intervalo de tempo. | **Baixa** |

### 2.2. Frontend e Experiência do Usuário (UX)

| Tarefa | Problema | Solução Proposta | Prioridade |
| :--- | :--- | :--- | :--- |
| **Implementar Roteamento Real** | A navegação entre telas é simulada com `useState`, o que impede o uso de URLs diretas, histórico do navegador e compartilhamento de links. | Adicionar a biblioteca `react-router-dom` para gerenciar as rotas da aplicação (ex: `/`, `/ranking`, `/perfil/:id`), criando uma Single-Page Application (SPA) real. | **Alta** |
| **Corrigir Cálculo de Impostos** | A calculadora de impostos soma alíquotas de forma linear sobre o salário bruto, o que é conceitualmente incorreto (mistura impostos sobre renda e consumo). | Refatorar a calculadora para focar em impostos sobre a renda (INSS, IRRF) com suas faixas e deduções corretas. Criar uma seção separada para explicar a carga tributária sobre o consumo. | **Crítica** |
| **Tratamento de Erros e Estados Vazios** | As seções não exibem feedback visual para o usuário em caso de erro na API ou quando uma busca não retorna resultados. | Implementar componentes de estado de erro e estado vazio em todas as seções que dependem de dados externos, informando o usuário sobre o que aconteceu. | **Média** |
| **Implementar Error Boundary** | Uma falha em um componente pode quebrar a aplicação inteira. | Criar um componente de `ErrorBoundary` global para capturar erros de renderização em qualquer parte da árvore de componentes e exibir uma UI de fallback. | **Média** |
| **Debounce na Busca** | A busca por políticos e cidades é executada a cada tecla pressionada, gerando requisições desnecessárias. | Implementar um hook customizado (`useDebounce`) para adicionar um pequeno atraso (ex: 300ms) antes de executar a busca, disparando a API apenas quando o usuário para de digitar. | **Média** |
| **Melhorar Acessibilidade (a11y)** | Faltam atributos de acessibilidade, como `aria-label` em botões de ícone e `role` em elementos interativos, dificultando o uso por leitores de tela. | Adicionar atributos `aria-label`, `role` e garantir o uso de HTML semântico em toda a aplicação para melhorar a acessibilidade. | **Baixa** |
| **Melhorar SEO** | O título da página é estático e não há meta tags de descrição, o que prejudica a indexação em mecanismos de busca. | Utilizar a biblioteca `react-helmet-async` para gerenciar dinamicamente o `<title>` e as meta tags de cada página, melhorando o SEO. | **Baixa** |

### 2.3. Qualidade de Código e DevOps

| Tarefa | Problema | Solução Proposta | Prioridade |
| :--- | :--- | :--- | :--- |
| **Remover Arquivos de Build do Git** | O diretório `app/dist` está versionado, poluindo o repositório. | Criar um arquivo `.gitignore` na raiz do projeto, adicionar `app/dist/`, `app/node_modules/` e outros arquivos gerados, e remover o `dist` do histórico do Git. | **Crítica** |
| **Implementar Testes Automatizados** | A ausência de testes torna o projeto frágil e as refatorações arriscadas. | Introduzir `pytest` no backend para testes de unidade e de API. No frontend, usar `Vitest` e `React Testing Library` para testar hooks e componentes. | **Alta** |
| **Remover `console.log`** | O código possui vários `console.log` que não deveriam estar em produção. | Configurar o linter (ESLint) para proibir `console.log` e removê-los do código. | **Média** |
| **Atualizar README** | O `README.md` é o template padrão do Vite e não contém informações sobre o projeto, como rodá-lo localmente ou sua arquitetura. | Reescrever o `README.md` principal com uma descrição do projeto, instruções de setup para o frontend e backend, e uma visão geral da arquitetura. | **Baixa** |
| **Implementar CI/CD** | Não há um processo automatizado de integração contínua ou deploy. | Criar um workflow simples no GitHub Actions para rodar o linter e os testes a cada push ou pull request, garantindo a qualidade do código. | **Média** |
| **Remover Dependências Inutilizadas** | O `package.json` do frontend lista dependências como `zod` e `date-fns` que não parecem ser utilizadas. | Analisar e remover as dependências que não estão em uso para diminuir o tamanho do bundle e a complexidade do projeto. | **Baixa** |

## 3. Próximos Passos

Recomendo seguir a ordem de prioridade definida neste plano. Começar pelas melhorias **críticas** garantirá que a aplicação se torne imediatamente mais estável, performática e confiável. Em seguida, as melhorias de prioridade **alta** fortalecerão a arquitetura para o futuro, e assim por diante.

Estou pronto para começar a implementação dessas melhorias. Aguardo sua confirmação para darmos o próximo passo.
