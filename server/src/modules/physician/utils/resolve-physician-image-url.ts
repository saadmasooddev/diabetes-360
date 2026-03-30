import { azureService } from "server/src/shared/services/azure.service";

const PROFILE_SEGMENT = "/profile-picture/";

/** Stored value is an Azure blob key (userId/profile-picture/...) */
export function isStoredPhysicianBlobKey(
	stored: string | null | undefined,
): boolean {
	if (!stored || stored.startsWith("http://") || stored.startsWith("https://")) {
		return false;
	}
	return stored.includes(PROFILE_SEGMENT);
}

/**
 * Turn DB value into a browser-usable URL.
 * - Azure blob keys → time-limited SAS read URL (default 7 days).
 * - Already absolute URLs → unchanged.
 * - Legacy relative paths (public uploads) → returned as-is; client may prefix with API origin.
 */
export async function resolvePhysicianImageUrlForDisplay(
	stored: string | null | undefined,
	expiresInMinutes = 60 * 24 * 7,
): Promise<string | null> {
	if (stored == null || stored === "") {
		return null;
	}
	if (stored.startsWith("http://") || stored.startsWith("https://")) {
		return stored;
	}
	if (isStoredPhysicianBlobKey(stored)) {
		const { downloadUrl } = await azureService.generateDownloadSAS(
			stored,
			expiresInMinutes,
		);
		return downloadUrl;
	}
	return stored;
}
