"use client";

import { Upload, Download, RefreshCw, X, RotateCw } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

type WatermarkPosition = 
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right"
  | "tiled";

interface WatermarkSettings {
  text: string;
  color: string;
  fontSize: number;
  opacity: number;
  position: WatermarkPosition;
  offsetX: number;
  offsetY: number;
  rotation: number; // New: rotation angle in degrees
}

export default function WatermarkPage() {
  const [image, setImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [settings, setSettings] = useState<WatermarkSettings>({
    text: "浮水印文字",
    color: "#ffffff",
    fontSize: 48,
    opacity: 0.5,
    position: "bottom-right",
    offsetX: 20,
    offsetY: 20,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const positions: { value: WatermarkPosition; label: string }[] = [
    { value: "top-left", label: "左上" },
    { value: "top-center", label: "上中" },
    { value: "top-right", label: "右上" },
    { value: "middle-left", label: "左中" },
    { value: "middle-center", label: "正中央" },
    { value: "middle-right", label: "右中" },
    { value: "bottom-left", label: "左下" },
    { value: "bottom-center", label: "下中" },
    { value: "bottom-right", label: "右下" },
    { value: "tiled", label: "平鋪" },
  ];

  const colors = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ];

  // Preset rotation angles
  const rotationPresets = [
    { value: 0, label: "0°" },
    { value: 45, label: "45°" },
    { value: -45, label: "-45°" },
    { value: 90, label: "90°" },
    { value: -90, label: "-90°" },
  ];

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片檔案");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setOriginalFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSettingChange = (key: keyof WatermarkSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Generate watermark preview
  useEffect(() => {
    if (!image || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Store image dimensions for offset calculations
      setImageDimensions({ width: img.width, height: img.height });
      
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Set watermark style
      ctx.globalAlpha = settings.opacity;
      ctx.font = `${settings.fontSize}px Arial`;
      ctx.fillStyle = settings.color;

      // Calculate text dimensions using actual bounding box for precise centering
      const metrics = ctx.measureText(settings.text);
      const textWidth = metrics.width;
      // Use actualBoundingBoxAscent and actualBoundingBoxDescent for accurate text height
      const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      // Calculate the vertical offset from baseline to the center of the text bounding box
      const textVerticalCenter = metrics.actualBoundingBoxAscent - textHeight / 2;

      const drawWatermark = (x: number, y: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((settings.rotation * Math.PI) / 180);
        // Draw text centered at the origin point
        ctx.fillText(settings.text, 0, textVerticalCenter);
        ctx.restore();
      };

      if (settings.position === "tiled") {
        // Tiled mode with rotation support
        const tileWidth = textWidth + 150;
        const tileHeight = textHeight + 150;
        
        for (let y = 0; y < canvas.height + tileHeight; y += tileHeight) {
          for (let x = 0; x < canvas.width + tileWidth; x += tileWidth) {
            // Offset for staggered pattern
            const offsetX = (Math.floor(y / tileHeight) % 2) * (tileWidth / 2);
            
            // Calculate center for rotation
            const centerX = x + offsetX + tileWidth / 4;
            const centerY = y + tileHeight / 2;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((settings.rotation * Math.PI) / 180);
            // Use textVerticalCenter for proper centering
            ctx.fillText(settings.text, -textWidth / 2, textVerticalCenter);
            ctx.restore();
          }
        }
      } else {
        // Single position mode
        let x = 0;
        let y = 0;

        // Calculate position based on text bounding box center
        switch (settings.position) {
          case "top-left":
            x = settings.offsetX;
            y = settings.offsetY + textHeight;
            break;
          case "top-center":
            x = (canvas.width - textWidth) / 2;
            y = settings.offsetY + textHeight;
            break;
          case "top-right":
            x = canvas.width - textWidth - settings.offsetX;
            y = settings.offsetY + textHeight;
            break;
          case "middle-left":
            x = settings.offsetX;
            y = canvas.height / 2;
            break;
          case "middle-center":
            x = (canvas.width - textWidth) / 2;
            y = canvas.height / 2;
            break;
          case "middle-right":
            x = canvas.width - textWidth - settings.offsetX;
            y = canvas.height / 2;
            break;
          case "bottom-left":
            x = settings.offsetX;
            y = canvas.height - settings.offsetY;
            break;
          case "bottom-center":
            x = (canvas.width - textWidth) / 2;
            y = canvas.height - settings.offsetY;
            break;
          case "bottom-right":
            x = canvas.width - textWidth - settings.offsetX;
            y = canvas.height - settings.offsetY;
            break;
        }

        // Add shadow effect to make watermark more visible
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        drawWatermark(x, y);
      }

      // Generate preview URL
      setPreviewUrl(canvas.toDataURL("image/png"));
    };
    img.src = image;
  }, [image, settings]);

  const handleDownload = () => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.download = `watermarked_${originalFileName}`;
    link.href = previewUrl;
    link.click();
  };

  const handleReset = () => {
    setSettings({
      text: "浮水印文字",
      color: "#ffffff",
      fontSize: 48,
      opacity: 0.5,
      position: "bottom-right",
      offsetX: 20,
      offsetY: 20,
      rotation: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          圖片浮水印
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          為圖片添加文字浮水印，可調整位置、角度、透明度和樣式
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Upload and Preview */}
        <div className="space-y-4">
          {/* Image Upload Area */}
          {!image ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                isDragging
                  ? "border-neutral-900 bg-neutral-100 dark:border-neutral-50 dark:bg-neutral-800"
                  : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer text-center">
                <Upload className="mx-auto mb-4 size-12 text-neutral-400" />
                <p className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  點擊上傳圖片或拖曳檔案到這裡
                </p>
                <p className="text-xs text-neutral-400">
                  支援 PNG、JPG、WebP 等常見格式
                </p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Area */}
              <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                {previewUrl && (
                  <img
                    // eslint-disable-next-line @next/next/no-img-element
                    src={previewUrl}
                    alt="浮水印預覽"
                    className="max-h-[500px] w-full object-contain"
                  />
                )}
                <button
                  onClick={() => {
                    setImage(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-neutral-900/80 p-1 text-white hover:bg-neutral-900 dark:bg-neutral-50/80 dark:text-neutral-900 dark:hover:bg-neutral-50"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={!previewUrl}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <Download className="size-5" />
                下載浮水印圖片
              </button>
            </div>
          )}
        </div>

        {/* Right: Watermark Settings */}
        <div className="space-y-4">
          {/* Watermark Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              浮水印文字
            </label>
            <input
              type="text"
              value={settings.text}
              onChange={(e) => handleSettingChange("text", e.target.value)}
              placeholder="輸入浮水印文字..."
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
            />
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              文字顏色
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleSettingChange("color", color)}
                  className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    settings.color === color
                      ? "border-neutral-900 dark:border-neutral-50"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              字體大小: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="200"
              value={settings.fontSize}
              onChange={(e) => handleSettingChange("fontSize", parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              透明度: {Math.round(settings.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.opacity * 100}
              onChange={(e) => handleSettingChange("opacity", parseInt(e.target.value) / 100)}
              className="w-full"
            />
          </div>

          {/* Rotation Angle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <RotateCw className="mr-2 inline size-4" />
              旋轉角度: {settings.rotation}°
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="-180"
                max="180"
                value={settings.rotation}
                onChange={(e) => handleSettingChange("rotation", parseInt(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="-180"
                max="180"
                value={settings.rotation}
                onChange={(e) => handleSettingChange("rotation", parseInt(e.target.value) || 0)}
                className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-center text-neutral-900 focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50"
              />
            </div>
            {/* Preset rotation buttons */}
            <div className="flex flex-wrap gap-2">
              {rotationPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSettingChange("rotation", preset.value)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    settings.rotation === preset.value
                      ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              位置
            </label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => handleSettingChange("position", pos.value)}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition-all ${
                    settings.position === pos.value
                      ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Offset */}
          {settings.position !== "tiled" && imageDimensions.width > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  水平偏移: {settings.offsetX}px
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(100, imageDimensions.width)}
                  value={settings.offsetX}
                  onChange={(e) => handleSettingChange("offsetX", parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  垂直偏移: {settings.offsetY}px
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(100, imageDimensions.height)}
                  value={settings.offsetY}
                  onChange={(e) => handleSettingChange("offsetY", parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <RefreshCw className="size-4" />
            重置為預設值
          </button>
        </div>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
