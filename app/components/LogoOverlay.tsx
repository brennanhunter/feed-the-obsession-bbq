import Link from "next/link";
import { LogoShape } from "./Logo";

// Page-level logo overlay for the home page.
//
// It lives OUTSIDE the sticky header's stacking context, as two `fixed` layers at
// the page root. A `fixed` element blends against the page painted behind it, so
// each layer's mix-blend reacts to BOTH the dark header bar and the carousel photo
// (and whatever scrolls under it). The two blends compose to:
//   white over dark pixels, brand red over light pixels — per pixel, live.
//
// Layer 1 (white + difference) inverts the backdrop: white over dark, black over light.
// Layer 2 (red + lighten) paints brand red into those now-dark (originally light)
// areas via max(red, backdrop), leaving the white areas untouched. Layer 2 sits
// above Layer 1 (higher z-index) so it blends against Layer 1's result.
//
// The logo starts at the header top and overflows 66% of the header height below it.
const SIZE = "h-[calc(5.5rem*1.66)] aspect-[2718/2896]";

export default function LogoOverlay() {
  return (
    <>
      {/* Layer 1 — invert the backdrop */}
      <div className="fixed inset-x-0 top-0 z-[60] pointer-events-none mix-blend-difference">
        <div className="container mx-auto px-6">
          <LogoShape className={`bg-white ${SIZE}`} />
        </div>
      </div>

      {/* Layer 2 — brand red over the light areas (also carries the clickable home link) */}
      <div className="fixed inset-x-0 top-0 z-[61] pointer-events-none mix-blend-lighten">
        <div className="container mx-auto px-6">
          <Link
            href="/"
            aria-label="FTO Barbeque — home"
            className="pointer-events-auto inline-block hover:opacity-80 transition-opacity"
          >
            <LogoShape className={`bg-brand-primary ${SIZE}`} />
          </Link>
        </div>
      </div>
    </>
  );
}
