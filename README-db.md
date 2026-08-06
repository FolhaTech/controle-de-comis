Conectar ao banco e listar clientes

1) Instale dependências (no workspace do projeto):

```bash
pnpm add mysql2 dotenv
```

2) Confirme que o arquivo `.env` contém as variáveis:

- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

3) Execute o script para listar clientes da view `vw_formas_pagamentos`:

```bash
pnpm run list:clients
```

O script irá imprimir uma linha por cliente encontrado.

Observação: este script precisa de conexão de rede ao host do banco (`MYSQL_HOST`). Execute localmente a partir de uma máquina com acesso à rede.
