import { Building2, CheckCircle2, Edit, ExternalLink, Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useInterviewPrepStore } from '@/stores/interviewPrepStore';

export function CompanyNotesTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const companyNotes = useInterviewPrepStore((state) => state.companyNotes);
  const addCompanyNote = useInterviewPrepStore((state) => state.addCompanyNote);
  const updateCompanyNote = useInterviewPrepStore((state) => state.updateCompanyNote);
  const deleteCompanyNote = useInterviewPrepStore((state) => state.deleteCompanyNote);

  const filteredNotes = companyNotes.filter(
    (note) =>
      searchQuery === '' ||
      note.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

    const salaryMin = formData.get('salaryMin') as string;
    const salaryMax = formData.get('salaryMax') as string;
    const salaryCurrency = formData.get('salaryCurrency') as string;

    const noteData = {
      companyName: formData.get('companyName') as string,
      notes: formData.get('notes') as string,
      researched: formData.get('researched') === 'true',
      companyLinks: {
        website: (formData.get('website') as string) || undefined,
        linkedin: (formData.get('linkedin') as string) || undefined,
        glassdoor: (formData.get('glassdoor') as string) || undefined,
        careers: (formData.get('careers') as string) || undefined,
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
    };

    if (editingId) {
      updateCompanyNote(editingId, noteData);
      setEditingId(null);
    } else {
      addCompanyNote(noteData);
    }

    setShowAddDialog(false);
    e.currentTarget.reset();
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddDialog(true);
  };

  const editingNote = editingId ? companyNotes.find((n) => n.id === editingId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Company Research</CardTitle>
          <CardDescription>Track research notes for companies you're applying to</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit' : 'Add'} Company Research</DialogTitle>
                    <DialogDescription>
                      Keep track of important information about companies
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input name="companyName" required defaultValue={editingNote?.companyName} />
                    </div>

                    {/* Research Status */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        name="researched"
                        value="true"
                        defaultChecked={editingNote?.researched}
                      />
                      <Label htmlFor="researched" className="text-sm font-normal">
                        Mark as researched
                      </Label>
                    </div>

                    {/* General Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">General Notes</Label>
                      <Textarea name="notes" required rows={4} defaultValue={editingNote?.notes} />
                    </div>

                    {/* Company Links */}
                    <div className="space-y-2">
                      <Label>Company Links</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-xs text-muted-foreground">
                            Website
                          </Label>
                          <Input
                            name="website"
                            placeholder="https://company.com"
                            defaultValue={editingNote?.companyLinks?.website}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin" className="text-xs text-muted-foreground">
                            LinkedIn
                          </Label>
                          <Input
                            name="linkedin"
                            placeholder="https://linkedin.com/company/..."
                            defaultValue={editingNote?.companyLinks?.linkedin}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="glassdoor" className="text-xs text-muted-foreground">
                            Glassdoor
                          </Label>
                          <Input
                            name="glassdoor"
                            placeholder="https://glassdoor.com/..."
                            defaultValue={editingNote?.companyLinks?.glassdoor}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="careers" className="text-xs text-muted-foreground">
                            Careers Page
                          </Label>
                          <Input
                            name="careers"
                            placeholder="https://company.com/careers"
                            defaultValue={editingNote?.companyLinks?.careers}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Culture Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="cultureNotes">Culture & Values</Label>
                      <Textarea
                        name="cultureNotes"
                        rows={3}
                        placeholder="Company culture, values, work environment..."
                        defaultValue={editingNote?.cultureNotes}
                      />
                    </div>

                    {/* Tech Stack */}
                    <div className="space-y-2">
                      <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
                      <Input
                        name="techStack"
                        placeholder="React, Node.js, PostgreSQL, AWS..."
                        defaultValue={editingNote?.techStack?.join(', ')}
                      />
                    </div>

                    {/* Interview Process */}
                    <div className="space-y-2">
                      <Label htmlFor="interviewProcess">Interview Process</Label>
                      <Textarea
                        name="interviewProcess"
                        rows={3}
                        placeholder="Number of rounds, types of interviews, what to expect..."
                        defaultValue={editingNote?.interviewProcess}
                      />
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-2">
                      <Label>Salary Range (Optional)</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="salaryMin" className="text-xs text-muted-foreground">
                            Min
                          </Label>
                          <Input
                            name="salaryMin"
                            type="number"
                            placeholder="80000"
                            defaultValue={editingNote?.salaryRange?.min}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salaryMax" className="text-xs text-muted-foreground">
                            Max
                          </Label>
                          <Input
                            name="salaryMax"
                            type="number"
                            placeholder="120000"
                            defaultValue={editingNote?.salaryRange?.max}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salaryCurrency" className="text-xs text-muted-foreground">
                            Currency
                          </Label>
                          <Input
                            name="salaryCurrency"
                            placeholder="USD"
                            defaultValue={editingNote?.salaryRange?.currency || 'USD'}
                          />
                        </div>
                      </div>
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

      {/* Company Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      <CardTitle>{note.companyName}</CardTitle>
                      {note.researched && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Researched
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{note.notes}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(note.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteCompanyNote(note.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Links */}
                {note.companyLinks && Object.values(note.companyLinks).some(Boolean) && (
                  <div className="flex gap-2 flex-wrap">
                    {note.companyLinks.website && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={note.companyLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                    {note.companyLinks.linkedin && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={note.companyLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {note.companyLinks.glassdoor && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={note.companyLinks.glassdoor}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Glassdoor
                        </a>
                      </Button>
                    )}
                    {note.companyLinks.careers && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={note.companyLinks.careers}
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

                {/* Culture */}
                {note.cultureNotes && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Culture & Values</h4>
                    <p className="text-sm text-muted-foreground">{note.cultureNotes}</p>
                  </div>
                )}

                {/* Tech Stack */}
                {note.techStack && note.techStack.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tech Stack</h4>
                    <div className="flex gap-2 flex-wrap">
                      {note.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Process */}
                {note.interviewProcess && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Interview Process</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.interviewProcess}
                    </p>
                  </div>
                )}

                {/* Salary Range */}
                {note.salaryRange && (note.salaryRange.min || note.salaryRange.max) && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Salary Range</h4>
                    <p className="text-sm text-muted-foreground">
                      {note.salaryRange.min &&
                        `${note.salaryRange.currency || 'USD'} ${note.salaryRange.min.toLocaleString()}`}
                      {note.salaryRange.min && note.salaryRange.max && ' - '}
                      {note.salaryRange.max &&
                        `${note.salaryRange.currency || 'USD'} ${note.salaryRange.max.toLocaleString()}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No company research yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? 'No companies match your search'
                : 'Start adding companies to track your research'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Company
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
