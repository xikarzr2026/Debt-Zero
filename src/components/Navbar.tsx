'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import { SUPPORTED_CURRENCIES } from '@/types/debt';
import { APP_VERSION } from '@/lib/version';
import {
  Zap,
  ChevronDown,
  Settings2,
  Wand2,
  Wallet,
  Upload,
  Download,
  HelpCircle,
  Trash2,
  Check,
} from 'lucide-react';

interface NavbarProps {
  planLoaded: boolean;
  onStartSetup: () => void;
  onOpenCashFlow: () => void;
  onOpenHelp: () => void;
  onSavePlan: () => void;
  onLoadPlan: (file: File) => void;
  onClearData: () => void;
}

const menuItemClass =
  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none disabled:opacity-40 disabled:pointer-events-none';

export const Navbar: React.FC<NavbarProps> = ({
  planLoaded,
  onStartSetup,
  onOpenCashFlow,
  onOpenHelp,
  onSavePlan,
  onLoadPlan,
  onClearData,
}) => {
  const { profile, updateProfile } = useDebt();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const run = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-amber-200/80 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
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
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Debt payoff planner</p>
          </div>
        </div>

        {/* Settings: setup, budget, plan files, currency, help and reset in one place */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors text-slate-700 shadow-xs"
          >
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            data-testid="navbar-load-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onLoadPlan(file);
            }}
          />

          {menuOpen && (
            <div
              role="menu"
              aria-label="Settings"
              className="absolute right-0 mt-2 w-64 p-1.5 bg-white rounded-xl border border-amber-200 shadow-xl z-50"
            >
              <button type="button" role="menuitem" className={menuItemClass} onClick={() => run(onStartSetup)}>
                <Wand2 className="w-4 h-4 text-emerald-700" />
                <span>{planLoaded ? 'Guided setup…' : 'Start setup…'}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                disabled={!planLoaded}
                onClick={() => run(onOpenCashFlow)}
              >
                <Wallet className="w-4 h-4 text-emerald-700" />
                <span>Income & budget…</span>
              </button>

              <div className="my-1.5 h-px bg-amber-100" role="separator" />

              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => run(() => fileInputRef.current?.click())}
              >
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Load plan from file…</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                disabled={!planLoaded}
                onClick={() => run(onSavePlan)}
              >
                <Download className="w-4 h-4 text-sky-600" />
                <span>Save plan to file</span>
              </button>

              {planLoaded && (
                <>
                  <div className="my-1.5 h-px bg-amber-100" role="separator" />
                  <div className="px-2.5 pt-1 pb-1.5" role="radiogroup" aria-label="Currency">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Currency</div>
                    <div className="grid grid-cols-4 gap-1">
                      {Object.values(SUPPORTED_CURRENCIES).map((c) => {
                        const selected = profile.currency === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            title={c.label}
                            onClick={() => updateProfile({ currency: c.code })}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-bold border ${
                              selected
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                                : 'bg-white border-amber-200 text-slate-600 hover:bg-amber-50'
                            }`}
                          >
                            {c.code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="my-1.5 h-px bg-amber-100" role="separator" />

              <button type="button" role="menuitem" className={menuItemClass} onClick={() => run(onOpenHelp)}>
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>How calculations work</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClass} text-rose-700 hover:bg-rose-50 focus:bg-rose-50`}
                disabled={!planLoaded}
                onClick={() => run(onClearData)}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all data</span>
              </button>
              {planLoaded && (
                <p className="px-2.5 pt-1.5 pb-0.5 text-[10px] text-slate-400 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Saved automatically in this browser
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
