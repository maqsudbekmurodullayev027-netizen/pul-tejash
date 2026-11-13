import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Delete,
  Eye,
  EyeOff,
  Lock,
  Pause,
  Play,
  ShieldCheck,
  UserPlus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CurrencyMode, UserProfile } from '../types/finance';

interface LoginScreenProps {
  profile: UserProfile;
  currency: CurrencyMode;
  onUnlock: () => void;
  onCompleteRegistration: (data: {
    fullName: string;
    email: string;
    role: string;
    pinCode: string;
    currency: CurrencyMode;
  }) => void;
  onResetPinToDefault: () => void;
}

const PROMO_VIDEO_SRC = '/assets/aistudio/moneymind_reels_cinema_final_adc09f72.mp4';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  profile,
  currency,
  onUnlock,
  onCompleteRegistration,
  onResetPinToDefault,
}) => {
  const [authMode, setAuthMode] = useState<'pin' | 'full'>(
    profile.isRegistered ? 'pin' : 'full'
  );

  // PIN login state
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  // Full registration / first-time login state
  const [fullName, setFullName] = useState(
    profile.isRegistered ? '' : profile.fullName
  );
  const [email, setEmail] = useState(
    profile.isRegistered ? '' : profile.email
  );
  const [role, setRole] = useState(profile.isRegistered ? '' : profile.role);
  const [newPin, setNewPin] = useState('');
  const [selectedCurrency, setSelectedCurrency] =
    useState<CurrencyMode>(currency);
  const [showNewPin, setShowNewPin] = useState(false);
  const [regError, setRegError] = useState('');

  // Video player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setAuthMode(profile.isRegistered ? 'pin' : 'full');
  }, [profile.isRegistered]);

  const attemptPinLogin = (candidate: string) => {
    if (candidate === profile.pinCode) {
      setPinError('');
      onUnlock();
    } else {
      setPinError('Kirish kodi noto\'g\'ri. Qayta urinib ko\'ring.');
      setPin('');
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setPinError('');
    if (next.length === 4) {
      setTimeout(() => attemptPinLogin(next), 120);
    }
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setPinError('');
  };

  useEffect(() => {
    if (authMode !== 'pin') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && pin.length === 4) {
        attemptPinLogin(pin);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [authMode, pin, profile.pinCode]);

  const handleFullSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setRegError('Iltimos, ism-familiyangizni kiriting.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setRegError('To\'g\'ri elektron pochta manzilini kiriting.');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setRegError('Keyingi kirishlar uchun aniq 4 ta raqamli kod yarating.');
      return;
    }
    setRegError('');
    onCompleteRegistration({
      fullName: fullName.trim(),
      email: email.trim(),
      role: role.trim() || 'Smart Finance foydalanuvchisi',
      pinCode: newPin,
      currency: selectedCurrency,
    });
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const initials = profile.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="grid w-full max-w-5xl items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
        {/* Left Column: MoneyMind Cinema Video Showcase */}
        <div className="flex flex-col justify-between bg-slate-950 p-6 text-white lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-display text-base font-extrabold tracking-tight">
                MoneyMind
              </span>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Platforma taqdimoti
            </span>
          </div>

          {/* 9:16 Vertical Video Frame */}
          <div className="relative mx-auto my-5 aspect-[9/16] w-full max-w-[270px] overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
            <video
              ref={videoRef}
              src={PROMO_VIDEO_SRC}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="h-full w-full object-cover"
            />

            {/* Video Overlay Controls */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3.5 pb-3.5 pt-8">
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-xs transition-colors hover:bg-white/25"
                aria-label={isPlaying ? 'To\'xtatish' : 'Ijro etish'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pauza</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Ijro</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-xs transition-colors hover:bg-white/25"
                aria-label={isMuted ? 'Ovozni yoqish' : 'Ovozni o\'chirish'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Ovoz yoqish</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-teal-400" />
                    <span>Ovoz yoniq</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-xs leading-relaxed text-slate-400">
            Kirish jarayonida MoneyMind imkoniyatlarini qisqa videorolikda
            tomosha qilishingiz mumkin.
          </p>
        </div>

        {/* Right Column: Dual-Mode Auth (PIN Code vs Full Registration) */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-7">
          {/* Mode Switcher Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                authMode === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              Kod bilan kirish
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('full');
                setPinError('');
              }}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                authMode === 'full'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              To'liq ma'lumot bilan
            </button>
          </div>

          {authMode === 'pin' ? (
            <div>
              {/* Profile Card */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  {!avatarError && profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                      {initials || 'MM'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display truncate text-base font-bold text-slate-900 dark:text-white">
                      {profile.fullName}
                    </h2>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {profile.email} · {profile.role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Lock className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                    <span>4 xonali kirish kodini kiriting</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin((s) => !s)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {showPin ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Yashirish
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Ko'rsatish
                      </>
                    )}
                  </button>
                </div>

                {/* 4 PIN Boxes */}
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const char = pin[idx];
                    const isFilled = Boolean(char);
                    return (
                      <div
                        key={idx}
                        className={`font-mono-num flex h-13 items-center justify-center rounded-xl border text-lg font-bold transition-colors ${
                          pinError
                            ? 'border-red-400 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                            : isFilled
                            ? 'border-teal-600 bg-teal-50/50 text-slate-900 dark:border-teal-500 dark:bg-teal-950/30 dark:text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950'
                        }`}
                      >
                        {isFilled ? (showPin ? char : '•') : ''}
                      </div>
                    );
                  })}
                </div>

                {pinError && (
                  <p className="mt-2.5 text-xs font-medium text-red-600 dark:text-red-400">
                    {pinError}
                  </p>
                )}

                {/* Numeric Keypad */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(
                    (digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleDigit(digit)}
                        className="font-mono-num flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-900 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                      >
                        {digit}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPin(profile.pinCode);
                      setTimeout(() => attemptPinLogin(profile.pinCode), 100);
                    }}
                    className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 dark:border-slate-800 dark:bg-slate-950 dark:text-teal-400 dark:hover:bg-teal-950/40"
                  >
                    Tez kirish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit('0')}
                    className="font-mono-num flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-900 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="O'chirish"
                  >
                    <Delete className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">
                    {profile.pinCode === '2026'
                      ? 'Standart kod: 2026'
                      : 'O\'rnatilgan maxfiy kod bilan kiring'}
                  </span>
                  <div className="flex items-center gap-3">
                    {profile.pinCode !== '2026' && (
                      <button
                        type="button"
                        onClick={() => {
                          onResetPinToDefault();
                          setPin('');
                          setPinError('');
                        }}
                        className="font-medium text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
                      >
                        Kodni 2026 ga tiklash
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => attemptPinLogin(pin)}
                      disabled={pin.length !== 4}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-40 dark:bg-teal-600"
                    >
                      <span>Kirish</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFullSubmit} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Hisob ma'lumotlari bilan kirish
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Agar birinchi marta kirayotgan bo'lsangiz, ma'lumotlaringizni va
                  4 xonali PIN kodni kiriting — keyingi safar faqat kod bilan
                  kirasiz.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ism-familiya
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Azizbek Karimov"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Lavozim / Yo'nalish
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Masalan: Dasturchi / Tadbirkor"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Elektron pochta
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ism@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      4 xonali kirish kodi yarating
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewPin((v) => !v)}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400"
                    >
                      {showNewPin ? 'Yashirish' : 'Ko\'rish'}
                    </button>
                  </div>
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="Masalan: 2026"
                    className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold tracking-widest text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Asosiy valyuta
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('UZS')}
                      className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                        selectedCurrency === 'UZS'
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      UZS (so'm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('USD')}
                      className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                        selectedCurrency === 'USD'
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>
              </div>

              {regError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {regError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMode('pin')}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
                >
                  Avval kirganmisiz? Kod bilan kirish
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
                >
                  <span>Saqlash va platformaga kirish</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
