import fs from "fs";
import path from "path";

import matter from "gray-matter";
import { marked } from "marked";

import type { BlogPostMeta } from "@/types";

const postsDirectory = path.join(process.cwd(), "posts");

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getPostBySlug(
  slug: string
): BlogPostMeta & { contentHtml: string } {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const { data, content } = matter(fileContents);

  const title = (data.title as string) ?? realSlug;
  const date = (data.date as string) ?? "";
  const tags = (data.tags as string[]) ?? [];

  const contentHtml = marked.parse(content) as string;

  return {
    slug: realSlug,
    title,
    date,
    tags,
    contentHtml,
  };
}

export function getAllPosts(): BlogPostMeta[] {
  const slugs = getPostSlugs();

  const posts = slugs.map((slug) => {
    const { contentHtml: _contentHtml, ...meta } = getPostBySlug(slug);
    return {
      ...meta,
      excerpt: createExcerptFromHtml(_contentHtml),
    } as BlogPostMeta;
  });

  return posts.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return a.date > b.date ? -1 : 1;
  });
}

function createExcerptFromHtml(html: string, maxLength = 140): string {
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
