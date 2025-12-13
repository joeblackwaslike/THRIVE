import { Award, Star, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Application, Interview } from '@/types';

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  achieved: boolean;
  value: number;
  threshold: number;
}

/**
 * Hook to detect and notify about analytics milestones
 *
 * Note: Milestone checks are throttled to prevent notification spam.
 * Milestones are only checked once per 5 seconds max.
 */
export function useMilestoneNotifications(applications: Application[], interviews: Interview[]) {
  const [achievedMilestones, setAchievedMilestones] = useState<Set<string>>(new Set());
  const lastCheckTimeRef = useRef<number>(0);
  const THROTTLE_MS = 5000; // Check at most once per 5 seconds

  useEffect(() => {
    // Throttle milestone checks to prevent spam
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTimeRef.current;

    if (timeSinceLastCheck < THROTTLE_MS) {
      // Skip this check if we checked recently
      return;
    }

    // Update last check time
    lastCheckTimeRef.current = now;

    const milestones: Milestone[] = [
      {
        id: 'apps-10',
        title: '10 Applications! 🎯',
        description: "You've submitted 10 applications! Keep up the momentum!",
        icon: Target,
        achieved: applications.length >= 10,
        value: applications.length,
        threshold: 10,
      },
      {
        id: 'apps-25',
        title: '25 Applications Milestone! 🚀',
        description: "Impressive! You've reached 25 applications!",
        icon: TrendingUp,
        achieved: applications.length >= 25,
        value: applications.length,
        threshold: 25,
      },
      {
        id: 'apps-50',
        title: '50 Applications! 🏆',
        description: 'Half century! Your dedication is paying off!',
        icon: Trophy,
        achieved: applications.length >= 50,
        value: applications.length,
        threshold: 50,
      },
      {
        id: 'apps-100',
        title: '100 Applications! 👑',
        description: 'Incredible milestone! Century complete!',
        icon: Award,
        achieved: applications.length >= 100,
        value: applications.length,
        threshold: 100,
      },
      {
        id: 'interviews-5',
        title: 'First 5 Interviews! ⭐',
        description: "You've secured 5 interviews! Great progress!",
        icon: Star,
        achieved: interviews.length >= 5,
        value: interviews.length,
        threshold: 5,
      },
      {
        id: 'interviews-10',
        title: '10 Interviews! 💫',
        description: "Double digits! You're making great impressions!",
        icon: Zap,
        achieved: interviews.length >= 10,
        value: interviews.length,
        threshold: 10,
      },
      {
        id: 'interviews-25',
        title: '25 Interviews! 🌟',
        description: 'Quarter century of interviews! Exceptional!',
        icon: Trophy,
        achieved: interviews.length >= 25,
        value: interviews.length,
        threshold: 25,
      },
    ];

    // Check for newly achieved milestones
    milestones.forEach((milestone) => {
      if (
        milestone.achieved &&
        !achievedMilestones.has(milestone.id) &&
        milestone.value === milestone.threshold // Only notify when exactly hitting the threshold
      ) {
        // Show toast notification
        toast.success(milestone.title, {
          description: milestone.description,
          duration: 5000,
        });

        // Mark as achieved
        setAchievedMilestones((prev) => new Set([...prev, milestone.id]));
      }
    });
  }, [applications.length, interviews.length, achievedMilestones]);

  return achievedMilestones;
}

/**
 * Hook to detect significant metric changes and notify
 */
export function useMetricChangeNotifications(
  currentMetrics: {
    responseRate: number;
    interviewConversionRate: number;
    offerRate: number;
  },
  previousMetrics?: {
    responseRate: number;
    interviewConversionRate: number;
    offerRate: number;
  },
) {
  const [notifiedChanges, setNotifiedChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!previousMetrics) return;

    const changes: Array<{ id: string; title: string; description: string }> = [];

    // Response rate improvement
    const responseRateChange = currentMetrics.responseRate - previousMetrics.responseRate;
    if (responseRateChange >= 10 && !notifiedChanges.has('response-rate-up')) {
      changes.push({
        id: 'response-rate-up',
        title: '📈 Response Rate Improved!',
        description: `Your response rate increased by ${responseRateChange.toFixed(1)}%!`,
      });
    }

    // Interview conversion improvement
    const interviewChange =
      currentMetrics.interviewConversionRate - previousMetrics.interviewConversionRate;
    if (interviewChange >= 5 && !notifiedChanges.has('interview-conversion-up')) {
      changes.push({
        id: 'interview-conversion-up',
        title: '🎯 Interview Rate Up!',
        description: `Interview conversion improved by ${interviewChange.toFixed(1)}%!`,
      });
    }

    // Offer rate improvement
    const offerRateChange = currentMetrics.offerRate - previousMetrics.offerRate;
    if (offerRateChange >= 5 && !notifiedChanges.has('offer-rate-up')) {
      changes.push({
        id: 'offer-rate-up',
        title: '🏆 Offer Rate Increased!',
        description: `Your offer rate is up by ${offerRateChange.toFixed(1)}%!`,
      });
    }

    // Show notifications
    changes.forEach((change) => {
      toast.success(change.title, {
        description: change.description,
        duration: 4000,
      });

      setNotifiedChanges((prev) => new Set([...prev, change.id]));
    });
  }, [currentMetrics, previousMetrics, notifiedChanges]);
}

/**
 * Hook to show periodic encouragement messages
 */
export function useEncouragementMessages(applicationCount: number, _interviewCount: number) {
  const [lastEncouragementCount, setLastEncouragementCount] = useState(0);

  useEffect(() => {
    // Show encouragement every 5 applications (after the first 10)
    if (
      applicationCount >= 10 &&
      applicationCount % 5 === 0 &&
      applicationCount > lastEncouragementCount
    ) {
      const messages = [
        'Keep going! Every application brings you closer to your goal! 💪',
        "You're doing great! Consistency is key! 🌟",
        'Impressive dedication! Your hard work will pay off! 🚀',
        "Stay motivated! You're building momentum! ⚡",
        'Great progress! Keep pushing forward! 🎯',
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      toast.info('Keep Up The Great Work!', {
        description: randomMessage,
        duration: 3000,
      });

      setLastEncouragementCount(applicationCount);
    }
  }, [applicationCount, lastEncouragementCount]);
}
