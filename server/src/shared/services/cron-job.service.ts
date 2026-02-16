import cron from "node-cron";
import type { ScheduledTask } from "node-cron";

export interface CronJobDefinition {
	name: string;
	schedule: string;
	handler: () => Promise<void>;
}

export class CronJobService {
	private jobs: CronJobDefinition[] = [];
	private tasks: ScheduledTask[] = [];

	register(job: CronJobDefinition) {
		this.jobs.push(job);
		return this;
	}

	registerAll(jobs: CronJobDefinition[]) {
		for (const job of jobs) {
			this.jobs.push(job);
		}
	}

	start(): void {
		for (const job of this.jobs) {
			const task = cron.schedule(job.schedule, async () => {
				try {
					await job.handler();
				} catch (err) {
					console.error(
						`[CronJobService] Job "${job.name}" failed:`,
						err instanceof Error ? err.message : err,
					);
				}
			});
			this.tasks.push(task);
		}
	}

	stop(): void {
		for (const task of this.tasks) {
			task.stop();
		}
		this.tasks = [];
	}
}
