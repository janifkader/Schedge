"use client";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getUser, signout } from "@/api/api";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [username, setUsername] = useState(null);
  const router = useRouter();

  const handleSignout = async function() {
    await signout();
    router.push('/signin');
  }

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getUser();
        setUsername(data.username);
      } catch {
        window.location.href = "/noAuth";
      }
    };
    loadUser();
  }, []);
  if (!username) return null;

  return (
    <main>
      <div className="flex flex-col flex-1 bg-zinc-50 font-sans">
        <div className="flex flex-col">
          {/* Top Quarter - Navigation */}
          <header className="h-1/6 w-full bg-red-900 text-black">
            <nav className="flex items-center justify-around h-full px-8">
              <div className="text-white">
                <Image
                  src="/log.png"
                  alt="logo"
                  width={100}
                  height={20}
                  priority
                />
                {username}
              </div>
              <ul className="flex gap-6">
                <li><Link className="text-white" href="/home">Home</Link></li>
                <li><Link className="text-white" href="/calendars">Calendars</Link></li>
                <li><Link className="text-white" href="/teams">Teams</Link></li>
                <li><Link className="text-white" href="/account">Account</Link></li>
                <li><button className="text-white bg-transparent border-none cursor-pointer" onClick={() => { handleSignout(); }}>
                      Signout
                    </button>
                </li>
              </ul>
            </nav>
          </header>
        </div>
      </div>
      {children}
    </main>
  );
}
