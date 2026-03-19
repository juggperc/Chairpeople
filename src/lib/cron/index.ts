import { v4 as uuid } from 'uuid';
import type { CronJob } from '@/types';
import { getDb } from '@/lib/db';

type CronCallback = (job: CronJob) => void | Promise<void>;

interface ScheduledJob {
  id: string;
  cronJob: CronJob;
  intervalId: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null;
  callback: CronCallback;
}

class CronManager {
  private static instance: CronManager | null = null;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private listeners: Map<string, CronCallback[]> = new Map();

  private constructor() {}

  static getInstance(): CronManager {
    if (!CronManager.instance) {
      CronManager.instance = new CronManager();
    }
    return CronManager.instance;
  }

  async loadJobs(companyId: string): Promise<void> {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT * FROM cron_jobs WHERE company_id = ? AND enabled = 1
      `).all(companyId) as CronJob[];

      for (const job of rows) {
        this.scheduleJob(job);
      }
    } catch (error) {
      console.error('Failed to load cron jobs:', error);
    }
  }

  createJob(companyId: string, employeeId: string | undefined, options: {
    name: string;
    description?: string;
    schedule: string;
    type: CronJob['type'];
    action: string;
  }): CronJob {
    const id = uuid();
    const now = new Date().toISOString();
    const nextRun = this.calculateNextRun(options.schedule);

    const cronJob: CronJob = {
      id,
      companyId,
      employeeId,
      name: options.name,
      description: options.description || '',
      schedule: options.schedule,
      type: options.type,
      action: options.action,
      enabled: true,
      nextRun,
      createdAt: now,
    };

    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO cron_jobs (id, company_id, employee_id, name, description, schedule, type, action, enabled, next_run, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, companyId, employeeId || null, options.name, options.description || '', options.schedule, options.type, options.action, 1, nextRun, now);
    } catch (error) {
      console.error('Failed to create cron job:', error);
    }

    this.scheduleJob(cronJob);
    return cronJob;
  }

  private scheduleJob(cronJob: CronJob): void {
    if (this.scheduledJobs.has(cronJob.id)) {
      this.unscheduleJob(cronJob.id);
    }

    const callback: CronCallback = async (job) => {
      try {
        const listeners = this.listeners.get(job.id) || [];
        for (const listener of listeners) {
          await listener(job);
        }
        
        const db = getDb();
        const now = new Date().toISOString();
        const nextRun = this.calculateNextRun(job.schedule);
        db.prepare('UPDATE cron_jobs SET last_run = ?, next_run = ? WHERE id = ?').run(now, nextRun, job.id);
      } catch (error) {
        console.error(`Cron job ${job.id} failed:`, error);
      }
    };

    let intervalId: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null = null;

    if (cronJob.type === 'recurring') {
      const delay = this.scheduleToMs(cronJob.schedule);
      if (delay > 0) {
        intervalId = setInterval(() => callback(cronJob), delay);
      }
    } else if (cronJob.type === 'one-time' && cronJob.nextRun) {
      const delay = new Date(cronJob.nextRun).getTime() - Date.now();
      if (delay > 0) {
        intervalId = setTimeout(() => {
          callback(cronJob);
          this.disableJob(cronJob.id);
        }, delay);
      }
    }

    this.scheduledJobs.set(cronJob.id, {
      id: cronJob.id,
      cronJob,
      intervalId,
      callback,
    });
  }

  private unscheduleJob(id: string): void {
    const scheduled = this.scheduledJobs.get(id);
    if (scheduled?.intervalId) {
      if (scheduled.intervalId instanceof setInterval) {
        clearInterval(scheduled.intervalId);
      } else {
        clearTimeout(scheduled.intervalId);
      }
    }
    this.scheduledJobs.delete(id);
  }

  enableJob(id: string): void {
    const scheduled = this.scheduledJobs.get(id);
    if (scheduled) {
      scheduled.cronJob.enabled = true;
      try {
        const db = getDb();
        db.prepare('UPDATE cron_jobs SET enabled = 1 WHERE id = ?').run(id);
      } catch (error) {
        console.error('Failed to enable cron job:', error);
      }
    }
  }

  disableJob(id: string): void {
    const scheduled = this.scheduledJobs.get(id);
    if (scheduled) {
      scheduled.cronJob.enabled = false;
      if (scheduled.intervalId) {
        if (scheduled.intervalId instanceof setInterval) {
          clearInterval(scheduled.intervalId);
        } else {
          clearTimeout(scheduled.intervalId);
        }
        scheduled.intervalId = null;
      }
      try {
        const db = getDb();
        db.prepare('UPDATE cron_jobs SET enabled = 0 WHERE id = ?').run(id);
      } catch (error) {
        console.error('Failed to disable cron job:', error);
      }
    }
  }

  deleteJob(id: string): void {
    this.unscheduleJob(id);
    try {
      const db = getDb();
      db.prepare('DELETE FROM cron_jobs WHERE id = ?').run(id);
    } catch (error) {
      console.error('Failed to delete cron job:', error);
    }
  }

  onJobRun(id: string, callback: CronCallback): () => void {
    const listeners = this.listeners.get(id) || [];
    this.listeners.set(id, [...listeners, callback]);
    return () => {
      const current = this.listeners.get(id) || [];
      this.listeners.set(id, current.filter(l => l !== callback));
    };
  }

  private calculateNextRun(schedule: string): string | undefined {
    const delay = this.scheduleToMs(schedule);
    if (delay > 0) {
      return new Date(Date.now() + delay).toISOString();
    }
    return undefined;
  }

  private scheduleToMs(schedule: string): number {
    const match = schedule.match(/^(\d+)([smhd])$/);
    if (!match) return 60000;
    
    const [, value, unit] = match;
    const num = parseInt(value, 10);
    
    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return 60000;
    }
  }

  stopAll(): void {
    for (const [id] of this.scheduledJobs) {
      this.unscheduleJob(id);
    }
  }
}

export const cronManager = CronManager.getInstance();