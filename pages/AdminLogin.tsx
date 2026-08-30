import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Phone, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Users, User } from 'lucide-react';
import { useApp } from '../state';

const AdminLogin: React.FC = () => {
  const { adminAuth, setIsLoggedIn, isLoggedIn, staff = [], staffLogin, currentStaff, setCurrentStaff, branding } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      if (currentStaff?.permissions?.length) navigate(`/admin/${currentStaff.permissions[0]}`);
      else navigate('/admin/dashboard');
    }
  }, [isLoggedIn, currentStaff]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setIsLoading(true);
    await new Promise(r => setTimeout(r, 350));
    if (!adminAuth) { setError('خطأ في إعدادات النظام.'); setIsLoading(false); return; }
    const u = username.trim(), p = password.trim();
    if (u === adminAuth.username && p === adminAuth.password) {
      setSuccessMsg('تم التحقق، جاري الدخول...');
      setTimeout(() => { setCurrentStaff(null); setIsLoggedIn(true); }, 500);
      return;
    }
    const found = (staff || []).find((s: any) => s.username === u && s.password === p);
    if (found) {
      setSuccessMsg(`أهلاً ${found.name}، جاري التوجيه...`);
      setTimeout(() => { staffLogin(found.id); setCurrentStaff(found); setIsLoggedIn(true); }, 500);
      return;
    }
    setIsLoading(false);
    setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const phone = recoveryPhone.trim().replace(/\s+/g, '');
    const adminPhone = (adminAuth?.phone || '').trim().replace(/\s+/g, '');
    if (adminPhone && phone === adminPhone) {
      setSuccessMsg('تم التحقق، جاري الدخول...');
      setTimeout(() => setIsLoggedIn(true), 600);
    } else {
      setIsLoading(false);
      setError('رقم الهاتف غير مطابق.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 40% 30%, #2a0a12 0%, #110305 60%, #080102 100%)',
        fontFamily: "'Tajawal', 'Amiri', sans-serif"
      }}
      dir="rtl"
    >
      {/* ambient glows */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-red-900/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5">
          {branding?.logoImage ? (
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.18)] p-1.5">
                <img src={branding.logoImage} alt="Logo" className="h-20 w-20 rounded-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="inline-flex flex-col items-center justify-center px-5 py-2 mb-3 rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#3a080f] to-[#1a0307]">
              <span className="text-xl font-serif tracking-widest text-[#f3efe9]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>QAAF</span>
              <span className="text-[11px] text-amber-200/80" style={{ fontFamily: "'Amiri', serif" }}>قاف</span>
            </div>
          )}
          <h1 className="text-base font-bold text-white/90">
            {showForgot ? 'استعادة الحساب' : 'لوحة تحكم الإدارة'}
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {showForgot ? 'أدخل رقم الهاتف المسجل للتحقق' : 'سجّل دخولك للمتابعة'}
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl bg-white/[0.05] border border-white/10 p-5 backdrop-blur-xl shadow-2xl shadow-black/50">
          {/* Gold top line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-t-2xl" />

          {!showForgot ? (
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">اسم المستخدم</label>
                <div className="relative">
                  <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); if (error) setError(''); }}
                    placeholder="admin"
                    required
                    autoComplete="username"
                    className="w-full bg-black/30 border border-white/10 hover:border-white/20 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 rounded-lg py-2.5 pr-9 pl-3 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-gray-400">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setError(''); setSuccessMsg(''); }}
                    className="text-[10px] text-amber-500/80 hover:text-amber-400 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full bg-black/30 border border-white/10 hover:border-white/20 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 rounded-lg py-2.5 pr-9 pl-9 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[11px]">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px]">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /><span>جاري التحقق...</span></>
                ) : (
                  <><ShieldCheck size={15} /><span>تسجيل الدخول</span></>
                )}
              </button>

              {/* Staff hint */}
              {(staff || []).length > 0 && (
                <p className="text-center text-[10px] text-gray-600 flex items-center justify-center gap-1">
                  <Users size={11} />
                  يمكن لأعضاء الفريق ({staff.length}) الدخول باستخدام بياناتهم الخاصة
                </p>
              )}
            </form>
          ) : (
            /* Recovery Form */
            <form onSubmit={handleRecovery} className="space-y-3">
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-200/80 leading-relaxed">
                أدخل رقم هاتف المدير المسجل في إعدادات المتجر للدخول الفوري.
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="tel"
                    value={recoveryPhone}
                    onChange={e => { setRecoveryPhone(e.target.value); if (error) setError(''); }}
                    placeholder="01xxxxxxxxx"
                    required
                    autoFocus
                    className="w-full bg-black/30 border border-white/10 hover:border-white/20 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 rounded-lg py-2.5 pr-9 pl-3 text-sm text-white placeholder-gray-600 outline-none transition-all font-mono"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[11px]">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px]">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /><span>تحقق...</span></>
                ) : (
                  <><ShieldCheck size={15} /><span>تأكيد والدخول</span></>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgot(false); setError(''); setSuccessMsg(''); }}
                className="w-full text-[11px] text-gray-500 hover:text-white transition-colors py-1"
              >
                ← العودة لتسجيل الدخول
              </button>
            </form>
          )}
        </div>

        {/* Footer link */}
        <div className="text-center mt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-300 transition-colors"
          >
            <ArrowRight size={12} className="rotate-180" />
            العودة للمتجر
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
