import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Eye, 
  Package, 
  Receipt, 
  Settings, 
  LogOut, 
  HelpCircle,
  Menu,
  Plus,
  Store,
  Scan,
  Bell,
  UserCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  key?: string | number;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl group",
      active 
        ? "bg-[#3856c4] text-white shadow-lg shadow-[#3856c4]/20 scale-95" 
        : "text-gray-400 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-gray-400 group-hover:text-white")} />
    <span>{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, userProfile, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'prescriptions', label: 'Prescriptions', icon: Eye },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f7f9fb] font-sans text-[#2c3437] overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#0b0f10] transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col p-4",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-10 px-2">
          <h1 className="text-xl font-black tracking-tight text-white uppercase">FOCUSHUB</h1>
          <p className="text-gray-500 text-[10px] tracking-widest mt-1 uppercase">VISION MANAGEMENT</p>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 space-y-1">
          <button 
            onClick={() => setActiveTab('sales')}
            className="w-full bg-gradient-to-r from-[#3856c4] to-[#6d89fa] text-white py-3 px-4 rounded-xl font-bold mb-6 flex items-center justify-center gap-2 shadow-lg shadow-[#3856c4]/20 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>

          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
              ) : (
                userProfile?.displayName?.charAt(0) || 'U'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-xs truncate">{userProfile?.displayName || 'Arjun Mehta'}</p>
              <p className="text-gray-500 text-[10px] truncate uppercase tracking-wider">{userProfile?.role === 'admin' ? 'FocusHub Admin' : 'Staff'}</p>
            </div>
          </div>

          <button className="flex items-center w-full gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
            <HelpCircle className="w-5 h-5" />
            <span>Support</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center w-full gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-[#f7f9fb]/80 backdrop-blur-xl flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-black"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-[#2c3437] text-xl font-bold capitalize">
              {activeTab === 'dashboard' ? 'Dashboard Overview' : 
               activeTab === 'customers' ? 'Customer Registry' : 
               activeTab === 'sales' ? 'Register New Customer' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <LayoutDashboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                className="bg-[#eaeff2] border-none rounded-full py-2 pl-10 pr-4 text-sm w-80 focus:ring-2 focus:ring-[#3856c4]/20 transition-all" 
                placeholder="Search clients, orders, or prescriptions..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="hover:bg-[#3856c4]/5 rounded-full p-2 transition-colors relative">
                <Bell className="w-5 h-5 text-[#2c3437]" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="hover:bg-[#3856c4]/5 rounded-full p-2 transition-colors">
                <UserCircle className="w-5 h-5 text-[#2c3437]" />
              </button>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Floating Action Button */}
        {activeTab === 'dashboard' && (
          <div className="fixed bottom-8 right-8 z-50">
            <button 
              onClick={() => setActiveTab('sales')}
              className="w-14 h-14 rounded-full bg-[#3856c4] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
