import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/spinner";
import { ChevronLeft } from "lucide-react";
import { QUICK_LOG_DIET_TYPE_ENUM, QUICK_LOG_EXERCISE_TYPE_ENUM, QUICK_LOG_MEDICINES_TYPE_ENUM, QUICK_LOG_SLEEP_DURATION_TYPE_ENUM, QUICK_LOG_STRESS_LEVEL_TYPE_ENUM, QuickLogDietTypeEnumValues, QuickLogExerciseTypeEnumValues, QuickLogMedicinesTypeEnumValues, QuickLogSleepDurationTypeEnumValues, QuickLogStressLevelTypeEnumValues } from "@shared/schema";

type ExerciseOption = {
	value: QuickLogExerciseTypeEnumValues
	label: string
}
const EXERCISE_OPTIONS: ExerciseOption[] = [
	{ value: QUICK_LOG_EXERCISE_TYPE_ENUM.NONE, label: "None" },
	{ value: QUICK_LOG_EXERCISE_TYPE_ENUM.LIGHT, label: "Light" },
	{ value: QUICK_LOG_EXERCISE_TYPE_ENUM.MODERATE, label: "Moderate" },
	{ value: QUICK_LOG_EXERCISE_TYPE_ENUM.INTENSE, label: "Intense" },
];

type DietOption = {
	value: QuickLogDietTypeEnumValues
	label: string
}
const DIET_OPTIONS: DietOption[] = [
	{ value: QUICK_LOG_DIET_TYPE_ENUM.MOSTLY_HOME_COOKED, label: "Mostly home-cooked" },
	{ value: QUICK_LOG_DIET_TYPE_ENUM.MIXED, label: "Mixed" },
	{ value: QUICK_LOG_DIET_TYPE_ENUM.HIGH_CARB_OUTSIDE, label: "High-carb-outside" },
];

type SleepOption = {
	value: QuickLogSleepDurationTypeEnumValues
	label: string
}
const SLEEP_OPTIONS: SleepOption[] = [
	{ value: QUICK_LOG_SLEEP_DURATION_TYPE_ENUM.LESS_5, label: "<5" },
	{ value: QUICK_LOG_SLEEP_DURATION_TYPE_ENUM.FIVE_SEVEN, label: "5-7" },
	{ value: QUICK_LOG_SLEEP_DURATION_TYPE_ENUM.MORE_7, label: ">7" },
];

type MedicinesOption = {
	value: QuickLogMedicinesTypeEnumValues
	label: string
}
const MEDICINES_OPTIONS: MedicinesOption[] = [
	{ value: QUICK_LOG_MEDICINES_TYPE_ENUM.TAKEN, label: "Taken" },
	{ value: QUICK_LOG_MEDICINES_TYPE_ENUM.MISSED, label: "Missed" },
];

type StressOption = {
	value: QuickLogStressLevelTypeEnumValues
	label: string
}
const STRESS_OPTIONS: StressOption[] = [
	{ value: QUICK_LOG_STRESS_LEVEL_TYPE_ENUM.LOW, label: "Low" },
	{ value: QUICK_LOG_STRESS_LEVEL_TYPE_ENUM.MODERATE, label: "Moderate" },
	{ value: QUICK_LOG_STRESS_LEVEL_TYPE_ENUM.HIGH, label: "High" },
];

interface QuickLogFormData {
	exercise: QuickLogExerciseTypeEnumValues;
	diet: QuickLogDietTypeEnumValues;
	sleepDuration: QuickLogSleepDurationTypeEnumValues;
	medicines: QuickLogMedicinesTypeEnumValues;
	stressLevel: QuickLogStressLevelTypeEnumValues;
}

interface DailyQuickLogsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: QuickLogFormData & { logDate?: string }) => void;
	isSubmitting: boolean;
	initialData?: QuickLogFormData | null;
	logDate?: string;
}

