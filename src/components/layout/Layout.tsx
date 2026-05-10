import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, User, Utensils, Activity, Settings, 
  LogOut, ClipboardList, TrendingUp, MessageSquare
} from 'lucide-react';
import type { Profile } from '../../types';

interface LayoutProps {
  user: Profile | null;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isPatient = user?.role === 'patient';

  const navItems = isPatient ? [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Log Food', path: '/food-log', icon: Utensils },
    { label: 'Meal Plans', path: '/meal-plans', icon: ClipboardList },
    { label: 'Monitoring', path: '/monitoring', icon: Activity },
    { label: 'Settings', path: '/settings', icon: Settings },
  ] : [
    { label: 'Dashboard', path: '/dietitian/dashboard', icon: LayoutDashboard },
    { label: 'Notes', path: '/dietitian/notes', icon: MessageSquare },
    { label: 'Assign Plan', path: '/dietitian/assign', icon: ClipboardList },
    { label: 'Progress', path: '/dietitian/progress', icon: TrendingUp },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r fixed h-full">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="bg-green-600 p-1.5 rounded-lg">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold font-serif text-gray-900">HealthyPlate</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}