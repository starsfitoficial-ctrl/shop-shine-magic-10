

## Problema

O login redireciona sempre para `/dashboard`. Como o usuário também tem role `store_owner` e criou uma loja, ele vê o painel do lojista. Não há nenhum link para `/admin` na interface — o acesso só funciona digitando a URL manualmente.

## Solução

Duas mudanças simples:

### 1. Redirecionar admin para `/admin` após login

Em `src/pages/Auth.tsx`, após login bem-sucedido, verificar as roles do usuário. Se tiver role `admin`, redirecionar para `/admin` em vez de `/dashboard`.

### 2. Adicionar link "Admin" no header do Dashboard

Em `src/pages/Dashboard.tsx`, adicionar um botão/link condicional no header que só aparece para usuários com `isAdmin`, direcionando para `/admin`. Assim, mesmo que o admin navegue ao dashboard, consegue voltar ao painel admin facilmente.

### 3. Adicionar link "Dashboard" no header do Admin

Em `src/pages/Admin.tsx`, adicionar um link para `/dashboard` no header para que o admin possa alternar entre os dois painéis.

