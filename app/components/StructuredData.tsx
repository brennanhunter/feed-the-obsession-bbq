import { business } from "@/lib/business";

// Restaurant / LocalBusiness JSON-LD. Helps Google connect this site to your
// Google Business Profile and show rich local results (address, cuisine, map).
export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${business.url}/#restaurant`,
    name: business.name,
    description:
      "Veteran-owned BBQ joint in DeLand, FL serving wood-smoked brisket, ribs, and pulled pork for dine-in and take-out, plus custom smoker builds and catering.",
    url: business.url,
    telephone: `+1-${business.phone}`,
    image: `${business.url}/og-image.png`,
    logo: `${business.url}/logo-red.png`,
    priceRange: business.priceRange,
    servesCuisine: [...business.cuisine],
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.zip,
      addressCountry: business.address.country,
    },
    hasMap: business.maps.profile,
    sameAs: [business.social.facebook, business.social.instagram],
    areaServed: business.areaServed.map((name) => ({ "@type": "Place", name })),
    menu: `${business.url}/menu`,
    acceptsReservations: false,
    // Hours are emitted only once you fill in business.hours (lib/business.ts).
    ...(business.hours.length
      ? {
          openingHoursSpecification: business.hours.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
