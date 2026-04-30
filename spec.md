# SPEC — IS Network Interview System

> Arquivo de contexto para sessões de IA. Leia antes de qualquer tarefa neste projeto.

## Visão Geral

Sistema web interno para a equipe **IS Network** do Mercado Livre conduzir e registrar entrevistas técnicas de candidatos a vagas de redes. Substitui planilhas manuais.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Banco | MySQL 8 (mysql2/promise, pool) |
| Frontend | HTML SPA + Tailwind CSS CDN |
| Auth | Nenhuma (uso interno) |

---

## Banco de Dados

Banco: `entrevistas_network` (utf8mb4)

### Tabela: vagas

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | INT PK | Customizável — deve refletir o ID do sistema de RH do Mercado Livre |
| local | VARCHAR(255) | Obrigatório |
| descricao | TEXT | Opcional |
| status | ENUM('aberta','encerrada') | Default: 'aberta' |
| created_at | TIMESTAMP | Auto |

### Tabela: candidatos

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| nome | VARCHAR(255) | Obrigatório |
| linkedin | VARCHAR(500) | Opcional |
| pretensao_salarial | VARCHAR(100) | Armazenado já formatado: "R$ 12.000,00" |
| vaga_id | INT FK | → vagas ON DELETE SET NULL |
| tecnologias | JSON | `{ "Firewall::Fortigate": true, ... }` — chave no formato `Categoria::Vendor` |
| aceita_presencialidade | TINYINT(1) NULL | `1` = Sim, `0` = Não, `NULL` = Não informado |
| created_at | TIMESTAMP | Auto |

### Tabela: perguntas

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| categoria | VARCHAR(100) | Ex: "Camada 2 - Switch" |
| texto | TEXT | Pergunta reescrita para leitura em voz alta |
| gabarito | TEXT | Resposta de referência exibida como dica expansível |
| pontos | INT | 1 a 4 conforme dificuldade |
| dificuldade | ENUM('NORMAL','MEDIUM','HARD') | |

Seed de **45 perguntas** já inserido. Perguntas de AWS Cloud foram removidas.

### Tabela: respostas

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| candidato_id | INT FK | → candidatos ON DELETE CASCADE |
| pergunta_id | INT FK | → perguntas ON DELETE CASCADE |
| acertou | TINYINT(1) NULL | `1` = Acertou, `0` = Errou, `NULL` = Não Perguntado (excluído do score) |
| created_at | TIMESTAMP | Auto |

UNIQUE KEY em `(candidato_id, pergunta_id)` — usa `ON DUPLICATE KEY UPDATE` para upsert.

---

## API

Base: `/api`

### Vagas

- `GET /vagas` — lista com `COUNT(candidatos)` e `status` via LEFT JOIN, agrupado por id
- `GET /vagas/:id` — vaga individual
- `POST /vagas` — body: `{ id?, local, descricao }` — `id` é opcional; se informado, usa como PK (integração com RH). Retorna 409 se ID já existir
- `PUT /vagas/:id` — body: `{ new_id?, local, descricao }` — se `new_id` diferente do atual, executa transação: INSERT novo ID, UPDATE candidatos.vaga_id, DELETE antigo
- `PATCH /vagas/:id/status` — toggle entre 'aberta' e 'encerrada', retorna `{ status }`
- `DELETE /vagas/:id`

### Candidatos

- `GET /candidatos[?vaga_id=N]` — score calculado excluindo respostas com `acertou IS NULL`. Campos: `perguntas_respondidas`, `pontos_obtidos`, `pontos_totais`
- `GET /candidatos/:id` — inclui array `respostas` com detalhes das perguntas
- `POST /candidatos` — body: `{ nome, linkedin, pretensao_salarial, vaga_id, tecnologias, aceita_presencialidade }`
- `PUT /candidatos/:id` — mesmos campos do POST
- `POST /candidatos/:id/respostas` — body: `{ respostas: [{ pergunta_id, acertou }] }` — `acertou` pode ser `true`, `false` ou `null` (N/P). Upsert via `ON DUPLICATE KEY UPDATE`
- `DELETE /candidatos/:id` — cascade remove respostas

### Perguntas

- `GET /perguntas` — retorna todos os campos incluindo `gabarito`, ordenado por categoria, id
- `GET /perguntas/categorias` — lista de categorias distintas

