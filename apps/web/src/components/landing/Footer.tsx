'use client';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 py-8 px-6 bg-[#09090F]/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-md">
            D
          </div>
          <span className="text-sm font-bold text-white">Damora AI</span>
          <span className="text-xs text-slate-400 font-mono ml-1">Private AI Workspace</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-300">
          <a
            href="https://damora-api.onrender.com/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            API Docs (Swagger)
          </a>
          <a
            href="https://github.com/lavneetsh/Damora-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <span className="text-slate-400 font-mono">© 2025 Lavneet Sharma</span>
        </div>
      </div>
    </footer>
  );
}
