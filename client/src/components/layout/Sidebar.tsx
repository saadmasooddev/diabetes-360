import { Link, useLocation } from "wouter";
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
	Calendar,
	Users,
	CalendarCheck,
	Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/utils/permissions";
import { PAYMENT_TYPE } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

interface NavItem {
	label: string;
	icon: React.ReactNode;
	path: () => string;
	testId: string;
	permissions?: string[];
	paymentTypes?: ("free" | "monthly" | "annual")[];
	jsx?: React.JSX.Element;
}

interface SidebarProps {
	className?: string;
}

export function Sidebar({ className }: SidebarProps) {
	const [location, setLocation] = useLocation();
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const { hasAnyPermission } = usePermissions();
	const [isOpen, setIsOpen] = useState(false);
	const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
	const hasReadAllAppointments = hasAnyPermission([
		PERMISSIONS.READ_ALL_APPOINTMENTS,
	]);

	const hasReadAllPatients = hasAnyPermission([PERMISSIONS.READ_ALL_PATIENTS]);
	const isDashboardRoute =
		location === ROUTES.DASHBOARD ||
		location === ROUTES.HEALTH_ASSESSMENT ||
		location === ROUTES.HEALTH_METRICS_HISTORY;

	const myDashbard = () => {
		return (
			<div>
				<div
					className={cn(
						"flex w-full items-center justify-between rounded-lg text-sm font-medium transition-colors",
						isDashboardRoute
							? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
							: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
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
									: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
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
									: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
							)}
							data-testid="nav-health-metrics-history"
						>
							<ChevronRight className="h-4 w-4" />
							<span>Log History</span>
						</Link>
					</div>
				)}
			</div>
		);
	};

	const mainNavItems: NavItem[] = [
		{
			label: "Home",
			icon: <Home className="h-5 w-5" />,
			path: () => ROUTES.HOME,
			testId: "nav-home",
			permissions: [PERMISSIONS.READ_OWN_PROFILE],
		},
		{
			label: "My Dashboard",
			icon: <LayoutDashboard className="h-5 w-5" />,
			path: () => ROUTES.DASHBOARD,
			jsx: myDashbard(),
			testId: "nav-my-dashboard",
			permissions: [PERMISSIONS.READ_OWN_HEALTH_METRICS],
		},
		{
			label: "Instant Consultation",
			icon: <Video className="h-5 w-5" />,
			path: () => ROUTES.INSTANT_CONSULTATION,
			testId: "nav-consultation",
			permissions: [PERMISSIONS.CREATE_BOOKINGS],
		},
		{
			label: "Find a Doctor",
			icon: <UserSearch className="h-5 w-5" />,
			path: () => ROUTES.FIND_DOCTOR,
			testId: "nav-doctors",
			permissions: [PERMISSIONS.READ_PHYSICIANS],
		},
		{
			label: "Consultations",
			icon: <Calendar className="h-5 w-5" />,
			path: () => ROUTES.CONSULTATIONS,
			testId: "nav-consultations",
			permissions: [PERMISSIONS.READ_OWN_CONSULTATIONS],
			paymentTypes: ["monthly", "annual"],
		},
		{
			label: "Food Scanner",
			icon: <Scan className="h-5 w-5" />,
			path: () => ROUTES.FOOD_SCANNER,
			testId: "nav-food-scanner",
			permissions: [PERMISSIONS.SCAN_FOOD],
		},
		{
			label: "Tips & Exercises",
			icon: <Dumbbell className="h-5 w-5" />,
			path: () => ROUTES.TIPS_EXERCISES,
			testId: "nav-tips",
			permissions: [PERMISSIONS.READ_OWN_HEALTH_METRICS],
		},
		{
			label: "Medical Records",
			icon: <FileText className="h-5 w-5" />,
			path: () => ROUTES.MEDICAL_RECORDS,
			testId: "nav-records",
			permissions: [PERMISSIONS.READ_OWN_MEDICAL_RECORDS],
		},
		{
			label: "DiaBot (AI Chatbot)",
			icon: <Bot className="h-5 w-5" />,
			path: () => ROUTES.DIABOT,
			testId: "nav-diabot",
			permissions: [PERMISSIONS.USE_DIABOT],
		},
		{
			label: "Health Plans",
			icon: <DollarSign className="h-5 w-5" />,
			path: () => ROUTES.HEALTH_PLANS,
			testId: "nav-payments",
			permissions: [PERMISSIONS.SUBSCRIBE_HEALTH_PLANS],
			paymentTypes: [PAYMENT_TYPE.FREE],
		},
		{
			label: "Home",
			icon: <Home className="h-5 w-5" />,
			path: () => {
				return hasReadAllAppointments ? ROUTES.ADMIN_HOME : ROUTES.DOCTOR_HOME;
			},
			testId: "nav-doctor-home",
			permissions: [
				PERMISSIONS.READ_OWN_APPOINTMENTS,
				PERMISSIONS.READ_ALL_APPOINTMENTS,
			],
		},
		{
			label: "Patients",
			icon: <Users className="h-5 w-5" />,
			path: () => {
				return hasReadAllPatients
					? ROUTES.ADMIN_PATIENTS
					: ROUTES.DOCTOR_PATIENTS;
			},
			testId: "nav-doctor-patients",
			permissions: [PERMISSIONS.READ_PATIENT_PROFILES],
		},
		{
			label: "Appointments",
			icon: <CalendarCheck className="h-5 w-5" />,
			path: () => {
				return hasReadAllAppointments
					? ROUTES.ADMIN_APPOINTMENTS
					: ROUTES.DOCTOR_APPOINTMENTS;
			},
			testId: "nav-doctor-appointments",
			permissions: [
				PERMISSIONS.READ_OWN_APPOINTMENTS,
				PERMISSIONS.READ_ALL_APPOINTMENTS,
			],
		},
		{
			label: "Alerts",
			icon: <Bell className="h-5 w-5" />,
			path: () => {
				return hasReadAllPatients
					? ROUTES.ADMIN_PATIENTS_ALERTS
					: ROUTES.DOCTOR_PATIENTS_ALERTS;
			},
			testId: "nav-doctor-alerts",
			permissions: [PERMISSIONS.READ_PATIENT_ALERTS],
		},
	];

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

			<aside
				className={cn(
					"font-inter fixed z-40 flex h-screen w-64 flex-col border-r bg-white transition-transform dark:bg-gray-900",
					isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
					className,
				)}
			>
				{/* User Profile */}
				<div className="border-b p-4">
					<div className="flex items-center gap-3">
						<Avatar className="h-12 w-12">
							<AvatarImage
								src=""
								alt={`${user?.firstName} ${user?.lastName}`}
							/>
							<AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
								{user?.firstName?.slice(0, 1).toUpperCase() || ""}
								{user?.lastName?.slice(0, 1).toUpperCase() || "U"}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<p
								className="text-xs font-medium text-teal-600 dark:text-teal-400"
								data-testid="text-user-profile-label"
							>
								USER PROFILE
							</p>
							<p
								className="text-sm font-semibold text-gray-900 dark:text-white"
								data-testid="text-username"
							>
								{user?.firstName && user?.lastName
									? `${user.firstName} ${user.lastName}`
									: "User"}
							</p>
						</div>
					</div>
				</div>

				{/* Main Navigation */}
				<div className="flex-1 overflow-y-auto py-4">
					<div className="mb-3 px-4">
						<p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
							MAIN
						</p>
					</div>
					<nav className="space-y-1 px-2">
						{/* My Dashboard with sub-menu */}

						{/* Other nav items */}
						{mainNavItems.map((item) => {
							// Filter by permissions
							if (item.permissions && !hasAnyPermission(item.permissions)) {
								return null;
							}

							// Filter by payment type
							if (
								item.paymentTypes &&
								(!user?.paymentType ||
									!item.paymentTypes.includes(user.paymentType))
							) {
								return null;
							}

							const href = item.path();
							const isActive = location === href;
							if (item.jsx) {
								return <div key={href}>{item.jsx}</div>;
							}
							return (
								<Link
									key={href}
									href={href}
									className={cn(
										"flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
										isActive
											? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
											: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
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
						<p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
							SETTINGS
						</p>
					</div>
					<nav className="space-y-1 px-2">
						<Link
							href={ROUTES.SETTINGS}
							className={cn(
								"flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
								location === ROUTES.SETTINGS
									? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
									: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
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
