import { useState, type ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/authContext"; // <--- eklendi

const LoginSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Please enter a valid email."),
  password: z.string().min(1, "Password must be at least 8 characters."),
  remember: z.boolean().optional(),
});
type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", remember: false }, // <-- doğru
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<LoginForm> = async (values) => {
    setServerError("");
    try {
      await login({
        email: values.email,                 // <-- email gönder
        password: values.password,
        remember: !!values.remember,
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setServerError(msg);
      setError("password", { type: "server", message: "Check your credentials." });
    }
  };
  return (
    <>
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-7rem)] animation-auth max-w-7xl place-items-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-white/70">Sign in to continue to your workspace.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {serverError && (
              <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {serverError}
              </div>
            )}

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/90">Email</label>
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
          {errors.email && <p id="email-error" className="mt-1 text-xs text-rose-300">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-white/90">Password</label>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          {errors.password && <p id="password-error" className="mt-1 text-xs text-rose-300">{errors.password.message}</p>}
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

            {/* ... sosyal butonlar / footer aynı */}
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

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
