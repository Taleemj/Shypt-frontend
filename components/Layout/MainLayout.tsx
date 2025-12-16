import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { Bell } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPath, onNavigate }) => {
  const { user } = useAuthContext();
  
  useEffect(() => {
    const handleNav = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
            onNavigate(customEvent.detail);
        }
    };
    window.addEventListener('app-navigate', handleNav);
    return () => window.removeEventListener('app-navigate', handleNav);
  }, [onNavigate]);

  const isAdmin = user?.user_type === 'super_user' || user?.user_type === 'staff';

  const handleProfileClick = () => {
      const profilePath = isAdmin ? '/admin/profile' : '/client/profile';
      onNavigate(profilePath);
  };

  const handleBellClick = () => {
      if (isAdmin) {
          onNavigate('/admin/notifications');
      } else {
          onNavigate('/client/notifications');
      }
  };
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Hide Sidebar when printing */}
      <div className="print:hidden h-full">
        <Sidebar 
          currentPath={currentPath}
          onNavigate={onNavigate}
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Hide on Print */}
        <header className="bg-white shadow-sm h-16 border-b border-slate-200 flex items-center justify-between px-8 print:hidden">
           <h2 className="text-lg font-semibold text-slate-700 capitalize">
             {currentPath.split('/').pop()?.replace(/-/g, ' ')}
           </h2>
           <div className="flex items-center space-x-6">
              {/* Notification Bell */}
              <button 
                onClick={handleBellClick}
                className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition group"
                title="Notifications"
              >
                <Bell size={20} className="group-hover:text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>

              {/* User Profile */}
              <div 
                className="flex items-center space-x-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition"
                onClick={handleProfileClick}
              >
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.user_type.replace('_', ' ')}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary-700">
                      {getInitials(user?.full_name)}
                  </div>
              </div>
           </div>
        </header>

        {/* Main Content - Reset padding/overflow for print */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;