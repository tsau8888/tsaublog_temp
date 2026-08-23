"use client";

import { motion } from "framer-motion";
import { 
  File, 
  FileText, 
  Image, 
  Download, 
  ArrowRight, 
  Home as HomeIcon,
  FileArchive,
  FileVideo,
  Copy,
  Check,
  Hash
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  sha256?: string;
  children?: FileItem[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a"];
  const videoExts = ["mp4", "webm", "avi", "mov", "mkv"];
  const codeExts = ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "h", "css", "html", "json", "xml"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz"];
  const docExts = ["doc", "docx", "pdf", "txt", "md", "rtf", "xls", "xlsx", "ppt", "pptx"];
  
  if (imageExts.includes(ext)) return Image;
  if (audioExts.includes(ext)) return File;
  if (videoExts.includes(ext)) return FileVideo;
  if (codeExts.includes(ext)) return FileText;
  if (archiveExts.includes(ext)) return FileArchive;
  if (docExts.includes(ext)) return FileText;
  
  return File;
}

function SHA256Display({ sha256 }: { sha256: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`sha256:${sha256}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
        <Hash className="size-3" />
        <span className="font-mono">sha256:</span>
        <span className="font-mono">{sha256.substring(0, 16)}...</span>
        <span className="font-mono text-neutral-400">{sha256.substring(16, 32)}...</span>
        <span className="font-mono text-neutral-400">{sha256.substring(32, 48)}...</span>
        <span className="font-mono text-neutral-400">{sha256.substring(48)}</span>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        title="複製 SHA256"
      >
        {copied ? (
          <>
            <Check className="size-3 text-green-500" />
            <span className="text-green-500">已複製</span>
          </>
        ) : (
          <>
            <Copy className="size-3" />
            <span>複製</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function FileSharePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);
        const response = await fetch("/file-manifest.json");
        if (!response.ok) {
          throw new Error("無法載入檔案列表");
        }
        const data = await response.json();
        setFiles(data.files || []);
      } catch (err) {
        setError("無法載入檔案列表，請確認檔案目錄存在");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, []);

  const getCurrentFiles = (): FileItem[] => {
    let current = files;
    for (const pathPart of currentPath) {
      const found = current.find(f => f.name === pathPart && f.type === "directory");
      if (found?.children) {
        current = found.children;
      } else {
        return [];
      }
    }
    return current;
  };

  const navigateToFile = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateToPath = (index: number) => {
    setCurrentPath(currentPath.slice(0, index));
  };

  const currentFiles = getCurrentFiles();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-50" />
          <p className="text-sm text-neutral-500">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <p className="mt-2 text-sm text-neutral-500">
          請在 public/file 目錄中放入要分享的檔案
        </p>
      </div>
    );
  }

  const folders = currentFiles.filter(f => f.type === "directory");
  const regularFiles = currentFiles.filter(f => f.type === "file");

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          檔案分享
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          瀏覽和下載分享的檔案
        </p>
      </div>

      {/* 麵包屑導航 */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/files"
          onClick={() => setCurrentPath([])}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
        >
          <HomeIcon className="size-4" />
          <span>根目錄</span>
        </Link>
        {currentPath.map((pathPart, index) => (
          <div key={index} className="flex items-center gap-2">
            <ArrowRight className="size-4 text-neutral-400" />
            <button
              onClick={() => navigateToPath(index + 1)}
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
            >
              {pathPart}
            </button>
          </div>
        ))}
      </div>

      {/* 檔案列表 */}
      {currentFiles.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <File className="mx-auto mb-4 size-12 text-neutral-400" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {currentPath.length === 0 ? "目前沒有分享的檔案" : "此資料夾為空"}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
        >
          {/* 資料夾列表 */}
          {folders.length > 0 && (
            <div className="border-b border-neutral-200 p-2 dark:border-neutral-800">
              {folders.map((folder) => (
                <motion.div key={folder.path} variants={itemVariants}>
                  <button
                    onClick={() => navigateToFile(folder.name)}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <File className="size-5 text-yellow-500" />
                    <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-50">
                      {folder.name}
                    </span>
                    <ArrowRight className="size-4 text-neutral-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* 檔案列表 */}
          {regularFiles.length > 0 && (
            <div className="p-2">
              {regularFiles.map((file) => {
                const Icon = getFileIcon(file.name);
                return (
                  <motion.div key={file.path} variants={itemVariants}>
                    <a
                      href={`/file/${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <Icon className="size-5 text-neutral-500" />
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-50">
                          {file.name}
                        </p>
                        {file.size !== undefined && (
                          <p className="text-xs text-neutral-500">
                            {formatFileSize(file.size)}
                          </p>
                        )}
                        {file.sha256 && (
                          <SHA256Display sha256={file.sha256} />
                        )}
                      </div>
                      <Download className="size-4 text-neutral-400" />
                    </a>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* 說明 */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
          使用說明
        </h3>
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-600 dark:text-neutral-400">
          <li>點擊資料夾可進入查看子目錄</li>
          <li>點擊檔案可直接預覽或下載</li>
          <li>點擊 SHA256 後的「複製」按鈕可複製完整雜湊值</li>
        </ul>
      </div>
    </div>
  );
}
