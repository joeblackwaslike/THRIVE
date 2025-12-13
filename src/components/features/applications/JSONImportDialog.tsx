import { AlertCircle, CheckCircle2, FileJson, RefreshCw, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ImportMode, type JSONValidationResult, validateJSONImport } from '@/lib/import';
import { useApplicationsStore } from '@/stores';

interface JSONImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'mode' | 'preview' | 'importing' | 'complete';

export function JSONImportDialog({ open, onOpenChange }: JSONImportDialogProps) {
  const { applications, addApplication, clearApplications } = useApplicationsStore();
  const fileInputId = `json-file-${crypto.randomUUID()}`;
  const mergeRadioId = `mode-merge-${crypto.randomUUID()}`;
  const replaceRadioId = `mode-replace-${crypto.randomUUID()}`;
  const [step, setStep] = useState<ImportStep>('upload');
  const [validation, setValidation] = useState<JSONValidationResult | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.json')) {
        toast.error('Invalid File', {
          description: 'Please upload a JSON file',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const result = validateJSONImport(content, applications);

          if (result.errors.length > 0) {
            toast.error('Invalid JSON', {
              description: result.errors[0],
            });
            return;
          }

          if (result.totalRecords === 0) {
            toast.error('Empty File', {
              description: 'The JSON file contains no records',
            });
            return;
          }

          setValidation(result);
          setStep('mode');

          toast.success('File Loaded', {
            description: `Found ${result.totalRecords} records`,
          });
        } catch (error) {
          toast.error('Parse Error', {
            description: 'Failed to parse JSON file',
          });
          console.error('JSON parse error:', error);
        }
      };

      reader.readAsText(file);
    },
    [applications],
  );

  const handleModeSelect = useCallback(() => {
    setStep('preview');
  }, []);

  const handleImport = useCallback(async () => {
    if (!validation) return;

    setImporting(true);
    try {
      if (importMode === 'replace') {
        // Clear existing applications first
        await clearApplications();
      }

      // Import valid applications
      for (const app of validation.validRecords) {
        await addApplication(app);
      }

      setImportedCount(validation.validRecords.length);
      setStep('complete');

      toast.success('Import Complete', {
        description: `Successfully imported ${validation.validRecords.length} applications`,
      });
    } catch (error) {
      toast.error('Import Failed', {
        description: 'An error occurred during import',
      });
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  }, [validation, importMode, addApplication, clearApplications]);

  const handleClose = useCallback(() => {
    setStep('upload');
    setValidation(null);
    setImportMode('merge');
    setImporting(false);
    setImportedCount(0);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Applications from JSON</DialogTitle>
          <DialogDescription>
            Upload a JSON file to restore or merge application data
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
                <h3 className="text-lg font-semibold mb-2">Upload JSON File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a JSON file exported from Thrive
                </p>
              </div>
              <Label htmlFor={fileInputId}>
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <FileJson className="w-5 h-5" />
                  <span>Choose File</span>
                </div>
                <Input
                  id={fileInputId}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>
          )}

          {/* Step 2: Import Mode */}
          {step === 'mode' && validation && (
            <div className="space-y-6 py-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Import Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Select how you want to import the data
                </p>
              </div>

              <RadioGroup
                value={importMode}
                onValueChange={(value: string) => setImportMode(value as ImportMode)}
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="merge" id={mergeRadioId} />
                  <Label htmlFor={mergeRadioId} className="flex-1 cursor-pointer">
                    <div className="font-semibold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Merge with existing data
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add new applications to your current list. Duplicates will be skipped.
                    </p>
                    {applications.length > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        Current: {applications.length} applications
                      </Badge>
                    )}
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer border-red-200 dark:border-red-900">
                  <RadioGroupItem value="replace" id={replaceRadioId} />
                  <Label htmlFor={replaceRadioId} className="flex-1 cursor-pointer">
                    <div className="font-semibold flex items-center gap-2 text-red-600 dark:text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      Replace all existing data
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Delete all current applications and import from file. This cannot be undone.
                    </p>
                    {applications.length > 0 && (
                      <Badge variant="destructive" className="mt-2">
                        Will delete {applications.length} applications
                      </Badge>
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && validation && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Import Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Review the import results -{' '}
                  {importMode === 'replace' ? 'Replace mode' : 'Merge mode'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {validation.validRecords.length}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">Valid</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {validation.invalidRecords.length}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">Invalid</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                  <X className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {validation.duplicates.length}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Duplicates</p>
                  </div>
                </div>
              </div>

              {(validation.invalidRecords.length > 0 || validation.duplicates.length > 0) && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {validation.invalidRecords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-red-900 dark:text-red-100">
                          Invalid Records
                        </h4>
                        <div className="space-y-2">
                          {validation.invalidRecords.slice(0, 5).map((item) => (
                            <div
                              key={item.index}
                              className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                            >
                              <p className="text-sm font-medium mb-1">Record {item.index}</p>
                              <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                                {item.errors.map((error) => (
                                  <li key={`${item.index}-${error.substring(0, 20)}`}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {validation.invalidRecords.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ... and {validation.invalidRecords.length - 5} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {validation.duplicates.length > 0 && importMode === 'merge' && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-100">
                          Duplicate Records (will be skipped)
                        </h4>
                        <div className="space-y-2">
                          {validation.duplicates.slice(0, 5).map((item) => (
                            <div
                              key={item.index}
                              className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20"
                            >
                              <p className="text-sm font-medium">Record {item.index}</p>
                              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                {item.data.companyName} - {item.data.position}
                              </p>
                            </div>
                          ))}
                          {validation.duplicates.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ... and {validation.duplicates.length - 5} more
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
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {importedCount} applications
                </p>
                {importMode === 'replace' && (
                  <Badge variant="outline" className="mt-2">
                    Replaced all data
                  </Badge>
                )}
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

          {step === 'mode' && validation && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <AnimatedButton onClick={handleModeSelect}>Next: Preview</AnimatedButton>
            </>
          )}

          {step === 'preview' && validation && (
            <>
              <Button variant="outline" onClick={() => setStep('mode')}>
                Back to Mode
              </Button>
              <AnimatedButton
                onClick={handleImport}
                loading={importing}
                loadingText="Importing..."
                disabled={validation.validRecords.length === 0}
                variant={importMode === 'replace' ? 'destructive' : 'default'}
              >
                {importMode === 'replace' ? 'Replace & Import' : 'Merge & Import'} (
                {validation.validRecords.length})
              </AnimatedButton>
            </>
          )}

          {step === 'complete' && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
