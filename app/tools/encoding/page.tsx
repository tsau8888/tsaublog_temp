"use client";

/** 視覺維護原則：保留原有操作版面，讓編解碼在 Unicode 文字下正確可逆。 */

import { Copy, Trash2, ArrowLeftRight, Check } from "lucide-react";
import { useState, useCallback } from "react";

// 編解碼類型
type EncodingType = "base64" | "base32" | "base85" | "url";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value.trim());
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

// Base32 編解碼實現
function base32Encode(input: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let output = "";
  let buffer = 0;
  let bitsLeft = 0;
  const bytes = encoder.encode(input);
  
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    
    while (bitsLeft >= 5) {
      output += alphabet[(buffer >>> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }
  
  if (bitsLeft > 0) {
    output += alphabet[(buffer << (5 - bitsLeft)) & 31];
  }
  
  return output.padEnd(Math.ceil(output.length / 8) * 8, "=");
}

function base32Decode(input: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const compact = input.replace(/\s/g, "");
  if (!/^[A-Z2-7]*={0,6}$/i.test(compact) || /=.+/.test(compact.replace(/=+$/, ""))) {
    throw new Error("無效的 Base32 格式");
  }

  const cleaned = compact.replace(/=+$/, "").toUpperCase();
  if (![0, 2, 4, 5, 7].includes(cleaned.length % 8)) {
    throw new Error("無效的 Base32 長度");
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;
  
  for (let i = 0; i < cleaned.length; i++) {
    const value = alphabet.indexOf(cleaned[i]);
    if (value === -1) continue;
    
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    
    while (bitsLeft >= 8) {
      bytes.push((buffer >>> (bitsLeft - 8)) & 255);
      bitsLeft -= 8;
    }
  }

  if (bitsLeft > 0 && (buffer & ((1 << bitsLeft) - 1)) !== 0) {
    throw new Error("無效的 Base32 填補位元");
  }
  
  return decoder.decode(new Uint8Array(bytes));
}

// Base85 編解碼實現 (Ascii85)
function base85Encode(input: string): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";
  let output = "";
  const bytes = encoder.encode(input);

  for (let index = 0; index < bytes.length; index += 4) {
    const length = Math.min(4, bytes.length - index);
    const value = (((bytes[index] || 0) * 256 + (bytes[index + 1] || 0)) * 256 + (bytes[index + 2] || 0)) * 256 + (bytes[index + 3] || 0);
    const characters = new Array<string>(5);
    let remaining = value;
    for (let position = 4; position >= 0; position -= 1) {
      characters[position] = alphabet[remaining % 85];
      remaining = Math.floor(remaining / 85);
    }
    output += characters.join("").slice(0, length < 4 ? length + 1 : 5);
  }
  
  return output;
}

function base85Decode(input: string): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";
  const cleaned = input.replace(/\s/g, "");
  const bytes: number[] = [];
  let group: number[] = [];

  const flushGroup = (values: number[]) => {
    if (values.length < 2) return;
    const originalLength = values.length;
    while (values.length < 5) values.push(84);
    const value = values.reduce((total, current) => total * 85 + current, 0);
    const decoded = [
      Math.floor(value / 256 ** 3) & 255,
      Math.floor(value / 256 ** 2) & 255,
      Math.floor(value / 256) & 255,
      value & 255,
    ];
    bytes.push(...decoded.slice(0, originalLength < 5 ? originalLength - 1 : 4));
  };
  
  for (const character of cleaned) {
    const idx = alphabet.indexOf(character);
    if (idx === -1) {
      throw new Error("無效的 Base85 字元");
    }
    group.push(idx);
    if (group.length === 5) {
      flushGroup(group);
      group = [];
    }
  }

  if (group.length === 1) {
    throw new Error("無效的 Base85 長度");
  }
  flushGroup(group);
  return decoder.decode(new Uint8Array(bytes));
}

// URL 編解碼
function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

function urlDecode(input: string): string {
  return decodeURIComponent(input);
}

export default function EncodingPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [encodingType, setEncodingType] = useState<EncodingType>("base64");
  const [copied, setCopied] = useState(false);

  const process = useCallback((text: string, type: EncodingType, isEncode: boolean) => {
    if (!text) {
      return "";
    }
    
    try {
      switch (type) {
        case "base64":
          return isEncode ? bytesToBase64(encoder.encode(text)) : decoder.decode(base64ToBytes(text));
        case "base32":
          return isEncode ? base32Encode(text) : base32Decode(text);
        case "base85":
          return isEncode ? base85Encode(text) : base85Decode(text);
        case "url":
          return isEncode ? urlEncode(text) : urlDecode(text);
        default:
          return text;
      }
    } catch {
      return "解碼錯誤：輸入格式無效";
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    setOutput(process(value, encodingType, mode === "encode"));
  };

  const handleModeChange = (newMode: "encode" | "decode") => {
    setMode(newMode);
    setOutput(process(input, encodingType, newMode === "encode"));
  };

  const handleTypeChange = (type: EncodingType) => {
    setEncodingType(type);
    setOutput(process(input, type, mode === "encode"));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  const handleSwap = () => {
    const newMode = mode === "encode" ? "decode" : "encode";
    setMode(newMode);
    setInput(output);
    setOutput(process(output, encodingType, newMode === "encode"));
  };

  const encodingTypes: { value: EncodingType; label: string }[] = [
    { value: "base64", label: "Base64" },
    { value: "base32", label: "Base32" },
    { value: "base85", label: "Base85" },
    { value: "url", label: "URL" },
  ];

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          編解碼工具
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          支援 Base64、Base32、Base85、URL 編解碼，雙向轉換即時預覽
        </p>
      </div>

      {/* 編解碼類型選擇 */}
      <div className="flex flex-wrap gap-2">
        {encodingTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => handleTypeChange(type.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              encodingType === type.value
                ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 編碼/解碼模式切換 */}
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          onClick={() => handleModeChange("encode")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            mode === "encode"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          }`}
        >
          編碼 (Encode)
        </button>
        <button
          onClick={() => handleModeChange("decode")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            mode === "decode"
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          }`}
        >
          解碼 (Decode)
        </button>
      </div>

      {/* 輸入輸出區域 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 輸入區域 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              輸入文字
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
            placeholder={`請輸入要${mode === "encode" ? "編碼" : "解碼"}的文字...`}
            className="min-h-[300px] w-full resize-none rounded-lg border border-neutral-200 bg-white p-4 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
          />
        </div>

        {/* 輸出區域 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              輸出結果
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
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
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
            className="min-h-[300px] w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>
    </div>
  );
}
