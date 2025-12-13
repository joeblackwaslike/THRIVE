import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Progress } from '@/components/ui/progress';
import { RatingSlider } from '@/components/ui/rating-slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/hooks/useConfirm';
import {
  COMPANY_SIZES,
  COMPANY_STATUSES,
  CURRENCIES,
  INDUSTRIES,
  PRIORITY_LEVELS,
  REMOTE_POLICIES,
} from '@/lib/constants';
import type { Company } from '@/types';

// Form schema based on company schema
const companyFormSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().max(200).optional(),
  founded: z.string().optional(),
  remotePolicy: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  researched: z.boolean().optional(),
  description: z.string().optional(),
  culture: z.string().optional(),
  techStack: z.string().optional(), // Comma-separated
  benefits: z.string().optional(), // Comma-separated
  pros: z.string().optional(), // Comma-separated
  cons: z.string().optional(), // Comma-separated
  notes: z.string().optional(),
  // Company Links
  linkedinUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  glassdoorUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  careersUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  newsUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  // Ratings
  overallRating: z.number().min(0).max(5).optional(),
  workLifeBalanceRating: z.number().min(0).max(5).optional(),
  compensationRating: z.number().min(0).max(5).optional(),
  careerGrowthRating: z.number().min(0).max(5).optional(),
  managementRating: z.number().min(0).max(5).optional(),
  cultureRating: z.number().min(0).max(5).optional(),
  // Salary
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: Partial<Company>) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  onSaveAndAddAnother?: (data: Partial<Company>) => void | Promise<void>;
}

