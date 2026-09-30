'use client';

import React, { useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import { PRESET_SCENARIOS } from '@/lib/presets';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/types/debt';
import {
  Zap,
  Sun,
  Download,
  Sparkles,
  ChevronDown,
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
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-amber-200/80 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-amber-500 p-[1.5px] shadow-md shadow-emerald-700/15 flex items-center justify-center">
            <div className="w-full h-full bg-amber-50 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-700 fill-emerald-700" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Debt<span className="text-emerald-700">Zero</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Prairie Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Intelligent Debt Elimination & Payoff Engine
            </p>
          </div>
        </div>

        {/* Middle: Free Cash Flow Status Pill */}
        <button
          onClick={onOpenCashFlow}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-[1.02] bg-amber-50/90 border-amber-200/90 shadow-xs"
          title="Click to manage Income & Expenses breakdown"
        >
          <span className="text-slate-600">Free Cash Flow:</span>
          <span
            className={`font-bold ${
              freeCashFlowData.isDeficit
                ? 'text-rose-700'
                : 'text-emerald-700'
            }`}
          >
            {formatCurrency(freeCashFlowData.freeCashFlow)}/mo
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-semibold">
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors text-slate-700 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Presets</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {presetDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPresetDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-amber-200 bg-white shadow-xl p-2 z-50">
                  <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
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
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                            : 'hover:bg-amber-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{preset.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
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
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors text-slate-700 shadow-xs"
            >
              <span className="font-bold text-emerald-700">
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
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-amber-200 bg-white shadow-xl p-1 z-50">
                  {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        updateProfile({ currency: curr.code });
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        profile.currency === curr.code
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'hover:bg-amber-50 text-slate-700'
                      }`}
                    >
                      <span>{curr.label}</span>
                      <span className="text-amber-800 font-bold">{curr.symbol}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Data Backup / Import */}
          <button
            onClick={onOpenImportExport}
            className="p-2 text-xs font-medium rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors text-slate-700 shadow-xs"
            title="Import / Export Data"
          >
            <Download className="w-4 h-4 text-emerald-700" />
          </button>

          {/* How It Works Guide */}
          <button
            onClick={onOpenHelp}
            className="p-2 text-xs font-medium rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors text-slate-700 shadow-xs"
            title="Financial Engine Guide"
          >
            <HelpCircle className="w-4 h-4 text-amber-700" />
          </button>

          {/* Theme Indicator (Sun for Prairie Daylight) */}
          <div
            className="p-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 shadow-xs"
            title="Prairie Daylight Theme Active"
          >
            <Sun className="w-4 h-4 text-amber-600 fill-amber-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
