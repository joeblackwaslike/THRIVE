import {
  Briefcase,
  Building2,
  CheckCircle2,
  Edit,
  ExternalLink,
  MapPin,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INTERVIEW_DIFFICULTIES, INTERVIEW_EXPERIENCES, REMOTE_POLICIES } from '@/lib/constants';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useCompaniesStore } from '@/stores/companiesStore';

export function CompanyResearchHub() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResearched, setFilterResearched] = useState<'all' | 'researched' | 'not-researched'>(
    'all',
  );

  const companies = useCompaniesStore((state) => state.companies);
  const addCompany = useCompaniesStore((state) => state.addCompany);
  const updateCompany = useCompaniesStore((state) => state.updateCompany);
  const deleteCompany = useCompaniesStore((state) => state.deleteCompany);
  const applications = useApplicationsStore((state) => state.applications);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      searchQuery === '' ||
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.some((ind) => ind.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesResearched =
      filterResearched === 'all' ||
      (filterResearched === 'researched' && company.researched) ||
      (filterResearched === 'not-researched' && !company.researched);

    return matchesSearch && matchesResearched;
  });

  // Sort by researched first, then by name
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (a.researched !== b.researched) return a.researched ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const techStackStr = formData.get('techStack') as string;
    const techStack = techStackStr
      ? techStackStr
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const industryStr = formData.get('industry') as string;
    const industry = industryStr
      ? industryStr
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const benefitsStr = formData.get('benefits') as string;
    const benefits = benefitsStr
      ? benefitsStr
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const prosStr = formData.get('pros') as string;
    const pros = prosStr
      ? prosStr
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const consStr = formData.get('cons') as string;
    const cons = consStr
      ? consStr
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const salaryMin = formData.get('salaryMin') as string;
    const salaryMax = formData.get('salaryMax') as string;
    const salaryCurrency = formData.get('salaryCurrency') as string;

    const applicationIdValue = formData.get('applicationId') as string;

    const companyData = {
      name: formData.get('companyName') as string,
      notes: (formData.get('notes') as string) || undefined,
      researched: formData.get('researched') === 'true',
      applicationIds:
        applicationIdValue && applicationIdValue !== 'none' ? [applicationIdValue] : [],
      website: (formData.get('website') as string) || undefined,
      companyLinks: {
        website: (formData.get('website') as string) || undefined,
        linkedin: (formData.get('linkedin') as string) || undefined,
        glassdoor: (formData.get('glassdoor') as string) || undefined,
        careers: (formData.get('careers') as string) || undefined,
        news: (formData.get('news') as string) || undefined,
      },
      cultureNotes: (formData.get('cultureNotes') as string) || undefined,
      techStack,
      interviewProcess: (formData.get('interviewProcess') as string) || undefined,
      salaryRange:
        salaryMin || salaryMax
          ? {
              min: salaryMin ? Number.parseInt(salaryMin, 10) : undefined,
              max: salaryMax ? Number.parseInt(salaryMax, 10) : undefined,
              currency: salaryCurrency || 'USD',
            }
          : undefined,
      ratings: {
        overall: formData.get('ratingOverall')
          ? Number.parseFloat(formData.get('ratingOverall') as string)
          : undefined,
        workLifeBalance: formData.get('ratingWorkLife')
          ? Number.parseFloat(formData.get('ratingWorkLife') as string)
          : undefined,
        compensation: formData.get('ratingCompensation')
          ? Number.parseFloat(formData.get('ratingCompensation') as string)
          : undefined,
        careerGrowth: formData.get('ratingCareer')
          ? Number.parseFloat(formData.get('ratingCareer') as string)
          : undefined,
        management: formData.get('ratingManagement')
          ? Number.parseFloat(formData.get('ratingManagement') as string)
          : undefined,
        culture: formData.get('ratingCulture')
          ? Number.parseFloat(formData.get('ratingCulture') as string)
          : undefined,
      },
      interviewDifficulty:
        (formData.get('interviewDifficulty') as 'easy' | 'medium' | 'hard') || undefined,
      interviewExperience:
        (formData.get('interviewExperience') as 'positive' | 'neutral' | 'negative') || undefined,
      pros,
      cons,
      employeeReviews: (formData.get('employeeReviews') as string) || undefined,
      newsAndUpdates: (formData.get('newsAndUpdates') as string) || undefined,
      competitorComparison: (formData.get('competitorComparison') as string) || undefined,
      remotePolicy:
        (formData.get('remotePolicy') as 'full-remote' | 'hybrid' | 'on-site' | 'flexible') ||
        undefined,
      size: (formData.get('companySize') as string) || undefined,
      founded: (formData.get('founded') as string) || undefined,
      industry,
      benefits,
    };

    if (editingId) {
      updateCompany(editingId, companyData);
      setEditingId(null);
    } else {
      addCompany(companyData);
    }

    setShowAddDialog(false);
    e.currentTarget.reset();
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddDialog(true);
  };

  const editingCompany = editingId ? companies.find((c) => c.id === editingId) : null;

  const getApplicationsForCompany = (companyName: string) => {
    return applications.filter(
      (app) => app.companyName.toLowerCase() === companyName.toLowerCase(),
    );
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Researched</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.filter((c) => c.researched).length}</div>
            <p className="text-xs text-muted-foreground">
              {companies.length > 0
                ? `${Math.round((companies.filter((c) => c.researched).length / companies.length) * 100)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                companies.filter(
                  (c) =>
                    (c.applicationIds && c.applicationIds.length > 0) ||
                    getApplicationsForCompany(c.name).length > 0,
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter((c) => c.ratings?.overall).length > 0
                ? (
                    companies.reduce((sum, c) => sum + (c.ratings?.overall || 0), 0) /
                    companies.filter((c) => c.ratings?.overall).length
                  ).toFixed(1)
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Company Directory</CardTitle>
          <CardDescription>Search and filter your company research</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search companies, industries, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={filterResearched}
              onValueChange={(v) => setFilterResearched(v as typeof filterResearched)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Research Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="researched">Researched</SelectItem>
                <SelectItem value="not-researched">Not Researched</SelectItem>
              </SelectContent>
            </Select>
            <Dialog
              open={showAddDialog}
              onOpenChange={(open) => {
                setShowAddDialog(open);
                if (!open) setEditingId(null);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit' : 'Add'} Company Research</DialogTitle>
                    <DialogDescription>
                      Build a comprehensive profile of the company
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="companyName">Company Name *</Label>
                          <Input name="companyName" required defaultValue={editingCompany?.name} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="founded">Founded (Year)</Label>
                          <Input
                            name="founded"
                            placeholder="2015"
                            defaultValue={editingCompany?.founded}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companySize">Company Size</Label>
                          <Input
                            name="companySize"
                            placeholder="1000-5000 employees"
                            defaultValue={editingCompany?.size}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry (comma-separated)</Label>
                          <Input
                            name="industry"
                            placeholder="Technology, SaaS, Cloud Computing"
                            defaultValue={editingCompany?.industry?.join(', ')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="remotePolicy">Remote Policy</Label>
                          <Select name="remotePolicy" defaultValue={editingCompany?.remotePolicy}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select policy" />
                            </SelectTrigger>
                            <SelectContent>
                              {REMOTE_POLICIES.map((policy) => (
                                <SelectItem key={policy.value} value={policy.value}>
                                  {policy.icon} {policy.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Links to Application */}
                    {applications.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="applicationId">Link to Application (Optional)</Label>
                        <Select
                          name="applicationId"
                          defaultValue={editingCompany?.applicationIds?.[0] || 'none'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an application" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {applications.map((app) => (
                              <SelectItem key={app.id} value={app.id}>
                                {app.position} at {app.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Research Status */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        name="researched"
                        value="true"
                        defaultChecked={editingCompany?.researched}
                      />
                      <Label htmlFor="researched" className="text-sm font-normal">
                        Mark as fully researched
                      </Label>
                    </div>

                    {/* General Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">General Notes *</Label>
                      <Textarea
                        name="notes"
                        required
                        rows={3}
                        placeholder="What does this company do? What makes them unique?"
                        defaultValue={editingCompany?.notes}
                      />
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Company Links</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-xs text-muted-foreground">
                            Website
                          </Label>
                          <Input
                            name="website"
                            placeholder="https://company.com"
                            defaultValue={editingCompany?.companyLinks?.website}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin" className="text-xs text-muted-foreground">
                            LinkedIn
                          </Label>
                          <Input
                            name="linkedin"
                            placeholder="https://linkedin.com/company/..."
                            defaultValue={editingCompany?.companyLinks?.linkedin}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="glassdoor" className="text-xs text-muted-foreground">
                            Glassdoor
                          </Label>
                          <Input
                            name="glassdoor"
                            placeholder="https://glassdoor.com/..."
                            defaultValue={editingCompany?.companyLinks?.glassdoor}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="careers" className="text-xs text-muted-foreground">
                            Careers Page
                          </Label>
                          <Input
                            name="careers"
                            placeholder="https://company.com/careers"
                            defaultValue={editingCompany?.companyLinks?.careers}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="news" className="text-xs text-muted-foreground">
                            News/Press
                          </Label>
                          <Input
                            name="news"
                            placeholder="https://company.com/news"
                            defaultValue={editingCompany?.companyLinks?.news}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Company Ratings (1-5)</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ratingOverall" className="text-xs">
                            Overall
                          </Label>
                          <Input
                            name="ratingOverall"
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="4.5"
                            defaultValue={editingCompany?.ratings?.overall}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ratingWorkLife" className="text-xs">
                            Work-Life Balance
                          </Label>
                          <Input
                            name="ratingWorkLife"
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="4.0"
                            defaultValue={editingCompany?.ratings?.workLifeBalance}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ratingCompensation" className="text-xs">
                            Compensation
                          </Label>
                          <Input
                            name="ratingCompensation"
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="4.2"
                            defaultValue={editingCompany?.ratings?.compensation}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ratingCareer" className="text-xs">
                            Career Growth
                          </Label>
                          <Input
                            name="ratingCareer"
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="3.8"
                            defaultValue={editingCompany?.ratings?.careerGrowth}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ratingManagement" className="text-xs">
                            Management
                          </Label>
                          <Input
                            name="ratingManagement"
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="4.0"
                            defaultValue={editingCompany?.ratings?.management}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ratingCulture" className="text-xs">
                            Culture
                          </Label>
                          <Input
                            name="ratingCulture"
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="4.5"
                            defaultValue={editingCompany?.ratings?.culture}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Culture & Values */}
                    <div className="space-y-2">
                      <Label htmlFor="cultureNotes">Culture & Values</Label>
                      <Textarea
                        name="cultureNotes"
                        rows={3}
                        placeholder="Company culture, values, work environment, team dynamics..."
                        defaultValue={editingCompany?.cultureNotes}
                      />
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pros">Pros (one per line)</Label>
                        <Textarea
                          name="pros"
                          rows={4}
                          placeholder="Great benefits&#10;Strong engineering culture&#10;Innovative projects"
                          defaultValue={editingCompany?.pros?.join('\n')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cons">Cons (one per line)</Label>
                        <Textarea
                          name="cons"
                          rows={4}
                          placeholder="Long hours sometimes&#10;Bureaucratic processes&#10;Limited remote options"
                          defaultValue={editingCompany?.cons?.join('\n')}
                        />
                      </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="space-y-2">
                      <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
                      <Input
                        name="techStack"
                        placeholder="React, Node.js, PostgreSQL, AWS, Docker, Kubernetes..."
                        defaultValue={editingCompany?.techStack?.join(', ')}
                      />
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2">
                      <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                      <Input
                        name="benefits"
                        placeholder="Health insurance, 401k matching, Unlimited PTO, Stock options..."
                        defaultValue={editingCompany?.benefits?.join(', ')}
                      />
                    </div>

                    {/* Interview Process */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Interview Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="interviewDifficulty">Interview Difficulty</Label>
                          <Select
                            name="interviewDifficulty"
                            defaultValue={editingCompany?.interviewDifficulty}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              {INTERVIEW_DIFFICULTIES.map((diff) => (
                                <SelectItem key={diff.value} value={diff.value}>
                                  {diff.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="interviewExperience">Interview Experience</Label>
                          <Select
                            name="interviewExperience"
                            defaultValue={editingCompany?.interviewExperience}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                            <SelectContent>
                              {INTERVIEW_EXPERIENCES.map((exp) => (
                                <SelectItem key={exp.value} value={exp.value}>
                                  {exp.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interviewProcess">Interview Process Details</Label>
                        <Textarea
                          name="interviewProcess"
                          rows={3}
                          placeholder="Number of rounds, types of interviews, what to expect, typical timeline..."
                          defaultValue={editingCompany?.interviewProcess}
                        />
                      </div>
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Compensation</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="salaryMin">Min Salary</Label>
                          <Input
                            name="salaryMin"
                            type="number"
                            placeholder="80000"
                            defaultValue={editingCompany?.salaryRange?.min}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salaryMax">Max Salary</Label>
                          <Input
                            name="salaryMax"
                            type="number"
                            placeholder="120000"
                            defaultValue={editingCompany?.salaryRange?.max}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salaryCurrency">Currency</Label>
                          <Input
                            name="salaryCurrency"
                            placeholder="USD"
                            defaultValue={editingCompany?.salaryRange?.currency || 'USD'}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Employee Reviews Summary */}
                    <div className="space-y-2">
                      <Label htmlFor="employeeReviews">Employee Reviews Summary</Label>
                      <Textarea
                        name="employeeReviews"
                        rows={3}
                        placeholder="Summary of what employees are saying on Glassdoor, Blind, etc..."
                        defaultValue={editingCompany?.employeeReviews}
                      />
                    </div>

                    {/* News and Updates */}
                    <div className="space-y-2">
                      <Label htmlFor="newsAndUpdates">Recent News & Updates</Label>
                      <Textarea
                        name="newsAndUpdates"
                        rows={3}
                        placeholder="Recent funding, product launches, acquisitions, layoffs, etc..."
                        defaultValue={editingCompany?.newsAndUpdates}
                      />
                    </div>

                    {/* Competitor Comparison */}
                    <div className="space-y-2">
                      <Label htmlFor="competitorComparison">Competitor Comparison</Label>
                      <Textarea
                        name="competitorComparison"
                        rows={3}
                        placeholder="How does this company compare to competitors? What makes them different?"
                        defaultValue={editingCompany?.competitorComparison}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingId ? 'Update' : 'Add'} Company</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      {sortedCompanies.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedCompanies.map((company) => {
            const linkedApps = getApplicationsForCompany(company.name);

            return (
              <Card key={company.id} className="relative">
                {company.researched && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Researched
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 pr-20">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <CardTitle>{company.name}</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {company.founded && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Founded {company.founded}
                          </div>
                        )}
                        {company.size && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {company.size}
                          </div>
                        )}
                        {company.remotePolicy && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {REMOTE_POLICIES.find((p) => p.value === company.remotePolicy)?.label}
                          </div>
                        )}
                      </div>
                      {company.ratings?.overall && (
                        <div>{renderStarRating(company.ratings.overall)}</div>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(company.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteCompany(company.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Industries */}
                  {company.industry && company.industry.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {company.industry.map((ind) => (
                        <Badge key={ind} variant="secondary" className="text-xs">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  <p className="text-sm text-muted-foreground">{company.notes}</p>

                  {/* Linked Applications */}
                  {linkedApps.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        Your Applications ({linkedApps.length})
                      </h4>
                      <div className="space-y-1">
                        {linkedApps.map((app) => (
                          <div key={app.id} className="text-sm text-muted-foreground">
                            �?{app.position} -{' '}
                            <Badge variant="outline" className="text-xs">
                              {app.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {company.companyLinks && Object.values(company.companyLinks).some(Boolean) && (
                    <div className="flex gap-2 flex-wrap">
                      {company.companyLinks.website && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={company.companyLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                      {company.companyLinks.linkedin && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={company.companyLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                      {company.companyLinks.glassdoor && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={company.companyLinks.glassdoor}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Glassdoor
                          </a>
                        </Button>
                      )}
                      {company.companyLinks.careers && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={company.companyLinks.careers}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Careers
                          </a>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Detailed Ratings */}
                  {company.ratings &&
                    Object.values(company.ratings).some((v) => v !== undefined && v > 0) && (
                      <div className="space-y-2 pt-2 border-t">
                        <h4 className="text-sm font-medium">Detailed Ratings</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {company.ratings.workLifeBalance && (
                            <div>
                              <span className="text-muted-foreground">Work-Life:</span>{' '}
                              {company.ratings.workLifeBalance.toFixed(1)} �?{' '}
                            </div>
                          )}
                          {company.ratings.compensation && (
                            <div>
                              <span className="text-muted-foreground">Compensation:</span>{' '}
                              {company.ratings.compensation.toFixed(1)} �?{' '}
                            </div>
                          )}
                          {company.ratings.careerGrowth && (
                            <div>
                              <span className="text-muted-foreground">Career Growth:</span>{' '}
                              {company.ratings.careerGrowth.toFixed(1)} �?{' '}
                            </div>
                          )}
                          {company.ratings.management && (
                            <div>
                              <span className="text-muted-foreground">Management:</span>{' '}
                              {company.ratings.management.toFixed(1)} �?{' '}
                            </div>
                          )}
                          {company.ratings.culture && (
                            <div>
                              <span className="text-muted-foreground">Culture:</span>{' '}
                              {company.ratings.culture.toFixed(1)} �?{' '}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Pros and Cons */}
                  {((company.pros && company.pros.length > 0) ||
                    (company.cons && company.cons.length > 0)) && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      {company.pros && company.pros.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-green-600">Pros</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {company.pros.slice(0, 3).map((pro) => (
                              <li key={pro}>�?{pro}</li>
                            ))}
                            {company.pros.length > 3 && (
                              <li className="italic">+{company.pros.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                      {company.cons && company.cons.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-red-600">Cons</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {company.cons.slice(0, 3).map((con) => (
                              <li key={con}>�?{con}</li>
                            ))}
                            {company.cons.length > 3 && (
                              <li className="italic">+{company.cons.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tech Stack */}
                  {company.techStack && company.techStack.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-sm font-medium">Tech Stack</h4>
                      <div className="flex gap-2 flex-wrap">
                        {company.techStack.slice(0, 6).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {company.techStack.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{company.techStack.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interview Info */}
                  {(company.interviewDifficulty ||
                    company.interviewExperience ||
                    company.interviewProcess) && (
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-sm font-medium">Interview Information</h4>
                      <div className="space-y-2">
                        {(company.interviewDifficulty || company.interviewExperience) && (
                          <div className="flex gap-2">
                            {company.interviewDifficulty && (
                              <Badge
                                variant="outline"
                                className={
                                  INTERVIEW_DIFFICULTIES.find(
                                    (d) => d.value === company.interviewDifficulty,
                                  )?.color
                                }
                              >
                                Difficulty: {company.interviewDifficulty}
                              </Badge>
                            )}
                            {company.interviewExperience && (
                              <Badge variant="outline">
                                Experience: {company.interviewExperience}
                              </Badge>
                            )}
                          </div>
                        )}
                        {company.interviewProcess && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {company.interviewProcess}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Salary Range */}
                  {company.salaryRange && (company.salaryRange.min || company.salaryRange.max) && (
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-1">Compensation Range</h4>
                      <p className="text-sm text-muted-foreground">
                        {company.salaryRange.min &&
                          `${company.salaryRange.currency || 'USD'} ${company.salaryRange.min.toLocaleString()}`}
                        {company.salaryRange.min && company.salaryRange.max && ' - '}
                        {company.salaryRange.max &&
                          `${company.salaryRange.currency || 'USD'} ${company.salaryRange.max.toLocaleString()}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || filterResearched !== 'all'
                ? 'No companies match your filters'
                : "Start researching companies you're interested in"}
            </p>
            {!searchQuery && filterResearched === 'all' && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Research Your First Company
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
