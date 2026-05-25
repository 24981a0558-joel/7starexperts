'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { sendOtp, login } = useAuth();

  const phoneForm = useForm<{ phone: string }>();
  const otpForm = useForm<{ otp: string }>();

  const handleSendOtp = phoneForm.handleSubmit(async (data) => {
    setErrorMsg('');
    try {
      await sendOtp.mutateAsync(data.phone);
      setPhone(data.phone);
      setStep('otp');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message ?? 'Failed to send OTP');
    }
  });

  const handleVerifyOtp = otpForm.handleSubmit(async (data) => {
    setErrorMsg('');
    try {
      await login.mutateAsync({ phone, otp: data.otp });
    } catch (e: any) {
      setErrorMsg(e.message ?? e.response?.data?.message ?? 'Login failed');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at top left, #1e2d4a 0%, #070d1a 50%, #0f0a1e 100%)' }}>

      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white opacity-10 animate-pulse"
            style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }} />
        ))}
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#f0b429 0%,#d49a0f 100%)', boxShadow: '0 0 60px rgba(240,180,41,0.4)' }}>
            <Crown size={36} className="text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">7StarExperts</h1>
          <p className="mt-1 text-sm tracking-widest uppercase" style={{ color: '#f0b429' }}>Admin Console</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(240,180,41,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          <h2 className="text-lg font-bold text-white mb-1">
            {step === 'phone' ? 'Welcome back' : 'Enter Verification Code'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {step === 'phone' ? 'Sign in to your admin account' : `OTP sent to +91 ${phone}`}
          </p>

          {errorMsg && (
            <div className="text-sm rounded-xl px-4 py-3 mb-4 border"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {errorMsg}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#f0b429' }}>
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                  <input {...phoneForm.register('phone', {
                    required: 'Phone required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit number' }
                  })}
                    placeholder="9876543210"
                    className="w-full rounded-xl pl-14 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', '--tw-ring-color': '#f0b429' } as any}
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-red-400 text-xs mt-1">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>
              <button type="submit" disabled={sendOtp.isPending}
                className="w-full py-3.5 rounded-xl font-bold text-gray-900 flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)', boxShadow: '0 4px 20px rgba(240,180,41,0.3)' }}>
                {sendOtp.isPending && <Loader2 size={16} className="animate-spin" />}
                Send OTP →
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#f0b429' }}>
                  6-Digit OTP
                </label>
                <input {...otpForm.register('otp', { required: 'OTP required', minLength: { value: 6, message: '6 digits' } })}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="w-full rounded-xl px-4 py-3.5 text-xl text-white placeholder-gray-600 tracking-[0.5em] text-center font-bold focus:outline-none focus:ring-2"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', '--tw-ring-color': '#f0b429' } as any}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-red-400 text-xs mt-1 text-center">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>
              <button type="submit" disabled={login.isPending}
                className="w-full py-3.5 rounded-xl font-bold text-gray-900 flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#f0b429,#d49a0f)', boxShadow: '0 4px 20px rgba(240,180,41,0.3)' }}>
                {login.isPending && <Loader2 size={16} className="animate-spin" />}
                Verify & Enter
              </button>
              <button type="button" onClick={() => setStep('phone')}
                className="w-full text-sm text-gray-500 hover:text-gray-300 py-2 transition-colors">
                ← Change number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Dev mode: OTP printed in backend terminal
        </p>
      </div>
    </div>
  );
}
