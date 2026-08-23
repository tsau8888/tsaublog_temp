export interface FriendLink {
  name: string;
  url: string;
  desc: string;
  image: string;
}

export const friendLinks: FriendLink[] = [
  // 範例：可以自行修改或新增
  // {
  //   name: "D-Sketon",
  //   url: "https://example.com",
  //   desc: "一個車萬人",
  //   image: "/friends/d-sketon.png",
  // },
  {
    name: "老祖",
    url: "https://huiink.github.io",
    desc: "爆肝小孩",
    image: "https://huiink.github.io/avatar.webp",
    },
  {
    name: "R3X DJ",
    url: "https://r3xdj.pages.dev/",
    desc: "對不起我都在 Vibe Hacking",
    image: "https://r3xdj.pages.dev/img/icy_star.png",
  }
];
