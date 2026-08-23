import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Tsau",
  url: "https://blog.tsau8888.qzz.io",
  description:
    "tsaublog",
  keywords: ["tsau","blog"],
  formspree: process.env.NEXT_PUBLIC_FORMSPREE_ID || "",
  locales: [
    { locale: "zh", label: "繁體中文" },
  ],
  defaultLocale: "zh",
  links: {
    github: "https://github.com/tsau8888",
    instagram: "https://www.instagram.com/tsau8888/",
    email: "tsau8888@protonmail.com",
  },
  avatar: "/avatar.webp",
};
