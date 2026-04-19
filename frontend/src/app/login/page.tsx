"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { authApi } from "@/services/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect already-logged-in users straight to dashboard
  // but ONLY if their JWT is still valid (not expired)
  useEffect(() => {
    const token = localStorage.getItem('mn_token');
    const user = localStorage.getItem('mn_user');
    if (token) {
      try {
        // JWT uses base64url — convert to standard base64 before atob()
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(b64));
        const isExpired = payload.exp && Date.now() / 1000 > payload.exp;
        if (isExpired) {
          localStorage.removeItem('mn_token');
          localStorage.removeItem('mn_user');
          return;
        }
        const parsed = JSON.parse(user ?? '{}');
        router.replace(parsed.role === 'ADMIN' ? '/admin' : '/dashboard/parent');
      } catch {
        // Malformed token — clear and show login
        localStorage.removeItem('mn_token');
        localStorage.removeItem('mn_user');
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

      // Dashboard layout handles subscription/plan gating automatically
      router.push(res.user.role === 'ADMIN' ? '/admin' : '/dashboard/parent');
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
