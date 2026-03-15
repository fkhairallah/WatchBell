import React from 'react';
import { Coffee, X } from 'lucide-react';

const BMC_URL = 'https://www.buymeacoffee.com/fadyk';

interface Props {
  onClose: () => void;
}

export const SupportModal: React.FC<Props> = ({ onClose }) => {
  const handleSupport = () => {
    window.open(BMC_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <Coffee className="w-8 h-8 text-yellow-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Enjoying WatchMaker?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              I'm a solo dev building this in my spare time — no ads, no subscriptions.
              If WatchMaker has been useful on your watch, a coffee keeps the updates coming.
            </p>
          </div>

          <button
            onClick={handleSupport}
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold rounded-xl transition-colors"
          >
            <Coffee className="w-5 h-5" />
            <span>Buy me a coffee — $5</span>
          </button>

          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
