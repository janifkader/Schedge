"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NoAuth() {
  const { id: idParam } = use(params);
  const id = idParam?.[0] || null;
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p>Error! access denied Please login first</p>
      <Link
        href="/signin"
        className="px-4 py-2 border-2 border-gray-400 hover:border-gray-800"
      >
        Go to Home
      </Link>
    </div>
  );
}
