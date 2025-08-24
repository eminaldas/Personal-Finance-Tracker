import { useState, type ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

// --- Validation Schema (email + basic password rule) ---
const LoginSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", remember: false },
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<LoginForm> = async (values) => {
    setServerError("");
    try {
      // TODO: Replace with real API call
      await new Promise((r) => setTimeout(r, 1000));
      // Navigate after successful login, e.g., useNavigate()("/dashboard")
      console.log("Login success", values);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setServerError(msg);
      // Optionally set a field-specific error
      setError("password", { type: "server", message: "Check your credentials." });
    }
  };

  return (
    <>

      {/* Content */}
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-7rem)] animation-auth max-w-7xl place-items-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-white/70">Sign in to continue to your workspace.</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {/* Optional server error */}
            {serverError && (
              <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {serverError}
              </div>
            )}

            <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/90">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(
                    "block w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/40 shadow-inner outline-none backdrop-blur focus:ring-2",
                    "border-white/10 focus:border-transparent focus:ring-cyan-400",
                    errors.email && "border-rose-400/40 focus:ring-rose-400"
                  )}
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-rose-300">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-white/90">
                    Password
                  </label>
                  <a href="#" className="text-xs text-cyan-300 hover:text-cyan-200">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn(
                      "block w-full rounded-xl border bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder-white/40 shadow-inner outline-none backdrop-blur focus:ring-2",
                      "border-white/10 focus:border-transparent focus:ring-cyan-400",
                      errors.password && "border-rose-400/40 focus:ring-rose-400"
                    )}
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      // eye-off
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 4.62A10.94 10.94 0 0112 4c5 0 9.27 3.11 10.5 7.5a11.36 11.36 0 01-3.12 4.56" />
                        <path d="M6.61 6.61A11.5 11.5 0 001.5 11.5 11.52 11.52 0 008.1 17.4" />
                      </svg>
                    ) : (
                      // eye
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-rose-300">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember + Submit */}
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                    {...register("remember")}
                  />
                  Remember me
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                  Sign in
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 text-white/40">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-wider">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Socials (optional) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SocialButton label="Continue with Google">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.4-5.1 3.4-3.1 0-5.6-2.5-5.6-5.6S8.9 6 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.8 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.2-1.4H12z" />
                </svg>
              </SocialButton>
              <SocialButton label="Continue with GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="currentColor" d="M12 .5A11.5 11.5 0 000 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.04 1.78 2.74 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.45.11-3.03 0 0 .98-.31 3.21 1.18a11.2 11.2 0 015.84 0c2.23-1.49 3.21-1.18 3.21-1.18.63 1.58.23 2.74.11 3.03.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.67.42.36.8 1.07.8 2.17 0 1.57-.02 2.83-.02 3.22 0 .31.21.68.8.56A11.5 11.5 0 0024 12 11.5 11.5 0 0012 .5z" />
                </svg>
              </SocialButton>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-white/60">
              Don’t have an account? <a className="text-cyan-300 hover:text-cyan-200 cursor-pointer " onClick={() =>{navigate('/register')}}>Create one</a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

type SocialButtonProps = { label: string; children: ReactNode; onClick?: () => void };
function SocialButton({ label, children, onClick }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10"
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

// small className helper
function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
