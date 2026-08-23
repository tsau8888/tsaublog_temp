"use client";

import { motion } from "framer-motion";
import { 
  Code2, 
  Lock, 
  Hash, 
  Image,
  ArrowRight,
  QrCode
} from "lucide-react";
import Link from "next/link";

const tools = [
  {
    name: "QR Code 產生器",
    description: "可愛風格、現代風格 QR Code，支援中間圖片和多樣化自訂",
    href: "/tools/qrcode",
    icon: QrCode,
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "編解碼工具",
    description: "支援 Base64、Base32、Base85、URL 編解碼，雙向轉換即時預覽",
    href: "/tools/encoding",
    icon: Code2,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "加解密工具",
    description: "AES-256 加密解密，支援檔案和文字加密，保護您的敏感資料",
    href: "/tools/crypto",
    icon: Lock,
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "哈希運算",
    description: "MD5、SHA1、SHA256、SHA512 快速計算，支援檔案和文字雜湊",
    href: "/tools/hash",
    icon: Hash,
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "圖片浮水印",
    description: "為圖片添加文字浮水印，可調整位置、透明度和樣式",
    href: "/tools/watermark",
    icon: Image,
    color: "from-orange-500 to-red-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      {/* 頁面標題 */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
          實用工具
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-400">
          專為開發者設計的線上工具集合，所有運算都在瀏覽器端完成，確保資料隱私安全。
        </p>
      </div>

      {/* 工具卡片網格 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          
          return (
            <motion.div key={tool.href} variants={itemVariants}>
              <Link
                href={tool.href}
                className="group relative block overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-neutral-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                {/* 背景漸變裝飾 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />
                
                <div className="relative">
                  {/* 圖標 */}
                  <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${tool.color} p-3`}>
                    <Icon className="size-6 text-white" />
                  </div>
                  
                  {/* 標題和描述 */}
                  <h2 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                    {tool.name}
                  </h2>
                  <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {tool.description}
                  </p>
                  
                  {/* 連結指示器 */}
                  <div className="flex items-center text-sm font-medium text-neutral-900 transition-transform duration-200 group-hover:translate-x-1 dark:text-neutral-50">
                    <span>開始使用</span>
                    <ArrowRight className="ml-2 size-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 隱私提示 */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <Lock className="size-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
              隱私優先
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              所有工具的運算過程都在您的瀏覽器中完成，我們不會收集、儲存或傳輸任何輸入的資料。
              您可以隨時離開頁面，資料將自動清除。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
