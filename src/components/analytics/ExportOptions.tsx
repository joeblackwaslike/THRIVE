import { format, subDays } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Application, Interview } from '@/types';
import type { AnalyticsMetrics } from '@/types/analytics';

interface ExportOptionsProps {
  applications: Application[];
  interviews: Interview[];
  metrics: AnalyticsMetrics;
}

type PeriodType = 'all' | '7' | '30' | '90' | '180' | '365' | 'custom';

export function ExportOptions({ applications, interviews, metrics }: ExportOptionsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportType, setExportType] = useState<'applications' | 'interviews' | 'summary'>(
    'applications',
  );
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [lastExport, setLastExport] = useState<string | null>(null);

  // Filter data by selected period
  const filteredData = useMemo(() => {
    if (period === 'all') {
      return { applications, interviews };
    }

    let startDate: Date;
    let endDate: Date = new Date();

    if (period === 'custom') {
      if (!customDateRange?.from) {
        return { applications, interviews };
      }
      startDate = customDateRange.from;
      endDate = customDateRange.to || customDateRange.from;
    } else {
      const daysBack = parseInt(period, 10);
      startDate = subDays(endDate, daysBack);
    }

    const filteredApps = applications.filter((app) => {
      if (!app.appliedDate) return false;
      const appDate = new Date(app.appliedDate);
      return appDate >= startDate && appDate <= endDate;
    });

    const filteredInterviews = interviews.filter((interview) => {
      if (!interview.scheduledAt) return false;
      const interviewDate = new Date(interview.scheduledAt);
      return interviewDate >= startDate && interviewDate <= endDate;
    });

    return { applications: filteredApps, interviews: filteredInterviews };
  }, [applications, interviews, period, customDateRange]);

  // Export applications to CSV
  const exportApplicationsCSV = () => {
    const headers = [
      'Company',
      'Position',
      'Status',
      'Applied Date',
      'Location',
      'Work Type',
      'Employment Type',
      'Salary Min',
      'Salary Max',
      'Priority',
      'Tags',
    ];

    const rows = filteredData.applications.map((app) => [
      app.companyName,
      app.position,
      app.status,
      app.appliedDate ? format(new Date(app.appliedDate), 'yyyy-MM-dd') : '',
      app.location || '',
      app.workType || '',
      app.employmentType || '',
      app.salary?.min || '',
      app.salary?.max || '',
      app.priority || '',
      (app.tags || []).join('; '),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    downloadFile(csv, 'applications.csv', 'text/csv');
  };

  // Export interviews to CSV
  const exportInterviewsCSV = () => {
    const headers = [
      'Application',
      'Company',
      'Type',
      'Status',
      'Scheduled At',
      'Duration (min)',
      'Location',
      'Meeting URL',
      'Interviewers',
    ];

    const rows = filteredData.interviews.map((interview) => {
      const app = applications.find((a) => a.id === interview.applicationId);
      return [
        app ? `${app.companyName} - ${app.position}` : 'Unknown',
        app?.companyName || '',
        interview.type,
        interview.status,
        interview.scheduledAt ? format(new Date(interview.scheduledAt), 'yyyy-MM-dd HH:mm') : '',
        interview.duration || '',
        interview.location || '',
        interview.meetingUrl || '',
        (interview.interviewers || []).map((i) => i.name).join('; '),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    downloadFile(csv, 'interviews.csv', 'text/csv');
  };

  // Export summary to CSV
  const exportSummaryCSV = () => {
    const data = [
      ['Metric', 'Value'],
      ['Total Applications', metrics.totalApplications],
      ['Active Applications', metrics.activeApplications],
      ['Rejected Applications', metrics.rejectedApplications],
      ['Successful Applications', metrics.successfulApplications],
      ['Response Rate', `${metrics.responseRate.toFixed(1)}%`],
      ['Average Response Time', `${metrics.averageResponseTime.toFixed(0)} days`],
      ['Total Interviews', metrics.totalInterviews],
      ['Interview Conversion Rate', `${metrics.interviewConversionRate.toFixed(1)}%`],
      ['Offer Rate', `${metrics.offerRate.toFixed(1)}%`],
      ['Interview to Offer Rate', `${metrics.interviewToOfferRate.toFixed(1)}%`],
      ['Applications This Week', metrics.applicationsThisWeek],
      ['Applications This Month', metrics.applicationsThisMonth],
      ['Interviews This Week', metrics.interviewsThisWeek],
      ['Interviews This Month', metrics.interviewsThisMonth],
    ];

    const csv = data.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    downloadFile(csv, 'analytics-summary.csv', 'text/csv');
  };

  // Export to JSON
  const exportJSON = () => {
    let data: unknown;
    let filename: string;

    switch (exportType) {
      case 'applications':
        data = filteredData.applications;
        filename = 'applications.json';
        break;
      case 'interviews':
        data = filteredData.interviews;
        filename = 'interviews.json';
        break;
      case 'summary':
        data = {
          exportDate: new Date().toISOString(),
          period: period === 'all' ? 'All time' : `Last ${period} days`,
          metrics,
          summary: {
            totalApplications: filteredData.applications.length,
            totalInterviews: filteredData.interviews.length,
            uniqueCompanies: new Set(filteredData.applications.map((a) => a.companyName)).size,
          },
        };
        filename = 'analytics-summary.json';
        break;
    }

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, filename, 'application/json');
  };

  // Handle export based on format
  const handleExport = () => {
    if (exportFormat === 'csv') {
      switch (exportType) {
        case 'applications':
          exportApplicationsCSV();
          break;
        case 'interviews':
          exportInterviewsCSV();
          break;
        case 'summary':
          exportSummaryCSV();
          break;
      }
    } else {
      exportJSON();
    }

    setLastExport(format(new Date(), 'MMM dd, yyyy HH:mm'));
  };

  // Helper to download file
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print current page
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>Download your job search data in various formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Time Period</div>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Export Type</div>
              <Select
                value={exportType}
                onValueChange={(v) => setExportType(v as typeof exportType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applications">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Applications Data
                    </div>
                  </SelectItem>
                  <SelectItem value="interviews">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Interviews Data
                    </div>
                  </SelectItem>
                  <SelectItem value="summary">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Analytics Summary
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">File Format</div>
              <Select
                value={exportFormat}
                onValueChange={(v) => setExportFormat(v as typeof exportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Excel Compatible)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON (Developer Friendly)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {period === 'custom' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Select Date Range</div>
              <DateRangePicker value={customDateRange} onChange={setCustomDateRange} />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Showing {filteredData.applications.length} application(s) and{' '}
              {filteredData.interviews.length} interview(s)
              {period === 'custom' && customDateRange?.from && (
                <>
                  {' '}
                  from {format(customDateRange.from, 'MMM dd, yyyy')}
                  {customDateRange.to && ` to ${format(customDateRange.to, 'MMM dd, yyyy')}`}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExport} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Export {exportFormat.toUpperCase()}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>

          {lastExport && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Last exported: {lastExport}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Export Buttons */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{filteredData.applications.length}</div>
            <div className="text-xs text-muted-foreground">
              {period === 'all'
                ? 'all time'
                : period === 'custom'
                  ? customDateRange?.from
                    ? `${format(customDateRange.from, 'MMM dd')} - ${customDateRange.to ? format(customDateRange.to, 'MMM dd') : 'now'}`
                    : 'select dates'
                  : `last ${period} days`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportType('applications');
                  setExportFormat('csv');
                  exportApplicationsCSV();
                }}
                className="flex-1"
              >
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportType('applications');
                  setExportFormat('json');
                  exportJSON();
                }}
                className="flex-1"
              >
                <FileJson className="mr-1 h-3 w-3" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{filteredData.interviews.length}</div>
            <div className="text-xs text-muted-foreground">
              {period === 'all'
                ? 'all time'
                : period === 'custom'
                  ? customDateRange?.from
                    ? `${format(customDateRange.from, 'MMM dd')} - ${customDateRange.to ? format(customDateRange.to, 'MMM dd') : 'now'}`
                    : 'select dates'
                  : `last ${period} days`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportType('interviews');
                  setExportFormat('csv');
                  exportInterviewsCSV();
                }}
                className="flex-1"
              >
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportType('interviews');
                  setExportFormat('json');
                  exportJSON();
                }}
                className="flex-1"
              >
                <FileJson className="mr-1 h-3 w-3" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Summary Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{Object.keys(metrics).length}</div>
            <div className="text-xs text-muted-foreground">metrics available</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportType('summary');
                  setExportFormat('csv');
                  exportSummaryCSV();
                }}
                className="flex-1"
              >
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportType('summary');
                  setExportFormat('json');
                  exportJSON();
                }}
                className="flex-1"
              >
                <FileJson className="mr-1 h-3 w-3" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">
              CSV
            </Badge>
            <p>Best for importing into Excel, Google Sheets, or other spreadsheet applications</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">
              JSON
            </Badge>
            <p>Best for developers, backups, or importing into other applications</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">
              Print
            </Badge>
            <p>Use Ctrl+P or Cmd+P for print preview. The page is optimized for printing.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
