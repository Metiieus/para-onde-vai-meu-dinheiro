# Para Onde Vai Meu Dinheiro

> Transparência pública ao alcance de todos os brasileiros.

**Para Onde Vai Meu Dinheiro** é uma plataforma de código aberto que transforma dados governamentais complexos em informações claras e acessíveis. O objetivo é empoderar a população brasileira com ferramentas para acompanhar o uso do dinheiro público.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Ranking de Gastos** | Veja quais parlamentares mais gastaram a cota parlamentar (CEAP), por categoria e ano |
| **Calculadora de Impostos** | Descubra quanto você paga de INSS, IRRF e impostos de consumo, com metodologia progressiva real |
| **Tradução de Valores** | Entenda o que os gastos públicos representam em termos concretos (cestas básicas, consultas médicas, etc.) |
| **Alertas de Licitações** | Identifique licitações com preços acima do mercado em todo o Brasil |
| **Perfil do Parlamentar** | Veja o histórico detalhado de despesas de qualquer deputado federal |

---

## Arquitetura

```
para-onde-vai-meu-dinheiro/
├── app/                    # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # React Hooks (lógica de estado)
│   │   ├── sections/       # Seções/páginas da aplicação
│   │   ├── services/       # Camada de comunicação com a API
│   │   └── types/          # Tipos TypeScript
│   └── .env.example        # Variáveis de ambiente do frontend
│
├── backend/                # Backend (FastAPI + Python)
│   ├── main.py             # API principal
│   ├── tests/              # Testes unitários
│   ├── requirements.txt    # Dependências Python
│   ├── Dockerfile          # Container do backend
│   └── .env.example        # Variáveis de ambiente do backend
│
└── README.md
```

**Fluxo de dados:**

```
Usuário → Frontend (React) → Backend (FastAPI) → Cache (Redis) → APIs Governamentais
```

O backend atua como um **BFF (Backend for Frontend)**, centralizando todas as chamadas às APIs governamentais, aplicando cache com Redis e processando dados em paralelo. O frontend **nunca** acessa as APIs governamentais diretamente.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Python](https://python.org/) 3.11+
- [Redis](https://redis.io/) (opcional, mas recomendado para performance)

---

## Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/Metiieus/para-onde-vai-meu-dinheiro.git
cd para-onde-vai-meu-dinheiro
```

### 2. Configure o Backend

```bash
cd backend

# Crie e ative um ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Inicie o servidor
uvicorn main:app --reload --port 8000
```

A API estará disponível em `http://localhost:8000`.
A documentação interativa (Swagger) estará em `http://localhost:8000/docs`.

### 3. Configure o Frontend

```bash
cd app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local se necessário (padrão aponta para localhost:8000)

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

---

## Testes

### Backend

```bash
cd para-onde-vai-meu-dinheiro
python3 -m pytest backend/tests/ -v
```

### Frontend

```bash
cd app
npm run lint
```

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | URL de conexão com o Redis |
| `CACHE_TTL` | `3600` | Tempo de vida do cache em segundos |
| `CACHE_ADMIN_KEY` | *(vazio)* | Chave secreta para o endpoint `/api/cache/clear` |
| `ALLOWED_ORIGINS` | `*` | Origens permitidas no CORS (use o domínio do frontend em produção) |
| `PORT` | `8000` | Porta do servidor |

### Frontend (`app/.env.local`)

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:8000` | URL do backend |

---

## Fontes de Dados

| Fonte | Dados |
|---|---|
| [API de Dados Abertos da Câmara](https://dadosabertos.camara.leg.br/) | Deputados, despesas, proposições |
| [API de Dados Abertos do Senado](https://legis.senado.leg.br/dadosabertos/) | Senadores |
| [Portal da Transparência](https://portaldatransparencia.gov.br/) | Contratos, convênios, servidores |
| [IBPT](https://ibpt.com.br/) | Metodologia de estimativa de impostos sobre consumo |

---

## Contribuindo

Contribuições são bem-vindas! Este projeto tem um propósito social importante: ajudar a população brasileira a entender para onde vai o dinheiro dos seus impostos.

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feature/minha-melhoria`
3. Faça commit das suas alterações: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Faça push para a branch: `git push origin feature/minha-melhoria`
5. Abra um Pull Request

### Convenção de Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — nova funcionalidade
- `fix:` — correção de bug
- `docs:` — atualização de documentação
- `refactor:` — refatoração sem mudança de comportamento
- `test:` — adição ou correção de testes

---

## Licença

Este projeto é de código aberto. Consulte o arquivo `LICENSE` para mais informações.

---

*Feito com dedicação para a transparência pública brasileira.*
