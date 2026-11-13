import React, { useRef, useState } from 'react';
import {
  Bell,
  Camera,
  Check,
  Download,
  FileJson,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  RotateCcw,
  Shield,
  Sun,
  Upload,
  User,
} from 'lucide-react';
import { CurrencyMode, UserProfile } from '../types/finance';

interface SettingsViewProps {
  profile: UserProfile;
  currency: CurrencyMode;
  isDark: boolean;
  onUpdateProfile: (next: UserProfile) => void;
  onCurrencyChange: (c: CurrencyMode) => void;
  onToggleTheme: () => void;
  onLockApp: () => void;
  onSignOut: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onResetDemoData: () => void;
  onNotify: (title: string, message: string) => void;
}

const DEFAULT_AVATAR = '/src/assets/images/avatar_user_profile_1794566864752.jpg';

const AVATAR_THEMES = [
  {
    label: 'Asosiy portret',
    url: DEFAULT_AVATAR,
  },
  {
    label: 'Zumrad monogramma',
    url: '',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  currency,
  isDark,
  onUpdateProfile,
  onCurrencyChange,
  onToggleTheme,
  onLockApp,
  onSignOut,
  onExportJSON,
  onExportCSV,
  onResetDemoData,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullName, setFullName] = useState(profile.fullName);
  const [role, setRole] = useState(profile.role);
  const [email, setEmail] = useState(profile.email);
  const [newPin, setNewPin] = useState(profile.pinCode);
  const [confirmPin, setConfirmPin] = useState(profile.pinCode);
  const [pinError, setPinError] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      fullName: fullName.trim() || 'Shaxsiy hisob',
      role: role.trim() || 'Smart Finance foydalanuvchisi',
      email: email.trim() || 'user@moneymind.uz',
    });
    onNotify(
      'Profil saqlandi',
      'Shaxsiy ma\'lumotlaringiz muvaffaqiyatli yangilandi.'
    );
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onNotify(
        'Rasm hajmi katta',
        'Iltimos, hajmi 2 MB dan kichik rasm tanlang.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarError(false);
        onUpdateProfile({
          ...profile,
          avatarUrl: reader.result,
        });
        onNotify(
          'Profil rasmi yangilandi',
          'Yangi suratingiz barcha panellarga qo\'llandi.'
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('Kod aniq 4 ta raqamdan iborat bo\'lishi kerak.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Kiritilgan kodlar bir-biriga mos kelmadi.');
      return;
    }
    setPinError('');
    onUpdateProfile({
      ...profile,
      pinCode: newPin,
      pinEnabled: true,
    });
    onNotify(
      'Kirish kodi o\'rnatildi',
      'Yangi 4 xonali xavfsizlik kodingiz saqlandi va faollashtirildi.'
    );
  };

  const initials = profile.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Parametrlar va xavfsizlik
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Profil rasmi, login kodi, bildirishnomalar va tizim sozlamalarini boshqarish
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onLockApp}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Lock className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            Qulflash (Kod bilan)
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40 whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" />
            Hisobdan chiqish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile & Photo Upload Card */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <User className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Shaxsiy profil va rasm
            </h2>
          </div>

          {/* Avatar Manager */}
          <div className="mt-5 flex flex-wrap items-center gap-5">
            {!avatarError && profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xl font-bold text-white">
                {initials || 'MM'}
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Yangi rasm yuklash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarError(false);
                    onUpdateProfile({
                      ...profile,
                      avatarUrl: AVATAR_THEMES[0].url,
                    });
                    onNotify('Rasm tiklandi', 'Standart profil rasmi tanlandi.');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Standart rasm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({
                      ...profile,
                      avatarUrl: AVATAR_THEMES[1].url,
                    });
                    onNotify('Avatar o\'zgartirildi', 'Monogramma avatari tanlandi.');
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  Monogramma ({initials || 'MM'})
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                JPG, PNG yoki WebP (maksimal 2 MB). Rasm qurilmangizda saqlanadi.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ism-familiya
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
              >
                <Check className="h-3.5 w-3.5" />
                Profilni saqlash
              </button>
            </div>
          </form>
        </section>

        {/* Security & PIN Code Card */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Shield className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Kirish kodi va Login himoyasi
            </h2>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="text-xs">
              <p className="font-semibold text-slate-900 dark:text-white">
                Ilova ochilganda Login so'rash
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                Yoqilgan bo'lsa, kirishda 4 xonali PIN kod talab qilinadi
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profile.pinEnabled}
              onClick={() => {
                const next = !profile.pinEnabled;
                onUpdateProfile({ ...profile, pinEnabled: next });
                onNotify(
                  next ? 'Kirish himoyasi yoqildi' : 'Kirish himoyasi o\'chirildi',
                  next
                    ? 'Keyingi kirishda 4 xonali kod so\'raladi.'
                    : 'Ilovaga kodsiz kirish yoqildi.'
                );
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                profile.pinEnabled
                  ? 'bg-teal-700 dark:bg-teal-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profile.pinEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <form onSubmit={handleSavePin} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Yangi 4 xonali kod
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="2026"
                  className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-center text-sm font-bold tracking-widest text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Kodni tasdiqlang
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="2026"
                  className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-center text-sm font-bold tracking-widest text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {pinError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {pinError}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Kodni saqlash
              </button>

              <button
                type="button"
                onClick={onLockApp}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <Lock className="h-3.5 w-3.5" />
                Sinab ko'rish
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Preferences, Alerts & Data Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Notifications & Display */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Bell className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Interfeys va aqlli ogohlantirishlar
            </h2>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {/* Currency */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Asosiy ko'rsatish valyutasi
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Barcha grafik va hisob-kitoblarda valyuta birligini tanlang
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onCurrencyChange('UZS')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    currency === 'UZS'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  UZS (so'm)
                </button>
                <button
                  type="button"
                  onClick={() => onCurrencyChange('USD')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    currency === 'USD'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Mavzu ko'rinishi
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Yorug' kunduzgi yoki qorong'i tungi interfeys
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    Yorug' rejimga o'tish
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-slate-600" />
                    Qorong'i rejimga o'tish
                  </>
                )}
              </button>
            </div>

            {/* Toggle 1: 5-tier Spending Guard */}
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  5 bosqichli xarajat nazorati ogohlantirishi
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  «Ko'p» yoki «Juda ko'p» darajasiga yetganda darhol ogohlantirish yuborish
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profile.spendingGuardEnabled}
                onClick={() =>
                  onUpdateProfile({
                    ...profile,
                    spendingGuardEnabled: !profile.spendingGuardEnabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  profile.spendingGuardEnabled
                    ? 'bg-teal-700 dark:bg-teal-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.spendingGuardEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Budget Alerts */}
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Byudjet limiti ogohlantirishlari
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Kategoriya limiti 80% dan oshganda bildirishnoma chiqarish
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profile.budgetAlertsEnabled}
                onClick={() =>
                  onUpdateProfile({
                    ...profile,
                    budgetAlertsEnabled: !profile.budgetAlertsEnabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  profile.budgetAlertsEnabled
                    ? 'bg-teal-700 dark:bg-teal-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.budgetAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Goal Guard */}
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Jamg'arma himoyasi eslatmalari
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Maqsaddan pul yechishda tejamkorlik haqida ogohlantirish oynasini chiqarish
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profile.goalGuardEnabled}
                onClick={() =>
                  onUpdateProfile({
                    ...profile,
                    goalGuardEnabled: !profile.goalGuardEnabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  profile.goalGuardEnabled
                    ? 'bg-teal-700 dark:bg-teal-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.goalGuardEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Data Backup & Reset */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <FileJson className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Ma'lumotlar va zaxira nusxa
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={onExportJSON}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  To'liq zaxira nusxani yuklab olish (JSON)
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Barcha operatsiyalar, byudjet va maqsadlar
                </p>
              </div>
              <FileJson className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
            </button>

            <button
              type="button"
              onClick={onExportCSV}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Tranzaksiyalarni Excel / CSV formatida eksport
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Kirim, chiqim va o'tkazmalar jadvali
                </p>
              </div>
              <Download className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300" />
            </button>

            <button
              type="button"
              onClick={onResetDemoData}
              className="flex w-full items-center justify-between rounded-lg border border-red-200 bg-red-50/40 px-4 py-3 text-left text-xs transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 dark:hover:bg-red-950/40"
            >
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">
                  Boshlang'ich namuna ma'lumotlariga qaytarish
                </p>
                <p className="mt-0.5 text-red-600/80 dark:text-red-400/80">
                  Barcha o'zgarishlarni tozalab, demo ma'lumotlarni tiklaydi
                </p>
              </div>
              <RotateCcw className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
