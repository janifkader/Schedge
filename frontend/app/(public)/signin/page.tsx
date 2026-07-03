"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { signin, resendVerificationEmail } from "@/api/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Button } from "@/components/Button";
import { Alert, AlertDescription } from "@/components/Alert";
import { Mail, Lock, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import type { ApiError } from "@/app/types/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/Tooltip";

export default function Signin() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [verified, setVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const router = useRouter();

  const handleSubmit = async function (e: React.FormEvent<HTMLFormElement>) {
    try {
      e.preventDefault();
      setIsLoading(true);
      setVerified(true);
      setErrorMessage("");

      const email = emailRef.current?.value?.trim() || "";
      const pass = passRef.current?.value || "";
      await signin(email, pass);
      router.push("/home");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.message) {
        if (apiErr.message === "Please verify your account.") {
          setVerified(false);
        }
        setErrorMessage(apiErr.message);
      } else if (apiErr?.errors) {
        setErrorMessage(apiErr.errors[0]?.msg || "An unexpected error occurred");
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async function () {
    try {
      setIsResending(true);
      const email = emailRef.current?.value?.trim() || "";
      setVerified(true);
      await resendVerificationEmail(email);
      setErrorMessage("Verification email resent successfully.");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.message) {
        setErrorMessage(apiErr.message);
      } else if (apiErr?.errors) {
        setErrorMessage(apiErr.errors[0]?.msg || "An unexpected error occurred");
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <h1 className="text-2xl font-bold text-red-900">Schedge</h1>
        </div>

        <Card className="shadow-2xl border-zinc-200">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-zinc-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <Alert
                  variant={errorMessage.includes("successfully") ? "default" : "destructive"}
                  className="animate-in slide-in-from-top-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between gap-2">
                    <span className="flex-1">{errorMessage}</span>
                    {!verified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleResend}
                              aria-label="Resend verification"
                              disabled={isResending}
                              className="h-7 px-2 hover:bg-destructive/20"
                            >
                              {isResending ? (
                                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Resend verification email</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700">
                  <Mail className="h-3.5 w-3.5" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  ref={emailRef}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-700">
                    <Lock className="h-3.5 w-3.5" />
                    Password
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  ref={passRef}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base bg-red-900 hover:bg-red-800 text-white mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-zinc-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-red-900 hover:text-red-800 font-medium hover:underline transition-colors"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
