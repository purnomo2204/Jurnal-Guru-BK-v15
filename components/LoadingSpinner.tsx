import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Memproses..." }) => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-primary uppercase tracking-widest">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
