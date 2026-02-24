## 🏪 SaaS Multi-Tenant - Vitrine Digital White Label

Sistema completo de catálogo digital com checkout via WhatsApp, painel do lojista e painel administrativo.

---

### Fase 1: Fundação (Banco de Dados & Autenticação)

**Supabase Setup**

- Conectar Supabase ao projeto
- Configurar autenticação com Email + Senha + Google OAuth

**Estrutura do Banco de Dados**

- Tabela `stores` — dados da loja (nome, slug, logo, cor primária, WhatsApp, taxa de entrega, endereço, status da assinatura, data de expiração)
- Tabela `categories` — categorias por loja com ícone e ordem
- Tabela `products` — produtos com nome, slug, descrição, preço, imagens, SKU, estoque, status (ativo/esgotado), categoria
- Tabela `orders` — pedidos com nome do cliente, telefone, endereço, tipo de entrega, forma de pagamento, itens, total, status
- Tabela `click_events` — rastreamento de cliques (ver produto / finalizar WhatsApp)
- Tabela `delivery_zones` — bairros com taxa personalizada por loja
- Tabela `user_roles` — separação segura de roles (admin, store_owner)
- Tabela `store_settings` — páginas legais (política de reembolso, termos, contato)
- RLS (Row Level Security) em todas as tabelas

---

### Fase 2: Vitrine Pública (Frontend do Cliente)

**Rota: `/:store_slug**`

- Header fixo com logo da loja, barra de busca, ícone de favoritos e carrinho
- Cor primária dinâmica baseada na configuração do lojista
- Carrossel horizontal de categorias com ícones
- Grid de produtos com imagem, nome, preço
- Ordenação: Menor Preço / Destaques
- Busca com filtro em tempo real
- Badge "Esgotado" em produtos sem estoque
- Páginas legais automáticas: Política de Reembolso, Termos de Uso, Contato

**Rota: `/:store_slug/p/:product_slug**`

- Página de destino do produto com galeria de imagens
- Botão "Adicionar a Sacola"
- Schema.org JSON-LD completo (name, description, image, sku, offers com price, availability, url)
- Rastreamento de clique "Ver Produto"

---

### Fase 3: Carrinho & Checkout WhatsApp

**Carrinho (persistido no localStorage)**

- Drawer/sidebar com lista de itens, quantidades e subtotal
- Alterar quantidade ou remover itens

**Página de Checkout Local**

- Formulário com validação (Zod): Nome, Telefone, Tipo de Entrega (Delivery/Retirada), Endereço completo, Forma de Pagamento
- Cálculo de taxa de entrega (por bairro ou fixa)
- Resumo do pedido com subtotal, taxa e total

**Botão Mágico — WhatsApp**

- Gera mensagem formatada com template profissional (emojis, itens, valores, dados do cliente)
- Abre `api.whatsapp.com/send?phone=...&text=...`
- Salva pedido no banco com rastreamento de clique "Finalizar WhatsApp"

---

### Fase 4: Painel do Lojista (`/dashboard`)

**Dashboard Principal**

- Contador de cliques: "Ver Produto" vs "Finalizar WhatsApp" com gráfico temporal
- Resumo de pedidos recentes
- Total de produtos ativos

**Gestão de Produtos**

- CRUD completo de produtos com upload de imagens
- Botão rápido "Marcar como Esgotado" (atualiza Schema.org automaticamente)
- Gestão de categorias

**Configurações da Loja**

- Nome, logo, cor primária, número WhatsApp
- Taxa de entrega: fixa ou por bairro
- Edição das páginas legais (Política de Reembolso, Termos, Contato)

---

### Fase 5: Painel Admin (`/admin`)

**Visão Geral**

- MRR (Receita Mensal Recorrente) via [Asaas](https://www.asaas.com/)
- Total de lojas ativas/inativas
- Controle de expiração de assinaturas

**Gestão de Lojistas**

- Lista de lojas com status de assinatura
- Ativar/desativar lojas
- Ver métricas por loja

**Stripe Integrado**

- Planos de assinatura mensal para lojistas
- Webhooks para ativar/desativar automaticamente
- Portal do cliente Asaas para gerenciar pagamento

**Loja Demo**

- Loja de demonstração com dados pré-preenchidos
- Reset automático dos dados a cada 24h (cron job via Edge Function)

---

### Fase 6: SEO & Google Shopping Ready

- Schema.org JSON-LD em todas as páginas de produto
- Meta tags dinâmicas (title, description, og:image)
- Estrutura de banco pronta para feed XML RSS 2.0 (futura Edge Function)
- Sitemap dinâmico por loja
- Páginas legais obrigatórias geradas automaticamente

---

### Design & UX

- **Estilo "Mercado Livre"**: limpo, funcional, com foco em conversão
- **Design responsivo**: mobile-first
- **Sistema de cores dinâmico**: cada loja aplica sua `cor_primaria` via CSS variables
- **Componentes Shadcn/UI** com Tailwind CSS
- **Sonner** para notificações toast