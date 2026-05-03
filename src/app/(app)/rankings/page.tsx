"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RankingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/groups");
  }, [router]);

  return null;
}
