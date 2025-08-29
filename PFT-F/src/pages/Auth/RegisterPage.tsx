import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

// ------------ Password helpers
const MIN_LEN = 8;
const hasLower = (s: string) => /[a-z]/.test(s);
const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasNumber = (s: string) => /\d/.test(s);
const hasSymbol = (s: string) => /[^A-Za-z0-9]/.test(s);

const passwordScore = (pw: string = ""): number => {
  let score = 0;
  if (pw.length >= MIN_LEN) score++;
  if (hasLower(pw)) score++;
  if (hasUpper(pw)) score++;
  if (hasNumber(pw)) score++;
  if (hasSymbol(pw)) score++;
  if (pw.length >= 12 && score >= 3) score++;
  return Math.min(score, 6); // 0..6
};

// ------------ Schema
const RegisterSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    email: z.string().min(1, "Email is required.").email("Enter a valid email."),
    password: z
      .string()
      .min(MIN_LEN, `At least ${MIN_LEN} characters.`)
      .refine(hasLower, "Must include a lowercase letter.")
      .refine(hasUpper, "Must include an uppercase letter.")
      .refine(hasNumber, "Must include a number.")
      .refine(hasSymbol, "Must include a symbol."),
    confirm: z.string(),
    agree: z.boolean().refine((v) => v === true, { message: "You must accept the Terms." }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  })
  .refine(
    (data) => !data.password.toLowerCase().includes(data.email.split("@")[0].toLowerCase()),
    { path: ["password"], message: "Avoid using your email/username in the password." }
  );

export type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const [showPw, setShowPw] = useState<boolean>(false);
  const [showPw2, setShowPw2] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "", agree: false },
    mode: "onChange",
  });

  const pw = watch("password");
  const confirm = watch("confirm");
  const score = useMemo(() => passwordScore(pw), [pw]);

  const onSubmit = async (values: RegisterForm) => {
    setServerError("");
    try {
      // TODO: API call
      await new Promise((r) => setTimeout(r, 800));
      console.log("Register success", values);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Registration failed, please try again.");
    }
  };

  const meterStops = ["Very weak", "Weak", "Okay", "Good", "Strong", "Very strong"] as const;
  const meterIndex = Math.max(0, Math.min(5, score - 1));

  const checklist = [
    { ok: pw.length >= MIN_LEN, label: `At least ${MIN_LEN} characters` },
    { ok: hasLower(pw), label: "Lowercase letter" },
    { ok: hasUpper(pw), label: "Uppercase letter" },
    { ok: hasNumber(pw), label: "Number" },
    { ok: hasSymbol(pw), label: "Symbol (e.g. !@#$)" },
  ] as const;

  const generate = (): string => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>?";
    const len = 14;
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  return (
<div>
      <main className="relative z-10 mx-auto grid min-h-[90vh] max-w-7xl place-items-center animation-auth  px-6">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="mt-2 text-sm text-white/70">Start exploring AI tools in minutes.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
            {serverError && (
              <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-white/90" htmlFor="name">Name</label>
                <input id="name" type="text" className={cn(baseInput, errors.name && errorRing)} placeholder="Jane Doe" {...register("name")} />
                {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-white/90" htmlFor="email">Email</label>
                <input id="email" type="email" className={cn(baseInput, errors.email && errorRing)} placeholder="you@example.com" autoComplete="email" {...register("email")} />
                {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-white/90" htmlFor="password">Password</label>
                  <button type="button" onClick={() => { const pwd = generate(); setValue("password", pwd, { shouldValidate: true }); setValue("confirm", pwd, { shouldValidate: true }); }} className="text-xs text-cyan-300 hover:text-cyan-200">Generate</button>
                </div>
                <div className="relative">
                  <input id="password" type={showPw ? "text" : "password"} className={cn(baseInput, "pr-10", errors.password && errorRing)} placeholder="••••••••" autoComplete="new-password" {...register("password")} />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:text-white" aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? EyeOff : Eye}</button>
                </div>
                {/* Strength meter */}
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={cn("h-full transition-all", strengthColor(score))} style={{ width: `${(score / 6) * 100}%` }} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/60">
                    <span>Password strength</span>
                    <span className="uppercase tracking-wide">{meterStops[meterIndex]}</span>
                  </div>
                </div>
                {/* Checklist */}
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {checklist.map((c) => (
                    <li key={c.label} className="flex items-center gap-2">
                      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", c.ok ? "bg-emerald-400" : "bg-white/25")} />
                      <span className={cn(c.ok ? "text-white/80" : "text-white/50")}>{c.label}</span>
                    </li>
                  ))}
                </ul>
                {errors.password && <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p>}
              </div>

              {/* Confirm */}
              <div>
                <label className="mb-1 block text-sm font-medium text-white/90" htmlFor="confirm">Confirm password</label>
                <div className="relative">
                  <input id="confirm" type={showPw2 ? "text" : "password"} className={cn(baseInput, "pr-10", errors.confirm && errorRing)} placeholder="••••••••" autoComplete="new-password" {...register("confirm")} />
                  <button type="button" onClick={() => setShowPw2((s) => !s)} className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:text-white" aria-label={showPw2 ? "Hide password" : "Show password"}>{showPw2 ? EyeOff : Eye}</button>
                  <div className="pointer-events-none absolute -bottom-5 right-0 text-[11px]">{confirm && (<span className={cn(confirm === pw ? "text-emerald-300" : "text-rose-300")}>{confirm === pw ? "Match" : "Not matching"}</span>)}</div>
                </div>
                {errors.confirm && <p className="mt-2 text-xs text-rose-300">{errors.confirm.message}</p>}
              </div>

              {/* Agree checkbox */}
              <div className="pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400" {...register("agree")} />
                  I agree to the <a className="text-cyan-300 hover:text-cyan-200" href="#">Terms</a>
                </label>
                {errors.agree && <p className="mt-1 text-xs text-rose-300">{errors.agree.message}</p>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isSubmitting} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                Create account
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-white/60">
              Already have an account? <a className="text-cyan-300 hover:text-cyan-200 cursor-pointer" onClick={()=>{navigate('/login')}}>Sign in</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

const baseInput = "block w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/40 shadow-inner outline-none backdrop-blur focus:ring-2 border-white/10 focus:border-transparent focus:ring-cyan-400";
const errorRing = "border-rose-400/40 focus:ring-rose-400";

function cn(...c: Array<string | false | null | undefined>): string {
  return c.filter(Boolean).join(" ");
}

const Eye = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M3 3l18 18" />
    <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
    <path d="M9.88 4.62A10.94 10.94 0 0112 4c5 0 9.27 3.11 10.5 7.5a11.36 11.36 0 01-3.12 4.56" />
    <path d="M6.61 6.61A11.5 11.5 0 001.5 11.5 11.52 11.52 0 008.1 17.4" />
  </svg>
);

function strengthColor(score: number): string {
  if (score <= 2) return "bg-rose-400";
  if (score <= 3) return "bg-amber-400";
  if (score <= 4) return "bg-lime-400";
  return "bg-emerald-400";
}
