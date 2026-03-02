

## Como acessar o Painel de Administração

O painel Admin já está implementado e acessível na rota `/admin`.

### Requisitos de acesso

1. **Estar autenticado** — Faça login em `/auth` com um usuário que tenha a role `admin`.
2. **Ter a role `admin`** — O sistema verifica a tabela `user_roles` no banco de dados. Se o usuário não tiver a role `admin`, ele é redirecionado para `/dashboard`.

### Fluxo de navegação

```text
/auth (login) → /admin (se role = admin)
                /dashboard (se role = store_owner ou sem role admin)
```

### O que o painel Admin exibe hoje

Com base no código em `src/pages/Admin.tsx`:

- **Lojas Ativas** — contagem de lojas com status `active` ou `trial`
- **Lojas Inativas** — todas as demais
- **Total de Cliques** — contagem global da tabela `click_events`
- **Lista de lojas** — nome, slug, badge de status e botão "Ver" que abre a vitrine

### Como verificar se seu usuário tem acesso

Não há link direto para `/admin` na interface (Landing ou Dashboard). Você precisa:

1. Fazer login em `/auth`
2. Navegar manualmente para `/admin` na barra de endereço

Se for redirecionado para `/dashboard`, significa que seu usuário não tem a role `admin` na tabela `user_roles`. Nesse caso, precisaríamos inserir essa role no banco para o seu `user_id`.

### Observação

Atualmente não existe um link de navegação no Dashboard ou na Landing apontando para `/admin` — o acesso é apenas por URL direta, o que é adequado para um painel administrativo restrito.

