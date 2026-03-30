import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

function initialsFromName(
	firstName?: string | null,
	lastName?: string | null,
	fallbackName?: string,
): string {
	const f = (firstName || "").trim();
	const l = (lastName || "").trim();
	if (f || l) {
		const a = f.slice(0, 1).toUpperCase();
		const b = l.slice(0, 1).toUpperCase();
		return (a + b) || "?";
	}
	const parts = (fallbackName || "").trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
	}
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return "?";
}

export interface PhysicianAvatarProps {
	firstName?: string | null;
	lastName?: string | null;
	/** Display name when first/last are missing (e.g. "Dr. Jane Doe") */
	name?: string;
	/** Remote URL (SAS/https), legacy relative path, or data URL preview */
	imageUrl?: string | null;
	className?: string;
	fallbackClassName?: string;
	/** e.g. border for cards */
	imgClassName?: string;
}

/**
 * Physician avatar: photo when available; otherwise initials on a teal background (sidebar style).
 */
export function PhysicianAvatar({
	firstName,
	lastName,
	name,
	imageUrl,
	className,
	fallbackClassName,
	imgClassName,
}: PhysicianAvatarProps) {
	const [broken, setBroken] = useState(false);
	const initials = initialsFromName(firstName, lastName, name);

	const trimmed = imageUrl?.trim();
	const isHttp =
		!!trimmed &&
		(trimmed.startsWith("http://") ||
			trimmed.startsWith("https://") ||
			trimmed.startsWith("data:"));

	if (trimmed && !broken) {
		if (isHttp) {
			return (
				<div
					className={cn(
						"relative flex shrink-0 overflow-hidden rounded-full",
						className,
					)}
				>
					<img
						src={trimmed}
						alt=""
						className={cn("h-full w-full object-cover", imgClassName)}
						onError={() => setBroken(true)}
					/>
				</div>
			);
		}
		return (
			<div className={cn("relative overflow-hidden rounded-full", className)}>
				<Image
					src={trimmed}
					alt=""
					pointToServer
					className={cn("h-full w-full object-cover", imgClassName)}
					onError={() => setBroken(true)}
				/>
			</div>
		);
	}

	return (
		<Avatar className={cn("rounded-full", className)}>
			<AvatarFallback
				className={cn(
					"bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-full text-sm font-semibold",
					fallbackClassName,
				)}
			>
				{initials}
			</AvatarFallback>
		</Avatar>
	);
}
