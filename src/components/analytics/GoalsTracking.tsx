import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type JobSearchGoal, useGoalsStore } from '@/stores/goalsStore';
import type { Application, Interview } from '@/types';

interface GoalsTrackingProps {
  applications: Application[];
  interviews: Interview[];
}

export function GoalsTracking({ applications, interviews }: GoalsTrackingProps) {
  const { goals, addGoal, deleteGoal } = useGoalsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New goal form state
  const [newGoalType, setNewGoalType] = useState<JobSearchGoal['type']>('applications');
  const [newGoalPeriod, setNewGoalPeriod] = useState<JobSearchGoal['period']>('weekly');
  const [newGoalTarget, setNewGoalTarget] = useState('10');

  // Calculate current period dates
  const getCurrentPeriod = useCallback((period: 'weekly' | 'monthly') => {
    const now = new Date();
    if (period === 'weekly') {
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };
    }
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  // Calculate progress for each goal
  const calculateGoalProgress = useCallback(
    (goal: JobSearchGoal) => {
      const period = getCurrentPeriod(goal.period);
      let current = 0;

      switch (goal.type) {
        case 'applications':
          current = applications.filter((app) => {
            if (!app.appliedDate) return false;
            const date = new Date(app.appliedDate);
            return isWithinInterval(date, period);
          }).length;
          break;

        case 'interviews':
          current = interviews.filter((interview) => {
            if (!interview.scheduledAt) return false;
            const date = new Date(interview.scheduledAt);
            return isWithinInterval(date, period);
          }).length;
          break;

        case 'offers':
          current = applications.filter((app) => {
            if (!app.offerDate) return false;
            const date = new Date(app.offerDate);
            return isWithinInterval(date, period);
          }).length;
          break;

        case 'responseRate': {
          const periodApps = applications.filter((app) => {
            if (!app.appliedDate) return false;
            const date = new Date(app.appliedDate);
            return isWithinInterval(date, period);
          });
          const responded = periodApps.filter(
            (app) =>
              app.status !== 'applied' && app.status !== 'target' && app.status !== 'hunting',
          ).length;
          current = periodApps.length > 0 ? (responded / periodApps.length) * 100 : 0;
          break;
        }
      }

      const percentage = goal.target > 0 ? (current / goal.target) * 100 : 0;
      return {
        current: goal.type === 'responseRate' ? Math.round(current) : current,
        target: goal.target,
        percentage: Math.min(percentage, 100),
        status: percentage >= 100 ? 'achieved' : percentage >= 75 ? 'on-track' : 'behind',
      };
    },
    [applications, interviews, getCurrentPeriod],
  );

  const activeGoals = goals.filter((g) => g.active);

  const handleCreateGoal = () => {
    const target = Number.parseInt(newGoalTarget, 10);
    if (Number.isNaN(target) || target <= 0) return;

    const period = getCurrentPeriod(newGoalPeriod);

    addGoal({
      type: newGoalType,
      period: newGoalPeriod,
      target,
      startDate: period.start,
      endDate:
        newGoalPeriod === 'weekly' ? addWeeks(period.start, 52) : addMonths(period.start, 12),
      active: true,
    });

    setIsDialogOpen(false);
    setNewGoalTarget('10');
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
  };

  const getGoalIcon = (type: JobSearchGoal['type']) => {
    switch (type) {
      case 'applications':
        return Target;
      case 'interviews':
        return Calendar;
      case 'offers':
        return CheckCircle2;
      case 'responseRate':
        return TrendingUp;
    }
  };

  const getGoalLabel = (type: JobSearchGoal['type']) => {
    switch (type) {
      case 'applications':
        return 'Applications';
      case 'interviews':
        return 'Interviews';
      case 'offers':
        return 'Offers';
      case 'responseRate':
        return 'Response Rate';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Badge className="bg-green-500">Achieved</Badge>;
      case 'on-track':
        return <Badge className="bg-blue-500">On Track</Badge>;
      case 'behind':
        return <Badge className="bg-yellow-500">Behind</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Calculate summary stats
  const summary = useMemo(() => {
    const achieved = activeGoals.filter((goal) => {
      const progress = calculateGoalProgress(goal);
      return progress.status === 'achieved';
    }).length;

    return {
      total: activeGoals.length,
      achieved,
      onTrack: activeGoals.filter((goal) => {
        const progress = calculateGoalProgress(goal);
        return progress.status === 'on-track';
      }).length,
      behind: activeGoals.filter((goal) => {
        const progress = calculateGoalProgress(goal);
        return progress.status === 'behind';
      }).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGoals, calculateGoalProgress]);

  return (
    <div className="space-y-6">
      {/* Header with Create Goal Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Goals & Tracking</h3>
          <p className="text-muted-foreground">
            Set and track your job search goals to stay motivated
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a target to track your job search progress</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-type">Goal Type</Label>
                <Select
                  value={newGoalType}
                  onValueChange={(v) => setNewGoalType(v as JobSearchGoal['type'])}
                >
                  <SelectTrigger id="goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applications">Applications</SelectItem>
                    <SelectItem value="interviews">Interviews</SelectItem>
                    <SelectItem value="offers">Offers</SelectItem>
                    <SelectItem value="responseRate">Response Rate (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-period">Time Period</Label>
                <Select
                  value={newGoalPeriod}
                  onValueChange={(v) => setNewGoalPeriod(v as JobSearchGoal['period'])}
                >
                  <SelectTrigger id="goal-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-target">
                  Target {newGoalType === 'responseRate' ? '(%)' : '(Count)'}
                </Label>
                <Input
                  id="goal-target"
                  type="number"
                  min="1"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {activeGoals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Achieved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.achieved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">On Track</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.onTrack}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Behind</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.behind}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Active Goals</CardTitle>
          <CardDescription>Your current job search goals and progress</CardDescription>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active goals</h3>
              <p className="text-muted-foreground mb-4">
                Set your first goal to start tracking your job search progress
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeGoals.map((goal) => {
                const progress = calculateGoalProgress(goal);
                const Icon = getGoalIcon(goal.type);

                return (
                  <div key={goal.id} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {getGoalLabel(goal.type)} -{' '}
                              {goal.period === 'weekly' ? 'Weekly' : 'Monthly'}
                            </h4>
                            {getStatusBadge(progress.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Target: {goal.target}
                            {goal.type === 'responseRate' ? '%' : ''} per{' '}
                            {goal.period === 'weekly' ? 'week' : 'month'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">
                          {progress.current} / {progress.target}
                          {goal.type === 'responseRate' ? '%' : ''} (
                          {progress.percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={progress.percentage} className="h-2" />
                    </div>

                    {progress.status === 'achieved' && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Goal achieved! 🎉</span>
                      </div>
                    )}

                    {progress.status === 'behind' && (
                      <div className="flex items-center gap-2 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          {progress.target - progress.current} more needed to reach your goal
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
