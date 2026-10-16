'use client';

import React, { useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import { ModalShell } from './ModalShell';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { exportDataJSON, importDataJSON, clearAllData } = useDebt();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(
    null
  );

  if (!isOpen) return null;

  const jsonString = exportDataJSON();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false)
    );
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debtzero-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleClearAll = () => {
    if (!window.confirm('Delete all DebtZero data stored in this browser? This cannot be undone unless you exported first.')) {
      return;
    }
    clearAllData();
    onClose();
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    if (!window.confirm('Replace the current plan with this backup? This cannot be undone unless you exported first.')) {
      return;
    }
    const res = importDataJSON(importText);
    if (res.success) {
      setImportStatus({ success: true, message: 'Financial profile imported successfully!' });
      setTimeout(() => {
        onClose();
        setImportStatus(null);
      }, 1200);
    } else {
      setImportStatus({ success: false, message: res.error || 'Failed to parse JSON file' });
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Data Management & Backup">
        <div className="flex items-center justify-between pb-4 border-b border-amber-200">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Data Management & Backup
            </h3>
            <p className="text-xs text-slate-600">
              Export your setup or restore across devices.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Callout */}
        <div className="my-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs flex items-center gap-2.5 text-emerald-900 shadow-2xs">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-700" />
          <span>
            <strong>100% Privacy First:</strong> Your financial data is saved strictly in your local browser storage. No cloud tracking or sensitive banking credentials required.
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-amber-200 mb-4">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-emerald-700 text-emerald-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Export Backup (JSON)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-emerald-700 text-emerald-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Import Backup
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-3">
            <textarea
              aria-label="Exported backup JSON"
              readOnly
              value={jsonString}
              rows={8}
              className="w-full p-3 rounded-xl bg-amber-50/70 font-mono text-[11px] text-slate-800 border border-amber-200 focus:outline-none select-all shadow-2xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-50 text-xs font-bold text-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700 font-black" /> : <Copy className="w-4 h-4 text-amber-700" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download .JSON File</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-amber-200 text-xs">
              <span className="text-slate-600">Using a shared computer? Remove everything this app stored here.</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              aria-label="Backup JSON to import"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported DebtZero JSON backup here..."
              rows={8}
              className="w-full p-3 rounded-xl bg-amber-50/70 font-mono text-[11px] text-slate-800 border border-amber-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                    : 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                }`}
              >
                {importStatus.success ? (
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Restore Profile</span>
              </button>
            </div>
          </div>
        )}
    </ModalShell>
  );
};
