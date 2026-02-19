import Image from "next/image";
import Link from "next/link";
import { NavBar } from "@/components/navbar";
import { checkDbConnection } from "@/lib/db/prisma";

export default async function Home() {
  const result = await checkDbConnection();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex w-full flex-1 flex-col px-6 py-6 md:px-8 lg:px-10">
        <NavBar />
        <main className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-semibold leading-none tracking-tighter md:text-4xl md:leading-none lg:text-5xl lg:leading-none">
            Casos e Evidências
          </h1>
          <p className="mt-3.5 max-w-lg text-base leading-snug tracking-tight text-[#61646B] md:text-lg md:leading-snug lg:text-xl lg:leading-snug dark:text-[#94979E]">
            Organize evidências de WhatsApp (áudios e prints) por caso, com timeline, tags e fatos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5 md:mt-9 lg:mt-10">
            <Link
              className="rounded-full bg-[#00E599] px-5 py-2.5 font-semibold tracking-tight text-[#0C0D0D] transition-colors duration-200 hover:bg-[#00E5BF] lg:px-7 lg:py-3"
              href="/cases"
            >
              Ir para Casos
            </Link>
          </div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E5E7] py-5 sm:gap-2 sm:gap-6 md:pb-12 md:pt-10 dark:border-[#303236]">
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              result === "Database connected"
                ? "border-[#00E599]/20 bg-[#00E599]/10 text-[#1a8c66] dark:bg-[#00E599]/10 dark:text-[#00E599]"
                : "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-500"
            }`}
          >
            {result}
          </span>
        </footer>
      </div>
    </div>
  );
}
