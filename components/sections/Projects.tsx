"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { useTranslations } from "@/hooks/useTranslations";
import type { BlogPostMeta } from "@/types";

interface ProjectsProps {
  posts: BlogPostMeta[];
}

export default function Projects({ posts }: ProjectsProps) {
  const t = useTranslations();

  return (
    <section id="projects" className="scroll-mt-16">
      <div className="mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50"
        >
          {t.projects.title}
        </motion.h2>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          偶爾寫寫，長年不更新。
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mx-auto flex max-w-3xl flex-col gap-4"
      >
        {posts.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`}>
            <article className="group rounded-xl border border-neutral-200 bg-white/60 p-5 shadow-sm transition hover:border-neutral-400 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-neutral-600 dark:hover:bg-neutral-900">
              <h3 className="text-lg font-semibold text-neutral-900 transition-colors group-hover:text-primary-light dark:text-neutral-50 dark:group-hover:text-primary-dark">
                {post.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                {post.date && (
                  <span>
                    {new Date(post.date).toLocaleDateString("zh-TW")}
                  </span>
                )}
                {post.tags && post.tags.length > 0 && (
                  <span className="inline-flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {post.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {post.excerpt}
                </p>
              )}
            </article>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            尚未有任何文章，請在 <code>posts/</code> 資料夾中新增
            Markdown 檔案。
          </p>
        )}
      </motion.div>
    </section>
  );
}
