// Single source of truth for business info (address, contact, Google links, SEO).
// Imported anywhere via `@/lib/business`.

const ADDRESS_FULL = "1204 E New York Ave, DeLand, FL 32724";
const q = encodeURIComponent(ADDRESS_FULL);
const nameAndAddress = encodeURIComponent(`Feed The Obsession Barbecue, ${ADDRESS_FULL}`);

export const business = {
  name: "Feed The Obsession BBQ",
  // Canonical production origin (no trailing slash). Update if the domain changes.
  url: "https://feedtheobsessionbbq.com",
  tagline: "Veteran-Owned Wood-Smoked BBQ in DeLand, FL",

  phone: "812-205-0559",
  phoneHref: "tel:812-205-0559",
  email: "contact@ftobbq.com",
  emailHref: "mailto:contact@ftobbq.com",

  address: {
    street: "1204 E New York Ave",
    city: "DeLand",
    state: "FL",
    zip: "32724",
    country: "US",
    full: ADDRESS_FULL,
  },

  // SEO / structured-data attributes
  priceRange: "$$",
  cuisine: ["Barbecue", "American", "Southern"],
  // Areas you want to rank for / serve (used in structured data).
  areaServed: ["DeLand", "Orange City", "DeBary", "Deltona", "Lake Helen", "Volusia County"],
  // Open daily 12–8 PM, Friday 12–9 PM.
  // Note: they often stay open later when it's busy — the structured data below
  // lists the guaranteed hours, since Google treats these as hard closing times.
  hours: [
    {
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"],
      opens: "12:00",
      closes: "20:00",
    },
    {
      days: ["Friday"],
      opens: "12:00",
      closes: "21:00",
    },
  ] as { days: string[]; opens: string; closes: string }[],
  hoursDisplay: "Daily 12–8 PM · Fri 12–9 PM",

  maps: {
    // Turn-by-turn directions to the shop.
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    // Google Business Profile (hours, photos, reviews) via a name+address Maps lookup.
    profile: `https://www.google.com/maps/search/?api=1&query=${nameAndAddress}`,
    // Deep link to leave a Google review.
    review: "https://g.page/r/CdDIsat0xgNAEBM/review",
    // Keyless embeddable map for an <iframe>.
    embed: `https://maps.google.com/maps?q=${q}&z=15&output=embed`,
  },

  social: {
    facebook: "https://www.facebook.com/profile.php?id=61573454007742",
    instagram: "https://www.instagram.com/feed_the_obsession_outdoors/",
  },
} as const;
