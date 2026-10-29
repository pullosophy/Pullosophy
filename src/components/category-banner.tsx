import Link from "next/link";
import { SafeImage } from "@/components/safe-image";

type Props = {
  href: string;
  title: string;
  kicker: string;
  cta: string;
  images: string[];
  variant: "light" | "red" | "dark";
};

const styles = {
  light: "bg-muted text-foreground",
  red: "bg-brand text-white",
  dark: "bg-foreground text-white",
};

// Banner di categoria in home: titolo grande a sinistra, ventaglio di carte vere del catalogo a destra.
export function CategoryBanner({ href, title, kicker, cta, images, variant }: Props) {
  const fan = images.slice(0, 4);
  return (
    <Link
      href={href}
      className={`group relative flex h-44 overflow-hidden rounded-2xl p-6 sm:h-56 ${styles[variant]}`}
    >
      {/* Righe diagonali di sfondo, come le bande delle buste. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 22px)" }}
      />
      <div className="relative z-10 flex flex-col justify-between">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] opacity-70">{kicker}</p>
        <div>
          <h2 className="font-display max-w-[9ch] text-5xl leading-[0.9] sm:text-6xl lg:text-5xl xl:text-6xl">{title}</h2>
          <span className="mt-2 inline-block text-sm font-semibold opacity-80 group-hover:opacity-100">{cta}</span>
        </div>
      </div>
      {fan.length > 0 && (
        <div aria-hidden className="absolute -right-4 top-0 z-0 h-full w-[58%] transition-transform duration-300 group-hover:scale-105 lg:w-[50%]">
          {fan.map((src, i) => (
            <div
              key={src}
              className="absolute top-1/2 aspect-[5/7] h-[82%] lg:h-[70%]"
              style={{
                right: `${i * 14}%`,
                transform: `translateY(-50%) rotate(${(i - (fan.length - 1) / 2) * -7}deg)`,
                zIndex: 10 - i,
              }}
            >
              <SafeImage src={src} alt="" loading="lazy" className="h-full w-full rounded-lg object-cover shadow-xl" />
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
