import { useEffect } from "react";
import { getMessaging, isSupported, onMessage } from "firebase/messaging";
import { isFirebaseMessagingConfigured } from "@/config/firebasePublicConfig";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { ensureForegroundMessagingReady, getOrInitApp } from "@/lib/fcm/webFcm";

import { tryGetWebFcmRegistration } from "@/lib/fcm/webFcm";
import { saveFcmRegistration } from "@/lib/fcm/fcmTokenStorage";
import { useSaveFcmToken } from "@/hooks/mutations/use-notifications";

function dataField(
	data: Record<string, string> | undefined,
	key: string,
): string | undefined {
	if (!data) return undefined;
	const v = data[key];
	if (v == null) return undefined;
	return typeof v === "string" ? v : String(v);
}

export function FcmForegroundListener(): null {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const { toast } = useToast();
	const { mutate: saveFcmToken } = useSaveFcmToken();

	useEffect(() => {
		if (!isAuthenticated || !user?.role) {
			return;
		}
		if (!isFirebaseMessagingConfigured()) {
			return;
		}

		let cancelled = false;
		let unsubscribe: (() => void) | undefined;

		void (async () => {
			if (!(await isSupported())) {
				return;
			}

			const fcm = await tryGetWebFcmRegistration();
			if (!fcm) {
				return;
			}

			saveFcmRegistration(fcm);
			saveFcmToken(fcm);

			const ready = await ensureForegroundMessagingReady();
			if (cancelled || !ready) {
				return;
			}
			const app = getOrInitApp();
			if (!app || cancelled) {
				return;
			}
			const messaging = getMessaging(app);
			if (cancelled) {
				return;
			}
			unsubscribe = onMessage(messaging, (payload) => {
				const title = dataField(payload.data, "title");
				const body = dataField(payload.data, "body");
				if (!title) {
					return;
				}
				toast({
					title,
					description: body || undefined,
					className:
						"border-[#00856f]/25 bg-[#f7f9f9] text-foreground shadow-md backdrop-blur-sm",
					duration: 6500,
				});
			});
		})();

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	}, [isAuthenticated, user?.role, toast]);

	return null;
}
