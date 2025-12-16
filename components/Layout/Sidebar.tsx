import React from 'react';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings, 
  LogOut, 
  Layers, 
  AlertTriangle,
  ClipboardList,
  Truck,
  Users,
  BarChart3,
  CreditCard,
  Map,
  Store,
  MessageSquare,
  Box,
  Calculator
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const { user, logout } = useAuthContext();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
    
    // Core Orders
    { name: 'Client Orders', path: '/admin/orders', icon: <ClipboardList size={20} /> },
    { name: 'Shop For Me', path: '/admin/shopping', icon: <ShoppingCart size={20} /> }, // Moved here

    // Operations
    { name: 'Warehouse Ops', path: '/admin/warehouse', icon: <Layers size={20} /> },
    { name: 'Inventory Control', path: '/admin/inventory', icon: <Box size={20} /> },
    { name: 'Freight (MAWB)', path: '/admin/freight', icon: <Truck size={20} /> },
    { name: 'Last Mile Delivery', path: '/admin/delivery', icon: <Map size={20} /> },
    
    // Commercial
    { name: 'Suppliers', path: '/admin/suppliers', icon: <Store size={20} /> },
    
    // CRM & Compliance
    { name: 'CRM / Clients', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Compliance', path: '/admin/compliance', icon: <AlertTriangle size={20} /> },
    { name: 'Support Tickets', path: '/admin/tickets', icon: <MessageSquare size={20} /> },

    // Finance
    { name: 'Invoices', path: '/admin/invoices', icon: <FileText size={20} /> },
    { name: 'Expenses', path: '/admin/expenses', icon: <CreditCard size={20} /> },
    { name: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
    
    // System
    { name: 'Reports', path: '/admin/reports', icon: <BarChart3 size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const clientLinks = [
    { name: 'Dashboard', path: '/client/dashboard', icon: <Home size={20} /> },
    { name: 'My Orders', path: '/client/orders', icon: <Package size={20} /> },
    { name: 'Assisted Shopping', path: '/client/shopping', icon: <ShoppingCart size={20} /> },
    { name: 'Rate Calculator', path: '/client/calculator', icon: <Calculator size={20} /> },
    { name: 'Invoices', path: '/client/invoices', icon: <FileText size={20} /> },
    { name: 'Tracking', path: '/client/tracking', icon: <Truck size={20} /> },
    { name: 'Support', path: '/client/support', icon: <MessageSquare size={20} /> },
    { name: 'Settings', path: '/client/settings', icon: <Settings size={20} /> },
  ];

  const isAdmin = user?.user_type === 'super_user' || user?.user_type === 'staff';
  const links = isAdmin ? adminLinks : clientLinks;

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col w-64 h-screen bg-slate-900 text-white border-r border-slate-800">
      <div className="flex items-center justify-center h-16 border-b border-slate-800 flex-shrink-0">
        <h1 className="text-xl font-black tracking-wider flex items-center">
          <span className="text-primary-400 mr-1">Shypt</span>
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="px-2 space-y-1">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                currentPath.startsWith(link.path)
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3 text-slate-400">{link.icon}</span>
              {link.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            {getInitials(user?.full_name)}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-md transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;