"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { LockSimple, Eye, EyeSlash } from "@phosphor-icons/react";
import { NrifLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";
import { api, useApi } from "@/lib/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLogin />
    </Suspense>
  );
}

function AdminLogin() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const setup = useApi<{ needsSetup: boolean }>("/api/admin/setup", 0);
  const needsSetup = setup.data?.needsSetup;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      if (needsSetup) await api("/api/admin/setup", { json: { token, name, email, password } });
      else await api("/api/admin/login", { json: { email, password } });
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-paper lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <Image src="/media/start-line.webp" alt="" fill sizes="55vw" className="object-cover opacity-50" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <NrifLockup white className="h-12" />
          <p className="mt-6 font-race text-[4.2rem]">Run admin</p>
          <p className="mt-2 max-w-md text-white/70">Payments, entries, bibs and messages for Run for Independence 2027.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-16 sm:px-6">
        <form
          className="w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="lg:hidden">
            <NrifLockup className="h-10" />
          </div>
          <span className="mt-8 grid size-12 place-items-center rounded-2xl bg-forest-50 text-forest lg:mt-0">
            <LockSimple weight="fill" className="size-6" />
          </span>
          <h1 className="mt-5 text-[1.9rem] font-bold tracking-[-0.02em] text-navy">{needsSetup ? "Create the first admin" : "Sign in"}</h1>
          <p className="mt-1 text-muted">{needsSetup ? "Use the setup code from the deployment's settings. It works once." : "For NRIF staff only."}</p>
          <div className="mt-8 space-y-4">
            {needsSetup && (
              <>
                <Field label="Setup code" htmlFor="token">
                  <TextInput id="token" value={token} onChange={(e) => setToken(e.target.value.trim())} autoComplete="off" />
                </Field>
                <Field label="Your name" htmlFor="name">
                  <TextInput id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </Field>
              </>
            )}
            <Field label="Email" htmlFor="email">
              <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Password" htmlFor="password" hint={needsSetup ? "At least 10 characters" : undefined}>
              <TextInput
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={needsSetup ? "new-password" : "current-password"}
                trailing={
                  <button type="button" onClick={() => setShow((s) => !s)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-sand" aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
            </Field>
            {err && <p className="text-sm font-medium text-ember">{err}</p>}
            <Button type="submit" size="lg" block disabled={busy || setup.loading || !email || !password}>
              {busy ? "One moment…" : needsSetup ? "Create account" : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
