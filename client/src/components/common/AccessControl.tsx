import { useAuthStore } from "@/stores/authStore";

interface AccessControlProps {
	permission: string;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function AccessControl({
	permission,
	children,
	fallback = null,
}: AccessControlProps) {
	const { user } = useAuthStore();
	const userPermissions = user?.permissions || [];
	const hasAccess = userPermissions.includes(permission);

	return hasAccess ? <>{children}</> : <>{fallback}</>;
}
