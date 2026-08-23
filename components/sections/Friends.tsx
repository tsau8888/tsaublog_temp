"use client";

import Image from "next/image";

import { friendLinks } from "@/constants/sections/friends";

export default function Friends() {
  return (
    <section id="friends" className="scroll-mt-16">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
          夥伴們
        </h2>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          一些一起踩坑、一起寫程式、一起玩遊戲的朋友們。
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        {friendLinks.map((friend) => (
          <a
            key={friend.url}
            href={friend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-neutral-950/5 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-950/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800">
              <Image
                src={friend.image}
                alt={friend.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {friend.name}
              </div>
              <div className="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-400">
                {friend.desc}
              </div>
            </div>
          </a>
        ))}

        {friendLinks.length === 0 && (
          <p className="col-span-full text-center text-sm text-neutral-500 dark:text-neutral-400">
            尚未設定任何友站連結，請在 <code>constants/sections/friends.ts</code>{" "}
            中新增資料。
          </p>
        )}
      </div>
    </section>
  );
}

