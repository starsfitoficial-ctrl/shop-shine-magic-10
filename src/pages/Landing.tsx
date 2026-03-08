import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, ShoppingBag, BarChart3, Zap, Crown, Check, Star, MessageCircle } from "lucide-react";

const mockProducts = [
  { name: "Camiseta Premium", price: "R$ 89,90", color: "bg-primary/10" },
  { name: "Tênis Esportivo", price: "R$ 249,90", color: "bg-accent/30" },
  { name: "Bolsa Couro", price: "R$ 179,90", color: "bg-muted" },
];

const testimonials = [
  {
    initials: "MC",
    name: "Marina Costa",
    business: "Loja de Roupas",
    city: "São Paulo, SP",
    text: "Triplicei meus pedidos no primeiro mês! Meus clientes adoram a facilidade de pedir pelo WhatsApp.",
  },
  {
    initials: "RL",
    name: "Ricardo Lima",
    business: "Hamburgueria",
    city: "Belo Horizonte, MG",
    text: "Antes eu perdia pedidos por não ter cardápio digital. Agora recebo pedidos organizados direto no WhatsApp.",
  },
  {
    initials: "AF",
    name: "Ana Ferreira",
    business: "Acessórios Artesanais",
    city: "Curitiba, PR",
    text: "Montei minha loja em menos de 5 minutos e já comecei a vender no mesmo dia. Incrível!",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-header.png" alt="SysGrowth" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button>Criar Loja Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted/30 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Text */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Sua loja online em <span className="text-primary">minutos</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Catálogo profissional com checkout via WhatsApp. Seus clientes pedem, você vende.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
                <Link to="/auth">
                  <Button size="lg" className="w-full text-lg px-8 sm:w-auto">
                    Criar Loja Grátis
                  </Button>
                </Link>
                <Link to="/loja-demo-brasil">
                  <Button size="lg" variant="outline" className="w-full text-lg px-8 sm:w-auto">
                    Ver Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative w-[280px] rounded-[2.5rem] border-[6px] border-foreground/20 bg-card p-3 shadow-2xl">
                {/* Notch */}
                <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-foreground/10" />
                {/* Store header inside phone */}
                <div className="rounded-t-xl bg-primary px-3 py-2">
                  <p className="text-center text-sm font-bold text-primary-foreground">Minha Loja</p>
                </div>
                {/* Products */}
                <div className="space-y-2 bg-background p-2">
                  {mockProducts.map((product) => (
                    <div key={product.name} className="flex items-center gap-3 rounded-lg border bg-card p-2">
                      <div className={`h-12 w-12 flex-shrink-0 rounded-md ${product.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{product.name}</p>
                        <p className="text-xs font-bold text-primary">{product.price}</p>
                      </div>
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                        <MessageCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bottom bar */}
                <div className="flex justify-around rounded-b-xl bg-muted px-2 py-2">
                  <div className="h-1 w-8 rounded-full bg-foreground/20" />
                  <div className="h-1 w-8 rounded-full bg-primary" />
                  <div className="h-1 w-8 rounded-full bg-foreground/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers / Social proof bar */}
      <section className="bg-primary">
        <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-10 text-center sm:grid-cols-3">
          <div>
            <p className="text-4xl font-extrabold text-primary-foreground">+500</p>
            <p className="mt-1 text-sm text-primary-foreground/80">Lojas criadas</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-primary-foreground">R$ 0</p>
            <p className="mt-1 text-sm text-primary-foreground/80">Para começar</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-primary-foreground">2 min</p>
            <p className="mt-1 text-sm text-primary-foreground/80">Para estar no ar</p>
          </div>
        </div>
      </section>

      {/* Demo Banner */}
      <section className="border-t bg-primary/5">
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-14 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Exemplo ao vivo
            </span>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              Conheça a Loja Demo Brasil
            </h2>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Explore uma loja completa com 10 produtos, categorias e checkout via WhatsApp. Veja na prática o que você pode criar em minutos.
            </p>
          </div>
          <Link to="/loja-demo-brasil">
            <Button size="lg" className="text-lg px-8 shadow-lg">
              <Store className="mr-2 h-5 w-5" />
              Visitar Loja Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Tudo que você precisa</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-6 text-center">
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Catálogo Digital</h3>
              <p className="text-muted-foreground">Cadastre seus produtos com fotos, preços e categorias. Seus clientes navegam como num e-commerce.</p>
            </div>
            <div className="rounded-lg border bg-background p-6 text-center">
              <Zap className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Checkout WhatsApp</h3>
              <p className="text-muted-foreground">O cliente monta o carrinho e finaliza direto no WhatsApp da sua loja com pedido formatado.</p>
            </div>
            <div className="rounded-lg border bg-background p-6 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Painel Completo</h3>
              <p className="text-muted-foreground">Gerencie produtos, estoque, categorias, taxas de entrega e acompanhe métricas de cliques.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t bg-background py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">O que nossos lojistas dizem</h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.business} · {t.city}</p>
                    </div>
                  </div>
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Escolha seu plano</h2>
            <p className="mt-3 text-muted-foreground">Comece grátis, escale quando quiser</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Grátis */}
            <Card className="relative">
              <CardHeader className="text-center pb-2">
                <Store className="mx-auto mb-3 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Grátis</CardTitle>
                <p className="mt-2 text-3xl font-extrabold text-foreground">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Até 10 produtos", "Checkout via WhatsApp", "1 loja", "Subdomínio vitrineDigital.app/sua-loja"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
                <Link to="/auth" className="block pt-4">
                  <Button variant="outline" className="w-full">Começar Grátis</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro — Destacado */}
            <Card className="relative border-primary shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Mais Popular
              </Badge>
              <CardHeader className="text-center pb-2">
                <Zap className="mx-auto mb-3 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Pro</CardTitle>
                <p className="mt-2 text-3xl font-extrabold text-foreground">R$ 49<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Produtos ilimitados", "Checkout via WhatsApp", "1 loja", "Domínio customizado", "Suporte prioritário", "Analytics de cliques"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
                <Link to="/auth" className="block pt-4">
                  <Button className="w-full">Assinar Pro</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="relative">
              <CardHeader className="text-center pb-2">
                <Crown className="mx-auto mb-3 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Premium</CardTitle>
                <p className="mt-2 text-3xl font-extrabold text-foreground">R$ 99<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Tudo do Pro", "Até 5 lojas", "Analytics avançado", "Relatório de pedidos", "Integração futura com pagamentos"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
                <Link to="/auth" className="block pt-4">
                  <Button variant="outline" className="w-full">Assinar Premium</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SysGrowth Vitrine Digital. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;
