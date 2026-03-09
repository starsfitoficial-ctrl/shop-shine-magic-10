import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  link?: string | null;
  title?: string | null;
}

interface PromoBannerProps {
  banners: Banner[];
}

const PromoBanner = ({ banners }: PromoBannerProps) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  const Wrapper = banner.link
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={banner.link!} target="_blank" rel="noopener noreferrer">{children}</a>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-sm">
      <Wrapper>
        <div className="relative aspect-[3/1] md:aspect-[4/1] w-full">
          <img
            src={banner.image_url}
            alt={banner.title || "Promoção"}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          {banner.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white font-bold text-lg md:text-xl drop-shadow">{banner.title}</p>
            </div>
          )}
        </div>
      </Wrapper>

      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 flex items-center justify-center transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PromoBanner;
