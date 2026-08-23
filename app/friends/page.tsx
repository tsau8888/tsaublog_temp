/** 視覺維護原則：保留原有卡片與間距，僅調整朋友與本站資訊的閱讀順序。 */
import Friends from "@/components/sections/Friends";
import SiteInfo from "@/components/sections/SiteInfo";

export default function FriendsPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
      <Friends />
      <SiteInfo />
    </main>
  );
}
