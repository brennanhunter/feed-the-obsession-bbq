import Link from "next/link";
import { FaClock, FaFire, FaMapMarkerAlt } from "react-icons/fa";
import { business } from "@/lib/business";

export type TodaySpecial = { name: string; price: number } | null;

// Hours · today's special · where we are — the three things people check first.
export default function InfoStrip({
  status,
  special,
}: {
  status: { open: boolean; label: string };
  special: TodaySpecial;
}) {
  return (
    <section className="border-y border-white/10 bg-brand-secondary">
      <div className="container mx-auto px-6 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <div className="flex items-start gap-4 py-6 sm:pr-6">
          <FaClock className="mt-1 shrink-0 text-brand-primary text-xl" />
          <div>
            <p className="font-bold uppercase tracking-wide">{status.label}</p>
            <p className="text-white/55">{business.hoursDisplay}</p>
          </div>
        </div>

        <Link href="/menu" className="group flex items-start gap-4 py-6 sm:px-6">
          <FaFire className="mt-1 shrink-0 text-brand-primary text-xl" />
          <div>
            <p className="font-bold uppercase tracking-wide">
              {special ? "Today's special" : "Weekday specials"}
            </p>
            <p className="text-white/55 group-hover:text-white transition-colors">
              {special
                ? `${special.name} · $${special.price.toFixed(2)} →`
                : "A different special every Monday–Friday →"}
            </p>
          </div>
        </Link>

        <a
          href={business.maps.directions}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 py-6 sm:pl-6"
        >
          <FaMapMarkerAlt className="mt-1 shrink-0 text-brand-primary text-xl" />
          <div>
            <p className="font-bold uppercase tracking-wide">{business.address.street}</p>
            <p className="text-white/55 group-hover:text-white transition-colors">
              DeLand · Dine in or grab it to go →
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
