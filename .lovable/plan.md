

## Plano: Criar Usuário Admin Geral

O e-mail `sysgrowth.oficial@gmail.com` ainda não existe no sistema. Precisamos:

### Passo 1 — Cadastrar o usuário
Você precisa se cadastrar manualmente pela interface:
1. Acesse `/auth` no preview
2. Clique em "Criar conta"
3. Preencha: Nome: `Sulimar - Sys Growth`, E-mail: `sysgrowth.oficial@gmail.com`, Senha: `@Sysgrowth123!`
4. Confirme o e-mail (se a confirmação estiver ativa)

### Passo 2 — Adicionar role admin
Após o cadastro, eu executo uma migration SQL para inserir a role `admin` na tabela `user_roles` para o `user_id` recém-criado.

### Alternativa (mais rápida)
Se preferir, posso tentar criar o usuário diretamente via Edge Function usando a service role key, e em seguida inserir a role admin — tudo automatizado sem precisar cadastrar manualmente.

### Recomendação
A alternativa automatizada é mais prática. Após a implementação, basta acessar `/auth`, fazer login com as credenciais acima, e navegar para `/admin`.

