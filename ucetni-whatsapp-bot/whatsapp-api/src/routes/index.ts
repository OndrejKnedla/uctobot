import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';
import antiSpamMiddleware from '../middleware/antiSpam';
import monitoringService from '../services/monitoring';
import cronJobService from '../services/cronJobs';

const router = Router();

// Webhook routes
router.get('/webhook', webhookController.verify.bind(webhookController));
router.post('/webhook', antiSpamMiddleware.middleware(), webhookController.handleWebhook.bind(webhookController));

// Health check
router.get('/health', webhookController.healthCheck.bind(webhookController));

// Statistics and monitoring
router.get('/stats', webhookController.getStats.bind(webhookController));
router.get('/stats/detailed', async (req, res) => {
  try {
    const stats = await monitoringService.getSystemStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve detailed stats' });
  }
});

// User-specific stats (admin only in production)
router.get('/users/:phoneNumber/stats', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const userStats = await monitoringService.getUserStats(phoneNumber);
    
    if (!userStats) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user stats' });
  }
});

// Rate limit check (admin only)
router.get('/limits/check/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const status = await monitoringService.checkRateLimitStatus(phoneNumber);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check rate limit' });
  }
});

// Admin endpoints (should be protected in production)
router.post('/admin/reset-weekly', async (req, res) => {
  try {
    await cronJobService.triggerWeeklyReset();
    res.json({ success: true, message: 'Weekly reset triggered' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger weekly reset' });
  }
});

router.post('/admin/daily-tasks', async (req, res) => {
  try {
    await cronJobService.triggerDailyTasks();
    res.json({ success: true, message: 'Daily tasks triggered' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger daily tasks' });
  }
});

router.get('/admin/jobs', (req, res) => {
  try {
    const jobs = cronJobService.getJobStatus();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

router.get('/admin/export', async (req, res) => {
  try {
    const data = await monitoringService.exportUserData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;