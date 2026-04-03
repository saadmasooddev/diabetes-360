import { useEffect } from "react";
import { getMessaging, onMessage } from "firebase/messaging";
import {
	isFirebaseMessagingConfigured,
} from "@/config/firebasePublicConfig";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@shared/schema";
import { getOrInitApp } from "@/lib/fcm/webFcm";

export function FcmForegroundListener(): null {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const { toast } = useToast();

	useEffect(() => {
		if (!isAuthenticated || user?.role !== USER_ROLES.CUSTOMER) {
			return;
		}
		if (!isFirebaseMessagingConfigured()) {
			return;
		}

		const app = getOrInitApp()
		if (!app) return
		const messaging = getMessaging(app);

		const unsubscribe = onMessage(messaging, (payload) => {
			const title = payload.data?.title;
			const body = payload.data?.body;
			if (!title) return;
			toast({
				title,
				description: body || undefined,
				className:
					"border-[#00856f]/25 bg-[#f7f9f9] text-foreground shadow-md backdrop-blur-sm",
				duration: 6500,
			});
		});

		return () => {
			unsubscribe();
		};
	}, [isAuthenticated, user?.role, toast]);

	return null;
}
