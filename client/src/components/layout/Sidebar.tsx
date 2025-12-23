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
  ChevronRight,
  ChevronDown,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  testId: string;
  roles?: ('customer' | 'admin' | 'physician')[];
  paymentTypes?: ('free' | 'monthly' | 'annual')[];
}

const mainNavItems: NavItem[] = [
  { label: 'Home', icon: <Home className="h-5 w-5" />, path: ROUTES.HOME, testId: 'nav-home' },
  { label: 'Instant Consultation', icon: <Video className="h-5 w-5" />, path: ROUTES.INSTANT_CONSULTATION, testId: 'nav-consultation' },
  { label: 'Find a Doctor', icon: <UserSearch className="h-5 w-5" />, path: ROUTES.FIND_DOCTOR, testId: 'nav-doctors' },
  { label: 'Consultations', icon: <Calendar className="h-5 w-5" />, path: ROUTES.CONSULTATIONS, testId: 'nav-consultations', roles: ['customer'], paymentTypes: ['monthly', 'annual'] },
  { label: 'Food Scanner', icon: <Scan className="h-5 w-5" />, path: ROUTES.FOOD_SCANNER, testId: 'nav-food-scanner' },
  { label: 'Tips & Exercises', icon: <Dumbbell className="h-5 w-5" />, path: ROUTES.TIPS_EXERCISES, testId: 'nav-tips' },
  { label: 'Medical Records', icon: <FileText className="h-5 w-5" />, path: ROUTES.MEDICAL_RECORDS, testId: 'nav-records' },
  { label: 'DiaBot (AI Chatbot)', icon: <Bot className="h-5 w-5" />, path: ROUTES.DIABOT, testId: 'nav-diabot' },
  { label: 'Health Plans', icon: <DollarSign className='h-5 w-5' />, path: ROUTES.HEALTH_PLANS, testId: 'nav-payments' },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);

  const isDashboardRoute = location === ROUTES.DASHBOARD || location === ROUTES.HEALTH_ASSESSMENT || location === ROUTES.HEALTH_METRICS_HISTORY;

  useEffect(() => {
    if (isDashboardRoute) {
      setIsDashboardExpanded(true);
    }
  }, [isDashboardRoute]);

  const handleLogout = () => {
    logout();
    setLocation(ROUTES.LOGIN, { replace: true });
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-mobile-menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Spacer for larger screens to prevent layout shift */}
      <div className="hidden lg:block w-64 flex-shrink-0" />

      <aside className={cn(
        "fixed z-40 flex h-screen w-64 flex-col border-r bg-white transition-transform dark:bg-gray-900",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* User Profile */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
              <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                {user?.firstName?.slice(0, 1).toUpperCase() || ''}{user?.lastName?.slice(0, 1).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400" data-testid="text-user-profile-label">
                USER PROFILE
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white" data-testid="text-username">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
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
            {/* My Dashboard with sub-menu */}
            <div>
              <div
                className={cn(
                  "flex w-full items-center justify-between rounded-lg text-sm font-medium transition-colors",
                  isDashboardRoute
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <Link
                  href={ROUTES.DASHBOARD}
                  className="flex flex-1 cursor-pointer items-center gap-3 px-3 py-2.5"
                  data-testid="nav-dashboard"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>My Dashboard</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDashboardExpanded(!isDashboardExpanded);
                  }}
                  className="px-3 py-2.5 hover:opacity-70 transition-opacity"
                  data-testid="button-dashboard-expand"
                  aria-label="Toggle dashboard submenu"
                >
                  {isDashboardExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Dashboard sub-menu */}
              {isDashboardExpanded && (
                <div className="mt-1 space-y-1 pl-4">
                  <Link
                    href={ROUTES.HEALTH_ASSESSMENT}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      location === ROUTES.HEALTH_ASSESSMENT
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                    data-testid="nav-health-assessment"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>Health Assessment</span>
                  </Link>
                  <Link
                    href={ROUTES.HEALTH_METRICS_HISTORY}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      location === ROUTES.HEALTH_METRICS_HISTORY
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                    data-testid="nav-health-metrics-history"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>Metrics History</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Other nav items */}
            {mainNavItems.map((item) => {
              // Filter by role
              if (item.roles && !item.roles.includes(user?.role as any)) {
                return null;
              }

              // Filter by payment type
              if (item.paymentTypes && (!user?.paymentType || !item.paymentTypes.includes(user.paymentType))) {
                return null;
              }

              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                  data-testid={item.testId}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
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
            <Link
              href={ROUTES.SETTINGS}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                location === ROUTES.SETTINGS
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
              data-testid="nav-settings"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
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
    </>
  );
}
