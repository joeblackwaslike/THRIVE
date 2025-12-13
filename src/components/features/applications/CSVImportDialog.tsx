import { AlertCircle, CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  autoDetectMapping,
  type CSVImportResult,
  type FieldMapping,
  type ImportPreview,
  parseCSVFile,
  previewImport,
} from '@/lib/import';
import { useApplicationsStore } from '@/stores';
import type { Application } from '@/types';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

const APPLICATION_FIELDS: Array<{ value: keyof Application | 'none'; label: string }> = [
  { value: 'none', label: 'Do not import' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'position', label: 'Position' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'targetDate', label: 'Target Date' },
  { value: 'appliedDate', label: 'Applied Date' },
  { value: 'firstInterviewDate', label: 'First Interview Date' },
  { value: 'offerDate', label: 'Offer Date' },
  { value: 'responseDeadline', label: 'Response Deadline' },
  { value: 'location', label: 'Location' },
  { value: 'workType', label: 'Work Type' },
  { value: 'employmentType', label: 'Employment Type' },
  { value: 'salary', label: 'Salary' },
  { value: 'jobUrl', label: 'Job URL' },
  { value: 'jobDescription', label: 'Job Description' },
  { value: 'notes', label: 'Notes' },
  { value: 'tags', label: 'Tags' },
  { value: 'source', label: 'Source' },
  { value: 'referralName', label: 'Referral Name' },
];

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const { applications, addApplication } = useApplicationsStore();
  const fileInputId = `csv-file-${crypto.randomUUID()}`;
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCSVData] = useState<CSVImportResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid File', {
        description: 'Please upload a CSV file',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSVFile(content);

        if (parsed.totalRows === 0) {
          toast.error('Empty File', {
            description: 'The CSV file contains no data',
          });
          return;
        }

        setCSVData(parsed);
        const mappings = autoDetectMapping(parsed.headers);
        setFieldMappings(mappings);
        setStep('mapping');

        toast.success('File Uploaded', {
          description: `Loaded ${parsed.totalRows} rows`,
        });
      } catch (error) {
        toast.error('Parse Error', {
          description: 'Failed to parse CSV file',
        });
        console.error('CSV parse error:', error);
      }
    };

    reader.readAsText(file);
  }, []);

  const handleMappingChange = useCallback(
    (csvColumn: string, appField: keyof Application | 'none') => {
      setFieldMappings((prev) =>
        prev.map((m) =>
          m.csvColumn === csvColumn ? { ...m, appField: appField === 'none' ? null : appField } : m,
        ),
      );
    },
    [],
  );

  const handleGeneratePreview = useCallback(() => {
    if (!csvData) return;

    const previewResult = previewImport(csvData.rows, csvData.headers, fieldMappings, applications);
    setPreview(previewResult);
    setStep('preview');
  }, [csvData, fieldMappings, applications]);

  const handleImport = useCallback(async () => {
    if (!preview) return;

    setImporting(true);
    try {
      // Import valid applications
      for (const app of preview.valid) {
        await addApplication(app);
      }

      setStep('complete');
      toast.success('Import Complete', {
        description: `Successfully imported ${preview.totalValid} applications`,
      });
    } catch (error) {
      toast.error('Import Failed', {
        description: 'An error occurred during import',
      });
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  }, [preview, addApplication]);

  const handleClose = useCallback(() => {
    setStep('upload');
    setCSVData(null);
    setFieldMappings([]);
    setPreview(null);
    setImporting(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const canProceedToPreview = useMemo(() => {
    // Must have at least companyName, position, and status mapped
    const hasCompany = fieldMappings.some((m) => m.appField === 'companyName');
    const hasPosition = fieldMappings.some((m) => m.appField === 'position');
    const hasStatus = fieldMappings.some((m) => m.appField === 'status');
    return hasCompany && hasPosition && hasStatus;
  }, [fieldMappings]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Applications from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map the columns to import applications
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a CSV file containing your application data
                </p>
              </div>
              <Label htmlFor={fileInputId}>
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>Choose File</span>
                </div>
                <Input
                  id={fileInputId}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === 'mapping' && csvData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Map CSV Columns</h3>
                  <p className="text-sm text-muted-foreground">
                    Map your CSV columns to application fields
                  </p>
                </div>
                <Badge variant="secondary">{csvData.totalRows} rows</Badge>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {fieldMappings.map((mapping) => (
                    <div key={mapping.csvColumn} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{mapping.csvColumn}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sample:{' '}
                          {csvData.rows[0]?.[csvData.headers.indexOf(mapping.csvColumn)] || 'N/A'}
                        </p>
                      </div>
                      <div className="w-48">
                        <Select
                          value={mapping.appField || 'none'}
                          onValueChange={(value) =>
                            handleMappingChange(
                              mapping.csvColumn,
                              value as keyof Application | 'none',
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APPLICATION_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {!canProceedToPreview && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-950/50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>Required fields: Company Name, Position, and Status</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Import Preview</h3>
                <p className="text-sm text-muted-foreground">Review the import results</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {preview.totalValid}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">Valid</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {preview.totalInvalid}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">Invalid</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                  <X className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {preview.totalDuplicates}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Duplicates</p>
                  </div>
                </div>
              </div>

              {(preview.invalid.length > 0 || preview.duplicates.length > 0) && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {preview.invalid.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-red-900 dark:text-red-100">
                          Invalid Rows
                        </h4>
                        <div className="space-y-2">
                          {preview.invalid.slice(0, 5).map((item) => (
                            <div
                              key={item.row}
                              className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                            >
                              <p className="text-sm font-medium mb-1">Row {item.row}</p>
                              <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                                {item.errors.map((error) => (
                                  <li key={`${item.row}-${error.field}`}>• {error.message}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {preview.invalid.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ... and {preview.invalid.length - 5} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {preview.duplicates.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-100">
                          Duplicate Rows (will be skipped)
                        </h4>
                        <div className="space-y-2">
                          {preview.duplicates.slice(0, 5).map((item) => (
                            <div
                              key={item.row}
                              className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20"
                            >
                              <p className="text-sm font-medium">Row {item.row}</p>
                              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                {item.data['Company Name']} - {item.data.Position}
                              </p>
                            </div>
                          ))}
                          {preview.duplicates.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ... and {preview.duplicates.length - 5} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && preview && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {preview.totalValid} applications
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <AnimatedButton onClick={handleGeneratePreview} disabled={!canProceedToPreview}>
                Next: Preview
              </AnimatedButton>
            </>
          )}

          {step === 'preview' && preview && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <AnimatedButton
                onClick={handleImport}
                loading={importing}
                loadingText="Importing..."
                disabled={preview.totalValid === 0}
              >
                Import {preview.totalValid} Applications
              </AnimatedButton>
            </>
          )}

          {step === 'complete' && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
