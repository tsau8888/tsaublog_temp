export const navigation = {
  zh: [
    { name: "首頁", href: "/" },
    { name: "工具", href: "/tools" },
    { name: "檔案", href: "/files" },
    { name: "夥伴們", href: "/friends" },
  ],
} as const;

export type NavigationItem = (typeof navigation)["zh"][number];

export function getLocalizedNavigation() {
  return navigation.zh.map((item) => ({
    ...item,
    href: item.href,
  }));
}
