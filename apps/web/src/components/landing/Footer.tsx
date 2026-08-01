'use client';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#E2E0DC] py-8 px-6 bg-[#F3F2EF]">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-[#4F46E5] flex items-center justify-center text-white text-[10px] font-black">
            D
          </div>
          <span className="text-sm font-semibold text-[#374151]">Damora AI</span>
          <span className="text-xs text-[#9CA3AF] ml-1">Private AI Workspace</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#9CA3AF]">
          <a
            href="https://damora-api.onrender.com/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#374151] transition-colors"
          >
            API Docs (Swagger)
          </a>
          <a
            href="https://github.com/lavneetsh/Damora-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#374151] transition-colors"
          >
            GitHub
          </a>
          <span>© 2024 Lavneet Sharma</span>
        </div>
      </div>
    </footer>
  );
}
