"use client";

import React, { useState } from "react";
import { Zap, Lock, User, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, Sun, Moon } from "lucide-react";
import { loginUser, AuthUser } from "@/lib/auth";

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function LoginView({ onLoginSuccess, isDark, onToggleTheme }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Iltimos, login va parolni to'liq kiriting!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await loginUser(username.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err?.message || "Login yoki parol noto'g'ri!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#090d16] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-200 relative select-none">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
          className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#131b2e] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 shadow-2xs transition-all cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/25 mb-4 text-white">
            <Zap className="w-7 h-7 fill-white text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Aviakassa<span className="text-blue-600">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Avia chiptalar ombori va moliyaviy hisob-kitob tizimi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Tizimga kirish
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ishni davom ettirish uchun hisobingizga kiring
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/[0.08] flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in duration-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Foydalanuvchi nomi (Login)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#0c121e] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-hidden"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Maxfiy parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50/50 dark:bg-[#0c121e] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <span>Tizimga kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Info for Admin */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Standart login: <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">admin</span> • Parol: <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">admin123$</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
