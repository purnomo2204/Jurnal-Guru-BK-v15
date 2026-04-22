import React from 'react';
import { Save, X, LogOut, Cloud, RotateCcw } from 'lucide-react';

interface FormActionsProps {
  onSaveLocal: () => void;
  onSaveOnline?: () => void;
  onCancel: () => void;
  onClose: () => void;
  isSaving?: boolean;
  saveLabel?: string;
}

const FormActions: React.FC<FormActionsProps> = ({ 
  onSaveLocal, 
  onSaveOnline,
  onCancel, 
  onClose, 
  isSaving, 
  saveLabel = "SIMPAN" 
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      {onSaveOnline && (
        <button 
          type="button"
          onClick={onSaveOnline}
          disabled={isSaving}
          className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-black text-[12px] uppercase tracking-[0.2em] shadow-sm shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Cloud className="w-3.5 h-3.5" /> {saveLabel} CLOUD
        </button>
      )}
      <button 
        type="button"
        onClick={onSaveLocal}
        disabled={isSaving}
        className="flex-1 min-w-[100px] bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-black text-[12px] uppercase tracking-[0.2em] shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <Save className="w-3.5 h-3.5" /> {saveLabel} PC
      </button>
      <button 
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="px-4 bg-white hover:bg-slate-50 text-slate-500 py-2.5 rounded-lg font-black text-[12px] uppercase tracking-[0.2em] shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border border-slate-200 disabled:opacity-50"
      >
        <RotateCcw className="w-3.5 h-3.5" /> BATAL
      </button>
      <button 
        type="button"
        onClick={onClose}
        disabled={isSaving}
        className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-lg font-black text-[12px] uppercase tracking-[0.2em] shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border border-rose-100 disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" /> TUTUP
      </button>
    </div>
  );
};

export default FormActions;
