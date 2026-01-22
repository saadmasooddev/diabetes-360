export interface Doctor {
	id: string;
	name: string;
	specialty: string;
	experience: string;
	rating: number;
	isOnline: boolean;
	image: string;
	consultationFee?: number;
}
