import { InactivityChecker } from './inactivity-checker';

export class BackgroundJobs {
  private static instance: BackgroundJobs;
  private inactivityChecker: InactivityChecker;
  private intervals: NodeJS.Timeout[] = [];

  private constructor() {
    this.inactivityChecker = InactivityChecker.getInstance();
  }

  public static getInstance(): BackgroundJobs {
    if (!BackgroundJobs.instance) {
      BackgroundJobs.instance = new BackgroundJobs();
    }
    return BackgroundJobs.instance;
  }

  startJobs(): void {
    console.log('Starting background jobs...');

    // Check for inactive users every hour
    const inactivityInterval = setInterval(async () => {
      try {
        await this.inactivityChecker.checkInactiveUsers();
      } catch (error) {
        console.error('Error in inactivity check job:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Check for date-triggered messages every 15 minutes
    const dateCheckInterval = setInterval(async () => {
      try {
        await this.inactivityChecker.checkDateTriggeredMessages();
      } catch (error) {
        console.error('Error in date check job:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    this.intervals.push(inactivityInterval, dateCheckInterval);

    // Run initial checks
    setTimeout(() => {
      this.inactivityChecker.checkInactiveUsers();
      this.inactivityChecker.checkDateTriggeredMessages();
    }, 5000); // Wait 5 seconds after startup
  }

  stopJobs(): void {
    console.log('Stopping background jobs...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
}

// Auto-start jobs in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  BackgroundJobs.getInstance().startJobs();
}