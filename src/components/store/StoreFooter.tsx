import { Link } from "react-router-dom";

interface StoreFooterProps {
  storeSlug: string;
  storeName: string;
}

const StoreFooter = ({ storeSlug, storeName }: StoreFooterProps) => {
  return (
    <footer className="border-t bg-card mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={`/${storeSlug}/politica-de-reembolso`} className="hover:text-foreground transition-colors">
              Política de Reembolso
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to={`/${storeSlug}/termos-de-uso`} className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to={`/${storeSlug}/contato`} className="hover:text-foreground transition-colors">
              Contato
            </Link>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
