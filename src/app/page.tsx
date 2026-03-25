import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HomeContent } from "@/components/home-content";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return <HomeContent />;
}
