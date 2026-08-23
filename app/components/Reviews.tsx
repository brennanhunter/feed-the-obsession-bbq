import { business } from "@/lib/business";

const reviews = [
  { text: "Really good ribs — definitely will be back to try out the rest of the menu." },
  { text: "Good food and good people." },
  { text: "Amazing BBQ and staff." },
];

const Stars = ({ className = "" }: { className?: string }) => (
  <span className={`text-brand-primary tracking-widest ${className}`} aria-label="5 out of 5 stars">
    ★★★★★
  </span>
);

export default function Reviews() {
  return (
    <div className="bg-black py-20 border-t border-white/5">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        <Stars className="text-2xl" />
        <p className="mt-3 text-white/70">
          <span className="font-bold text-white">5.0</span> on Google · 7 reviews
        </p>
        <h2 className="mt-4 text-[36px] md:text-[40px] font-display tracking-wider">
          WHAT FOLKS ARE SAYING
        </h2>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-brand-secondary rounded-3xl p-8 text-left border border-white/10 flex flex-col"
            >
              <Stars className="text-lg mb-4" />
              <p className="text-white/90 text-lg leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>
              <p className="mt-5 text-white/40 text-sm font-semibold uppercase tracking-wider">
                Google review
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <a
            href={business.maps.profile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-3xl border border-white/20 text-white font-bold hover:border-brand-primary hover:text-brand-primary transition-all"
          >
            Read all reviews on Google →
          </a>
        </div>
      </div>
    </div>
  );
}
