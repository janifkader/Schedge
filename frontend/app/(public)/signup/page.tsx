"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signup } from "@/api/api";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { Button } from "@/components/Button";
import { Alert, AlertDescription } from "@/components/Alert";
import { Mail, Lock, User, Phone, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Register() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [phoneRef, setPhoneRef] = useState("");
  const passRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async function (e: React.FormEvent<HTMLFormElement>) {
    try {
      e.preventDefault();
      setIsLoading(true);
      setErrorMessage("");

      const name = nameRef.current?.value?.trim() || "";
      const email = emailRef.current?.value?.trim() || "";
      const phone = phoneRef ? `+1${phoneRef}` : "";
      const pass = passRef.current?.value || "";
      const confirm = confirmRef.current?.value || "";

      if (pass !== confirm) throw new Error("Passwords don't match.");
      await signup(name, email, pass, phone);
      router.push("/calendars");
    } catch (err: any) {
      console.log(err);

      if (err.message) {
        setErrorMessage(err.message);
      } else if (err?.errors) {
        setErrorMessage(err.errors[0]?.msg);
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-900 via-red-800 to-red-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <h1 className="text-3xl font-bold text-white">Schedge</h1>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Organize your time, amplify your productivity
            </h2>

            <div className="space-y-4 pt-8">
              {[
                { icon: CheckCircle2, text: "Seamless calendar management" },
                { icon: CheckCircle2, text: "Team collaboration tools" },
                { icon: CheckCircle2, text: "Smart scheduling & reminders" },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white/90">
                  <feature.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <h1 className="text-2xl font-bold text-red-900">Schedge</h1>
          </div>

          <Card className="shadow-2xl border-zinc-200">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold text-zinc-900">
                Create Account
              </CardTitle>
              <CardDescription className="text-base">
                Enter your details to get started
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-700">
                    <User className="h-3.5 w-3.5" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    ref={nameRef}
                    required
                    disabled={isLoading}
                  />
                </div>

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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-700">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                      +1
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneRef}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPhoneRef(val);
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      disabled={isLoading}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-700">
                    <Lock className="h-3.5 w-3.5" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    ref={passRef}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-zinc-700">
                    <Lock className="h-3.5 w-3.5" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    ref={confirmRef}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base bg-red-900 hover:bg-red-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign Up
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-sm text-zinc-600">
                    Already have an account?{" "}
                    <Link
                      href="/signin"
                      className="text-red-900 hover:text-red-800 font-medium hover:underline transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-zinc-500 mt-6">
            By signing up, you agree to our{" "}
            <a href="#" className="underline hover:text-zinc-700">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-zinc-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
