import { Star } from "lucide-react";
import { useState } from "react";
import type { FoodSite } from "@/lib/food-sites";
import { useFavorites } from "@/lib/favorites";

export function FavoriteButton({ site, className = "" }: { site: FoodSite; className?: string }) {
  const { isSaved, toggle } = useFavorites();
  const saved = isSaved(site.city, site.id);
  const [msg, setMsg] = useState("");

  return (
    <>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => setMsg(toggle(site) ? `${site.name} saved to your phone.` : `${site.name} removed.`)}
        className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 px-5 text-lg font-bold ${
          saved
            ? "border-primary bg-accent text-accent-foreground"
            : "border-border bg-card text-card-foreground hover:bg-accent"
        } ${className}`}
      >
        <Star className={`size-5 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
        {saved ? "Saved" : "Save this place"}
        <span className="sr-only"> {site.name}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {msg}
      </span>
    </>
  );
}
