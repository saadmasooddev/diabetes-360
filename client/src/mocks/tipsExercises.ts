export interface HealthTip {
	id: number;
	text: string;
}

export interface ExercisePlan {
	id: number;
	title: string;
	duration: string;
	description: string;
	image: string;
	isLocked: boolean;
}

export interface WeeklyChallenge {
	id: number;
	week: string;
	title: string;
	goal: string;
	progress: number;
	target: number;
	isLocked: boolean;
}

export const healthTips: HealthTip[] = [
	{
		id: 1,
		text: '"Drink a glass of water before meals to control hunger and prevent overeating."',
	},
	{
		id: 2,
		text: '"Aim for 30 minutes of moderate exercise every day to help regulate blood sugar levels."',
	},
	{
		id: 3,
		text: '"Add more fiber to your meals (e.g., whole grains, fruits, vegetables) to improve glucose control."',
	},
	{
		id: 4,
		text: '"Monitor your blood sugar levels regularly to track patterns and make informed decisions."',
	},
];

export const exercisePlans: ExercisePlan[] = [
	{
		id: 1,
		title: "Morning Walk",
		duration: "15-30 minutes",
		description:
			"Improves insulin sensitivity and lowers blood sugar after meals.",
		image:
			"https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=300&fit=crop",
		isLocked: false,
	},
	{
		id: 2,
		title: "Strength Training",
		duration: "15-30 minutes",
		description:
			"Strength training improves muscle mass, which helps your body use insulin more efficiently.",
		image:
			"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
		isLocked: false,
	},
	{
		id: 3,
		title: "Yoga or Stretching",
		duration: "15-30 minutes",
		description:
			"Yoga reduces stress and lower blood sugar, plus improves flexibility and mobility.",
		image:
			"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
		isLocked: false,
	},
];

export const weeklyChallenges: WeeklyChallenge[] = [
	{
		id: 1,
		week: "Week 1",
		title: "Step It Up!",
		goal: "Complete 10,000 steps every day for a week.",
		progress: 0,
		target: 70000,
		isLocked: false,
	},
	{
		id: 2,
		week: "Week 1",
		title: "Step It Up!",
		goal: "Complete 10,000 steps every day for a week.",
		progress: 0,
		target: 70000,
		isLocked: true,
	},
	{
		id: 3,
		week: "Week 1",
		title: "Step It Up!",
		goal: "Complete 10,000 steps every day for a week.",
		progress: 0,
		target: 70000,
		isLocked: true,
	},
];
