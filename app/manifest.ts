import type { MetadataRoute } from "next";
import { business } from "@/lib/business";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: business.name,
    short_name: "FTO BBQ",
    description: business.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#020304",
    theme_color: "#020304",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
