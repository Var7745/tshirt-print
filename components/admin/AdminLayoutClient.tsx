'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  Printer,
  Factory,
  Package,
  Users,
  CreditCard,
  Truck,
  TicketPercent,
  FileText,
  MessageSquare,
  Star,
  BarChart3,
  Bell,
  ShieldAlert,
  Settings,
  Search,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin';
  avatar_url?: string;
  phone?: string;
}

interface AdminContextType {
  user: AdminUser;
  setUser: (u: AdminUser) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminLayoutClient');
  return ctx;
};

const DEFAULT_USER: AdminUser = {
  id: 'usr_superadmin',
  name: 'JK Empress Admin',
  email: 'admin@jkempress.com',
  role: 'Admin',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  phone: '+91 98490 12345'
};

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: any;
    badge?: string;
    roles?: string[];
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'CORE OPERATIONS',
    items: [
      { label: 'Overview Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Order Management', href: '/admin/orders', icon: ShoppingBag, badge: 'Live' },
      { label: 'Print Files Center', href: '/admin/print-files', icon: Printer },
    ]
  },
  {
    title: 'COMMERCE & CLIENTS',
    items: [
      { label: 'Products & Pricing', href: '/admin/products', icon: Layers },
      { label: 'Customer Directory', href: '/admin/customers', icon: Users },
      { label: 'Finance & Payments', href: '/admin/finance', icon: CreditCard },
    ]
  },
  {
    title: 'CONTENT & LEADS',
    items: [
      { label: 'Website CMS', href: '/admin/content', icon: FileText },
      { label: 'College Enquiries', href: '/admin/enquiries', icon: MessageSquare },
      { label: 'Customer Reviews', href: '/admin/reviews', icon: Star },
    ]
  },
  {
    title: 'SYSTEM & GOVERNANCE',
    items: [
      { label: 'Business Reports', href: '/admin/reports', icon: BarChart3 },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Business Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AdminUser>(DEFAULT_USER);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(3);

  // Is this the login page? If so, render without admin layout shell
  const isLoginPage = pathname === '/admin/login';

  // Load user from localStorage if available
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('jkempress_admin_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      const savedTheme = localStorage.getItem('jkempress_admin_theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('jkempress_admin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('jkempress_admin_theme', 'light');
    }
  }, [darkMode]);

  // Fetch notifications
  useEffect(() => {
    if (!isLoginPage) {
      fetch('/api/admin/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotifications(data.data || []);
            setUnreadCount(data.unreadCount || 0);
          }
        })
        .catch(() => {});
    }
  }, [pathname, isLoginPage]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (e) {}
    try {
      localStorage.removeItem('jkempress_admin_user');
      document.cookie = 'jkempress_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    } catch (e) {}
    router.push('/admin/login');
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {}
  };

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Admin has access to all modules
  const isItemAllowed = (_itemRoles?: string[]) => {
    return true;
  };

  return (
    <AdminContext.Provider value={{ user, setUser, darkMode, toggleDarkMode }}>
      <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900'} flex flex-col font-sans transition-colors duration-200`}>
        
        {/* Top Header */}
        <header className={`sticky top-0 z-40 border-b ${darkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-slate-200'} backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-rose-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                JK
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black tracking-tight text-base sm:text-lg">JK EMPRESS</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">ADMIN</span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium -mt-0.5">Enterprise Management Suite</p>
              </div>
            </Link>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl border transition-all ${
                darkMode
                  ? 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  : 'bg-slate-100/80 border-slate-200 text-zinc-500 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <span>Search orders, colleges, t-shirt serials...</span>
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">Ctrl K</kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            
            {/* Admin Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'bg-slate-100 border-slate-200 text-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Admin</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg border text-zinc-600 dark:text-zinc-300 transition-colors ${
                darkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-lg border text-zinc-600 dark:text-zinc-300 transition-colors ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {notifOpen && (
                <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border p-4 z-50 ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-zinc-900'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 my-2">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-zinc-400">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div key={n.id} className={`py-2.5 text-xs ${!n.is_read ? 'font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{n.title}</span>
                            <span className="text-[10px] text-zinc-400 shrink-0">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-center">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      View all notification logs <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Public Store Link */}
            <Link
              href="/"
              target="_blank"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-colors ${
                darkMode ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
              title="Open Customer Website"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-orange-500/50 shadow-sm"
              />
              <button
                onClick={handleLogout}
                className="p-1.5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>

        {/* Main Body with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar */}
          <aside className={`
            fixed inset-y-0 left-0 z-30 w-64 pt-16 lg:pt-0 transform transition-transform duration-200 ease-in-out
            lg:static lg:translate-x-0 border-r flex flex-col justify-between
            ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-zinc-700'}
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            
            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {NAV_SECTIONS.map((section, sidx) => {
                const visibleItems = section.items.filter(item => isItemAllowed(item.roles));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={sidx} className="space-y-1">
                    <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20'
                                : darkMode
                                  ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                                  : 'hover:bg-slate-100 text-zinc-700 hover:text-zinc-950'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                              <span>{item.label}</span>
                            </span>
                            {item.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Bottom Footer Info */}
            <div className={`p-3 border-t text-[11px] ${darkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span>System v2.4</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  SQLite WAL Active
                </span>
              </div>
            </div>
          </aside>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>

        {/* Global Search Dialog Modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className={`w-full max-w-xl rounded-2xl shadow-2xl border p-4 ${
              darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-zinc-900'
            }`}>
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <Search className="w-5 h-5 text-orange-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type an Order ID (e.g. JK-2026-0001), College, or Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      router.push(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchOpen(false);
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-400"
                />
                <button onClick={() => setSearchOpen(false)} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-2 text-xs">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Quick Navigation</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { router.push('/admin/orders'); setSearchOpen(false); }}
                    className="p-2.5 rounded-xl border text-left hover:border-orange-500 flex items-center justify-between"
                  >
                    <span>Browse All Orders</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  <button
                    onClick={() => { router.push('/admin/print-files'); setSearchOpen(false); }}
                    className="p-2.5 rounded-xl border text-left hover:border-orange-500 flex items-center justify-between"
                  >
                    <span>Print Files Center</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  <button
                    onClick={() => { router.push('/admin/customers'); setSearchOpen(false); }}
                    className="p-2.5 rounded-xl border text-left hover:border-orange-500 flex items-center justify-between"
                  >
                    <span>Customer Directory</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  <button
                    onClick={() => { router.push('/admin/finance'); setSearchOpen(false); }}
                    className="p-2.5 rounded-xl border text-left hover:border-orange-500 flex items-center justify-between"
                  >
                    <span>Revenue & Payments</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminContext.Provider>
  );
}
