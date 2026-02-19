"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSelector } from "@/components/themes/selector";
import { Button } from "@/components/ui/button";

type User = { id: string; email: string; name: string | null } | null;

export function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState<User>(undefined as unknown as User);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const displayName = user?.name?.trim() || user?.email || null;

  return (
    <nav className="flex items-center justify-between py-6 md:py-8">
      <Link href="/">
        <div className="flex items-center">
          <Image
            className="lg:h-7 lg:w-auto dark:hidden"
            src="/logo.svg"
            alt="Logo"
            width={88}
            height={24}
            priority
          />
          <Image
            className="hidden lg:h-7 lg:w-auto dark:block"
            src="/logo-dark.svg"
            alt="Logo"
            width={88}
            height={24}
            priority
          />
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeSelector />
        <Button variant="outline" asChild>
          <Link href="/cases">Casos</Link>
        </Button>
        {user === undefined ? (
          <span className="text-sm text-muted-foreground">…</span>
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground" title={user.email}>
              {displayName}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sair
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href="/sign-in">Entrar</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
