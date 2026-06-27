// The logo PNG is a black silhouette on transparency (the "FTO" letters are
// transparent knockouts), so we render it as a CSS mask and color it freely.
// Size it with height + the logo's aspect ratio, e.g. `h-28 aspect-[2718/2896]`.

const maskStyle = {
  WebkitMaskImage: "url(/logo.png)",
  maskImage: "url(/logo.png)",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
} as const;

/**
 * Bare masked logo silhouette. Give it a `bg-*` class for color and `h-* aspect-*`
 * for size. Used directly by LogoOverlay (which puts the blend mode on a fixed
 * ancestor) and by the solid <Logo> below.
 */
export function LogoShape({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`block shrink-0 ${className}`} style={maskStyle} />;
}

/**
 * Solid logo that takes its color from the current text color:
 *   text-white          -> white logo (dark backgrounds)
 *   text-brand-primary  -> red logo   (light backgrounds)
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="FTO Barbeque logo"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={maskStyle}
    />
  );
}
