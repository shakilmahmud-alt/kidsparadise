import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden">
      <div className="relative">
        {/* Animated Background Glow Blobs */}
        <div className="absolute -inset-10 bg-rose-100 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute -inset-8 bg-[#F0264C]/15 rounded-full blur-2xl opacity-40 animate-ping" style={{ animationDuration: '2.5s' }}></div>

        {/* Main Logo with Floating Animation */}
        <div className="relative flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
          <img 
            src="https://kidsparadise.com.bd/wp-content/uploads/2026/08/kp-logo-1.1.png" 
            alt="Kids Paradise" 
            width="180"
            height="72"
            fetchPriority="high"
            className="h-12 md:h-16 w-auto object-contain drop-shadow-sm" 
          />
          
          {/* Small floating sparkles */}
          <div className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5 text-gray-700 text-sm md:text-base font-bold tracking-tight">
          <Loader2 className="w-4 h-4 animate-spin text-[#F0264C]" />
          <span>Welcome to Kids Paradise...</span>
        </div>
      </div>

      {/* Loading Progress Bar at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100">
        <div className="h-full bg-gradient-to-r from-rose-400 to-[#F0264C] animate-progress"></div>
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
