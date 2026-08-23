// Simplify lucide-react type declarations
declare module "lucide-react" {
  import { ComponentType, SVGProps } from "react";
  
  type IconProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    className?: string;
  };

  export type LucideIcon = ComponentType<IconProps>;

  type Icon = ComponentType<IconProps>;

  export const Copy: Icon;
  export const Trash2: Icon;
  export const ArrowLeftRight: Icon;
  export const ArrowRight: Icon;
  export const Check: Icon;
  export const RefreshCw: Icon;
  export const Lock: Icon;
  export const Unlock: Icon;
  export const Key: Icon;
  export const Shield: Icon;
  export const Upload: Icon;
  export const Download: Icon;
  export const X: Icon;
  export const RotateCw: Icon;
  export const Code2: Icon;
  export const Hash: Icon;
  export const Image: Icon;
  export const Menu: Icon;
  export const Home: Icon;
  export const Monitor: Icon;
  export const Moon: Icon;
  export const Sun: Icon;
  export const Globe: Icon;
  export const ClipboardCopy: Icon;
  export const ChevronDown: Icon;
  export const Sparkles: Icon;
  export const Mail: Icon;
  export const MessageSquare: Icon;
  export const Send: Icon;
  export const User: Icon;
  export const Github: Icon;
  export const Instagram: Icon;
  export const File: Icon;
  export const FileText: Icon;
  export const FileImage: Icon;
  export const FileVideo: Icon;
  export const FileArchive: Icon;
  export const Files: Icon;
  export const Archive: Icon;
  export const Video: Icon;
  export const Palette: Icon;
  export const QrCode: Icon;
}