### Health

- `GET /health` — `{ status: 'ok', timestamp }`

---

## Frontend

SPA single-file em `frontend/index.html`. Servido estaticamente pelo Express.

### Abas

1. **Vagas** — cards com local, ID, status badge (● Aberta / ● Encerrada), contagem de candidatos, botão "✓ Encerrar Vaga" / "↺ Reabrir" (toggle), ícone de edição ✎ e remoção ✕. Modal unificado para criar e editar com campo de ID customizável
2. **Candidatos** — lista com score, badge de nível, tecnologias agrupadas por categoria (ex: `Firewall: FortiGate, Palo Alto`), pretensão salarial e flag de presencialidade. Botões: "Entrevistar", "✎ Editar", "Remover". Modal unificado criar/editar com: máscara de moeda, select de presencialidade 2x/semana (Sim/Não/Não informado), e seletor de tecnologias por grupo expansível
3. **Questionário** — selector de candidato, 45 perguntas agrupadas por categoria. Cada pergunta tem badges HARD/MEDIUM e **três botões de resposta**: "✓ Acertou" (verde), "✗ Errou" (vermelho), "— N/P" (cinza = Não Perguntado, excluído do score). Estado visual por CSS (active com borda luminosa + glow). Linha da pergunta recebe fundo colorido conforme resposta. Gabarito expansível. Score inline exclui perguntas N/P do denominador. Botão "💾 Salvar Respostas" faz POST com upsert
4. **Dashboard** — 4 stat cards (total, entrevistados, score médio, acima da média), ranking ordenado por score desc com barra de progresso colorida, filtro por vaga

### Variáveis JS globais

- `allPerguntas` — array de perguntas carregado a cada abertura da aba
- `respostasAtivas` — `{ [pergunta_id]: true | false | null }` — `null` = Não Perguntado
- `tecSelecionadas` — `Set<string>` — valores no formato `"Categoria::Vendor"` (ex: `"Firewall::FortiGate"`)
- `TECNOLOGIAS_MAP` — `{ [categoria]: string[] }` — mapa com 7 categorias e 6 vendors cada

### Funções utilitárias JS

```js
pct(obtained, total)       // retorna 0-100
scoreLabel(p)              // retorna { text, cls } para badge ACIMA/MEDIANO/ABAIXO
scoreColor(p)              // retorna classe Tailwind para barra de progresso
mascaraMoeda(input)        // formata campo de texto para R$ 0.000,00 em tempo real
toggleGabarito(id)         // expande/colapsa o box de gabarito de uma pergunta
toggleTechGroup(header)    // expande/colapsa grupo de tecnologias no modal de candidato
toggleTec(key, el)         // seleciona/deseleciona vendor; key = "Categoria::Vendor"
api(path, opts)            // wrapper fetch com header JSON e tratamento de erro
toast(msg, type)           // notificação temporária (success/error) no canto inferior direito
```

### Modais

Todos os modais são reutilizados para criar e editar. A lógica de cada um:
- Detecta modo pelo campo hidden `*-edit-id` (vazio = criar, preenchido = editar)
- Atualiza título e texto do botão de submit conforme o modo
- `fecharModal*()` limpa o estado e fecha

---

## Categorias e Pontuação

| Categoria | Perguntas | Dificuldades | Pontos máx |
|-----------|-----------|--------------|------------|
| Camada 1 - Físico | 5 | NORMAL | 8 |
| Camada 2 - Switch | 9 | NORMAL + 1 MEDIUM | 18 |
| Camada 3 - Roteamento | 8 | NORMAL + 3 HARD | 24 |
| Camada 4 e 7 | 11 | NORMAL | 24 |
| Wi-Fi | 12 | NORMAL + 2 HARD | 27 |
| **Total** | **45** | | **101** |

> AWS Cloud foi removida do questionário (7 perguntas excluídas).

Pontos variam de 1 a 4. Score = pontos_obtidos / pontos_totais_respondidos × 100.

---

## Critérios de Avaliação

- **ACIMA** (verde): >= 75%
- **MEDIANO** (amarelo): 50–74%
- **ABAIXO** (vermelho): < 50%

---

## Tecnologias do Candidato

