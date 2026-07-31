'use client';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] py-10 px-6">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo + tagline */}
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Damora AI"
            className="w-5 h-5 rounded object-cover"
          />
          <span className="text-sm font-semibold bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
            Damora AI
          </span>
          <span className="text-xs text-slate-600 ml-1">
            Private AI Workspace for Companies
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <a
            href="https://damora-api.onrender.com/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            API Docs (Swagger)
          </a>
          <a
            href="https://github.com/lavneetsh/Damora-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            GitHub
          </a>
          <span>© 2024 Lavneet Sharma</span>
        </div>
      </div>
    </footer>
  );
}
