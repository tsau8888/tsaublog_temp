"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Code2, 
  Lock, 
  Hash, 
  Image, 
  Menu, 
  X,
  Home,
  QrCode
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/** 視覺維護原則：保留既有工具側欄、間距與中性色系，僅以短促淡入轉場改善路由切換的感受。 */

// 工具導航配置
const toolsNav = [
  { 
    name: "總覽", 
    href: "/tools", 
    icon: Home,
    description: "工具總覽"
  },
  { 
    name: "QR Code", 
    href: "/tools/qrcode", 
    icon: QrCode,
    description: "QR Code 產生器"
  },
  { 
    name: "編解碼", 
    href: "/tools/encoding", 
    icon: Code2,
    description: "Base64、Base32、Base85、URL 編解碼"
  },
  { 
    name: "加解密", 
    href: "/tools/crypto", 
    icon: Lock,
    description: "AES256 加密解密"
  },
  { 
    name: "哈希運算", 
    href: "/tools/hash", 
    icon: Hash,
    description: "MD5、SHA1、SHA256、SHA512"
  },
  { 
    name: "圖片浮水印", 
    href: "/tools/watermark", 
    icon: Image,
    description: "為圖片添加浮水印"
  },
];

// 桌面版側邊欄
const DesktopSidebar = ({ pathname }: { pathname: string }) => {
  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24">
        <nav className="space-y-1">
          {toolsNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                }`}
              >
                <Icon className={`size-5 ${isActive ? "text-white dark:text-neutral-900" : "text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"}`} />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className={`text-xs font-normal ${isActive ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-500"}`}>
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* 隱私提示 */}
        <div className="mt-8 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            🔒 隱私保證
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
            所有運算都在瀏覽器端執行，資料不會傳送到伺服器。
          </p>
        </div>
      </div>
    </aside>
  );
};

// 移動版導航菜單
const MobileNav = ({
  isOpen,
  setIsOpen,
  pathname,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  pathname: string;
}) => {
  return (
    <div className="lg:hidden">
      {/* 移動版導航頭部 */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <Link
          href="/tools"
          className="text-lg font-medium text-neutral-900 dark:text-neutral-50"
        >
          實用工具
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
          aria-label="切換菜單"
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* 展開的導航選單 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-neutral-200 bg-white px-2 py-4 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <nav className="space-y-1">
              {toolsNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                    }`}
                  >
                    <Icon className={`size-5 ${isActive ? "text-white dark:text-neutral-900" : "text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"}`} />
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      <span className={`text-xs font-normal ${isActive ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-500"}`}>
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            
            {/* 隱私提示 */}
            <div className="mt-6 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                🔒 隱私保證
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                所有運算都在瀏覽器端執行，資料不會傳送到伺服器。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 主布局組件
export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen">
      <MobileNav isOpen={isOpen} setIsOpen={setIsOpen} pathname={pathname} />
      
      {/* 使用更大的負邊距徹底突破父容器寬度限制 */}
      <div className="relative -mx-12 w-[calc(100%+6rem)] sm:-mx-24 sm:w-[calc(100%+12rem)] lg:-mx-40 lg:w-[calc(100%+20rem)] xl:-mx-56 xl:w-[calc(100%+28rem)]">
        <div className="flex gap-12 py-8 px-12 sm:px-24 lg:px-40">
          <DesktopSidebar pathname={pathname} />
          
          <main className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -2 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
