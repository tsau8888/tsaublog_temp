"use client";

/** 視覺維護原則：維持首頁原有排版與動畫，移除音樂相關文案。 */

import { motion } from "framer-motion";

import { useTranslations } from "@/hooks/useTranslations";

export default function About() {
  const t = useTranslations();

  const introText = "用程式與文字記錄想法";

  return (
    <section
      id="about"
      className="mx-auto max-w-4xl scroll-mt-16 px-6 py-16 md:scroll-mt-24 lg:px-8"
    >
      <div className="mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50"
        >
          {t.about.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-neutral-700 dark:text-neutral-300"
        >
          {introText}
        </motion.p>
      </div>

      {/* 下方原本技術棧與特色區塊已移除 */}
    </section>
  );
}