Seletor agrupado por categoria, com grupos colapsáveis. Cada grupo exibe contador de itens selecionados no cabeçalho.

```js
TECNOLOGIAS_MAP = {
  'Firewall':              ['Fortinet FortiGate', 'Palo Alto Networks', 'Check Point', 'Cisco FTD/ASA', 'Sophos XGS', 'pfSense / OPNsense'],
  'Switch':                ['Cisco Catalyst/Nexus', 'HP Aruba', 'Juniper EX/QFX', 'Huawei CloudEngine', 'Ruckus ICX', 'Dell EMC PowerSwitch'],
  'Wi-Fi':                 ['Cisco Meraki / Catalyst', 'Aruba Networks', 'Ubiquiti UniFi', 'Ruckus SmartZone', 'Fortinet FortiAP', 'Extreme Networks'],
  'IPAM':                  ['Infoblox', 'NetBox', 'phpIPAM', 'SolarWinds IPAM', 'BlueCat', 'Micetro (Men&Mice)'],
  'NAC':                   ['Cisco ISE', 'Aruba ClearPass', 'FortiNAC', 'Forescout', 'Portnox', 'PacketFence'],
  'Gestão Centralizada':   ['FortiManager', 'Aruba Central', 'Cisco DNA Center', 'Juniper Mist', 'SolarWinds NMS', 'PRTG Network Monitor'],
  'Linguagem / Automação': ['Python', 'Ansible', 'Terraform', 'Bash / Shell', 'PowerShell', 'Go'],
}
```

Armazenado como JSON no banco com chave no formato `"Categoria::Vendor"`:
```json
{ "Firewall::Fortinet FortiGate": true, "Switch::Cisco Catalyst/Nexus": true }
```

No card do candidato, exibido agrupado: `Firewall: FortiGate, Palo Alto`

---

## Vagas — Integração com RH

O campo `id` da tabela `vagas` é customizável para refletir o ID da vaga no sistema de RH do Mercado Livre. Ao criar ou editar uma vaga, o campo "ID da Vaga" aparece no modal. Se deixado em branco na criação, o MySQL gera automaticamente via AUTO_INCREMENT.

Ao **trocar o ID** de uma vaga existente, o backend executa uma transação atômica:
1. INSERT na nova vaga com o novo ID
2. UPDATE em todos os candidatos vinculados
3. DELETE da vaga antiga

---

## Status de Vagas

Cada vaga tem um campo `status` ENUM('aberta','encerrada'). O toggle é feito via `PATCH /vagas/:id/status` que inverte o estado atual. Vagas encerradas aparecem visualmente com opacidade reduzida no card.

---

## Padrões de Código

- Async/await com try/catch em todos os handlers Express
- `db.query()` retorna `[rows, fields]` — sempre desestruturar o primeiro elemento
- Transações usam `db.getConnection()` com `beginTransaction / commit / rollback / release`
- Frontend usa `fetch` nativo com helper `api(path, opts)` que lança erro se `!r.ok`
- Sem autenticação, sem middleware extra — sistema interno simples
- CSS inline via `<style>` tag + Tailwind utility classes via CDN
- Perguntas sempre recarregadas ao abrir a aba Questionário (sem cache)

---

## Estrutura de Arquivos

```
entrevistas-Network/
├── schema.sql              # DDL completo + seed de 45 perguntas
├── README.md               # Instruções de setup e endpoints
├── spec.md                 # Este arquivo — contexto para IA
├── backend/
│   ├── package.json
│   ├── server.js           # Express, rotas, serve frontend estático
│   ├── db.js               # Pool mysql2/promise
│   └── routes/
│       ├── vagas.js        # GET, POST, PUT, PATCH status, DELETE
│       ├── candidatos.js   # GET, POST, PUT, DELETE + POST respostas
│       └── perguntas.js    # GET all, GET categorias
└── frontend/
    └── index.html          # SPA completa (~750 linhas)
```

---

## Possíveis Evoluções Futuras

- Exportação PDF/Excel do resultado da entrevista por candidato
- Campo de observações livres por candidato
- CRUD de perguntas pela própria interface
- Múltiplos entrevistadores por sessão com notas individuais
- Histórico de alterações de respostas
- Autenticação simples com senha de time
- Filtro no dashboard por período de data
