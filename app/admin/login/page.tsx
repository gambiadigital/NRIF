"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LockSimple, Eye, EyeSlash, EnvelopeSimple } from "@phosphor-icons/react";
import { NrifLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";
import { CodeInput } from "@/components/ui/CodeInput";
import { api, useApi } from "@/lib/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLogin />
    </Suspense>
  );
}

type Stage = "email" | "code" | "password";

/** Staff sign in with a code emailed by Neon Auth. The very first account also needs the deployment's setup code. */
function AdminLogin() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const setup = useApi<{ needsSetup: boolean }>("/api/admin/setup", 0);
  const needsSetup = !!setup.data?.needsSetup;
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const done = () => router.replace(next && next.startsWith("/admin") ? next : "/admin");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      if (needsSetup) await api("/api/admin/setup", { json: { token, name, email } });
      else await api("/api/admin/code", { json: { email } });
      setCode("");
      setStage("code");
    });
  const verify = (c: string) =>
    run(async () => {
      if (needsSetup) await api("/api/admin/setup", { json: { token, name, email, code: c } });
      else await api("/api/admin/verify", { json: { email, code: c } });
      done();
    });
  const withPassword = () =>
    run(async () => {
      await api("/api/admin/login", { json: { email, password } });
      done();
    });

  const emailOk = /^\S+@\S+\.\S+$/.test(email);

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
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <NrifLockup className="h-10" />
          </div>
          <AnimatePresence mode="wait">
            {stage === "email" && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendCode();
                }}
              >
                <span className="mt-8 grid size-12 place-items-center rounded-2xl bg-forest-50 text-forest lg:mt-0">
                  <LockSimple weight="fill" className="size-6" />
                </span>
                <h1 className="mt-5 text-[1.9rem] font-bold tracking-[-0.02em] text-navy">{needsSetup ? "Create the first admin" : "Sign in"}</h1>
                <p className="mt-1 text-muted">{needsSetup ? "Use the setup code from the deployment's settings. We'll email you a code to confirm the address." : "We'll email you a six-digit code. For NRIF staff only."}</p>
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
                  <Field label="Work email" htmlFor="email">
                    <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" leading={<EnvelopeSimple className="size-4" />} />
                  </Field>
                  {err && <p className="text-sm font-medium text-ember">{err}</p>}
                  <Button type="submit" size="lg" block arrow disabled={busy || setup.loading || !emailOk || (needsSetup && (token.length < 8 || name.trim().length < 2))}>
                    {busy ? "Sending…" : "Email me a code"}
                  </Button>
                </div>
              </motion.form>
            )}
            {stage === "code" && (
              <motion.div key="code" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <span className="mt-8 grid size-12 place-items-center rounded-2xl bg-forest-50 text-forest lg:mt-0">
                  <EnvelopeSimple weight="duotone" className="size-6" />
                </span>
                <h1 className="mt-5 text-[1.9rem] font-bold tracking-[-0.02em] text-navy">Check your email</h1>
                <p className="mt-1 text-muted">
                  {needsSetup ? "We sent a code to " : "If it has an admin account, we sent a code to "}
                  <b className="text-navy">{email}</b>. It works for 5 minutes; check spam too.
                </p>
                <div className="mt-8">
                  <CodeInput value={code} onChange={setCode} onComplete={(c) => void verify(c)} disabled={busy} />
                </div>
                {err && <p className="mt-4 text-sm font-medium text-ember">{err}</p>}
                <Button size="lg" block className="mt-6" disabled={busy || code.length < 6} onClick={() => void verify(code)}>
                  {busy ? "Checking…" : needsSetup ? "Create account" : "Sign in"}
                </Button>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <button onClick={() => setStage("email")} className="py-2 font-semibold text-muted hover:text-navy">
                    Change email
                  </button>
                  <button onClick={() => void sendCode()} disabled={busy} className="py-2 font-semibold text-forest hover:underline">
                    Send a new code
                  </button>
                </div>
              </motion.div>
            )}
            {stage === "password" && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void withPassword();
                }}
              >
                <h1 className="mt-8 text-[1.9rem] font-bold tracking-[-0.02em] text-navy lg:mt-0">Sign in with a password</h1>
                <p className="mt-1 text-muted">Only for accounts that were given one.</p>
                <div className="mt-8 space-y-4">
                  <Field label="Email" htmlFor="pemail">
                    <TextInput id="pemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                  </Field>
                  <Field label="Password" htmlFor="password">
                    <TextInput
                      id="password"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      trailing={
                        <button type="button" onClick={() => setShow((s) => !s)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-sand" aria-label={show ? "Hide password" : "Show password"}>
                          {show ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      }
                    />
                  </Field>
                  {err && <p className="text-sm font-medium text-ember">{err}</p>}
                  <Button type="submit" size="lg" block disabled={busy || !emailOk || !password}>
                    {busy ? "One moment…" : "Sign in"}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          {!needsSetup && (
            <button
              onClick={() => {
                setStage(stage === "password" ? "email" : "password");
                setErr(null);
              }}
              className="mt-6 py-2 text-sm font-semibold text-forest hover:underline"
            >
              {stage === "password" ? "Sign in with an email code instead" : "Use a password instead"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
