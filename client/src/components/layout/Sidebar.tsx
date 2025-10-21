import { Link, useLocation } from 'wouter';
import { 
  Home, 
  LayoutDashboard, 
  Video, 
  UserSearch, 
  Scan, 
  Dumbbell, 
  FileText, 
  Bot, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  testId: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Home', icon: <Home className="h-5 w-5" />, path: ROUTES.HOME, testId: 'nav-home' },
  { label: 'My Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: ROUTES.DASHBOARD, testId: 'nav-dashboard' },
  { label: 'Instant Consultation', icon: <Video className="h-5 w-5" />, path: ROUTES.INSTANT_CONSULTATION, testId: 'nav-consultation' },
  { label: 'Find a Doctor', icon: <UserSearch className="h-5 w-5" />, path: ROUTES.FIND_DOCTOR, testId: 'nav-doctors' },
  { label: 'Food Scanner', icon: <Scan className="h-5 w-5" />, path: ROUTES.FOOD_SCANNER, testId: 'nav-food-scanner' },
  { label: 'Tips & Exercises', icon: <Dumbbell className="h-5 w-5" />, path: ROUTES.TIPS_EXERCISES, testId: 'nav-tips' },
  { label: 'Medical Records', icon: <FileText className="h-5 w-5" />, path: ROUTES.MEDICAL_RECORDS, testId: 'nav-records' },
  { label: 'DiaBot (AI Chatbot)', icon: <Bot className="h-5 w-5" />, path: ROUTES.DIABOT, testId: 'nav-diabot' },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    setLocation(ROUTES.LOGIN);
  };

  return (
    <aside className={cn(
      "flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-900",
      className
    )}>
      {/* User Profile */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" alt={user?.username} />
            <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-medium text-teal-600 dark:text-teal-400" data-testid="text-user-profile-label">
              USER PROFILE
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white" data-testid="text-username">
              {user?.username || 'User321'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="mb-3 px-4">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">MAIN</p>
        </div>
        <nav className="space-y-1 px-2">
          {mainNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  data-testid={item.testId}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </a>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Settings Section */}
        <div className="mb-3 px-4">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">SETTINGS</p>
        </div>
        <nav className="space-y-1 px-2">
          <Link href={ROUTES.SETTINGS}>
            <a
              data-testid="nav-settings"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                location === ROUTES.SETTINGS
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
          </Link>
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 dark:text-gray-300"
          data-testid="button-help"
        >
          <HelpCircle className="mr-3 h-5 w-5" />
          Help
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 dark:text-red-400"
          onClick={handleLogout}
          data-testid="button-logout-sidebar"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout Account
        </Button>
      </div>
    </aside>
  );
}
