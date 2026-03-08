import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, ShoppingBag, BarChart3, Zap, Crown, Check } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">SysGrowth Vitrine Digital</span>
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
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Sua loja online em <span className="text-primary">minutos</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Crie sua vitrine digital com checkout via WhatsApp. Catálogo profissional, personalizado com a sua marca. Sem mensalidade para começar.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8">
              Começar Agora
            </Button>
          </Link>
          <Link to="/loja-demo-brasil">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Ver Demo
            </Button>
          </Link>
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

      {/* Pricing */}
      <section className="border-t bg-background py-20">
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
