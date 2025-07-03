import React from "react";

function Footer() {
  return (
    <footer className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 mt-auto">
      {/* Subtle glow effect at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Copyright Section */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-slate-400 text-sm font-medium">
              © 2025 Smart Cache
            </span>
            <span className="text-slate-600 text-sm">|</span>
            <span className="text-slate-500 text-sm">
              All rights reserved
            </span>
          </div>

          {/* Additional Links or Info */}
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Status: Operational</span>
            </div>

            <div className="text-slate-600 text-xs">
              Built with ❤️ for Web3
            </div>
          </div>
        </div>

        {/* Powered by section */}
        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <div className="text-center">
            <span className="text-slate-600 text-xs">
              Powered by Arbitrum • Built for the future of caching
            </span>
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-slate-500/5 pointer-events-none"></div>
    </footer>
  );
}

export default Footer;
