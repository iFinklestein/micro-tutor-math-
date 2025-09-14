
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Settings, BrainCircuit } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [buildDate, setBuildDate] = useState('');

  useEffect(() => {
    // NUCLEAR DARK LOCK - Force dark theme immediately and permanently
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.body.style.background = '#0f172a';
    document.body.style.color = '#f9fafb';

    // Prevent any theme switching
    localStorage.setItem('theme', 'dark');
    
    // Override any system preferences
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Always stay dark regardless of system preference
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    };
    mediaQuery.addEventListener('change', handleChange);

    // Set build date with cache buster
    const date = new Date();
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const buildId = Math.random().toString(36).substr(2, 9);
    setBuildDate(`${localDate.toISOString().slice(0, 19).replace('T', ' ')} [${buildId}]`);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0f172a', color: '#f9fafb' }}>
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur" style={{ background: 'rgba(17, 24, 39, 0.8)', borderColor: '#374151' }}>
        <div className="container flex h-14 items-center max-w-screen-2xl mx-auto px-4 md:px-8">
          <Link to={createPageUrl("Dashboard")} className="mr-6 flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6" style={{ color: '#60a5fa' }} />
            <span className="font-bold" style={{ color: '#f9fafb' }}>Micro Tutor</span>
          </Link>
          <div className="flex flex-1 items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("Settings"))}
              style={{ color: '#f9fafb' }}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="pb-16">{children}</main>
      <Toaster />
      <footer className="fixed bottom-0 left-0 right-0 p-2 text-center text-xs border-t" style={{ background: '#111827', borderColor: '#374151', color: '#9ca3af' }}>
        DARK LOCKED | Build: {buildDate}
      </footer>
    </div>
  );
}
