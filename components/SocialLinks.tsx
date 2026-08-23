"use client";

import { motion } from "framer-motion";
import { Github, Instagram, Mail } from "lucide-react";
import React from "react";

import { siteConfig } from "@/config/site";

type SocialLink = {
  type: "link";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  target?: "_blank" | "_self";
} | {
  type: "copy";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

const SocialLinks = () => {
  const email = siteConfig.links.email;

  const socialLinks: SocialLink[] = [
    {
      type: "link",
      href: siteConfig.links.github,
      icon: Github,
      label: "GitHub",
      target: "_blank",
    },
    {
      type: "link",
      href: siteConfig.links.instagram,
      icon: Instagram,
      label: "Instagram",
      target: "_blank",
    },
    {
      type: "copy",
      icon: Mail,
      label: "Email",
      value: email,
    },
  ];

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      alert(`已複製信箱：${email}`);
    } catch {
      alert("無法複製信箱，請手動複製。");
    }
  };

  return (
    <>
      {/* 社交連結 */}
      <div className="flex items-center gap-3">
        {socialLinks.map((link, index) => (
          <React.Fragment key={link.type === "link" ? link.href : link.value || index}>
            {link.type === "link" ? (
              <motion.a
                href={link.href}
                target={link.target}
                rel={
                  link.target === "_blank"
                    ? "noopener noreferrer"
                    : undefined
                }
                className="group relative rounded-lg p-2 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <link.icon className="size-5" />
                <span className="sr-only">{link.label}</span>
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/90 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all group-hover:-top-11 group-hover:opacity-100 dark:bg-white/90 dark:text-neutral-900">
                  {link.label}
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900/90 dark:border-t-white/90" />
                </span>
              </motion.a>
            ) : (
              <motion.button
                type="button"
                onClick={handleCopyEmail}
                className="group relative rounded-lg p-2 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <link.icon className="size-5" />
                <span className="sr-only">{link.label}</span>
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/90 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all group-hover:-top-11 group-hover:opacity-100 dark:bg-white/90 dark:text-neutral-900">
                  {link.label}
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900/90 dark:border-t-white/90" />
                </span>
              </motion.button>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default SocialLinks;
