// @ts-nocheck - Complex react-hook-form type inference issues with Zod resolver

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSalarySlider } from '@/components/ui/form-salary-slider';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { Textarea } from '@/components/ui/textarea';
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  PRIORITY_LEVELS,
  WORK_TYPES,
} from '@/lib/constants';
import { useApplicationsStore, useDocumentsStore } from '@/stores';
import type { Application, Document } from '@/types';

// Form schema based on application schema
const applicationFormSchema = z.object({
  position: z.string().min(1, 'Position is required').max(200),
  companyName: z.string().min(1, 'Company name is required').max(200),
  status: z.enum([
    'target',
    'hunting',
    'applied',
    'interviewing',
    'offer',
    'accepted',
    'rejected',
    'withdrawn',
  ]),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  workType: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  location: z.string().max(200).optional(),
  jobUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  salaryCurrency: z.string().optional(),
  targetDate: z.string().optional(),
  appliedDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  linkedDocumentIds: z.array(z.string()).optional(), // Document IDs to link
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface ApplicationFormProps {
  application?: Application;
  onSubmit: (data: Partial<Application>) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ApplicationForm({
  application,
  onSubmit,
  onCancel,
  isLoading = false,
}: ApplicationFormProps) {
  const { documents, addDocument } = useDocumentsStore();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ file: File; content: string } | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<Document['type']>('resume');
  const [isUploading, setIsUploading] = useState(false);

  // Document search and filter state
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<Document['type'] | 'all'>('all');

  // Get currently linked documents if editing
  const currentlyLinkedDocuments = application
    ? documents.filter((doc) => doc.usedInApplicationIds?.includes(application.id))
    : [];

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      position: application?.position || '',
      companyName: application?.companyName || '',
      status: application?.status || 'target',
      priority: application?.priority || 'medium',
      workType: application?.workType || undefined,
      employmentType: application?.employmentType || undefined,
      location: application?.location || '',
      jobUrl: application?.jobUrl || '',
      salaryMin: application?.salary?.min || undefined,
      salaryMax: application?.salary?.max || undefined,
      salaryCurrency: application?.salary?.currency || 'USD',
      targetDate: application?.targetDate
        ? new Date(application.targetDate).toISOString().split('T')[0]
        : '',
      appliedDate: application?.appliedDate
        ? new Date(application.appliedDate).toISOString().split('T')[0]
        : '',
      notes: application?.notes || '',
      tags: application?.tags?.join(', ') || '',
      linkedDocumentIds: currentlyLinkedDocuments.map((doc) => doc.id),
    },
  });

  // Track if form has been modified
  const isDirty = form.formState.isDirty;

  // Get suggested documents based on position, company, and document type
  const getSuggestedDocuments = () => {
    const position = form.watch('position')?.toLowerCase() || '';
    const companyName = form.watch('companyName')?.toLowerCase() || '';
    const selectedIds = form.watch('linkedDocumentIds') || [];

    if (!position && !companyName) return [];

    return documents
      .filter((doc) => !selectedIds.includes(doc.id)) // Exclude already selected
      .map((doc) => {
        let score = 0;
        const docName = doc.name.toLowerCase();

        // Higher score for resume/CV for any application
        if (doc.type === 'resume' || doc.type === 'cv') {
          score += 10;
        }

        // Score based on previous usage with same company
        if (companyName && doc.usedInApplicationIds && doc.usedInApplicationIds.length > 0) {
          // Check if this document was used for applications at the same company
          const usedForSameCompany = doc.usedInApplicationIds.some((appId) => {
            const app = useApplicationsStore.getState().applications.find((a) => a.id === appId);
            return app?.companyName?.toLowerCase().includes(companyName);
          });
          if (usedForSameCompany) score += 15;
        }

        // Score based on position keywords in document name
        const positionWords = position.split(' ').filter((word) => word.length > 2);
        positionWords.forEach((word) => {
          if (docName.includes(word)) score += 5;
        });

        // Bonus for recently used documents
        if (doc.lastUsedDate) {
          const daysSinceUsed =
            (Date.now() - new Date(doc.lastUsedDate).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUsed < 30) score += 3;
        }

        return { doc, score };
      })
      .filter((item) => item.score > 0) // Only show documents with relevance
      .sort((a, b) => b.score - a.score) // Sort by relevance
      .slice(0, 3) // Top 3 suggestions
      .map((item) => item.doc);
  };

  const suggestedDocuments = getSuggestedDocuments();

  // Filter documents based on search and type
  const filteredDocuments = documents.filter((doc) => {
    // Filter by search query
    if (documentSearch.trim()) {
      const searchLower = documentSearch.toLowerCase();
      const matchesName = doc.name.toLowerCase().includes(searchLower);
      const matchesType = doc.type.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesType) return false;
    }

    // Filter by document type
    if (documentTypeFilter !== 'all' && doc.type !== documentTypeFilter) {
      return false;
    }

    return true;
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      const fileContent: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Auto-detect document type from filename
      const fileName = file.name.toLowerCase();
      let detectedType: Document['type'] = 'resume';
      if (fileName.includes('cv')) detectedType = 'cv';
      else if (fileName.includes('cover')) detectedType = 'cover-letter';
      else if (fileName.includes('portfolio')) detectedType = 'portfolio';
      else if (fileName.includes('transcript')) detectedType = 'transcript';
      else if (fileName.includes('cert')) detectedType = 'certification';

      setUploadedFile({ file, content: fileContent });
      setSelectedDocType(detectedType);
      setUploadDialogOpen(true);

      // Reset the file input
      e.target.value = '';
    } catch (error) {
      console.error('Failed to read file:', error);
      toast.error('Failed to read file', {
        description: 'Please try again with a different file.',
      });
    }
  };

  const handleConfirmUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    try {
      const newDoc = await addDocument({
        name: uploadedFile.file.name.replace(/\.[^/.]+$/, ''),
        type: (selectedDocType as any).replace(/-/g, '_'),
        fileName: uploadedFile.file.name,
        fileUrl: uploadedFile.content,
        fileSize: uploadedFile.file.size,
        mimeType: uploadedFile.file.type,
        version: 1,
      });

      // Auto-select the newly uploaded document
      const currentIds = form.getValues('linkedDocumentIds') || [];
      form.setValue('linkedDocumentIds', [...currentIds, newDoc.id], { shouldDirty: true });

      toast.success('Document uploaded', {
        description: `${newDoc.name} has been added and linked to this application`,
      });

      setUploadDialogOpen(false);
      setUploadedFile(null);
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Upload failed', {
        description: 'Failed to upload document. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (values: ApplicationFormValues) => {
    // Transform form values to Application format
    const applicationData: Partial<Application> = {
      position: values.position,
      companyName: values.companyName,
      status: values.status,
      priority: values.priority,
      workType: values.workType,
      employmentType: values.employmentType,
      location: values.location || undefined,
      jobUrl: values.jobUrl || undefined,
      salary:
        values.salaryMin || values.salaryMax
          ? {
              min: values.salaryMin,
              max: values.salaryMax,
              currency: values.salaryCurrency,
            }
          : undefined,
      targetDate: values.targetDate ? new Date(values.targetDate) : undefined,
      appliedDate: values.appliedDate ? new Date(values.appliedDate) : undefined,
      notes: values.notes || undefined,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
      // Pass linkedDocumentIds for parent component to handle
      linkedDocumentIds: values.linkedDocumentIds || [],
    };

    onSubmit(applicationData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TechCorp Inc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => {
                const selectedStatus = APPLICATION_STATUSES.find((s) => s.value === field.value);
                return (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status">
                            {selectedStatus?.label}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper"
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        className="max-h-[300px]"
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{status.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {status.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIORITY_LEVELS.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Job Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="workType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WORK_TYPES.map((workType) => (
                        <SelectItem key={workType.value} value={workType.value}>
                          {workType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((empType) => (
                        <SelectItem key={empType.value} value={empType.value}>
                          {empType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., San Francisco, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://company.com/jobs/123" {...field} />
                </FormControl>
                <FormDescription>Link to the job posting</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Salary Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Salary Information</h3>
            <FormField
              control={form.control}
              name="salaryCurrency"
              render={({ field }) => (
                <FormItem className="w-[180px]">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                      <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                      <SelectItem value="HKD">HKD - Hong Kong Dollar</SelectItem>
                      <SelectItem value="NZD">NZD - New Zealand Dollar</SelectItem>
                      <SelectItem value="SEK">SEK - Swedish Krona</SelectItem>
                      <SelectItem value="NOK">NOK - Norwegian Krone</SelectItem>
                      <SelectItem value="MXN">MXN - Mexican Peso</SelectItem>
                      <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-2">
            <FormSalarySlider
              minValue={form.watch('salaryMin')}
              maxValue={form.watch('salaryMax')}
              currency={form.watch('salaryCurrency') || 'USD'}
              onChange={(range) => {
                form.setValue('salaryMin', range.min);
                form.setValue('salaryMax', range.max);
              }}
            />
          </div>
        </div>

        {/* Important Dates */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Important Dates</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Target Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value && 'text-muted-foreground'
                          }`}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>When you identified this opportunity</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appliedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Applied Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value && 'text-muted-foreground'
                          }`}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>When you submitted your application</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Type tags and press comma or enter..."
                  />
                </FormControl>
                <FormDescription>Add tags and press comma or enter</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about this application..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Documents</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {form.watch('linkedDocumentIds')?.length || 0} selected
              </Badge>
              <input
                type="file"
                id="document-upload"
                accept=".pdf,.md,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => document.getElementById('document-upload')?.click()}
              >
                <Plus className="h-3 w-3 mr-1" />
                Upload
              </Button>
            </div>
          </div>

          {/* Upload Confirmation Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>Select the type of document you're uploading</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">File</p>
                  <p className="text-sm text-muted-foreground">{uploadedFile?.file.name}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Document Type</p>
                  <Select
                    value={selectedDocType}
                    onValueChange={(value) => setSelectedDocType(value as Document['type'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resume">Resume</SelectItem>
                      <SelectItem value="cv">CV</SelectItem>
                      <SelectItem value="cover-letter">Cover Letter</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="transcript">Transcript</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setUploadedFile(null);
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleConfirmUpload} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload & Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <FormField
            control={form.control}
            name="linkedDocumentIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link Documents</FormLabel>
                <FormDescription>
                  Select documents to link with this application (resume, cover letter, etc.)
                </FormDescription>

                {/* Document Suggestions */}
                {suggestedDocuments.length > 0 && (
                  <div className="mb-3 p-3 bg-accent/30 border border-accent rounded-md space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      💡 Suggested documents
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedDocuments.map((doc) => (
                        <Button
                          key={doc.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const currentIds = field.value || [];
                            if (!currentIds.includes(doc.id)) {
                              field.onChange([...currentIds, doc.id]);
                            }
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {doc.name}
                          <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">
                            {doc.type}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search and Filter */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search documents..."
                      value={documentSearch}
                      onChange={(e) => setDocumentSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                    {documentSearch && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setDocumentSearch('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'all' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('all')}
                    >
                      All Types
                    </Button>
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'resume' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('resume')}
                    >
                      Resume
                    </Button>
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'cv' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('cv')}
                    >
                      CV
                    </Button>
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'cover-letter' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('cover-letter')}
                    >
                      Cover Letter
                    </Button>
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'portfolio' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('portfolio')}
                    >
                      Portfolio
                    </Button>
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'transcript' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('transcript')}
                    >
                      Transcript
                    </Button>
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'certification' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('certification')}
                    >
                      Certification
                    </Button>
                    <Button
                      type="button"
                      variant={documentTypeFilter === 'other' ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDocumentTypeFilter('other')}
                    >
                      Other
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto scrollbar-hide space-y-2">
                  {filteredDocuments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {documentSearch || documentTypeFilter !== 'all'
                        ? 'No documents match your search or filter.'
                        : 'No documents available. Create documents first to link them.'}
                    </p>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={field.value?.includes(doc.id)}
                          onCheckedChange={(checked) => {
                            const currentIds = field.value || [];
                            if (checked) {
                              field.onChange([...currentIds, doc.id]);
                            } else {
                              field.onChange(currentIds.filter((id) => id !== doc.id));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">{doc.name}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                              {doc.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">v{doc.version}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          {isDirty && (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : application ? 'Save Changes' : 'Create Application'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
