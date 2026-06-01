"use client";

import { useEffect, useState } from "react";
import { Menu, X, LogOut, Calendar, Users, FileText, Home, Settings } from "lucide-react";
import { Button } from "@/components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/Dropdown";
import { getUser, signout } from "@/api/api";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

function NavLink({ href, children, icon, onClick }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
    >
      {icon}
      <span>{children}</span>
    </a>
  );
}

export default function EnhancedNavbar({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [path, setPath] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignout = async function () {
    await signout();
    window.location.href = "/signin";
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getUser();
        setUsername(data.username);
        setAvatarUrl(data.avatar_url || null);
      } catch (err: unknown) {
        if (err instanceof Error && err.message) {
          if (err.message === "Please verify your email before performing this action.") {
            setPath(1);
          }
        }
        window.location.href = `/noAuth/${path}`;
      }
    };
    loadUser();
  }, [path]);

  if (!username) return null;

  const navLinks = [
    { href: "/home", label: "Home", icon: <Home className="w-4 h-4" /> },
    { href: "/calendars", label: "Calendars", icon: <Calendar className="w-4 h-4" /> },
    { href: "/teams", label: "Teams", icon: <Users className="w-4 h-4" /> },
    { href: "/requests", label: "Requests", icon: <FileText className="w-4 h-4" /> },
  ];

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const UserAvatar = ({ size = "h-8 w-8" }: { size?: string }) => (
    <Avatar className={size}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={username ?? ""} />
      ) : (
        <AvatarFallback className="bg-red-950 text-white text-xs">
          {getInitials(username ?? "")}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 w-full border-b border-red-950/10 bg-gradient-to-r from-red-900 via-red-800 to-red-900 shadow-lg">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/log.png" alt="logo" className="h-8 w-auto object-contain" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} icon={link.icon}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center hover:cursor-pointer gap-2 hover:bg-white/10 text-white border-white/20"
                    >
                      <UserAvatar />
                      <span className="hidden lg:inline-block">{username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <UserAvatar size="h-10 w-10" />
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{username}</p>
                          <p className="text-xs text-muted-foreground">Manage your account</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/account" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      variant="destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-2 animate-in slide-in-from-top">
              <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white/5 rounded-lg">
                <UserAvatar size="h-10 w-10" />
                <div className="flex flex-col">
                  <span className="text-white font-medium">{username}</span>
                  <span className="text-white/60 text-sm">View profile</span>
                </div>
              </div>

              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} icon={link.icon} onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </NavLink>
              ))}

              <div className="pt-2 mt-2 border-t border-white/10">
                <NavLink href="/account" icon={<Settings className="w-4 h-4" />} onClick={() => setMobileMenuOpen(false)}>
                  Account Settings
                </NavLink>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleSignout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-red-200 hover:text-red-100 hover:bg-red-950/30 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}