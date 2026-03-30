export interface Doctor {
	id: string;
	name: string;
	firstName?: string;
	lastName?: string;
	specialty: string;
	experience: string;
	rating: number;
	isOnline: boolean;
	/** Resolved image URL or legacy relative path */
	image: string;
	consultationFee?: number;
}