export function DailyQuickLogsModal({
	open,
	onOpenChange,
	onSubmit,
	isSubmitting,
	initialData,
	logDate,
}: DailyQuickLogsModalProps) {
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;
		const formData = new FormData(form);
		const data = {
			exercise: formData.get("exercise") as QuickLogExerciseTypeEnumValues,
			diet: formData.get("diet") as QuickLogDietTypeEnumValues,
			sleepDuration: formData.get("sleepDuration") as QuickLogSleepDurationTypeEnumValues,
			medicines: formData.get("medicines") as QuickLogMedicinesTypeEnumValues,
			stressLevel: formData.get("stressLevel") as QuickLogStressLevelTypeEnumValues,
		};
		onSubmit({ ...data, logDate });
	};

	const OptionGroup = ({
		label,
		name,
		options,
		defaultValue,
	}: {
		label: string;
		name: string;
		options: readonly { value: string; label: string }[];
		defaultValue?: string | null;
	}) => (
		<div className="space-y-3  ">
			<label
				className="block font-semibold text-sm"
				style={{ color: "#00453A" }}
			>
				{label}
			</label>
			<div className="flex flex-wrap gap-2">
				{options.map((opt) => (
					<label
						key={opt.value}
						className="flex items-center gap-2 cursor-pointer"
					>
						<input
							type="radio"
							name={name}
							value={opt.value}
							defaultChecked={defaultValue === opt.value}
							className="sr-only peer"
						/>
						<span
							className="px-4 py-2 rounded-lg border text-sm font-medium transition-all peer-checked:border-[#00856F] peer-checked:bg-[#E0F2F1] peer-checked:text-[#00453A]"
							style={{
								borderColor: "rgba(0, 133, 111, 0.3)",
								color: "#546E7A",
							}}
						>
							{opt.label}
						</span>
					</label>
				))}
			</div>
		</div>
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md p-4 "
				style={{
					background: "#FFFFFF",
					borderRadius: "16px",
					border: "1px solid rgba(0, 133, 111, 0.12)",
					boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
				}}
			>
				<DialogHeader className="flex flex-row items-center gap-2">
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="p-1 rounded-lg hover:bg-gray-100"
					>
						<ChevronLeft className="w-5 h-5" style={{ color: "#00856F" }} />
					</button>
					<DialogTitle
						style={{
							color: "#00856F",
							fontSize: "20px",
							fontWeight: 700,
						}}
					>
						Daily Quick Logs
					</DialogTitle>
				</DialogHeader>

				<form
					key={`quick-log-${logDate ?? "today"}-${open}`}
					onSubmit={handleSubmit}
					className="space-y-6 mt-4"
				>
					<OptionGroup
						label="Exercise"
						name="exercise"
						options={EXERCISE_OPTIONS}
						defaultValue={initialData?.exercise}
					/>
					<OptionGroup
						label="Diet"
						name="diet"
						options={DIET_OPTIONS}
						defaultValue={initialData?.diet}
					/>
					<OptionGroup
						label="Sleep Duration"
						name="sleepDuration"
						options={SLEEP_OPTIONS}
						defaultValue={initialData?.sleepDuration}
					/>
					<OptionGroup
						label="Medicines"
						name="medicines"
						options={MEDICINES_OPTIONS}
						defaultValue={initialData?.medicines}
					/>
					<OptionGroup
						label="Stress Level"
						name="stressLevel"
						options={STRESS_OPTIONS}
						defaultValue={initialData?.stressLevel}
					/>

					<Button
						type="submit"
						disabled={isSubmitting}
						className="w-full"
						style={{
							background: "linear-gradient(135deg, #00856F 0%, #006B5C 100%)",
							color: "#FFFFFF",
							borderRadius: "12px",
							fontWeight: 600,
							padding: "14px",
						}}
					>
						{isSubmitting ? (
							<>
								<ButtonSpinner className="mr-2" />
								Submitting...
							</>
						) : (
							"Submit"
						)}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
