import { PERMISSIONS as ALL_PERMISSIONS } from "@shared/schema";

export function hasAnyPermission(
	userPermissions: string[] | undefined,
	permissions: string[],
): boolean {
	if (!userPermissions || userPermissions.length === 0) {
		return false;
	}
	return permissions.some((permission) => userPermissions.includes(permission));
}

export function hasAllPermissions(
	userPermissions: string[] | undefined,
	permissions: string[],
): boolean {
	if (!userPermissions || userPermissions.length === 0) {
		return false;
	}
	return permissions.every((permission) =>
		userPermissions.includes(permission),
	);
}

export const PERMISSIONS = ALL_PERMISSIONS;
