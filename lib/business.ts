// Single source of truth for business info (address, contact, Google links).
// Imported anywhere via `@/lib/business`.

const ADDRESS_FULL = "1204 E New York Ave, DeLand, FL 32724";
const q = encodeURIComponent(ADDRESS_FULL);
const nameAndAddress = encodeURIComponent(`Feed The Obsession Barbecue, ${ADDRESS_FULL}`);

export const business = {
  name: "Feed The Obsession BBQ",

  phone: "812-205-0559",
  phoneHref: "tel:812-205-0559",
  email: "contact@ftobbq.com",
  emailHref: "mailto:contact@ftobbq.com",

  address: {
    street: "1204 E New York Ave",
    city: "DeLand",
    state: "FL",
    zip: "32724",
    full: ADDRESS_FULL,
  },

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
