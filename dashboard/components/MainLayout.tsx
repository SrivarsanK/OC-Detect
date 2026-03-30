'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  History, 
  Microscope, 
  Globe, 
  ShieldCheck, 
  Plus,
  Bell, 
  Search, 
  Menu, 
  X,
  Terminal
} from 'lucide-react';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// 🔍 Utility: Responsive Size Detection
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
  };
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const size = useWindowSize();

  const navItems = [
    { label: 'Triage Stream', icon: LayoutDashboard, href: '/' },
    { label: 'Archive', icon: History, href: '/archive' },
    { label: 'AI Analytics', icon: Microscope, href: '/analytics' },
    { label: 'Node Settings', icon: Globe, href: '/settings' },
  ];

  return (
    <div className={cn(
      "flex bg-background text-foreground font-sans min-h-screen overflow-hidden",
      size.isMobile ? "flex-col" : "flex-row"
    )}>
      
      {/* 🚀 Dynamic Sidebar */}
      <AnimatePresence>
        {(size.isDesktop || sidebarOpen) && (
          <motion.aside 
            initial={size.isMobile ? { x: -300 } : { opacity: 0 }}
            animate={size.isMobile ? { x: 0 } : { opacity: 1 }}
            exit={size.isMobile ? { x: -300 } : { opacity: 0 }}
            className={cn(
              "border-r border-slate-900 bg-slate-950/50 backdrop-blur-3xl flex flex-col group/sidebar z-[100] transition-all",
              size.isMobile ? "fixed inset-y-0 left-0 w-72 shadow-2xl" : "h-screen shrink-0",
              size.isTablet && !size.isMobile ? "w-20" : "w-72"
            )}
          >
            {/* Logo */}
            <div className="px-6 py-8 mb-4 lg:mb-12 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20 flex-shrink-0">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                {(!size.isTablet || size.isMobile) && (
                  <div className="block overflow-hidden whitespace-nowrap">
                    <span className="text-xl font-outfit font-black tracking-tight text-white leading-none">OralGuard</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 block">Specialist Portal</span>
                  </div>
                )}
              </div>
              {size.isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-slate-500">
                  <X className="size-6" />
                </Button>
              )}
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
               {navItems.map((item) => {
                 const isActive = pathname === item.href;
                 return (
                   <Link key={item.href} href={item.href} onClick={() => size.isMobile && setSidebarOpen(false)}>
                     <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start gap-4 px-4 py-6 rounded-2xl font-outfit font-bold transition-all mb-1",
                        isActive 
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                      )}
                     >
                        <item.icon className={cn("size-6 shrink-0", isActive ? "text-cyan-400" : "text-slate-500")} />
                        {(!size.isTablet || size.isMobile) && <span>{item.label}</span>}
                     </Button>
                   </Link>
                 );
               })}
               
               <Separator className="my-4 bg-slate-900" />
               
               <Link href="/scan" onClick={() => size.isMobile && setSidebarOpen(false)}>
                 <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-4 px-4 py-6 rounded-2xl font-outfit font-bold transition-all",
                    pathname === '/scan'
                    ? "bg-white text-slate-950 shadow-xl"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                  )}
                 >
                    <Plus className={cn("size-6 shrink-0", pathname === '/scan' ? 'text-slate-950' : 'text-slate-500')} />
                    {(!size.isTablet || size.isMobile) && <span>New Scan</span>}
                 </Button>
               </Link>
            </nav>

            {/* User Profile */}
            <div className="px-4 py-8 space-y-4">
              <Separator className="my-4 bg-slate-900" />
              <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-[2rem] border border-slate-800">
                 <div className="w-10 h-10 bg-cyan-500/20 rounded-full border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black shrink-0 relative">
                   DS
                   <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                 </div>
                 {(!size.isTablet || size.isMobile) && (
                   <div className="flex-1 overflow-hidden font-outfit">
                      <p className="text-sm font-black truncate text-white leading-tight">Dr. Specialist</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest mt-0.5">Oncology</p>
                   </div>
                 )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 🖥️ Main Workspace Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Control Bar */}
        <header className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl px-6 lg:px-12 flex items-center justify-between z-10 shrink-0 gap-4">
          <div className="flex items-center gap-4">
            {size.isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-white">
                <Menu className="size-6" />
              </Button>
            )}
            <div className={cn(
              "flex items-center gap-4 bg-slate-900/40 px-5 py-2.5 rounded-[1.5rem] border border-slate-800/50 transition-all focus-within:border-cyan-500/50",
              size.isMobile ? "w-auto" : "w-[400px]"
            )}>
              <Search className="size-4 text-slate-500" />
              <input 
                type="text" 
                placeholder={size.isMobile ? "Scan ID..." : "Patient lookup ID..."}
                className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-200 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
             <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_emerald]"></span>
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Node Sync</p>
             </div>
             <div className="flex items-center gap-2 lg:gap-4 font-outfit">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white relative">
                   <Bell className="size-5" />
                   <span className="absolute top-0 right-0 size-2 bg-rose-500 rounded-full" />
                </Button>
                <div className="w-px h-6 bg-slate-800" />
                {children && <div id="page-controls" />}
             </div>
          </div>
        </header>

        {/* Dynamic Page Scroll Area */}
        <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>

        {/* 📟 Footer */}
        <footer className="h-12 border-t border-slate-900 bg-slate-950 px-6 lg:px-12 flex items-center justify-between text-[9px] lg:text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em] shrink-0">
           <div className="flex items-center gap-8">
              {!size.isMobile && (
                <>
                  <span className="flex items-center gap-2 text-cyan-600/50">
                    <Terminal className="size-3" /> PIPELINE: AUTO_2026
                  </span>
                  <Separator orientation="vertical" className="h-4 bg-slate-900" />
                  <span>PHC CLUSTER: K-1221</span>
                </>
              )}
           </div>
           <div className="flex items-center gap-4">
              <span>MODEL: MobileNetV2 (Edge Impulse)</span>
              <Separator orientation="vertical" className="h-4 bg-slate-900" />
              <div className="flex items-center gap-2">
                 <span>&copy; ORALGUARD</span>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}
