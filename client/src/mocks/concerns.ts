export type Concern = {
	id: string;
	name: string;
	specialty: string;
	icon: string;
};

export const mockConcerns: Concern[] = [
	{
		id: "1",
		name: "Diabetologist",
		specialty: "Diabetologist",
		icon: "stethoscope",
	},
	{
		id: "2",
		name: "Nutritionist",
		specialty: "Nutritionist",
		icon: "apple",
	},
	{
		id: "3",
		name: "Health Coach",
		specialty: "Health Coach",
		icon: "heart-pulse",
	},
	{
		id: "4",
		name: "Endocrinologist",
		specialty: "Endocrinologist",
		icon: "activity",
	},
];
