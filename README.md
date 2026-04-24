# IS Network — Sistema de Entrevistas Técnicas

Sistema web para gestão de entrevistas técnicas da equipe IS Network do Mercado Livre.

## Funcionalidades

- **Vagas**: Cadastro e gestão de vagas com ID customizável (integrado ao ID do sistema de RH), status de aberta/encerrada
- **Candidatos**: Cadastro com LinkedIn, pretensão salarial (formatada em R$) e checklist de tecnologias conhecidas
- **Questionário**: 45 perguntas técnicas categorizadas com marcação de acerto/erro em tempo real e gabarito de referência expansível
- **Dashboard**: Ranking de candidatos por score técnico com filtro por vaga

## Pré-requisitos

- Node.js 18+
- MySQL 8+

## Setup

### 1. Banco de dados

```bash
mysql -u root -p < schema.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Variáveis de ambiente (opcional, padrões já configurados):

```bash
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=sua_senha
export DB_NAME=entrevistas_network
export PORT=3000
```

### 3. Iniciar o servidor

```bash
# Produção
npm start

# Desenvolvimento (com hot reload)
npm run dev
```

Acesse: **http://localhost:3000**

## Estrutura

```
entrevistas-Network/
├── schema.sql                  # DDL + seed de perguntas
├── backend/
│   ├── package.json
│   ├── server.js               # Entry point Express
│   ├── db.js                   # Pool MySQL2
│   └── routes/
│       ├── vagas.js            # CRUD vagas + toggle status
│       ├── candidatos.js       # CRUD candidatos + respostas
│       └── perguntas.js        # Listagem de perguntas
└── frontend/
    └── index.html              # SPA com Tailwind CSS
```

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/vagas` | Lista vagas com contagem de candidatos |
| GET | `/api/vagas/:id` | Retorna vaga por ID |
| POST | `/api/vagas` | Cria vaga (aceita `id` customizado) |
| PUT | `/api/vagas/:id` | Edita vaga (suporta troca de ID com migração de candidatos) |
| PATCH | `/api/vagas/:id/status` | Alterna status aberta/encerrada |
| DELETE | `/api/vagas/:id` | Remove vaga |
| GET | `/api/candidatos` | Lista candidatos com score |
| GET | `/api/candidatos?vaga_id=N` | Filtra candidatos por vaga |
| GET | `/api/candidatos/:id` | Candidato completo com respostas |
| POST | `/api/candidatos` | Cria candidato |
| PUT | `/api/candidatos/:id` | Edita candidato |
| POST | `/api/candidatos/:id/respostas` | Salva respostas (upsert) |
| DELETE | `/api/candidatos/:id` | Remove candidato e respostas |
| GET | `/api/perguntas` | Lista todas as perguntas com gabarito |
| GET | `/api/perguntas/categorias` | Lista categorias distintas |
| GET | `/api/health` | Health check |

## Categorias de Perguntas

| Categoria | Qtd | Pontos máx |
|-----------|-----|------------|
| Camada 1 - Físico | 5 | 8 |
| Camada 2 - Switch | 9 | 18 |
| Camada 3 - Roteamento | 8 | 24 |
| Camada 4 e 7 | 11 | 24 |
| Wi-Fi | 12 | 27 |
| **Total** | **45** | **101** |

> As perguntas de AWS Cloud foram removidas do questionário padrão.

## Score

- **ACIMA** (verde): >= 75%
- **MEDIANO** (amarelo): 50% – 74%
- **ABAIXO** (vermelho): < 50%
