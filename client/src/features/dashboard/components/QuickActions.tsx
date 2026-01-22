import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Droplets, Weight, Plus } from "lucide-react";

interface QuickActionsProps {
	onAddMetric: () => void;
}

export function QuickActions({ onAddMetric }: QuickActionsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={onAddMetric}
					data-testid="button-add-blood-sugar"
				>
					<Droplets className="mr-2 h-4 w-4" />
					Log Blood Sugar
				</Button>
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={onAddMetric}
					data-testid="button-add-blood-pressure"
				>
					<Heart className="mr-2 h-4 w-4" />
					Log Blood Pressure
				</Button>
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={onAddMetric}
					data-testid="button-add-weight"
				>
					<Weight className="mr-2 h-4 w-4" />
					Log Weight
				</Button>
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={onAddMetric}
					data-testid="button-add-activity"
				>
					<Activity className="mr-2 h-4 w-4" />
					Log Activity
				</Button>
				<Button
					className="w-full"
					onClick={onAddMetric}
					data-testid="button-add-all-metrics"
				>
					<Plus className="mr-2 h-4 w-4" />
					Add All Metrics
				</Button>
			</CardContent>
		</Card>
	);
}