// Helper function to calculate average rating
function calculateAverageRating(ratings: {
  workLifeBalance?: number;
  compensation?: number;
  careerGrowth?: number;
  management?: number;
  culture?: number;
}): number {
  const values = Object.values(ratings).filter((v): v is number => v !== undefined && v > 0);
  if (values.length === 0) return 0;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

// Helper function to calculate form completeness
function calculateCompleteness(values: Partial<CompanyFormValues>): number {
  const fields = [
    'name',
    'website',
    'industry',
    'size',
    'location',
    'founded',
    'status',
    'priority',
    'remotePolicy',
    'description',
    'culture',
    'linkedinUrl',
    'glassdoorUrl',
  ];
  const filled = fields.filter((field) => {
    const value = values[field as keyof CompanyFormValues];
    return value !== undefined && value !== '' && value !== null;
  });
  return Math.round((filled.length / fields.length) * 100);
}

// Helper function to validate URL
function isValidUrl(url: string | undefined): boolean {
  if (!url || url === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function CompanyForm({
  company,
  onSubmit,
  onCancel,
  isLoading = false,
  onSaveAndAddAnother,
}: CompanyFormProps) {
  const { confirm } = useConfirm();
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: company?.name || '',
      website: company?.website || '',
      industry: company?.industry?.[0] || undefined,
      size: company?.size || undefined,
      location: company?.location || '',
      founded: company?.founded || '',
      remotePolicy: company?.remotePolicy || undefined,
      status: company?.status || undefined,
      priority: company?.priority || undefined,
      researched: company?.researched || false,
      description: company?.description || '',
      culture: company?.culture || '',
      techStack: company?.techStack?.join(', ') || '',
      benefits: company?.benefits?.join(', ') || '',
      pros: company?.pros?.join(', ') || '',
      cons: company?.cons?.join(', ') || '',
      notes: company?.notes || '',
      // Company Links
      linkedinUrl: company?.companyLinks?.linkedin || '',
      glassdoorUrl: company?.companyLinks?.glassdoor || '',
      careersUrl: company?.companyLinks?.careers || '',
      newsUrl: company?.companyLinks?.news || '',
      // Ratings
      overallRating: company?.ratings?.overall || undefined,
      workLifeBalanceRating: company?.ratings?.workLifeBalance || undefined,
      compensationRating: company?.ratings?.compensation || undefined,
      careerGrowthRating: company?.ratings?.careerGrowth || undefined,
      managementRating: company?.ratings?.management || undefined,
      cultureRating: company?.ratings?.culture || undefined,
      // Salary
      salaryMin: company?.salaryRange?.min || undefined,
      salaryMax: company?.salaryRange?.max || undefined,
      salaryCurrency: company?.salaryRange?.currency || 'USD',
      salaryPeriod: 'year',
    },
  });

  // Watch all form values for smart features
  const formValues = useWatch({ control: form.control });

  // Calculate completeness percentage
  const completeness = useMemo(() => {
    return calculateCompleteness(formValues);
  }, [formValues]);

  // Auto-calculate average rating when individual ratings change
  useEffect(() => {
    const ratings = {
      workLifeBalance: formValues.workLifeBalanceRating,
      compensation: formValues.compensationRating,
      careerGrowth: formValues.careerGrowthRating,
      management: formValues.managementRating,
      culture: formValues.cultureRating,
    };

    const average = calculateAverageRating(ratings);

    // Only update if there's a calculated average and it's different
    if (average > 0 && formValues.overallRating !== average) {
      form.setValue('overallRating', average, { shouldValidate: false });
    }
  }, [
    formValues.workLifeBalanceRating,
    formValues.compensationRating,
    formValues.careerGrowthRating,
    formValues.managementRating,
    formValues.cultureRating,
    formValues.overallRating,
    form,
  ]);

  // Track if form has unsaved changes
  const isDirty = form.formState.isDirty;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const formElement = document.querySelector('form');
        if (formElement) {
          formElement.requestSubmit();
        }
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isDirty) {
          (async () => {
            const confirmCancel = await confirm({
              title: 'Unsaved Changes',
              description: 'You have unsaved changes. Are you sure you want to cancel?',
              type: 'danger',
              confirmText: 'Discard',
              cancelText: 'Keep Editing',
            });
            if (confirmCancel) {
              onCancel();
            }
          })();
        } else {
          onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, onCancel, confirm]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSubmit = useCallback(
    (values: CompanyFormValues) => {
      // Transform form values to Company format
      const companyData: Partial<Company> = {
        name: values.name,
        website: values.website || undefined,
        industry: values.industry ? [values.industry] : undefined,
        size: values.size || undefined,
        location: values.location || undefined,
        founded: values.founded || undefined,
        remotePolicy: (values.remotePolicy as Company['remotePolicy']) || undefined,
        status: (values.status as Company['status']) || undefined,
        priority: (values.priority as Company['priority']) || undefined,
        researched: values.researched || false,
        description: values.description || undefined,
        culture: values.culture || undefined,
        techStack: values.techStack
          ? values.techStack
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        benefits: values.benefits
          ? values.benefits
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        pros: values.pros
          ? values.pros
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        cons: values.cons
          ? values.cons
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        notes: values.notes || undefined,
        // Company Links
        companyLinks: {
          website: values.website || undefined,
          linkedin: values.linkedinUrl || undefined,
          glassdoor: values.glassdoorUrl || undefined,
          careers: values.careersUrl || undefined,
          news: values.newsUrl || undefined,
        },
        // Ratings
        ratings: {
          overall: values.overallRating || undefined,
          workLifeBalance: values.workLifeBalanceRating || undefined,
          compensation: values.compensationRating || undefined,
          careerGrowth: values.careerGrowthRating || undefined,
          management: values.managementRating || undefined,
          culture: values.cultureRating || undefined,
        },
        // Salary Range
        salaryRange:
          values.salaryMin || values.salaryMax
            ? {
                min: values.salaryMin,
                max: values.salaryMax,
                currency: values.salaryCurrency || 'USD',
              }
            : undefined,
      };

      onSubmit(companyData);
    },
    [onSubmit],
  );

  const handleSaveAndAddAnother = useCallback(
    async (values: CompanyFormValues) => {
      // Transform form values to Company format (reuse the same logic)
      const companyData: Partial<Company> = {
        name: values.name,
        website: values.website || undefined,
        industry: values.industry ? [values.industry] : undefined,
        size: values.size || undefined,
        location: values.location || undefined,
        founded: values.founded || undefined,
        remotePolicy: (values.remotePolicy as Company['remotePolicy']) || undefined,
        status: (values.status as Company['status']) || undefined,
        priority: (values.priority as Company['priority']) || undefined,
        researched: values.researched || false,
        description: values.description || undefined,
        culture: values.culture || undefined,
        techStack: values.techStack
          ? values.techStack
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        benefits: values.benefits
          ? values.benefits
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        pros: values.pros
          ? values.pros
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        cons: values.cons
          ? values.cons
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        notes: values.notes || undefined,
        companyLinks: {
          website: values.website || undefined,
          linkedin: values.linkedinUrl || undefined,
          glassdoor: values.glassdoorUrl || undefined,
          careers: values.careersUrl || undefined,
          news: values.newsUrl || undefined,
        },
        ratings: {
          overall: values.overallRating || undefined,
          workLifeBalance: values.workLifeBalanceRating || undefined,
          compensation: values.compensationRating || undefined,
          careerGrowth: values.careerGrowthRating || undefined,
          management: values.managementRating || undefined,
          culture: values.cultureRating || undefined,
        },
        salaryRange:
          values.salaryMin || values.salaryMax
            ? {
                min: values.salaryMin,
                max: values.salaryMax,
                currency: values.salaryCurrency || 'USD',
              }
            : undefined,
      };

      if (onSaveAndAddAnother) {
        await onSaveAndAddAnother(companyData);
        form.reset(); // Reset form for next entry
      }
    },
    [onSaveAndAddAnother, form],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="links">Links & Research</TabsTrigger>
            <TabsTrigger value="ratings">Ratings & Salary</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Data Completeness Indicator */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {completeness === 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm font-medium">Profile Completeness: {completeness}%</span>
              </div>
              <Badge variant={completeness === 100 ? 'default' : 'secondary'}>
                {completeness < 50
                  ? 'Getting Started'
                  : completeness < 80
                    ? 'Good Progress'
                    : completeness < 100
                      ? 'Almost There'
                      : 'Complete'}
              </Badge>
            </div>
            <Progress value={completeness} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Fill out more fields to get better insights and recommendations
            </p>
          </div>

          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
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

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => {
                  const isValid = isValidUrl(field.value);
                  return (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="url" placeholder="https://company.com" {...field} />
                          {field.value && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry.value} value={industry.value}>
                              {industry.label}
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
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
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
                    <FormDescription>Headquarters or main office location</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="founded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Founded</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2010" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="remotePolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remote Policy</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select remote policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REMOTE_POLICIES.map((policy) => (
                            <SelectItem key={policy.value} value={policy.value}>
                              {policy.icon} {policy.label}
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
                  name="researched"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Researched</FormLabel>
                        <FormDescription>
                          Mark if you've completed research on this company
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-6 mt-6">
            {/* Company Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Links</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => {
                    const isValid = isValidUrl(field.value);
                    return (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="https://www.linkedin.com/company/..." {...field} />
                            {field.value && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isValid ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="glassdoorUrl"
                  render={({ field }) => {
                    const isValid = isValidUrl(field.value);
                    return (
                      <FormItem>
                        <FormLabel>Glassdoor URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="https://www.glassdoor.com/..." {...field} />
                            {field.value && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isValid ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="careersUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Careers Page URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com/careers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>News/Blog URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com/blog" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Company Research section stays here */}
            </div>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6 mt-6">
            {/* Ratings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ratings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="flex items-center gap-2">
                          Overall Rating
                          <Badge variant="outline" className="text-xs font-normal">
                            <Star className="h-3 w-3 mr-1" />
                            Auto-calculated
                          </Badge>
                        </FormLabel>
                      </div>
                      <FormControl>
                        <RatingSlider
                          value={field.value || 0}
                          onChange={field.onChange}
                          disabled
                          showValue
                          className="opacity-60"
                        />
                      </FormControl>
                      <FormDescription>Automatically calculated from ratings below</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workLifeBalanceRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RatingSlider
                          value={field.value || 0}
                          onChange={field.onChange}
                          label="Work-Life Balance"
                          showValue
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="compensationRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RatingSlider
                          value={field.value || 0}
                          onChange={field.onChange}
                          label="Compensation"
                          showValue
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="careerGrowthRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RatingSlider
                          value={field.value || 0}
                          onChange={field.onChange}
                          label="Career Growth"
                          showValue
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managementRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RatingSlider
                          value={field.value || 0}
                          onChange={field.onChange}
                          label="Management"
                          showValue
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cultureRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RatingSlider
                          value={field.value || 0}
                          onChange={field.onChange}
                          label="Culture"
                          showValue
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Salary Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Salary Range</h3>
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
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.symbol} {currency.value}
                            </SelectItem>
                          ))}
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

            {/* Company Research */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Research</h3>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What does the company do?"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="culture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Culture</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes about company culture, values, work environment..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tech Stack</FormLabel>
                    <FormControl>
                      <Input placeholder="React, TypeScript, Node.js, PostgreSQL" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated list of technologies</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl>
                      <Input placeholder="Health insurance, 401k, Remote work, PTO" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated list of benefits and perks</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6 mt-6">
            {/* Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis</h3>

              <FormField
                control={form.control}
                name="pros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pros</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Great culture, Competitive salary, Growth opportunities"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of positive aspects</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cons</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Long commute, Startup uncertainty, Limited benefits"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of concerns or drawbacks</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other notes about this company..."
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
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex flex-col gap-4 pt-4 border-t">
          {/* Keyboard shortcuts hint */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+S</kbd> to save
              </span>
              <span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> to cancel
              </span>
            </div>
            {isDirty && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.reset()}
                disabled={isLoading || !isDirty}
              >
                Reset Form
              </Button>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              {!company && onSaveAndAddAnother && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit(handleSaveAndAddAnother)}
                  disabled={isLoading}
                >
                  Save & Add Another
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : company ? 'Update Company' : 'Save Company'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
