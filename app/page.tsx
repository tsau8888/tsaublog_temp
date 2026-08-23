import About from "@/components/sections/About";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import { getAllPosts } from "@/lib/posts";

export default function RootPage() {
  const posts = getAllPosts();

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      <Hero />
      <About />
      <Projects posts={posts} />
    </div>
  );
}
