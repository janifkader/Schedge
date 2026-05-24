"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";


export default function NoAuth({ params }: { params: { id?: string[] } }) {
  const { id: idParam } = use(params);
  const id = idParam?.[0] || null;
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      { id === 0 ? ( <p>Error! access denied Please login first</p> ) : ( <p>Verification email has been sent! Please verify your account.</p> )}
      <Link
        href="/signin"
        className="px-4 py-2 border-2 border-gray-400 hover:border-gray-800"
      >
        Go to Home
      </Link>
    </div>
  );
}
