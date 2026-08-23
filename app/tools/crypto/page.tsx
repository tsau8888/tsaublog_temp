"use client";

/** 視覺維護原則：保留原有控制項與版面，修復純瀏覽器環境的 AES-GCM 文字處理。 */

import CryptoJS from "crypto-js";
import { saveAs } from "file-saver";
import { Copy, Trash2, ArrowLeftRight, Check, RefreshCw, Lock, Unlock, Key, Upload, Download, File, FileText, FileImage, FileVideo, FileArchive } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

type CryptoMode = "encrypt" | "decrypt";
type InputMode = "text" | "file";
type Algorithm = "AES-GCM" | "AES-CBC" | "AES-ECB" | "DES" | "3DES" | "RC4";

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

function hexToBytes(value: string): Uint8Array {
  const normalized = value.trim();
  if (!/^(?:[\dA-Fa-f]{2})+$/.test(normalized)) {
    throw new Error("金鑰或 IV 必須是有效的十六進位字串");
  }
  return Uint8Array.from(normalized.match(/.{1,2}/g) || [], (part) => parseInt(part, 16));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value.trim());
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function getKeyByteLength(algorithm: Algorithm): number {
  if (algorithm === "DES") return 8;
  if (algorithm === "3DES") return 24;
  if (algorithm === "RC4") return 16;
  return 32;
}

function getIvByteLength(algorithm: Algorithm): number {
  return algorithm === "DES" || algorithm === "3DES" ? 8 : 16;
}

function parseInteropKey(value: string, algorithm: Algorithm): CryptoJS.lib.WordArray {
  const normalized = value.trim();
  const expectedCharacters = getKeyByteLength(algorithm) * 2;
  const isRc4Key = algorithm === "RC4" && /^(?:[\dA-Fa-f]{2})+$/.test(normalized) && normalized.length <= 512;
  const isFixedLengthKey = algorithm !== "RC4" && new RegExp(`^[\\dA-Fa-f]{${expectedCharacters}}$`).test(normalized);

  if (!isRc4Key && !isFixedLengthKey) {
    const requirement = algorithm === "RC4"
      ? "RC4 金鑰必須是偶數長度的十六進位字串"
      : `${algorithm} 金鑰必須是 ${expectedCharacters} 個十六進位字元`;
    throw new Error(requirement);
  }

  return CryptoJS.enc.Hex.parse(normalized);
}

function parseInteropIv(value: string, algorithm: Algorithm): CryptoJS.lib.WordArray {
  const normalized = value.trim();
  const expectedCharacters = getIvByteLength(algorithm) * 2;
  if (!new RegExp(`^[\\dA-Fa-f]{${expectedCharacters}}$`).test(normalized)) {
    throw new Error(`${algorithm} IV 必須是 ${expectedCharacters} 個十六進位字元`);
  }
  return CryptoJS.enc.Hex.parse(normalized);
}

