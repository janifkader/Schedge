"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/api/api";
import Image from "next/image";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your account details...");

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token. Please check your link or request a new one.");
        return;
      }
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err: unknown) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Invalid or expired verification token.");
      }
    }
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="w-full bg-red-900 h-20 flex items-center px-8">
        <Image src="/log.png" alt="logo" width={100} height={20} priority />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-sm p-8 text-center">

          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-12 h-12 border-4 border-zinc-200 border-t-red-900 rounded-full animate-spin" />
              <h2 className="text-lg font-bold text-zinc-800">Processing Request</h2>
              <p className="text-sm text-zinc-500">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-3xl font-bold">
                ✓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">Account Activated!</h2>
                <p className="text-zinc-600 text-sm">{message}</p>
              </div>
              <button
                onClick={() => router.push("/signin")}
                className="w-full bg-red-900 hover:bg-red-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
              >
                Proceed to Login
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-900 text-3xl font-bold">
                !
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">Verification Failed</h2>
                <p className="text-red-700 font-medium text-sm mb-2">{message}</p>
                <p className="text-zinc-500 text-xs">
                  The link may have expired (valid for 24 hours) or already been used. Try logging in to request a new one.
                </p>
              </div>
              <button
                onClick={() => router.push("/signin")}
                className="w-full border border-red-900 text-red-900 hover:bg-red-50 font-semibold py-2.5 px-6 rounded-lg transition-colors"
              >
                Return to Sign In
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-red-900 rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}