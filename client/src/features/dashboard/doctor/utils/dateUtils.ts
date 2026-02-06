import dayjs from "dayjs";

export const formatDate = (date: Date, formatStr: string): string => {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	if (formatStr === "MMM dd, yyyy") {
		return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
	}
	if (formatStr === "yyyy-MM-dd") {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}
	return date.toLocaleDateString();
};
