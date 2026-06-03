"use client";

import { useEffect } from "react";
import { getUser } from "@/api/api";

export default function Home() {
    useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getUser();
        if (data?.username) {
          window.location.href = `/home`
        }
      } catch (err: unknown) {
        window.location.href = `/signin`;
      }
    };
    loadUser();
  }, []);
  return (
    <div>
      Loading...
    </div>
  );
}
