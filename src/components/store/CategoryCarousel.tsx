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
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            selectedCategory === null
              ? ""
              : "bg-white border border-gray-200 text-gray-600"
          }`}
          style={selectedCategory === null ? { backgroundColor: 'var(--store-primary-hex)', color: 'white' } : undefined}
        >
          🏪 Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id === selectedCategory ? null : cat.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? ""
                : "bg-white border border-gray-200 text-gray-600"
            }`}
            style={selectedCategory === cat.id ? { backgroundColor: 'var(--store-primary-hex)', color: 'white' } : undefined}
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
