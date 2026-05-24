"use client";

import { usePathname } from "next/navigation";

export default function Home() {
  const pathname = usePathname();
  
  const linkStyle = (path: string) =>
    `px-4 py-2 ${
      pathname == path
        ? "bg-gray-800 text-white"
        : " text-gray-600"
    }`;
  return (
    <div>
      Welcome
    </div>
  );
}
