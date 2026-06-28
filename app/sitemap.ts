import type { MetadataRoute } from "next";
import { business } from "@/lib/business";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: business.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${business.url}/menu`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
