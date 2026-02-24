import type { Tables } from "@/integrations/supabase/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryCarouselProps {
  categories: Tables<"categories">[];
  selectedCategory: string | null;
  onSelect: (id: string | null) => void;
}

const CategoryCarousel = ({ categories, selectedCategory, onSelect }: CategoryCarouselProps) => {
  return (
    <ScrollArea className="mb-6 w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <button
          onClick={() => onSelect(null)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          🏪 Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id === selectedCategory ? null : cat.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default CategoryCarousel;
