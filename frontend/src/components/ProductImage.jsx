import { useState } from "react";

function ProductImage({ src, alt, className, ...props }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fallbackImage =
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=90";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f0f0ed]">
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200" />
      )}
      <img
        src={error || !src ? fallbackImage : src}
        alt={alt || "LUXORA Product"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`${className || "h-full w-full object-cover"} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
}

export default ProductImage;
