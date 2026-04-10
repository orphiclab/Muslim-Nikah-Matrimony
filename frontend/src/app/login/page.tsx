"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { authApi, subscriptionApi } from "@/services/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect already-logged-in users straight to dashboard
  useEffect(() => {
    const token = localStorage.getItem('mn_token');
    const user = localStorage.getItem('mn_user');
    if (token) {
      try {
        const parsed = JSON.parse(user ?? '{}');
        router.replace(parsed.role === 'ADMIN' ? '/admin' : '/dashboard/parent');
      } catch {
        router.replace('/dashboard/parent');
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(formData);
      localStorage.setItem("mn_token", res.token);
      localStorage.setItem("mn_user", JSON.stringify(res.user));
      window.dispatchEvent(new Event('mn_auth_change'));

      // Admin skips subscription check
      if (res.user.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      // Check if user has any active subscription
      try {
        const subRes = await subscriptionApi.mySubscriptions();
        const hasActive = (subRes.data ?? []).some((s: any) => s.subscription?.status === 'ACTIVE');
        router.push(hasActive ? '/dashboard/parent' : '/select-plan');
      } catch {
        // If subscription check fails, go to packages to be safe
        router.push('/select-plan');
      }
    } catch (e: any) {
      setError(e.message ?? "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins bg-gray-50 pt-24 pb-8 px-4 min-h-screen">
      <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-md overflow-hidden flex flex-col md:flex-row">

        {/* ── Left Sidebar — hidden on mobile, shown on md+ ── */}
        <aside className="hidden md:flex w-64 bg-[#F0F4F2] px-7 py-8 flex-col justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Sign in to your account to continue finding your meaningful match.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-[#1B6B4A]/20 rounded" />
              <span className="text-xs text-[#1B6B4A] font-medium">Secure Login</span>
              <div className="h-0.5 flex-1 bg-[#1B6B4A]/20 rounded" />
            </div>

            <ul className="mt-6 flex flex-col gap-4">
              {[
                { icon: "🔒", text: "Bank-level encryption" },
                { icon: "✅", text: "Verified profiles only" },
                { icon: "🕌", text: "Faith-guided matchmaking" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-base">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-10 text-xs text-gray-400 leading-relaxed">
            Trusted by 10,000+ families worldwide for halal matchmaking.
          </p>
        </aside>

        {/* ── Right Form Area ── */}
        <main className="flex-1 px-6 py-8 md:px-10 md:py-8">

          {/* Mobile-only brand header */}
          <div className="md:hidden mb-6 text-center">
            <Image
              src="/images/muslimLogo1.png"
              alt="Muslim Nikah logo"
              width={220}
              height={88}
              className="mx-auto mb-3 h-auto w-[180px]"
              priority
            />
          </div>

          <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-gray-800">Sign in</h1>
            <p className="mt-1 text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#1B6B4A] font-semibold hover:underline">
                Register
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/15 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[#1B6B4A] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 py-3 text-sm text-gray-800 outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/15 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#1B6B4A] py-3.5 text-sm font-semibold text-white hover:bg-[#155a3d] active:scale-[0.98] transition-all duration-200 shadow-md disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400 whitespace-nowrap">or continue with</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="mt-4 w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200 shadow-sm"
            >
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* <p className="mt-5 text-center text-xs text-gray-400">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-[#1B6B4A] hover:underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[#1B6B4A] hover:underline">Privacy Policy</Link>.
            </p> */}
          </div>
        </main>
      </div>
    </div>
  );
}
