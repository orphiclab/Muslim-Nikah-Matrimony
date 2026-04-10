"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? "Invalid credentials. Please try again.");
        return;
      }
      localStorage.setItem("mn_token", data.token);
      localStorage.setItem("mn_user", JSON.stringify(data.user));
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard/parent");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg overflow-hidden flex flex-col md:flex-row">

        {/* ── Left Sidebar ── */}
        <aside className="w-full md:w-72 bg-[#F0F4F2] px-8 py-10 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
              <div className="h-9 w-9 rounded-full bg-[#1B6B4A] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
              <span className="font-bold text-[#1B6B4A] text-base tracking-wide uppercase">
                Muslim Nikah
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-800">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Sign in to your account to continue finding your meaningful match.
            </p>

            {/* Decorative divider */}
            <div className="mt-8 flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-[#1B6B4A]/20 rounded" />
              <span className="text-xs text-[#1B6B4A] font-medium">Secure Login</span>
              <div className="h-0.5 flex-1 bg-[#1B6B4A]/20 rounded" />
            </div>

            {/* Trust features */}
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

          {/* Bottom note */}
          <p className="mt-10 text-xs text-gray-400 leading-relaxed">
            Trusted by 10,000+ families worldwide for halal matchmaking.
          </p>
        </aside>

        {/* ── Right Form Area ── */}
        <main className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-800">Sign in to your account</h2>
            <p className="mt-1 text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/customer/register" className="text-[#1B6B4A] font-medium hover:underline">
                Register
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#1B6B4A] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-[#1B6B4A] py-3 text-sm font-semibold text-white hover:bg-[#155a3d] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* <p className="mt-6 text-center text-xs text-gray-400">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-[#1B6B4A] hover:underline">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#1B6B4A] hover:underline">Privacy Policy</Link>.
            </p> */}
          </div>
        </main>
      </div>
    </div>
  );
}
