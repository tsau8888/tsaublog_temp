"use client";

/** 視覺維護原則：保留原有工具介面，只修復檔案雜湊的非同步計算。 */

import CryptoJS from "crypto-js";
import { Copy, Trash2, Check, X, Upload, File, FileText, FileImage, FileVideo, FileArchive } from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";
type InputMode = "text" | "file";

interface HashResult {
  algorithm: HashAlgorithm;
  label: string;
  value: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("application/zip") || mimeType.startsWith("application/x-rar")) return FileArchive;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function HashPage() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compareHash, setCompareHash] = useState("");
  const [activeAlgorithms, setActiveAlgorithms] = useState<HashAlgorithm[]>(["md5", "sha1", "sha256", "sha512"]);
  const [copied, setCopied] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileHashResults, setFileHashResults] = useState<HashResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsProcessing(true);
    setInput("");
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileData(e.target?.result as ArrayBuffer);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsProcessing(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  // Calculate text hash
  const textHashResults = useMemo<HashResult[]>(() => {
    if (!input || inputMode !== "text") {
      return [];
    }

    const algorithms: { algorithm: HashAlgorithm; label: string; fn: (data: string) => string }[] = [
      { algorithm: "md5", label: "MD5", fn: (data) => CryptoJS.MD5(data).toString() },
      { algorithm: "sha1", label: "SHA-1", fn: (data) => CryptoJS.SHA1(data).toString() },
      { algorithm: "sha256", label: "SHA-256", fn: (data) => CryptoJS.SHA256(data).toString() },
      { algorithm: "sha512", label: "SHA-512", fn: (data) => CryptoJS.SHA512(data).toString() },
    ];

    return algorithms
      .filter((algo) => activeAlgorithms.includes(algo.algorithm))
      .map((algo) => ({
        algorithm: algo.algorithm,
        label: algo.label,
        value: algo.fn(input),
      }));
  }, [input, activeAlgorithms, inputMode]);

  // Calculate file hashes asynchronously so every enabled SHA value is stored before rendering.
  useEffect(() => {
    let cancelled = false;

    const calculateFileHashes = async () => {
      if (!fileData || inputMode !== "file") {
        setFileHashResults([]);
        return;
      }

      setIsProcessing(true);
      try {
        const results: HashResult[] = [];
        const bytes = new Uint8Array(fileData);

        if (activeAlgorithms.includes("md5")) {
          const wordArray = CryptoJS.lib.WordArray.create(fileData as unknown as number[]);
          results.push({ algorithm: "md5", label: "MD5", value: CryptoJS.MD5(wordArray).toString() });
        }

        const shaDefinitions: Record<Exclude<HashAlgorithm, "md5">, { label: string; name: AlgorithmIdentifier }> = {
          sha1: { label: "SHA-1", name: "SHA-1" },
          sha256: { label: "SHA-256", name: "SHA-256" },
          sha512: { label: "SHA-512", name: "SHA-512" },
        };

        const shaResults = await Promise.all(
          activeAlgorithms
            .filter((algorithm): algorithm is Exclude<HashAlgorithm, "md5"> => algorithm !== "md5")
            .map(async (algorithm) => {
              const definition = shaDefinitions[algorithm];
              const hashBuffer = await crypto.subtle.digest(definition.name, bytes);
              const value = Array.from(new Uint8Array(hashBuffer))
                .map((byte) => byte.toString(16).padStart(2, "0"))
                .join("");
              return { algorithm, label: definition.label, value } as HashResult;
            }),
        );

        results.push(...shaResults);
        if (!cancelled) setFileHashResults(results);
      } catch (error) {
        console.error("File hash calculation failed:", error);
        if (!cancelled) setFileHashResults([]);
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    };

    calculateFileHashes();
    return () => {
      cancelled = true;
    };
  }, [fileData, activeAlgorithms, inputMode]);

  const hashResults = inputMode === "text" ? textHashResults : fileHashResults;

  const matchResult = useMemo(() => {
    if (!compareHash || hashResults.length === 0) {
      return null;
    }

    const normalizedCompare = compareHash.toLowerCase().trim();
    for (const result of hashResults) {
      if (result.value.toLowerCase() === normalizedCompare) {
        return result.label;
      }
    }
    return null;
  }, [compareHash, hashResults]);

  const toggleAlgorithm = (algorithm: HashAlgorithm) => {
    setActiveAlgorithms((prev) =>
      prev.includes(algorithm)
        ? prev.filter((a) => a !== algorithm)
        : [...prev, algorithm]
    );
  };

  const handleCopy = async (text: string, algorithm: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(algorithm);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setInput("");
    setFile(null);
    setFileData(null);
    setCompareHash("");
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const algorithms: { value: HashAlgorithm; label: string }[] = [
    { value: "md5", label: "MD5" },
    { value: "sha1", label: "SHA-1" },
    { value: "sha256", label: "SHA-256" },
    { value: "sha512", label: "SHA-512" },
  ];

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          哈希運算
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          MD5、SHA1、SHA256、SHA512 快速計算，支援文字和檔案雜湊
        </p>
      </div>

      {/* 輸入模式切換 */}
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          onClick={() => { setInputMode("text"); setFile(null); setFileData(null); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            inputMode === "text"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          }`}
        >
          <FileText className="size-4" />
          文字輸入
        </button>
        <button
          onClick={() => { setInputMode("file"); setInput(""); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            inputMode === "file"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          }`}
        >
          <Upload className="size-4" />
          檔案上傳
        </button>
      </div>

      {/* 演算法選擇 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          選擇演算法
        </label>
        <div className="flex flex-wrap gap-2">
          {algorithms.map((algo) => (
            <button
              key={algo.value}
              onClick={() => toggleAlgorithm(algo.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeAlgorithms.includes(algo.value)
                  ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>
      </div>

      {/* 輸入區域 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {inputMode === "text" ? "輸入文字" : "上傳檔案"}
          </label>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <Trash2 className="size-3" />
            清除
          </button>
        </div>

        {inputMode === "text" ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="請輸入要計算哈希的文字..."
            className="min-h-[150px] w-full resize-none rounded-lg border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
          />
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
              isDragging
                ? "border-neutral-900 bg-neutral-50 dark:border-neutral-50 dark:bg-neutral-800"
                : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />
            
            {file ? (
              <div className="flex w-full flex-col items-center gap-3 p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  {(() => {
                    const Icon = getFileIcon(file.type);
                    return <Icon className="size-8 text-neutral-600 dark:text-neutral-400" />;
                  })()}
                </div>
                <div className="text-center">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">{file.name}</p>
                  <p className="text-sm text-neutral-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                  className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  移除檔案
                </button>
              </div>
            ) : (
              <>
                <Upload className="mb-3 size-10 text-neutral-400" />
                <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  點擊或拖曳檔案到這裡
                </p>
                <p className="text-xs text-neutral-500">支援任何檔案類型</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* 處理中狀態 */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
          <div className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">正在處理檔案...</span>
        </div>
      )}

      {/* 哈希結果 */}
      {hashResults.length > 0 && !isProcessing && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            哈希結果 {inputMode === "file" && file && `(${file.name})`}
          </label>
          {hashResults.map((result) => (
            <div
              key={result.algorithm}
              className="group relative rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {result.label}
                </span>
                <button
                  onClick={() => handleCopy(result.value, result.algorithm)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                >
                  {copied === result.algorithm ? (
                    <>
                      <Check className="size-3" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      複製
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 break-all font-mono text-xs text-neutral-900 dark:text-neutral-50">
                {result.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 哈希比對 */}
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          哈希比對
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={compareHash}
            onChange={(e) => setCompareHash(e.target.value)}
            placeholder="貼上要比對的哈希值..."
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
          />
        </div>
        {compareHash && (
          <div className="mt-2">
            {matchResult ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="size-4" />
                <span className="text-sm font-medium">
                  匹配成功！符合 {matchResult} 哈希值
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <X className="size-4" />
                <span className="text-sm font-medium">
                  不匹配任何哈希值
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 提示資訊 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
        <h3 className="font-medium text-blue-800 dark:text-blue-200">
          關於哈希運算
        </h3>
        <ul className="mt-2 list-inside list-disc text-sm text-blue-700 dark:text-blue-300">
          <li>哈希是單向函數，無法從哈希值還原原始資料</li>
          <li>MD5 和 SHA-1 已發現有安全性漏洞，建議使用 SHA-256 或更高版本</li>
          <li>可用於密碼儲存、檔案完整性驗證等場景</li>
          <li>相同輸入必定產生相同輸出</li>
          <li>檔案處理完全在瀏覽器端完成，不會上傳至伺服器</li>
        </ul>
      </div>
    </div>
  );
}
