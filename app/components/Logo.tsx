// The logo PNG is a black silhouette on transparency (the "FTO" letters are
// transparent knockouts). We render it as a CSS mask over a `currentColor` box,
// so the logo takes whatever text color it's given:
//   text-white          -> white logo (use on dark backgrounds)
//   text-brand-primary  -> red logo   (use on white/light backgrounds)
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