export default function CryptoPage() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<CryptoMode>("encrypt");
  const [algorithm, setAlgorithm] = useState<Algorithm>("AES-GCM");
  const [iv, setIv] = useState("");
  const [showIv, setShowIv] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>("");

  // File handling
  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsProcessing(true);
    setInput("");
    setDownloadUrl(null);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileData(e.target?.result as ArrayBuffer);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setError("檔案讀取失敗");
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsProcessing(false);
      setError("檔案處理錯誤");
    }
  };

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

  const handleRemoveFile = () => {
    setFile(null);
    setFileData(null);
    setDownloadUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate random IV
  const generateRandomIV = useCallback(() => {
    const byteLength = algorithm === "AES-GCM" ? 12 : getIvByteLength(algorithm);
    const randomBytes = CryptoJS.lib.WordArray.random(byteLength);
    setIv(randomBytes.toString(CryptoJS.enc.Hex));
  }, [algorithm]);

  // Generate random key based on algorithm
  const generateRandomKey = useCallback(() => {
    const randomBytes = CryptoJS.lib.WordArray.random(getKeyByteLength(algorithm));
    setPassword(randomBytes.toString(CryptoJS.enc.Hex));
  }, [algorithm]);

  // File encryption using AES-GCM
  const encryptFile = async (fileData: ArrayBuffer, pwd: string): Promise<Blob> => {
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key using PBKDF2
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pwd),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      fileData
    );
    
    // Combine: salt (16) + iv (12) + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    return new Blob([combined], { type: "application/octet-stream" });
  };

  // File decryption using AES-GCM
  const decryptFile = async (fileData: ArrayBuffer, pwd: string): Promise<Blob> => {
    const dataArray = new Uint8Array(fileData);
    
    // Extract salt (16 bytes), IV (12 bytes)
    const salt = dataArray.slice(0, 16);
    const iv = dataArray.slice(16, 28);
    const encryptedData = dataArray.slice(28);
    
    // Derive key
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pwd),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encryptedData
    );
    
    return new Blob([decryptedData]);
  };

  // Process file encryption/decryption
  const processFile = async () => {
    if (!fileData || !password) return;
    if (algorithm !== "AES-GCM") {
      setError("檔案模式目前採用 AES-256-GCM，請切換至該演算法後再處理。");
      return;
    }
    
    setIsProcessing(true);
    setError("");
    setDownloadUrl(null);
    
    try {
      let resultBlob: Blob;
      
      if (mode === "encrypt") {
        resultBlob = await encryptFile(fileData, password);
        const encryptedFileName = file?.name ? `${file.name}.enc` : "encrypted_file.enc";
        setDownloadFileName(encryptedFileName);
      } else {
        resultBlob = await decryptFile(fileData, password);
        const decryptedFileName = file?.name ? file.name.replace(".enc", "") : "decrypted_file";
        setDownloadFileName(decryptedFileName);
      }
      
      const url = URL.createObjectURL(resultBlob);
      setDownloadUrl(url);
    } catch (err) {
      console.error("File processing error:", err);
      setError(mode === "encrypt" ? "加密失敗" : "解密失敗：密碼錯誤或檔案格式不正確");
    } finally {
      setIsProcessing(false);
    }
  };

  // Text encryption/decryption functions
  const aesGcmEncrypt = async (plaintext: string, keyHex: string, ivHex: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyData = hexToBytes(keyHex);
    const ivData = hexToBytes(ivHex);
    if (keyData.byteLength !== 32) {
      throw new Error("AES-256-GCM 金鑰必須為 32 位元組");
    }
    if (ivData.byteLength !== 12) {
      throw new Error("AES-GCM 初始化向量必須為 12 位元組（24 字元 Hex）");
    }
    const plaintextData = encoder.encode(plaintext);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(keyData),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(ivData) },
      cryptoKey,
      plaintextData
    );

    return `gcm1:${bytesToHex(ivData)}:${bytesToBase64(new Uint8Array(encryptedData))}`;
  };

  const aesGcmDecrypt = async (ciphertext: string, keyHex: string): Promise<string> => {
    try {
      const decoder = new TextDecoder();
      const envelope = ciphertext.trim().split(":");
      const isCurrentEnvelope = envelope.length === 3 && envelope[0] === "gcm1";
      const ivData = isCurrentEnvelope ? hexToBytes(envelope[1]) : base64ToBytes(ciphertext).slice(0, 12);
      const encryptedData = isCurrentEnvelope
        ? base64ToBytes(envelope[2])
        : base64ToBytes(ciphertext).slice(12);

      if (ivData.byteLength !== 12 || encryptedData.byteLength === 0) {
        throw new Error("無效的 AES-GCM 密文格式");
      }

      const keyData = hexToBytes(keyHex);
      if (keyData.byteLength !== 32) {
        throw new Error("AES-256-GCM 金鑰必須為 32 位元組");
      }
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(keyData),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(ivData) },
        cryptoKey,
        toArrayBuffer(encryptedData)
      );

      return decoder.decode(decryptedData);
    } catch {
      throw new Error("解密失敗：密碼錯誤或資料已被篡改");
    }
  };

  // Text encryption/decryption process
  const processText = useCallback(async (text: string, pwd: string, algo: Algorithm, isEncrypt: boolean): Promise<string> => {
    if (!text || !pwd) {
      return "";
    }

    setError("");

    try {
      if (algo === "AES-GCM") {
        const keyHex = parseInteropKey(pwd, algo).toString(CryptoJS.enc.Hex);
        const ivHex = iv || CryptoJS.lib.WordArray.random(12).toString(CryptoJS.enc.Hex);
        
        if (isEncrypt) {
          return await aesGcmEncrypt(text, keyHex, ivHex);
        } else {
          return await aesGcmDecrypt(text, keyHex);
        }
      }

      if (algo === "RC4") {
        const key = parseInteropKey(pwd, algo);

        if (isEncrypt) {
          const encrypted = CryptoJS.RC4.encrypt(text, key);
          return encrypted.toString();
        } else {
          const decrypted = CryptoJS.RC4.decrypt(text, key);
          return decrypted.toString(CryptoJS.enc.Utf8) || "解密失敗：密碼錯誤或輸入格式無效";
        }
      }

      const key = parseInteropKey(pwd, algo);
      const modeName = algo.split("-")[1] || "CBC";
      let ivWordArray: CryptoJS.lib.WordArray | null = null;
      let ciphertext = text;

      if (modeName !== "ECB") {
        if (isEncrypt) {
          ivWordArray = iv
            ? parseInteropIv(iv, algo)
            : CryptoJS.lib.WordArray.random(getIvByteLength(algo));
        } else {
          const parts = text.trim().split(":");
          if (parts.length !== 2 || !parts[1]) {
            throw new Error("密文格式必須是 IV:Base64密文");
          }
          ivWordArray = parseInteropIv(parts[0], algo);
          ciphertext = parts[1];
        }
      }

      const options: Record<string, unknown> = {
        mode: CryptoJS.mode[modeName as keyof typeof CryptoJS.mode],
        padding: CryptoJS.pad.Pkcs7,
      };

      if (ivWordArray) {
        options.iv = ivWordArray;
      }

      const cipher = algo === "DES" ? CryptoJS.DES : algo === "3DES" ? CryptoJS.TripleDES : CryptoJS.AES;
      if (isEncrypt) {
        const encrypted = cipher.encrypt(text, key, options);
        return ivWordArray
          ? `${ivWordArray.toString(CryptoJS.enc.Hex)}:${encrypted.toString()}`
          : encrypted.toString();
      }

      const decrypted = cipher.decrypt(ciphertext, key, options);
      return decrypted.toString(CryptoJS.enc.Utf8) || "解密失敗：金鑰、IV 或輸入格式無效";
    } catch (error) {
      console.error("Crypto error:", error);
      setError("處理錯誤：請檢查輸入格式");
      return "處理錯誤：請檢查輸入格式";
    }
  }, [iv]);

  // Auto-process text when inputs change
  useEffect(() => {
    if (inputMode === "text") {
      const processInput = async () => {
        const result = await processText(input, password, mode === "encrypt" ? algorithm : algorithm, mode === "encrypt");
        setOutput(result);
      };
      processInput();
    }
  }, [input, password, mode, algorithm, inputMode, processText]);

  // Handle file processing when button clicked
  const handleProcessFile = () => {
    processFile();
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const handleModeChange = (newMode: CryptoMode) => {
    setMode(newMode);
    setDownloadUrl(null);
  };

  const handleAlgorithmChange = (newAlgo: Algorithm) => {
    setAlgorithm(newAlgo);
    setIv("");
    setDownloadUrl(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput("");
    setPassword("");
    setOutput("");
    setIv("");
    setError("");
    setFile(null);
    setFileData(null);
    setDownloadUrl(null);
  };

  const handleDownload = () => {
    if (downloadUrl && downloadFileName) {
      saveAs(downloadUrl, downloadFileName);
    }
  };

  const handleSwap = () => {
    const newMode = mode === "encrypt" ? "decrypt" : "encrypt";
    setMode(newMode);
    setInput(output);
    setDownloadUrl(null);
  };

  const needsIv = algorithm !== "AES-ECB" && algorithm !== "RC4";

  const algorithms: { value: Algorithm; label: string; description: string; keyLength: string }[] = [
    { value: "AES-GCM", label: "AES-256-GCM", description: "Galois/Counter Mode (含認證標籤)", keyLength: "256 位元" },
    { value: "AES-CBC", label: "AES-256-CBC", description: "密碼區塊鏈結 (常用)", keyLength: "256 位元" },
    { value: "AES-ECB", label: "AES-256-ECB", description: "電子密碼本 (不安全)", keyLength: "256 位元" },
    { value: "3DES", label: "3DES", description: "三重資料加密標準", keyLength: "168 位元" },
    { value: "DES", label: "DES", description: "資料加密標準 (較舊)", keyLength: "56 位元" },
    { value: "RC4", label: "RC4", description: "串流加密 (較舊)", keyLength: "可變" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          加解密工具
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          支援 AES-256-GCM 等多種加密演算法，保護您的敏感資料
        </p>
      </div>

      {/* 輸入模式切換 */}
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          onClick={() => { setInputMode("text"); setFile(null); setFileData(null); setDownloadUrl(null); }}
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
          onClick={() => { setInputMode("file"); setInput(""); setOutput(""); setAlgorithm("AES-GCM"); setIv(""); }}
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

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          加密演算法
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {algorithms.map((algo) => (
            <button
              key={algo.value}
              onClick={() => handleAlgorithmChange(algo.value)}
              className={`rounded-lg border p-3 text-left transition-all duration-200 ${
                algorithm === algo.value
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700"
              }`}
            >
              <div className="font-medium">{algo.label}</div>
              <div className={`text-xs ${algorithm === algo.value ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-500"}`}>
                {algo.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Encryption/Decryption Mode Toggle */}
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          onClick={() => handleModeChange("encrypt")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            mode === "encrypt"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          }`}
        >
          <Lock className="size-4" />
          加密
        </button>
        <button
          onClick={() => handleModeChange("decrypt")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            mode === "decrypt"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          }`}
        >
          <Unlock className="size-4" />
          解密
        </button>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Key className="mr-2 inline size-4" />
            {inputMode === "file" ? "檔案密碼" : "十六進位金鑰"}
          </label>
          <button
            onClick={generateRandomKey}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <RefreshCw className="size-3" />
            產生隨機金鑰
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder={inputMode === "file" ? "請輸入檔案密碼..." : "請輸入對應演算法的 Hex 金鑰..."}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 pr-10 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            {showPassword ? <Unlock className="size-4" /> : <Lock className="size-4" />}
          </button>
        </div>
      </div>

      {/* IV Input (only for text mode and certain algorithms) */}
      {inputMode === "text" && needsIv && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              初始化向量 (IV)
              {algorithm === "AES-GCM" && <span className="ml-1 text-xs text-amber-600">(12 位元組)</span>}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={generateRandomIV}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              >
                <RefreshCw className="size-3" />
                產生隨機 IV
              </button>
              <button
                onClick={() => setShowIv(!showIv)}
                className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              >
                {showIv ? "隱藏" : "顯示"}
              </button>
            </div>
          </div>
          <input
            type={showIv ? "text" : "password"}
            value={iv}
            onChange={(e) => setIv(e.target.value)}
            placeholder={algorithm === "AES-GCM" ? "自動產生或輸入 24 字元 Hex..." : "自動產生或輸入 32 字元 Hex..."}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
          />
        </div>
      )}

      {/* Input Area - Text Mode */}
      {inputMode === "text" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {mode === "encrypt" ? "明文" : "密文"}
              </label>
              <button
                onClick={handleClear}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              >
                <Trash2 className="size-3" />
                清除
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={mode === "encrypt" ? "請輸入要加密的明文..." : "請輸入要解密的密文..."}
              className="min-h-[200px] w-full resize-none rounded-lg border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {mode === "encrypt" ? "密文" : "明文"}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSwap}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  title="交換輸入輸出"
                >
                  <ArrowLeftRight className="size-3" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 disabled:opacity-50"
                >
                  {copied ? (
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
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="結果將顯示在這裡..."
              className="min-h-[200px] w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
            />
          </div>
        </div>
      )}

      {/* Input Area - File Mode */}
      {inputMode === "file" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {mode === "encrypt" ? "選擇要加密的檔案" : "選擇要解密的檔案"}
            </label>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <Trash2 className="size-3" />
              清除
            </button>
          </div>

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
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null as File | null)}
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

          {/* Process Button */}
          <button
            onClick={handleProcessFile}
            disabled={!fileData || !password || isProcessing}
            className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {isProcessing ? "處理中..." : mode === "encrypt" ? "開始加密" : "開始解密"}
          </button>

          {/* Download Button */}
          {downloadUrl && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="size-5" />
                <span className="font-medium">
                  {mode === "encrypt" ? "加密完成！" : "解密完成！"}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                檔案名稱：{downloadFileName}
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Download className="size-4" />
                下載檔案
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <span className="text-lg">!</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
          <div className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">正在處理...</span>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
        <h3 className="font-medium text-amber-800 dark:text-amber-200">
          使用提示
        </h3>
        <ul className="mt-2 list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
          <li>請妥善保管您的密碼，忘記密碼將無法解密資料</li>
          <li>建議使用強密碼，包含字母、數字和特殊符號</li>
          <li>AES-256-GCM 提供認證加密，安全性最高</li>
          <li>檔案加密會產生。enc 副檔名的加密檔案</li>
          <li>所有運算在瀏覽器端完成，不會傳送到伺服器</li>
          <li>文字模式輸出格式：AES-GCM 為 gcm1:IV:密文；其他有 IV 的模式為 IV:密文</li>
          <li>文字模式請使用 Hex 金鑰：AES 64 字元、DES 16 字元、3DES 48 字元；RC4 可使用偶數長度 Hex 金鑰</li>
        </ul>
      </div>
    </div>
  );
}
