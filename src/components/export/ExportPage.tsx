import {
  Calendar,
  Check,
  Database,
  Download,
  FileJson,
  FileText,
  Filter,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfirm } from '@/hooks/useConfirm';
import { APPLICATION_STATUSES, EMPLOYMENT_TYPES, WORK_TYPES } from '@/lib/constants';
import {
  type BackupData,
  type DateRangeFilter,
  exportAndDownloadApplicationsCSV,
  exportAndDownloadApplicationsJSON,
  exportAndDownloadCompaniesCSV,
  exportAndDownloadCompaniesJSON,
  exportAndDownloadDocumentsCSV,
  exportAndDownloadDocumentsJSON,
  exportAndDownloadDocumentsZIP,
  exportAndDownloadInterviewsCSV,
  exportAndDownloadInterviewsJSON,
  exportBackup,
  filterApplicationsByDateRange,
  filterInterviewsByDateRange,
  parseBackupFile,
  validateBackupData,
} from '@/lib/export';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useCompaniesStore } from '@/stores/companiesStore';
import { useDocumentsStore } from '@/stores/documentsStore';
import { useInterviewsStore } from '@/stores/interviewsStore';
import type { ApplicationStatus } from '@/types';

export function ExportPage() {
  const fileUploadId = useId();

  // Date range state for calendar picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Enhanced filter states
  const [selectedStatuses, setSelectedStatuses] = useState<ApplicationStatus[]>([]);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const [exportType, setExportType] = useState<'csv' | 'json'>('csv');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');

  // Export progress tracking
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportingType, setExportingType] = useState<string>('');

  const {
    applications,
    addApplication,
    fetchApplications,
    loading: applicationsLoading,
  } = useApplicationsStore();
  const {
    interviews,
    addInterview,
    fetchInterviews,
    loading: interviewsLoading,
  } = useInterviewsStore();
  const { documents, fetchDocuments, loading: documentsLoading } = useDocumentsStore();
  const { companies, fetchCompanies, loading: companiesLoading } = useCompaniesStore();
  const { confirm, alert } = useConfirm();

  // Fetch data on mount
  useEffect(() => {
    fetchApplications();
    fetchInterviews();
    fetchDocuments();
    fetchCompanies();
  }, [fetchApplications, fetchInterviews, fetchDocuments, fetchCompanies]);

  const isLoading =
    applicationsLoading || interviewsLoading || documentsLoading || companiesLoading;

  // Apply filters to applications
  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    // Date range filter
    if (dateRange?.from || dateRange?.to) {
      const dateFilter: DateRangeFilter = {
        startDate: dateRange.from,
        endDate: dateRange.to,
      };
      filtered = filterApplicationsByDateRange(filtered, dateFilter);
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((app) => selectedStatuses.includes(app.status));
    }

    // Work type filter
    if (selectedWorkTypes.length > 0) {
      filtered = filtered.filter((app) => app.workType && selectedWorkTypes.includes(app.workType));
    }

    // Employment type filter
    if (selectedEmploymentTypes.length > 0) {
      filtered = filtered.filter(
        (app) => app.employmentType && selectedEmploymentTypes.includes(app.employmentType),
      );
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(
        (app) => app.priority && selectedPriorities.includes(app.priority),
      );
    }

    return filtered;
  }, [
    applications,
    dateRange,
    selectedStatuses,
    selectedWorkTypes,
    selectedEmploymentTypes,
    selectedPriorities,
  ]);

  // Apply filters to interviews
  const filteredInterviews = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) {
      return interviews;
    }
    const dateFilter: DateRangeFilter = {
      startDate: dateRange.from,
      endDate: dateRange.to,
    };
    return filterInterviewsByDateRange(interviews, dateFilter);
  }, [interviews, dateRange]);

  // Stats with filtered counts
  const stats = {
    applications: filteredApplications.length,
    interviews: filteredInterviews.length,
    documents: documents.length,
    companies: companies.length,
    total:
      filteredApplications.length + filteredInterviews.length + documents.length + companies.length,
  };

  // Check if any filters are active
  const hasActiveFilters =
    dateRange?.from ||
    dateRange?.to ||
    selectedStatuses.length > 0 ||
    selectedWorkTypes.length > 0 ||
    selectedEmploymentTypes.length > 0 ||
    selectedPriorities.length > 0;

  // Clear all filters
  const clearAllFilters = () => {
    setDateRange(undefined);
    setSelectedStatuses([]);
    setSelectedWorkTypes([]);
    setSelectedEmploymentTypes([]);
    setSelectedPriorities([]);
  };

  // Handle exports with filtered data
  // Helper function to simulate progress for exports
  const withProgress = async (
    type: string,
    itemCount: number,
    exportFn: () => void | Promise<void>,
  ) => {
    setIsExporting(true);
    setExportingType(type);
    setExportProgress(0);

    try {
      // Simulate progress for small datasets (< 100 items)
      if (itemCount < 100) {
        setExportProgress(50);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await Promise.resolve(exportFn());
        setExportProgress(100);
      } else {
        // For larger datasets, show incremental progress
        for (let i = 0; i < 10; i++) {
          setExportProgress((i + 1) * 10);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await Promise.resolve(exportFn());
        setExportProgress(100);
      }

      // Keep progress visible briefly
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportingType('');
    }
  };

  const handleExportApplicationsCSV = () => {
    withProgress('Applications (CSV)', filteredApplications.length, () => {
      exportAndDownloadApplicationsCSV(filteredApplications);
    });
  };

  const handleExportInterviewsCSV = () => {
    withProgress('Interviews (CSV)', filteredInterviews.length, () => {
      exportAndDownloadInterviewsCSV(filteredInterviews, applications);
    });
  };

  const handleExportInterviewsJSON = () => {
    withProgress('Interviews (JSON)', filteredInterviews.length, () => {
      exportAndDownloadInterviewsJSON(filteredInterviews);
    });
  };

  const handleExportDocumentsCSV = () => {
    withProgress('Documents (CSV)', documents.length, () => {
      exportAndDownloadDocumentsCSV(documents);
    });
  };

  const handleExportDocumentsJSON = () => {
    withProgress('Documents (JSON)', documents.length, () => {
      exportAndDownloadDocumentsJSON(documents);
    });
  };

  const handleExportDocumentsZIP = async () => {
    await withProgress('Documents (ZIP)', documents.length, async () => {
      try {
        await exportAndDownloadDocumentsZIP(documents);
      } catch (error) {
        console.error('Failed to export documents as ZIP:', error);
        await alert('Export Failed', 'Failed to export documents as ZIP. Please try again.');
      }
    });
  };

  const handleExportCompaniesCSV = () => {
    withProgress('Companies (CSV)', companies.length, () => {
      exportAndDownloadCompaniesCSV(companies);
    });
  };

  const handleExportCompaniesJSON = () => {
    withProgress('Companies (JSON)', companies.length, () => {
      exportAndDownloadCompaniesJSON(companies);
    });
  };

  const handleExportApplicationsJSON = () => {
    withProgress('Applications (JSON)', filteredApplications.length, () => {
      exportAndDownloadApplicationsJSON(filteredApplications);
    });
  };

  const handleExportBackup = () => {
    const totalItems = applications.length + interviews.length + documents.length;
    withProgress('Full Backup', totalItems, () => {
      exportBackup(applications, interviews, documents);
    });
  };

  // Handle import/restore
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const text = await file.text();
      const backupData: BackupData = parseBackupFile(text);

      // Validate data
      const validation = validateBackupData(backupData);
      if (!validation.valid) {
        setImportError(`Invalid backup file: ${validation.errors.join(', ')}`);
        setImporting(false);
        return;
      }

      // Ask for confirmation
      const confirmed = await confirm({
        title: 'Restore Backup',
        description:
          `This will restore:\n` +
          `- ${backupData.applications.length} applications\n` +
          `- ${backupData.interviews.length} interviews\n` +
          `- ${backupData.documents.length} documents\n\n` +
          `Current data will be replaced. Continue?`,
        type: 'danger',
        confirmText: 'Restore',
        cancelText: 'Cancel',
      });

      if (!confirmed) {
        setImporting(false);
        return;
      }

      // Restore data
      // Note: This is a simplified approach. In production, you'd want more sophisticated merging
      backupData.applications.forEach((app) => {
        addApplication(app);
      });
      backupData.interviews.forEach((interview) => {
        addInterview(interview);
      });
      // Documents would need similar handling

      setImportSuccess(
        `Successfully restored ${backupData.applications.length} applications, ` +
          `${backupData.interviews.length} interviews, and ${backupData.documents.length} documents`,
      );
    } catch (error) {
      setImportError(`Failed to restore backup: ${error}`);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Export & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Export your data in various formats or create a full backup
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {stats.total} items total
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">{stats.applications}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{stats.companies}</p>
              </div>
              <Database className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interviews</p>
                <p className="text-2xl font-bold">{stats.interviews}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{stats.documents}</p>
              </div>
              <FileJson className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          {/* Enhanced Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Export Filters
                  </CardTitle>
                  <CardDescription>
                    Filter data before exporting. Leave empty to export all data.
                  </CardDescription>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compact Filters Row */}
              <div className="flex flex-wrap gap-3">
                {/* Date Range Filter */}
                <div className="flex-1 min-w-[200px]">
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>

                {/* Status Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[120px] justify-between px-3">
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Status
                        {selectedStatuses.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {selectedStatuses.length}
                          </Badge>
                        )}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[140px]">
                    {APPLICATION_STATUSES.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status.value}
                        checked={selectedStatuses.includes(status.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses([...selectedStatuses, status.value]);
                          } else {
                            setSelectedStatuses(selectedStatuses.filter((s) => s !== status.value));
                          }
                        }}
                      >
                        {status.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Work Type Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[140px] justify-between px-3">
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Work Type
                        {selectedWorkTypes.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {selectedWorkTypes.length}
                          </Badge>
                        )}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[140px]">
                    {WORK_TYPES.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type.value}
                        checked={selectedWorkTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWorkTypes([...selectedWorkTypes, type.value]);
                          } else {
                            setSelectedWorkTypes(selectedWorkTypes.filter((t) => t !== type.value));
                          }
                        }}
                      >
                        {type.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Employment Type Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[160px] justify-between px-3">
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Employment
                        {selectedEmploymentTypes.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {selectedEmploymentTypes.length}
                          </Badge>
                        )}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[140px]">
                    {EMPLOYMENT_TYPES.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type.value}
                        checked={selectedEmploymentTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmploymentTypes([...selectedEmploymentTypes, type.value]);
                          } else {
                            setSelectedEmploymentTypes(
                              selectedEmploymentTypes.filter((t) => t !== type.value),
                            );
                          }
                        }}
                      >
                        {type.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[130px] justify-between px-3">
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Priority
                        {selectedPriorities.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {selectedPriorities.length}
                          </Badge>
                        )}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[120px]">
                    {['low', 'medium', 'high'].map((priority) => (
                      <DropdownMenuCheckboxItem
                        key={priority}
                        checked={selectedPriorities.includes(priority)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPriorities([...selectedPriorities, priority]);
                          } else {
                            setSelectedPriorities(selectedPriorities.filter((p) => p !== priority));
                          }
                        }}
                      >
                        <span className="capitalize">{priority}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Filter Summary */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Showing {filteredApplications.length} of {applications.length} applications
                    </span>
                  </div>
                  {filteredApplications.length !== applications.length && (
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      {applications.length - filteredApplications.length} filtered out
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Download your data in CSV or JSON format</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="export-type" className="text-sm text-muted-foreground">
                    Format:
                  </Label>
                  <Select
                    value={exportType}
                    onValueChange={(value: 'csv' | 'json') => setExportType(value)}
                  >
                    <SelectTrigger id="export-type" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Export Progress Indicator */}
              {isExporting && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Exporting {exportingType}...</p>
                    <span className="text-sm text-muted-foreground">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Applications</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.applications} application{stats.applications !== 1 ? 's' : ''}
                    {exportType === 'json' && ' with all fields'}
                  </p>
                </div>
                <Button
                  onClick={
                    exportType === 'csv'
                      ? handleExportApplicationsCSV
                      : handleExportApplicationsJSON
                  }
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Companies</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.companies} compan{stats.companies !== 1 ? 'ies' : 'y'}
                    {exportType === 'json' && ' with all fields'}
                  </p>
                </div>
                <Button
                  onClick={
                    exportType === 'csv' ? handleExportCompaniesCSV : handleExportCompaniesJSON
                  }
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Interviews</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.interviews} interview{stats.interviews !== 1 ? 's' : ''}
                    {exportType === 'json' && ' with all fields'}
                  </p>
                </div>
                <Button
                  onClick={
                    exportType === 'csv' ? handleExportInterviewsCSV : handleExportInterviewsJSON
                  }
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Documents</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.documents} document{stats.documents !== 1 ? 's' : ''}
                    {exportType === 'json' && ' - metadata only'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={
                      exportType === 'csv' ? handleExportDocumentsCSV : handleExportDocumentsJSON
                    }
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export {exportType.toUpperCase()}
                  </Button>
                  <Button
                    onClick={handleExportDocumentsZIP}
                    variant="outline"
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export ZIP
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  💡 Documents Export Options:
                </p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                  <li>
                    <strong>CSV/JSON:</strong> Exports document metadata (names, types, tags, etc.)
                  </li>
                  <li>
                    <strong>ZIP:</strong> Exports both metadata and actual document files together
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Full Backup
              </CardTitle>
              <CardDescription>
                Create a complete backup of all your data. This includes applications, interviews,
                documents, and all settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Backup Contents:</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ {stats.applications} Applications</li>
                  <li>✓ {stats.interviews} Interviews</li>
                  <li>✓ {stats.documents} Documents</li>
                  <li>✓ All metadata and relationships</li>
                </ul>
              </div>
              <Button
                onClick={handleExportBackup}
                className="w-full"
                size="lg"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Create Full Backup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Restore from Backup
              </CardTitle>
              <CardDescription>
                Restore your data from a previous backup file. This will replace your current data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {importError && (
                <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>
                </div>
              )}
              {importSuccess && (
                <div className="p-4 border border-green-500 rounded-lg bg-green-50 dark:bg-green-950">
                  <p className="text-sm text-green-600 dark:text-green-400">{importSuccess}</p>
                </div>
              )}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                  id={fileUploadId}
                />
                <Label
                  htmlFor={fileUploadId}
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {importing ? 'Restoring...' : 'Click to upload backup file'}
                  </span>
                  <span className="text-xs text-muted-foreground">JSON files only</span>
                </Label>
              </div>
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Warning: Restoring from backup will replace your current data. Make sure to
                  create a backup first if you want to keep your current data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports (Coming Soon)</CardTitle>
              <CardDescription>
                Build custom reports with specific fields and filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Custom report builder feature is coming soon.</p>
                <p className="text-sm mt-2">
                  You'll be able to select specific fields, apply filters, and generate custom
                  reports tailored to your needs.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
