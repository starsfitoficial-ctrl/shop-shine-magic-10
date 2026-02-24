import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, BarChart3, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Vitrine Digital</span>
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
          <Link to="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Ver Demo
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

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Vitrine Digital. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;
