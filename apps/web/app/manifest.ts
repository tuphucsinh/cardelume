import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CardeLume",
    short_name: "CardeLume",
    description: "Beautiful cards, made in moments.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f1",
    theme_color: "#0b1730",
    icons: [
      { src: "/brand/cardelume-icon.png", sizes: "295x245", type: "image/png" }
    ]
  };
}
