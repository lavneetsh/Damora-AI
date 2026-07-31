'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Damora AI Logo"
            className="w-7 h-7 rounded-lg object-cover transition-shadow group-hover:shadow-[0_0_12px_rgba(108,59,250,0.4)]"
          />
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
            Damora AI
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          {[
            { label: 'How It Works', href: '#rag-pipeline' },
            { label: 'Architecture', href: '#architecture' },
            { label: 'Demo', href: '#demo' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm text-slate-400 hover:text-white transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] rounded-xl px-4 py-2 hover:shadow-[0_0_20px_rgba(108,59,250,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
