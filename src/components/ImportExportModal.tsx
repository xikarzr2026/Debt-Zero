'use client';

import React, { useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  FileCode,
  AlertCircle,
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { exportDataJSON, importDataJSON, loadPreset } = useDebt();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(
    null
  );

  if (!isOpen) return null;

  const jsonString = exportDataJSON();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debtzero-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Data Management & Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export your setup or restore across devices.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Callout */}
        <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span>
            <strong>100% Privacy First:</strong> Your financial data is saved only in your local browser storage. No cloud accounts or sensitive banking credentials required.
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Export Backup (JSON)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Import Backup
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-3">
            <textarea
              readOnly
              value={jsonString}
              rows={8}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 focus:outline-none select-all"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download .JSON File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported DebtZero JSON backup here..."
              rows={8}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                {importStatus.success ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Restore Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
