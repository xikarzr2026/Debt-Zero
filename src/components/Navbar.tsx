'use client';

import React, { useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import { PRESET_SCENARIOS } from '@/lib/presets';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/types/debt';
import {
  Zap,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  TrendingDown,
  ChevronDown,
  DollarSign,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  onOpenImportExport: () => void;
  onOpenCashFlow: () => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenImportExport,
  onOpenCashFlow,
  onOpenHelp,
}) => {
  const {
    theme,
    toggleTheme,
    profile,
    updateProfile,
    freeCashFlowData,
    formatCurrency,
    loadPreset,
    currentPresetId,
  } = useDebt();

  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                DebtZero
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Engine v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent Debt Elimination & Payoff Engine
            </p>
          </div>
        </div>

        {/* Middle: Free Cash Flow Status Pill */}
        <button
          onClick={onOpenCashFlow}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-[1.02] bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80"
          title="Click to manage Income & Expenses breakdown"
        >
          <span className="text-slate-500 dark:text-slate-400">Free Cash Flow:</span>
          <span
            className={`font-semibold ${
              freeCashFlowData.isDeficit
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatCurrency(freeCashFlowData.freeCashFlow)}/mo
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            Edit
          </span>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset Scenarios Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setPresetDropdownOpen(!presetDropdownOpen);
                setCurrencyDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-700 dark:text-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Presets</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {presetDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPresetDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50">
                  <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Load Demo Financial Profile
                  </div>
                  {PRESET_SCENARIOS.map((preset) => {
                    const isSelected = currentPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          loadPreset(preset.id);
                          setPresetDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{preset.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {preset.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setCurrencyDropdownOpen(!currencyDropdownOpen);
                setPresetDropdownOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-700 dark:text-slate-200"
            >
              <span className="font-semibold text-emerald-500">
                {SUPPORTED_CURRENCIES[profile.currency as CurrencyCode]?.symbol || '$'}
              </span>
              <span className="hidden sm:inline">{profile.currency}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {currencyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCurrencyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xl p-1 z-50">
                  {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        updateProfile({ currency: curr.code });
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        profile.currency === curr.code
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{curr.label}</span>
                      <span className="text-slate-400">{curr.symbol}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Data Backup / Import */}
          <button
            onClick={onOpenImportExport}
            className="p-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-600 dark:text-slate-300"
            title="Import / Export Data"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* How It Works Guide */}
          <button
            onClick={onOpenHelp}
            className="p-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-600 dark:text-slate-300"
            title="Financial Engine Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-600 dark:text-slate-300"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
