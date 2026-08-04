import React from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden">
      <div className="relative">
        {/* Animated Background Blobs */}
        <div className="absolute -inset-10 bg-rose-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -inset-10 bg-[#e92c5d]/20 rounded-full blur-2xl opacity-40 animate-ping" style={{ animationDuration: '2s' }}></div>

        {/* Main Logo / Icon Container */}
        <div className="relative flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
          <img 
            src="https://ik.imagekit.io/vrtbi4wsn/store/zerobaby-logo_a9UGaRrto.png" 
            alt="Zero Baby" 
            width="160"
            height="64"
            fetchPriority="high"
            className="h-8 md:h-12 w-auto object-contain" 
          />
          
          {/* Small floating elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">

        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
          <span>Welcome to Zero Baby</span>
        </div>
      </div>

      {/* Loading Progress Bar at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
        <div className="h-full bg-gradient-to-r from-rose-400 to-[#e92c5d] animate-progress"></div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; opacity: 1; }
          50% { width: 70%; opacity: 0.8; }
          100% { width: 100%; opacity: 1; }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
