"use client";

import { ClipboardCopy } from "lucide-react";
import { useState } from "react";

import { siteConfig } from "@/config/site";

const siteInfoYml = `- name: ${siteConfig.name}
  url: ${siteConfig.url}
  desc: 被程式綁架的程式猿
  image: ${siteConfig.url}${siteConfig.avatar}`;

const applyTemplateYml = `- name: 你的名字
  url: 你的網站
  desc: 簡短描述
  image: 一張圖片連結`;

export default function SiteInfo() {
  const [copiedKey, setCopiedKey] = useState<"site" | "template" | null>(null);

  const handleCopy = async (text: string, key: "site" | "template") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
        本站資訊
      </h1>

      {/* 本站 YML */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 shadow-2xl ring-1 ring-neutral-800/80">
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </span>
            <span className="rounded-full bg-neutral-800/80 px-2 py-0.5 text-[11px]">
              YML
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(siteInfoYml, "site")}
            className="inline-flex items-center gap-1 rounded-md bg-neutral-800/80 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-700/80"
          >
            <ClipboardCopy className="size-3" />
            {copiedKey === "site" ? "已複製" : "複製"}
          </button>
        </div>
        <pre className="whitespace-pre rounded-2xl bg-neutral-950/70 px-4 py-3 text-xs leading-relaxed text-neutral-100">
{siteInfoYml}
        </pre>
      </div>

      {/* 申請格式 */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 shadow-xl ring-1 ring-neutral-800/80">
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="text-neutral-300">申請格式</span>
            <span className="rounded-full bg-neutral-800/80 px-2 py-0.5 text-[11px]">
              YML
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(applyTemplateYml, "template")}
            className="inline-flex items-center gap-1 rounded-md bg-neutral-800/80 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-700/80"
          >
            <ClipboardCopy className="size-3" />
            {copiedKey === "template" ? "已複製" : "複製"}
          </button>
        </div>
        <pre className="whitespace-pre rounded-2xl bg-neutral-950/70 px-4 py-3 text-xs leading-relaxed text-neutral-100">
{applyTemplateYml}
        </pre>
      </div>
    </section>
  );
}

