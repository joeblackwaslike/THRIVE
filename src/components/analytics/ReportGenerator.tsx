import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateAnalytics } from '@/lib/analytics';
import type { Application, Interview } from '@/types';

interface ReportGeneratorProps {
  applications: Application[];
  interviews: Interview[];
}

type ReportType = 'weekly' | 'monthly' | 'custom';
type ReportFormat = 'html' | 'text';

export function ReportGenerator({ applications, interviews }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('html');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  // Calculate report period
  const reportPeriod = useMemo(() => {
    const now = new Date();
    switch (reportType) {
      case 'weekly':
        return {
          start: startOfWeek(subWeeks(now, 1)),
          end: endOfWeek(subWeeks(now, 1)),
          label: 'Last Week',
        };
      case 'monthly':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1)),
          label: 'Last Month',
        };
      case 'custom':
        return {
          start: subDays(now, 7),
          end: now,
          label: 'Last 7 Days',
        };
    }
  }, [reportType]);

  // Calculate metrics for current and previous period
  const currentMetrics = useMemo(
    () => calculateAnalytics(applications, interviews, reportPeriod),
    [applications, interviews, reportPeriod],
  );

  const previousPeriod = useMemo(() => {
    const duration = reportPeriod.end.getTime() - reportPeriod.start.getTime();
    return {
      start: new Date(reportPeriod.start.getTime() - duration),
      end: reportPeriod.start,
    };
  }, [reportPeriod]);

  const previousMetrics = useMemo(
    () => calculateAnalytics(applications, interviews, previousPeriod),
    [applications, interviews, previousPeriod],
  );

  // Calculate trends
  const calculateChange = useCallback((current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change * 10) / 10),
      direction:
        change > 0 ? ('up' as const) : change < 0 ? ('down' as const) : ('neutral' as const),
    };
  }, []);

  // Generate HTML report
  const generateHTMLReport = () => {
    const trends = {
      applications: calculateChange(
        currentMetrics.totalApplications,
        previousMetrics.totalApplications,
      ),
      interviews: calculateChange(currentMetrics.totalInterviews, previousMetrics.totalInterviews),
      responseRate: calculateChange(currentMetrics.responseRate, previousMetrics.responseRate),
      offerRate: calculateChange(currentMetrics.offerRate, previousMetrics.offerRate),
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Search Report - ${reportPeriod.label}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f9fafb;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 3px solid #3b82f6;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      color: #1f2937;
    }
    .header .period {
      color: #6b7280;
      font-size: 18px;
      margin-top: 10px;
    }
    .header .generated {
      color: #9ca3af;
      font-size: 14px;
      margin-top: 5px;
    }
    .section {
      background: white;
      padding: 25px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin-top: 0;
      color: #1f2937;
      font-size: 24px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .metric {
      padding: 15px;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .metric-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .metric-trend {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .trend-up { color: #10b981; }
    .trend-down { color: #ef4444; }
    .trend-neutral { color: #6b7280; }
    .achievements {
      list-style: none;
      padding: 0;
    }
    .achievements li {
      padding: 12px 15px;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .achievements li:before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      margin-right: 10px;
    }
    .insights {
      background: #eff6ff;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .insights h3 {
      margin-top: 0;
      color: #1e40af;
      font-size: 18px;
    }
    .insights ul {
      margin: 10px 0 0 0;
      padding-left: 20px;
    }
    .insights li {
      margin-bottom: 8px;
      color: #1e3a8a;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #9ca3af;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Job Search Progress Report</h1>
    <div class="period">${reportPeriod.label}</div>
    <div class="period">${format(reportPeriod.start, 'MMM dd, yyyy')} - ${format(reportPeriod.end, 'MMM dd, yyyy')}</div>
    <div class="generated">Generated on ${format(new Date(), 'MMMM dd, yyyy at HH:mm')}</div>
  </div>

  <div class="section">
    <h2>📈 Key Metrics</h2>
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Applications Submitted</div>
        <div class="metric-value">${currentMetrics.totalApplications}</div>
        <div class="metric-trend trend-${trends.applications.direction}">
          ${trends.applications.direction === 'up' ? '↑' : trends.applications.direction === 'down' ? '↓' : '→'}
          ${trends.applications.value}% vs previous period
        </div>
      </div>
      <div class="metric">
        <div class="metric-label">Interviews Scheduled</div>
        <div class="metric-value">${currentMetrics.totalInterviews}</div>
        <div class="metric-trend trend-${trends.interviews.direction}">
          ${trends.interviews.direction === 'up' ? '↑' : trends.interviews.direction === 'down' ? '↓' : '→'}
          ${trends.interviews.value}% vs previous period
        </div>
      </div>
      <div class="metric">
        <div class="metric-label">Response Rate</div>
        <div class="metric-value">${currentMetrics.responseRate.toFixed(1)}%</div>
        <div class="metric-trend trend-${trends.responseRate.direction}">
          ${trends.responseRate.direction === 'up' ? '↑' : trends.responseRate.direction === 'down' ? '↓' : '→'}
          ${trends.responseRate.value}% vs previous period
        </div>
      </div>
      <div class="metric">
        <div class="metric-label">Offer Rate</div>
        <div class="metric-value">${currentMetrics.offerRate.toFixed(1)}%</div>
        <div class="metric-trend trend-${trends.offerRate.direction}">
          ${trends.offerRate.direction === 'up' ? '↑' : trends.offerRate.direction === 'down' ? '↓' : '→'}
          ${trends.offerRate.value}% vs previous period
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🎯 Achievements</h2>
    <ul class="achievements">
      ${currentMetrics.totalApplications > 0 ? `<li>Submitted ${currentMetrics.totalApplications} job applications</li>` : ''}
      ${currentMetrics.totalInterviews > 0 ? `<li>Secured ${currentMetrics.totalInterviews} interviews</li>` : ''}
      ${currentMetrics.successfulApplications > 0 ? `<li>Received ${currentMetrics.successfulApplications} job offers</li>` : ''}
      ${currentMetrics.responseRate > 50 ? `<li>Achieved ${currentMetrics.responseRate.toFixed(0)}% response rate from applications</li>` : ''}
      ${currentMetrics.interviewConversionRate > 10 ? `<li>Converted ${currentMetrics.interviewConversionRate.toFixed(0)}% of applications to interviews</li>` : ''}
      ${currentMetrics.totalApplications === 0 && currentMetrics.totalInterviews === 0 ? '<li>No applications or interviews recorded for this period</li>' : ''}
    </ul>
  </div>

  <div class="section">
    <h2>💡 Insights & Recommendations</h2>
    <div class="insights">
      <h3>What's Working:</h3>
      <ul>
        ${currentMetrics.responseRate > previousMetrics.responseRate ? '<li>Your response rate improved - keep using the same application strategies</li>' : ''}
        ${currentMetrics.interviewConversionRate > 15 ? '<li>Strong interview conversion rate - your profile is standing out</li>' : ''}
        ${currentMetrics.totalApplications > previousMetrics.totalApplications ? '<li>Increased application volume - maintaining good momentum</li>' : ''}
        ${currentMetrics.responseRate <= previousMetrics.responseRate && currentMetrics.interviewConversionRate <= 15 && currentMetrics.totalApplications <= previousMetrics.totalApplications ? '<li>Continue refining your application strategy and targeting relevant positions</li>' : ''}
      </ul>
      <h3>Areas to Focus:</h3>
      <ul>
        ${currentMetrics.responseRate < 30 ? '<li>Consider improving your resume and cover letter to increase response rates</li>' : ''}
        ${currentMetrics.totalInterviews === 0 ? '<li>Focus on getting more interviews - tailor applications to job requirements</li>' : ''}
        ${currentMetrics.averageResponseTime > 14 ? '<li>Follow up on applications after 7-10 days to increase engagement</li>' : ''}
        ${currentMetrics.totalApplications < 5 ? '<li>Increase application volume to improve your chances of success</li>' : ''}
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>📊 Additional Statistics</h2>
    <ul>
      <li><strong>Active Applications:</strong> ${currentMetrics.activeApplications}</li>
      <li><strong>Rejected Applications:</strong> ${currentMetrics.rejectedApplications}</li>
      <li><strong>Average Response Time:</strong> ${currentMetrics.averageResponseTime.toFixed(0)} days</li>
      <li><strong>Interview Conversion Rate:</strong> ${currentMetrics.interviewConversionRate.toFixed(1)}%</li>
      <li><strong>Scheduled Interviews:</strong> ${currentMetrics.scheduledInterviews}</li>
      <li><strong>Completed Interviews:</strong> ${currentMetrics.completedInterviews}</li>
    </ul>
  </div>

  <div class="footer">
    <p>Generated by Thrive - Job Search Tracking Application</p>
    <p>Keep up the great work! 💪</p>
  </div>
</body>
</html>
    `.trim();

    return html;
  };

  // Generate text report
  const generateTextReport = () => {
    const trends = {
      applications: calculateChange(
        currentMetrics.totalApplications,
        previousMetrics.totalApplications,
      ),
      interviews: calculateChange(currentMetrics.totalInterviews, previousMetrics.totalInterviews),
      responseRate: calculateChange(currentMetrics.responseRate, previousMetrics.responseRate),
      offerRate: calculateChange(currentMetrics.offerRate, previousMetrics.offerRate),
    };

    const getTrendSymbol = (direction: 'up' | 'down' | 'neutral') => {
      return direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
    };

    const text = `
═══════════════════════════════════════════════════════════
           JOB SEARCH PROGRESS REPORT
═══════════════════════════════════════════════════════════

Period: ${reportPeriod.label}
Dates: ${format(reportPeriod.start, 'MMM dd, yyyy')} - ${format(reportPeriod.end, 'MMM dd, yyyy')}
Generated: ${format(new Date(), 'MMMM dd, yyyy at HH:mm')}

───────────────────────────────────────────────────────────
KEY METRICS
───────────────────────────────────────────────────────────

Applications Submitted: ${currentMetrics.totalApplications}
  ${getTrendSymbol(trends.applications.direction)} ${trends.applications.value}% vs previous period

Interviews Scheduled: ${currentMetrics.totalInterviews}
  ${getTrendSymbol(trends.interviews.direction)} ${trends.interviews.value}% vs previous period

Response Rate: ${currentMetrics.responseRate.toFixed(1)}%
  ${getTrendSymbol(trends.responseRate.direction)} ${trends.responseRate.value}% vs previous period

Offer Rate: ${currentMetrics.offerRate.toFixed(1)}%
  ${getTrendSymbol(trends.offerRate.direction)} ${trends.offerRate.value}% vs previous period

───────────────────────────────────────────────────────────
ACHIEVEMENTS
───────────────────────────────────────────────────────────

${currentMetrics.totalApplications > 0 ? `✓ Submitted ${currentMetrics.totalApplications} job applications` : ''}
${currentMetrics.totalInterviews > 0 ? `✓ Secured ${currentMetrics.totalInterviews} interviews` : ''}
${currentMetrics.successfulApplications > 0 ? `✓ Received ${currentMetrics.successfulApplications} job offers` : ''}
${currentMetrics.responseRate > 50 ? `✓ Achieved ${currentMetrics.responseRate.toFixed(0)}% response rate` : ''}
${currentMetrics.interviewConversionRate > 10 ? `✓ Converted ${currentMetrics.interviewConversionRate.toFixed(0)}% of applications to interviews` : ''}
${currentMetrics.totalApplications === 0 && currentMetrics.totalInterviews === 0 ? '• No applications or interviews recorded for this period' : ''}

───────────────────────────────────────────────────────────
INSIGHTS & RECOMMENDATIONS
───────────────────────────────────────────────────────────

What's Working:
${currentMetrics.responseRate > previousMetrics.responseRate ? '• Your response rate improved - keep using the same strategies' : ''}
${currentMetrics.interviewConversionRate > 15 ? '• Strong interview conversion - your profile is standing out' : ''}
${currentMetrics.totalApplications > previousMetrics.totalApplications ? '• Increased application volume - maintaining good momentum' : ''}
${currentMetrics.responseRate <= previousMetrics.responseRate && currentMetrics.interviewConversionRate <= 15 && currentMetrics.totalApplications <= previousMetrics.totalApplications ? '• Continue refining your strategy and targeting relevant positions' : ''}

Areas to Focus:
${currentMetrics.responseRate < 30 ? '• Improve resume and cover letter to increase response rates' : ''}
${currentMetrics.totalInterviews === 0 ? '• Focus on getting interviews - tailor applications better' : ''}
${currentMetrics.averageResponseTime > 14 ? '• Follow up on applications after 7-10 days' : ''}
${currentMetrics.totalApplications < 5 ? '• Increase application volume for better chances' : ''}

───────────────────────────────────────────────────────────
ADDITIONAL STATISTICS
───────────────────────────────────────────────────────────

Active Applications: ${currentMetrics.activeApplications}
Rejected Applications: ${currentMetrics.rejectedApplications}
Average Response Time: ${currentMetrics.averageResponseTime.toFixed(0)} days
Interview Conversion Rate: ${currentMetrics.interviewConversionRate.toFixed(1)}%
Scheduled Interviews: ${currentMetrics.scheduledInterviews}
Completed Interviews: ${currentMetrics.completedInterviews}

═══════════════════════════════════════════════════════════
Generated by Thrive - Job Search Tracking Application
Keep up the great work! 💪
═══════════════════════════════════════════════════════════
    `.trim();

    return text;
  };

  // Download report
  const handleGenerateReport = () => {
    const content = reportFormat === 'html' ? generateHTMLReport() : generateTextReport();
    const mimeType = reportFormat === 'html' ? 'text/html' : 'text/plain';
    const extension = reportFormat === 'html' ? 'html' : 'txt';
    const filename = `job-search-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.${extension}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLastGenerated(format(new Date(), 'MMM dd, yyyy HH:mm'));
  };

  // Calculate trend icon
  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Calculate all trends for preview
  const trends = useMemo(
    () => ({
      applications: calculateChange(
        currentMetrics.totalApplications,
        previousMetrics.totalApplications,
      ),
      interviews: calculateChange(currentMetrics.totalInterviews, previousMetrics.totalInterviews),
      responseRate: calculateChange(currentMetrics.responseRate, previousMetrics.responseRate),
      offerRate: calculateChange(currentMetrics.offerRate, previousMetrics.offerRate),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [
      currentMetrics.totalApplications,
      currentMetrics.totalInterviews,
      currentMetrics.responseRate,
      currentMetrics.offerRate,
      previousMetrics.totalApplications,
      previousMetrics.totalInterviews,
      previousMetrics.responseRate,
      previousMetrics.offerRate,
      calculateChange,
    ],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Automated Report Generation
          </CardTitle>
          <CardDescription>Generate comprehensive reports with insights and trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Report Period</div>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Report (Last Week)</SelectItem>
                  <SelectItem value="monthly">Monthly Report (Last Month)</SelectItem>
                  <SelectItem value="custom">Custom (Last 7 Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Report Format</div>
              <Select
                value={reportFormat}
                onValueChange={(v) => setReportFormat(v as ReportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="html">HTML (Styled Report)</SelectItem>
                  <SelectItem value="text">Text (Plain Format)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {reportPeriod.label}: {format(reportPeriod.start, 'MMM dd')} -{' '}
              {format(reportPeriod.end, 'MMM dd, yyyy')}
            </span>
          </div>

          <Button onClick={handleGenerateReport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Generate & Download Report
          </Button>

          {lastGenerated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Last generated: {lastGenerated}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Preview</CardTitle>
          <CardDescription>Preview of metrics that will be included in your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Applications</div>
              <div className="text-2xl font-bold">{currentMetrics.totalApplications}</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {getTrendIcon(trends.applications.direction)}
                <span
                  className={
                    trends.applications.direction === 'up'
                      ? 'text-green-600'
                      : trends.applications.direction === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }
                >
                  {trends.applications.value}% vs previous
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Interviews</div>
              <div className="text-2xl font-bold">{currentMetrics.totalInterviews}</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {getTrendIcon(trends.interviews.direction)}
                <span
                  className={
                    trends.interviews.direction === 'up'
                      ? 'text-green-600'
                      : trends.interviews.direction === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }
                >
                  {trends.interviews.value}% vs previous
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Response Rate</div>
              <div className="text-2xl font-bold">{currentMetrics.responseRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {getTrendIcon(trends.responseRate.direction)}
                <span
                  className={
                    trends.responseRate.direction === 'up'
                      ? 'text-green-600'
                      : trends.responseRate.direction === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }
                >
                  {trends.responseRate.value}% vs previous
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Offer Rate</div>
              <div className="text-2xl font-bold">{currentMetrics.offerRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {getTrendIcon(trends.offerRate.direction)}
                <span
                  className={
                    trends.offerRate.direction === 'up'
                      ? 'text-green-600'
                      : trends.offerRate.direction === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }
                >
                  {trends.offerRate.value}% vs previous
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-1">Report Contents:</div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Key metrics with trend analysis</li>
              <li>• Period-over-period comparisons</li>
              <li>• Achievements and milestones</li>
              <li>• Personalized insights and recommendations</li>
              <li>• Detailed statistics breakdown</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Report Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">
              Weekly
            </Badge>
            <p>Best for tracking short-term progress and maintaining momentum</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">
              Monthly
            </Badge>
            <p>Ideal for comprehensive reviews and identifying long-term trends</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">
              HTML
            </Badge>
            <p>Styled report perfect for viewing in browser or sharing</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">
              Text
            </Badge>
            <p>Plain text format suitable for email or note-taking apps</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
