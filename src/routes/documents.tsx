import { useThrottledCallback } from '@tanstack/react-pacer';
import { createFileRoute } from '@tanstack/react-router';
import { jsPDF } from 'jspdf';
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpAZ,
  Award,
  Briefcase,
  Calendar,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  File,
  FileCode,
  FileText,
  FileType,
  Filter,
  Folder,
  GitBranch,
  GraduationCap,
  Link,
  List,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { z } from 'zod';
import { useConfirm } from '@/hooks/useConfirm';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { DocumentVersionTimeline } from '@/components/features/documents/DocumentVersionTimeline';
import { LinkApplicationDialog } from '@/components/features/documents/LinkApplicationDialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAutoSaveBatcher } from '@/hooks/useDatabaseBatching';
import { db } from '@/lib/db';
import {
  getDocumentTypeColors,
  getDocumentTypeIcon,
  isDocumentOutdated,
  isDocumentRecent,
} from '@/lib/utils';
import { useApplicationsStore, useDocumentsStore } from '@/stores';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Document } from '@/types';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Documents Page - Manage resumes, cover letters, and other job application documents
 *
 * Features:
 * - Accordion-based sidebar for organized document groups
 * - Resumes and Cover Letters sections
 * - Recently Deleted section with restore/permanent delete options
 * - Document preview with multiple format support (PDF, Markdown, Rich Text, Plain)
 * - Version control for documents
 *
 * Future Enhancements:
 * - Custom folders for better organization
 * - Link documents to specific job applications
 * - Share the same document across multiple applications
 * - Folder-based filtering and search
 * - Drag-and-drop document organization
 */
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const documentsSearchSchema = z.object({
  docId: z.string().optional(),
});

export const Route = createFileRoute('/documents')({
  component: DocumentsPage,
  validateSearch: (search) => documentsSearchSchema.parse(search),
});

function DocumentsPage() {
  const { docId } = Route.useSearch();
  const {
    documents,
    fetchDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    linkDocumentToApplications,
  } = useDocumentsStore();
  const { applications } = useApplicationsStore();
  const { documents: documentSettings } = useSettingsStore();
  const { confirm } = useConfirm();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewDocDialogOpen, setIsNewDocDialogOpen] = useState(false);
  const [isCoverLetterDialogOpen, setIsCoverLetterDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewFormat, setViewFormat] = useState<
    'pdf' | 'markdown' | 'richtext' | 'plain' | 'history'
  >('markdown');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);

  // Track last viewed document to prevent toast spam
  const lastViewedDocIdRef = useRef<string | null>(null);

  // Track PDF load errors to prevent toast spam
  const pdfLoadErrorShownRef = useRef<string | null>(null);
  const pdfLoadErrorTimestampRef = useRef<number>(0);

  // Drag & drop state
  const [isDraggingDocument, setIsDraggingDocument] = useState(false);
  const [draggingDocumentId, setDraggingDocumentId] = useState<string | null>(null);
  const [dropTargetAppId, setDropTargetAppId] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByType, setFilterByType] = useState<string>('all');
  const [filterByUsage, setFilterByUsage] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [filterByDate, setFilterByDate] = useState<
    'all' | 'recent' | 'old' | 'this-week' | 'this-month'
  >('all');
  const [filterByVersion, setFilterByVersion] = useState<'all' | 'latest' | 'outdated'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date-modified' | 'document-type' | 'usage-count'>(
    'date-modified'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Form state for new document dialog
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<
    'resume' | 'cv' | 'cover-letter' | 'portfolio' | 'transcript' | 'certification' | 'other'
  >('resume');
  const [newDocContent, setNewDocContent] = useState('');

  // Form state for upload document dialog
  const [uploadDocType, setUploadDocType] = useState<
    'resume' | 'cv' | 'cover-letter' | 'portfolio' | 'transcript' | 'certification' | 'other'
  >('resume');

  // Form state for cover letter dialog
  const [coverLetterName, setCoverLetterName] = useState('');
  const [coverLetterCompany, setCoverLetterCompany] = useState('');
  const [coverLetterPosition, setCoverLetterPosition] = useState('');
  const [coverLetterContent, setCoverLetterContent] = useState('');

  // Editing state for view/edit dialog
  const [editingContent, setEditingContent] = useState('');
  const [editingName, setEditingName] = useState('');

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // PDF container ref for responsive width calculation
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(800);

  // Generate PDF from text content
  const generatedPdfUrl = useMemo(() => {
    // Check if this is an uploaded PDF file (always available, not dependent on viewFormat)
    if (selectedDocument?.fileUrl && selectedDocument.mimeType === 'application/pdf') {
      // fileUrl already contains base64 data URL (data:application/pdf;base64,...)
      return selectedDocument.fileUrl;
    }

    // For text-based documents, only generate when viewing as PDF
    if (viewFormat !== 'pdf') return null;

    // For text-based documents, generate PDF from content
    if (!selectedDocument?.content) return null;

    try {
      // Check if content is already a PDF (starts with %PDF or is base64 PDF)
      if (
        selectedDocument.content.startsWith('%PDF') ||
        selectedDocument.content.startsWith('JVBER') || // base64 of %PDF
        selectedDocument.mimeType === 'application/pdf'
      ) {
        return `data:application/pdf;base64,${btoa(selectedDocument.content)}`;
      }

      // Generate PDF from text content
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set font and size
      doc.setFontSize(11);
      doc.setFont('helvetica');

      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedDocument.name, 20, 20);

      // Add content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const content = selectedDocument.content;
      const lines = doc.splitTextToSize(content, 170); // Split text to fit page width

      let y = 35; // Start position
      const lineHeight = 7;
      const pageHeight = 280;

      for (const line of lines) {
        if (y > pageHeight) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += lineHeight;
      }

      // Convert to blob URL
      const pdfBlob = doc.output('blob');
      return URL.createObjectURL(pdfBlob);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      return null;
    }
  }, [selectedDocument, viewFormat]);

  // Reset PDF error tracking when document or view format changes
  useEffect(() => {
    pdfLoadErrorShownRef.current = null;
    pdfLoadErrorTimestampRef.current = 0;
    setPdfLoadFailed(false);
  }, []);

  // Reset upload dialog state when closed
  useEffect(() => {
    if (!isUploadDialogOpen) {
      setUploadDocType('resume');
    }
  }, [isUploadDialogOpen]);

  // Auto-save document content while editing
  useAutoSaveBatcher(
    db.documents,
    selectedDocument?.id || '',
    {
      name: editingName,
      content: editingContent,
      updatedAt: new Date(),
    },
    [editingContent, editingName],
    {
      wait: 3000, // 3 seconds after last change
      onSuccess: () => {
        setLastSaved(new Date());
        setIsSaving(false);
      },
      onError: (error) => {
        console.error('Auto-save failed:', error);
        setIsSaving(false);
        toast.error('Auto-save Failed', {
          description: 'Your changes could not be saved automatically',
          duration: 3000,
        });
      },
    }
  );

  // Track when content is being edited to show saving indicator
  useEffect(() => {
    if (isEditMode && selectedDocument && (editingContent || editingName)) {
      setIsSaving(true);
      // Reset last saved when entering edit mode
      if (!lastSaved) {
        setLastSaved(null);
      }
    }
  }, [editingContent, editingName, isEditMode, selectedDocument, lastSaved]);

  // Calculate PDF width based on container size (throttled for performance)
  const updatePdfWidth = useCallback(() => {
    if (pdfContainerRef.current) {
      const containerWidth = pdfContainerRef.current.offsetWidth;
      // Use 90% of container width with some padding
      setPdfWidth(Math.max(300, containerWidth - 48));
    }
  }, []);

  const throttledUpdatePdfWidth = useThrottledCallback(updatePdfWidth, { wait: 150 });

  useEffect(() => {
    updatePdfWidth();
    window.addEventListener('resize', throttledUpdatePdfWidth);
    return () => window.removeEventListener('resize', throttledUpdatePdfWidth);
  }, [updatePdfWidth, throttledUpdatePdfWidth]);

  // Cleanup PDF blob URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (generatedPdfUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(generatedPdfUrl);
      }
    };
  }, [generatedPdfUrl]);

  // Fetch documents on mount
  useEffect(() => {
    const initDocuments = async () => {
      await fetchDocuments();

      // Auto-delete documents older than configured days
      const autoDeleteDate = new Date();
      autoDeleteDate.setDate(autoDeleteDate.getDate() - documentSettings.autoDeleteDays);

      // Get current documents from the store after fetching
      const currentDocs = useDocumentsStore.getState().documents;
      const oldDeletedDocs = currentDocs.filter(
        (doc) => doc.deletedAt && new Date(doc.deletedAt) <= autoDeleteDate
      );

      // Permanently delete old documents
      for (const doc of oldDeletedDocs) {
        try {
          await deleteDocument(doc.id);
          console.log(`Auto-deleted old document: ${doc.name}`);
        } catch (error) {
          console.error(`Failed to auto-delete document ${doc.name}:`, error);
        }
      }

      // Refresh if any were deleted
      if (oldDeletedDocs.length > 0) {
        await fetchDocuments();
        toast.info('Cleanup Complete', {
          description: `${oldDeletedDocs.length} old document(s) permanently deleted (older than ${documentSettings.autoDeleteDays} days)`,
        });
      }
    };

    initDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDocument, documentSettings.autoDeleteDays, fetchDocuments]);

  // Select document from URL parameter
  useEffect(() => {
    if (docId && documents.length > 0) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        setSelectedDocument(doc);
        // Only show toast if we haven't shown it for this document yet
        if (lastViewedDocIdRef.current !== docId) {
          toast.success(`Viewing ${doc.name}`);
          lastViewedDocIdRef.current = docId;
        }
      }
    }
  }, [docId, documents]);

  // Keep selectedDocument in sync with store updates (for link count updates, etc.)
  useEffect(() => {
    if (selectedDocument) {
      const updatedDoc = documents.find((d) => d.id === selectedDocument.id);
      if (updatedDoc) {
        // Check if usedInApplicationIds changed (most common update for linking)
        const currentLinks = selectedDocument.usedInApplicationIds?.length || 0;
        const newLinks = updatedDoc.usedInApplicationIds?.length || 0;

        if (currentLinks !== newLinks || selectedDocument.updatedAt !== updatedDoc.updatedAt) {
          setSelectedDocument(updatedDoc);
        }
      }
    }
  }, [documents, selectedDocument]);

  // Filter active (non-deleted) and recently deleted documents
  const activeDocuments = documents.filter((doc) => !doc.deletedAt);
  const recentlyDeletedThreshold = new Date();
  recentlyDeletedThreshold.setDate(
    recentlyDeletedThreshold.getDate() - documentSettings.recentlyDeletedDays
  );
  const recentlyDeleted = documents.filter(
    (doc) => doc.deletedAt && new Date(doc.deletedAt) > recentlyDeletedThreshold
  );

  // Apply filters to active documents
  const filteredDocuments = useMemo(() => {
    let filtered = activeDocuments.filter((doc) => {
      // Search filter
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filterByType !== 'all') {
        if (filterByType === 'resume' && !(doc.type === 'resume' || doc.type === 'cv')) {
          return false;
        } else if (filterByType === 'cover-letter' && doc.type !== 'cover-letter') {
          return false;
        } else if (
          filterByType !== 'resume' &&
          filterByType !== 'cover-letter' &&
          doc.type !== filterByType
        ) {
          return false;
        }
      }

      // Usage filter
      if (
        filterByUsage === 'linked' &&
        (!doc.usedInApplicationIds || doc.usedInApplicationIds.length === 0)
      ) {
        return false;
      }
      if (
        filterByUsage === 'unlinked' &&
        doc.usedInApplicationIds &&
        doc.usedInApplicationIds.length > 0
      ) {
        return false;
      }

      // Date filter
      if (filterByDate !== 'all') {
        const now = new Date();
        const docDate = new Date(doc.updatedAt || doc.createdAt);
        const daysDiff = Math.floor((now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));

        if (filterByDate === 'this-week' && daysDiff > 7) {
          return false;
        } else if (filterByDate === 'this-month' && daysDiff > 30) {
          return false;
        } else if (filterByDate === 'recent' && daysDiff > 7) {
          return false;
        } else if (filterByDate === 'old' && daysDiff <= 30) {
          return false;
        }
      }

      // Version filter
      if (filterByVersion !== 'all') {
        const hasNewerVersions = documents.some((d) => d.baseDocumentId === doc.id && !d.deletedAt);

        if (filterByVersion === 'latest' && hasNewerVersions) {
          return false;
        } else if (filterByVersion === 'outdated' && !hasNewerVersions) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date-modified': {
          const dateA = new Date(a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt).getTime();
          comparison = dateB - dateA;
          break;
        }

        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;

        case 'document-type':
          comparison = a.type.localeCompare(b.type);
          break;

        case 'usage-count': {
          const usageA = a.usedInApplicationIds?.length || 0;
          const usageB = b.usedInApplicationIds?.length || 0;
          comparison = usageB - usageA;
          break;
        }

        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    activeDocuments,
    searchQuery,
    filterByType,
    filterByUsage,
    filterByDate,
    filterByVersion,
    sortBy,
    sortOrder,
    documents,
  ]);

  // Throttled drag over handler for application drop targets
  const handleAppDragOver = useCallback((e: React.DragEvent, appId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    setDropTargetAppId(appId);
  }, []);

  const throttledAppDragOver = useThrottledCallback(handleAppDragOver, { wait: 50 });

  // Calculate counts and filtered document lists for each category
  // Use filteredDocuments to respect search and filter criteria
  const resumes = filteredDocuments.filter((doc) => doc.type === 'resume' || doc.type === 'cv');
  const coverLetters = filteredDocuments.filter((doc) => doc.type === 'cover-letter');
  const portfolios = filteredDocuments.filter((doc) => doc.type === 'portfolio');
  const transcripts = filteredDocuments.filter((doc) => doc.type === 'transcript');
  const certifications = filteredDocuments.filter((doc) => doc.type === 'certification');
  const otherDocs = filteredDocuments.filter((doc) => doc.type === 'other');

  const resumeCount = resumes.length;
  const coverLetterCount = coverLetters.length;
  const portfolioCount = portfolios.length;
  const transcriptCount = transcripts.length;
  const certificationCount = certifications.length;
  const otherDocsCount = otherDocs.length;

  // Render linked applications badge (simple badge without tooltip)
  const renderLinkedApplicationsBadge = (doc: Document) => {
    if (!doc.usedInApplicationIds || doc.usedInApplicationIds.length === 0) {
      return null;
    }

    return (
      <Badge variant="secondary" className="h-4 text-[10px] px-1 shrink-0">
        <Link className="h-2.5 w-2.5 mr-0.5" />
        {doc.usedInApplicationIds.length}
      </Badge>
    );
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    docType:
      | 'resume'
      | 'cv'
      | 'cover-letter'
      | 'portfolio'
      | 'transcript'
      | 'certification'
      | 'other' = 'other'
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      try {
        // Read file as base64 for storage
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const fileContent = e.target?.result as string;

            await addDocument({
              name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              type: docType,
              fileName: file.name,
              fileUrl: fileContent, // Store base64 content
              fileSize: file.size,
              mimeType: file.type,
              version: 1,
            });

            toast.success('File Uploaded', {
              description: `${file.name} has been uploaded successfully`,
            });
            setIsUploadDialogOpen(false);
            // Reset the file input
            event.target.value = '';
          } catch (error) {
            toast.error('Upload Failed', {
              description: error instanceof Error ? error.message : 'Failed to save file',
            });
          }
        };

        reader.onerror = () => {
          toast.error('Upload Failed', {
            description: 'Failed to read file',
          });
        };

        // Read the file as data URL (base64)
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error('Upload Failed', {
          description: error instanceof Error ? error.message : 'Failed to upload file',
        });
      }
    }
  };

  const handleNewDocument = async () => {
    if (!newDocName.trim()) {
      toast.error('Invalid Input', {
        description: 'Please enter a document name',
      });
      return;
    }

    try {
      // Create document with template content based on type
      let defaultContent = '';
      if (newDocType === 'resume') {
        defaultContent = `# ${newDocName}

## Contact Information
- Email: 
- Phone: 
- Location: 

## Summary
Write a brief professional summary here...

## Experience
### Job Title - Company Name
*Dates*
- Achievement or responsibility
- Achievement or responsibility

## Education
### Degree - Institution
*Graduation Year*

## Skills
- Skill 1
- Skill 2
- Skill 3`;
      } else if (newDocType === 'cv') {
        defaultContent = `# ${newDocName}

## Personal Information
- Name: 
- Email: 
- Phone: 
- Address: 

## Professional Summary
Write a comprehensive professional summary here...

## Education
### Degree - Institution
*Graduation Year*
- Details and achievements

## Professional Experience
### Job Title - Company Name
*Dates*
- Detailed responsibilities and achievements

## Publications
- Publication details

## Research Experience
- Research details

## Skills & Competencies
- Technical Skills
- Languages
- Certifications`;
      } else if (newDocType === 'cover-letter') {
        defaultContent = `Dear Hiring Manager,

I am writing to express my interest in [Position] at [Company].

[Write your cover letter content here...]

Thank you for considering my application.

Sincerely,
[Your Name]`;
      } else if (newDocType === 'portfolio') {
        defaultContent = `# ${newDocName}

## Portfolio Overview
Brief description of your portfolio and expertise...

## Featured Projects

### Project 1
**Description:** 
**Technologies:** 
**Link:** 

### Project 2
**Description:** 
**Technologies:** 
**Link:** 

## Skills & Expertise
- Skill area 1
- Skill area 2
- Skill area 3

## Contact
- Website: 
- GitHub: 
- LinkedIn: `;
      } else if (newDocType === 'transcript') {
        defaultContent = `# ${newDocName}

## Academic Transcript

**Institution:** 
**Program:** 
**Period:** 

### Courses & Grades

#### Semester 1
- Course Name - Grade
- Course Name - Grade

#### Semester 2
- Course Name - Grade
- Course Name - Grade

**Overall GPA:** 
**Honors/Awards:** `;
      } else if (newDocType === 'certification') {
        defaultContent = `# ${newDocName}

## Certification Details

**Certification Name:** 
**Issuing Organization:** 
**Issue Date:** 
**Expiration Date:** 
**Credential ID:** 
**Verification URL:** 

## Skills Covered
- Skill 1
- Skill 2
- Skill 3

## Description
Brief description of the certification and what it demonstrates...`;
      } else if (newDocType === 'other') {
        defaultContent = `# ${newDocName}

Add your content here...`;
      }

      await addDocument({
        name: newDocName,
        type: (newDocType as any).replace(/-/g, '_'),
        version: 1,
        content: newDocContent || defaultContent,
      });

      toast.success('Document Created', {
        description: `${newDocName} has been created`,
      });
      setIsNewDocDialogOpen(false);
      setNewDocName('');
      setNewDocType('resume');
      setNewDocContent('');
    } catch (error) {
      toast.error('Creation Failed', {
        description: error instanceof Error ? error.message : 'Failed to create document',
      });
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setEditingName(doc.name);
    setEditingContent(doc.content || '');
    setIsEditMode(false);
  };

  const handleSaveDocument = async () => {
    if (!selectedDocument) return;

    try {
      await updateDocument(selectedDocument.id, {
        name: editingName,
        content: editingContent,
      });

      toast.success('Document Updated', {
        description: `${editingName} has been saved`,
      });
      setIsEditMode(false);
    } catch (error) {
      toast.error('Save Failed', {
        description: error instanceof Error ? error.message : 'Failed to save document',
      });
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    console.log('Soft deleting document:', doc.name, doc.id);

    try {
      // Soft delete by setting deletedAt timestamp
      await updateDocument(doc.id, {
        deletedAt: new Date(),
      });

      console.log('Document soft deleted successfully');

      toast.success('Document Deleted', {
        description: `${doc.name} moved to recently deleted`,
      });

      // Clear selection if the deleted document was selected
      if (selectedDocument?.id === doc.id) {
        setSelectedDocument(null);
        setIsEditMode(false);
      }

      // Refresh the documents list to ensure UI updates
      await fetchDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Delete Failed', {
        description: error instanceof Error ? error.message : 'Failed to delete document',
      });
    }
  };

  const handleRestoreDocument = async (doc: Document) => {
    try {
      // Restore by clearing deletedAt
      await updateDocument(doc.id, {
        deletedAt: undefined,
      });

      toast.success('Document Restored', {
        description: `${doc.name} has been restored`,
      });

      await fetchDocuments();
    } catch (error) {
      toast.error('Restore Failed', {
        description: error instanceof Error ? error.message : 'Failed to restore document',
      });
    }
  };

  const handlePermanentDelete = async (doc: Document) => {
    const confirmed = await confirm({
      title: 'Permanently Delete Document',
      description: `Permanently delete "${doc.name}"? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteDocument(doc.id);

      toast.success('Document Permanently Deleted', {
        description: `${doc.name} has been permanently deleted`,
      });

      await fetchDocuments();
    } catch (error) {
      toast.error('Delete Failed', {
        description:
          error instanceof Error ? error.message : 'Failed to permanently delete document',
      });
    }
  };

  const handleCreateCoverLetter = async () => {
    if (!coverLetterName.trim()) {
      toast.error('Invalid Input', {
        description: 'Please enter a cover letter name',
      });
      return;
    }

    try {
      // Build cover letter content with template
      const content = `Dear Hiring Manager,

I am writing to express my interest in the ${coverLetterPosition || '[Position]'} position at ${coverLetterCompany || '[Company]'}.

${coverLetterContent}

Thank you for considering my application.

Sincerely,
[Your Name]`;

      await addDocument({
        name: coverLetterName,
        type: 'cover-letter',
        version: 1,
        content,
        notes: `Company: ${coverLetterCompany}, Position: ${coverLetterPosition}`,
      });

      toast.success('Cover Letter Created', {
        description: `${coverLetterName} has been created`,
      });
      setIsCoverLetterDialogOpen(false);
      setCoverLetterName('');
      setCoverLetterCompany('');
      setCoverLetterPosition('');
      setCoverLetterContent('');
    } catch (error) {
      toast.error('Creation Failed', {
        description: error instanceof Error ? error.message : 'Failed to create cover letter',
      });
    }
  };

  return (
    <>
      <div className="flex gap-6 h-[calc(100vh-6rem)] pb-6">
        {/* Sidebar */}
        <div className="w-56 flex flex-col gap-4 shrink-0 overflow-hidden">
          {/* Search with integrated Filter */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-10 h-9 text-sm"
            />
            <div className="absolute right-1 top-1 flex items-center gap-0.5">
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 relative">
                    <Filter className="h-3.5 w-3.5" />
                    {(filterByType !== 'all' ||
                      filterByUsage !== 'all' ||
                      filterByDate !== 'all' ||
                      filterByVersion !== 'all' ||
                      sortBy !== 'date-modified') && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[340px] p-0 animate-scaleIn"
                  align="start"
                  side="right"
                  sideOffset={8}
                >
                  {/* Header */}
                  <div className="px-4 py-2.5 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">Filter Documents</h4>
                    </div>
                    {(filterByType !== 'all' ||
                      filterByUsage !== 'all' ||
                      filterByDate !== 'all' ||
                      filterByVersion !== 'all' ||
                      sortBy !== 'date-modified') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium"
                        onClick={() => {
                          setFilterByType('all');
                          setFilterByUsage('all');
                          setFilterByDate('all');
                          setFilterByVersion('all');
                          setSortBy('date-modified');
                          setSortOrder('desc');
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="max-h-[600px]">
                    <div className="p-4 space-y-4">
                      {/* Document Type */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-foreground">Document Type</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'all', label: 'All', Icon: List },
                            { value: 'resume', label: 'Resume', Icon: FileText },
                            { value: 'cv', label: 'CV', Icon: FileText },
                            { value: 'cover-letter', label: 'Cover Letter', Icon: FileCode },
                            { value: 'portfolio', label: 'Portfolio', Icon: Briefcase },
                            { value: 'transcript', label: 'Transcript', Icon: GraduationCap },
                            { value: 'certification', label: 'Certificate', Icon: Award },
                            { value: 'other', label: 'Other', Icon: Paperclip },
                          ].map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFilterByType(
                                  value as
                                    | 'all'
                                    | 'resume'
                                    | 'cv'
                                    | 'cover-letter'
                                    | 'portfolio'
                                    | 'transcript'
                                    | 'certification'
                                    | 'other'
                                )
                              }
                              className={`
                                group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                transition-all duration-200
                                ${
                                  filterByType === value
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md'
                                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                                }
                              `}
                            >
                              <Icon className="h-3 w-3" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Usage Status */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-foreground">Usage Status</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'all', label: 'All', Icon: FileText },
                            { value: 'linked', label: 'Linked', Icon: Link },
                            { value: 'unlinked', label: 'Unlinked', Icon: X },
                          ].map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFilterByUsage(value as 'all' | 'linked' | 'unlinked')
                              }
                              className={`
                                group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                transition-all duration-200
                                ${
                                  filterByUsage === value
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md'
                                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                                }
                              `}
                            >
                              <Icon className="h-3 w-3" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date Filter */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-foreground">Last Updated</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'all', label: 'Any Time', Icon: Clock },
                            { value: 'this-week', label: 'This Week', Icon: Calendar },
                            { value: 'this-month', label: 'This Month', Icon: CalendarDays },
                            { value: 'recent', label: 'Recent', Icon: Sparkles },
                            { value: 'old', label: 'Old', Icon: CalendarClock },
                          ].map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFilterByDate(
                                  value as 'all' | 'recent' | 'old' | 'this-week' | 'this-month'
                                )
                              }
                              className={`
                                group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                transition-all duration-200
                                ${
                                  filterByDate === value
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md'
                                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                                }
                              `}
                            >
                              <Icon className="h-3 w-3" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Version Status */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-foreground">Version Status</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'all', label: 'All', Icon: GitBranch },
                            { value: 'latest', label: 'Latest', Icon: CheckCircle2 },
                            { value: 'outdated', label: 'Outdated', Icon: AlertCircle },
                          ].map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFilterByVersion(value as 'all' | 'latest' | 'outdated')
                              }
                              className={`
                                group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                transition-all duration-200
                                ${
                                  filterByVersion === value
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md'
                                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                                }
                              `}
                            >
                              <Icon className="h-3 w-3" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="relative py-1.5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-background px-3 text-xs text-muted-foreground font-medium">
                            Sorting
                          </span>
                        </div>
                      </div>

                      {/* Sort Options */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-foreground">Sort By</div>
                          <div className="flex items-center gap-1.5 bg-muted/50 rounded-full p-1">
                            {[
                              { value: 'desc', Icon: ArrowDownAZ, tooltip: 'Descending' },
                              { value: 'asc', Icon: ArrowUpAZ, tooltip: 'Ascending' },
                            ].map(({ value, Icon }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setSortOrder(value as 'asc' | 'desc')}
                                className={`
                                  p-1.5 rounded-full transition-all duration-200
                                  ${
                                    sortOrder === value
                                      ? 'bg-background shadow-sm text-foreground'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }
                                `}
                                title={value === 'desc' ? 'Descending' : 'Ascending'}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'date-modified', label: 'Date', Icon: CalendarDays },
                            { value: 'name', label: 'Name', Icon: Type },
                            { value: 'document-type', label: 'Type', Icon: FileType },
                            { value: 'usage-count', label: 'Usage', Icon: Link },
                          ].map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setSortBy(
                                  value as
                                    | 'name'
                                    | 'date-modified'
                                    | 'document-type'
                                    | 'usage-count'
                                )
                              }
                              className={`
                                group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                transition-all duration-200
                                ${
                                  sortBy === value
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md'
                                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                                }
                              `}
                            >
                              <Icon className="h-3 w-3" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setIsNewDocDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>

          {/* Document Groups with Accordion */}
          <ScrollArea className="flex-1 scrollbar-hide">
            <Accordion
              type="multiple"
              defaultValue={['resumes', 'cover-letters']}
              className="w-full max-w-full overflow-hidden"
            >
              {/* Resumes Section */}
              <AccordionItem value="resumes" className="border-b-0 overflow-hidden">
                <AccordionTrigger className="px-2 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Resumes</span>
                    </div>
                    <Badge variant="secondary" className="h-5 text-xs">
                      {resumeCount}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 overflow-hidden">
                  <div className="space-y-1">
                    {resumes.length === 0 ? (
                      <div className="px-2 py-6 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground mb-2">No resumes yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            setNewDocType('resume');
                            setIsNewDocDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Resume
                        </Button>
                      </div>
                    ) : (
                      resumes.map((doc) => {
                        const colors = getDocumentTypeColors(doc.type);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/x-document-id', doc.id);
                              e.dataTransfer.setData('text/plain', JSON.stringify(doc));
                              e.dataTransfer.effectAllowed = 'link';
                              setIsDraggingDocument(true);
                              setDraggingDocumentId(doc.id);
                              // Add visual feedback
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '0.5';
                              }
                            }}
                            onDragEnd={(e) => {
                              setIsDraggingDocument(false);
                              setDraggingDocumentId(null);
                              // Reset visual feedback
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => handleViewDocument(doc)}
                            className={`w-full max-w-[13rem] text-left px-3 py-2 rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                              selectedDocument?.id === doc.id
                                ? 'bg-accent text-accent-foreground border-primary'
                                : `hover:bg-muted ${colors.border}`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {getDocumentTypeIcon(doc.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderLinkedApplicationsBadge(doc)}
                                  {isDocumentRecent(doc.updatedAt) && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 text-[10px] px-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-0.5 animate-pulse-subtle shrink-0"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" />
                                      New
                                    </Badge>
                                  )}
                                  {isDocumentOutdated(doc.updatedAt) && (
                                    <Badge
                                      variant="outline"
                                      className="h-4 text-[10px] px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-0.5 opacity-70 shrink-0"
                                    >
                                      <Clock className="h-2.5 w-2.5" />
                                      Old
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Cover Letters Section */}
              <AccordionItem value="cover-letters" className="border-b-0 overflow-hidden">
                <AccordionTrigger className="px-2 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Cover Letters</span>
                    </div>
                    <Badge variant="secondary" className="h-5 text-xs">
                      {coverLetterCount}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 overflow-hidden">
                  <div className="space-y-1">
                    {coverLetters.length === 0 ? (
                      <div className="px-2 py-6 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground mb-2">No cover letters yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setIsCoverLetterDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Cover Letter
                        </Button>
                      </div>
                    ) : (
                      coverLetters.map((doc) => {
                        const colors = getDocumentTypeColors(doc.type);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/x-document-id', doc.id);
                              e.dataTransfer.setData('text/plain', JSON.stringify(doc));
                              e.dataTransfer.effectAllowed = 'link';
                              setIsDraggingDocument(true);
                              setDraggingDocumentId(doc.id);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '0.5';
                              }
                            }}
                            onDragEnd={(e) => {
                              setIsDraggingDocument(false);
                              setDraggingDocumentId(null);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => handleViewDocument(doc)}
                            className={`w-full max-w-[13rem] text-left px-3 py-2 rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                              selectedDocument?.id === doc.id
                                ? 'bg-accent text-accent-foreground border-primary'
                                : `hover:bg-muted ${colors.border}`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {getDocumentTypeIcon(doc.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderLinkedApplicationsBadge(doc)}
                                  {isDocumentRecent(doc.updatedAt) && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 text-[10px] px-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-0.5 animate-pulse-subtle shrink-0"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" />
                                      New
                                    </Badge>
                                  )}
                                  {isDocumentOutdated(doc.updatedAt) && (
                                    <Badge
                                      variant="outline"
                                      className="h-4 text-[10px] px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-0.5 opacity-70 shrink-0"
                                    >
                                      <Clock className="h-2.5 w-2.5" />
                                      Old
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Portfolios Section */}
              {portfolioCount > 0 && (
                <AccordionItem value="portfolios" className="border-b-0 overflow-hidden">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Portfolios</span>
                      </div>
                      <Badge variant="secondary" className="h-5 text-xs">
                        {portfolioCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 overflow-hidden">
                    <div className="space-y-1">
                      {portfolios.map((doc) => {
                        const colors = getDocumentTypeColors(doc.type);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/x-document-id', doc.id);
                              e.dataTransfer.setData('text/plain', JSON.stringify(doc));
                              e.dataTransfer.effectAllowed = 'link';
                              setIsDraggingDocument(true);
                              setDraggingDocumentId(doc.id);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '0.5';
                              }
                            }}
                            onDragEnd={(e) => {
                              setIsDraggingDocument(false);
                              setDraggingDocumentId(null);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => handleViewDocument(doc)}
                            className={`w-full max-w-[13rem] text-left px-3 py-2 rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                              selectedDocument?.id === doc.id
                                ? 'bg-accent text-accent-foreground border-primary'
                                : `hover:bg-muted ${colors.border}`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {getDocumentTypeIcon(doc.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderLinkedApplicationsBadge(doc)}
                                  {isDocumentRecent(doc.updatedAt) && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 text-[10px] px-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-0.5 animate-pulse-subtle shrink-0"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" />
                                      New
                                    </Badge>
                                  )}
                                  {isDocumentOutdated(doc.updatedAt) && (
                                    <Badge
                                      variant="outline"
                                      className="h-4 text-[10px] px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-0.5 opacity-70 shrink-0"
                                    >
                                      <Clock className="h-2.5 w-2.5" />
                                      Old
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Transcripts Section */}
              {transcriptCount > 0 && (
                <AccordionItem value="transcripts" className="border-b-0 overflow-hidden">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Transcripts</span>
                      </div>
                      <Badge variant="secondary" className="h-5 text-xs">
                        {transcriptCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 overflow-hidden">
                    <div className="space-y-1">
                      {transcripts.map((doc) => {
                        const colors = getDocumentTypeColors(doc.type);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/x-document-id', doc.id);
                              e.dataTransfer.setData('text/plain', JSON.stringify(doc));
                              e.dataTransfer.effectAllowed = 'link';
                              setIsDraggingDocument(true);
                              setDraggingDocumentId(doc.id);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '0.5';
                              }
                            }}
                            onDragEnd={(e) => {
                              setIsDraggingDocument(false);
                              setDraggingDocumentId(null);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => handleViewDocument(doc)}
                            className={`w-full max-w-[13rem] text-left px-3 py-2 rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                              selectedDocument?.id === doc.id
                                ? 'bg-accent text-accent-foreground border-primary'
                                : `hover:bg-muted ${colors.border}`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {getDocumentTypeIcon(doc.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderLinkedApplicationsBadge(doc)}
                                  {isDocumentRecent(doc.updatedAt) && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 text-[10px] px-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-0.5 animate-pulse-subtle shrink-0"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" />
                                      New
                                    </Badge>
                                  )}
                                  {isDocumentOutdated(doc.updatedAt) && (
                                    <Badge
                                      variant="outline"
                                      className="h-4 text-[10px] px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-0.5 opacity-70 shrink-0"
                                    >
                                      <Clock className="h-2.5 w-2.5" />
                                      Old
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Certifications Section */}
              {certificationCount > 0 && (
                <AccordionItem value="certifications" className="border-b-0 overflow-hidden">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Certifications</span>
                      </div>
                      <Badge variant="secondary" className="h-5 text-xs">
                        {certificationCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 overflow-hidden">
                    <div className="space-y-1">
                      {certifications.map((doc) => {
                        const colors = getDocumentTypeColors(doc.type);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/x-document-id', doc.id);
                              e.dataTransfer.setData('text/plain', JSON.stringify(doc));
                              e.dataTransfer.effectAllowed = 'link';
                              setIsDraggingDocument(true);
                              setDraggingDocumentId(doc.id);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '0.5';
                              }
                            }}
                            onDragEnd={(e) => {
                              setIsDraggingDocument(false);
                              setDraggingDocumentId(null);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => handleViewDocument(doc)}
                            className={`w-full max-w-[13rem] text-left px-3 py-2 rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                              selectedDocument?.id === doc.id
                                ? 'bg-accent text-accent-foreground border-primary'
                                : `hover:bg-muted ${colors.border}`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {getDocumentTypeIcon(doc.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderLinkedApplicationsBadge(doc)}
                                  {isDocumentRecent(doc.updatedAt) && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 text-[10px] px-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-0.5 animate-pulse-subtle shrink-0"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" />
                                      New
                                    </Badge>
                                  )}
                                  {isDocumentOutdated(doc.updatedAt) && (
                                    <Badge
                                      variant="outline"
                                      className="h-4 text-[10px] px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-0.5 opacity-70 shrink-0"
                                    >
                                      <Clock className="h-2.5 w-2.5" />
                                      Old
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Other Documents Section */}
              {otherDocsCount > 0 && (
                <AccordionItem value="other-docs" className="border-b-0 overflow-hidden">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Other Documents</span>
                      </div>
                      <Badge variant="secondary" className="h-5 text-xs">
                        {otherDocsCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 overflow-hidden">
                    <div className="space-y-1">
                      {otherDocs.map((doc) => {
                        const colors = getDocumentTypeColors(doc.type);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/x-document-id', doc.id);
                              e.dataTransfer.setData('text/plain', JSON.stringify(doc));
                              e.dataTransfer.effectAllowed = 'link';
                              setIsDraggingDocument(true);
                              setDraggingDocumentId(doc.id);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '0.5';
                              }
                            }}
                            onDragEnd={(e) => {
                              setIsDraggingDocument(false);
                              setDraggingDocumentId(null);
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.opacity = '1';
                              }
                            }}
                            onClick={() => handleViewDocument(doc)}
                            className={`w-full max-w-[13rem] text-left px-3 py-2 rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                              selectedDocument?.id === doc.id
                                ? 'bg-accent text-accent-foreground border-primary'
                                : `hover:bg-muted ${colors.border}`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {getDocumentTypeIcon(doc.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderLinkedApplicationsBadge(doc)}
                                  {isDocumentRecent(doc.updatedAt) && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 text-[10px] px-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex items-center gap-0.5 animate-pulse-subtle shrink-0"
                                    >
                                      <Sparkles className="h-2.5 w-2.5" />
                                      New
                                    </Badge>
                                  )}
                                  {isDocumentOutdated(doc.updatedAt) && (
                                    <Badge
                                      variant="outline"
                                      className="h-4 text-[10px] px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 flex items-center gap-0.5 opacity-70 shrink-0"
                                    >
                                      <Clock className="h-2.5 w-2.5" />
                                      Old
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Recently Deleted Section */}
              {recentlyDeleted.length > 0 && (
                <AccordionItem value="recently-deleted" className="border-b-0">
                  <AccordionTrigger className="px-2 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">Recently Deleted</span>
                      </div>
                      <Badge variant="destructive" className="h-5 text-xs">
                        {recentlyDeleted.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 overflow-hidden">
                    <div className="space-y-1">
                      {recentlyDeleted.map((doc) => (
                        <div
                          key={doc.id}
                          className="w-full max-w-[13rem] px-2 py-2 rounded-md bg-muted/30 border border-destructive/20"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{doc.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleRestoreDocument(doc)}
                                title="Restore"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handlePermanentDelete(doc)}
                                title="Delete Forever"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </ScrollArea>
        </div>

        {/* Preview Area */}
        <div className="flex-1 min-w-0">
          {selectedDocument ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {isEditMode ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="text-sm font-semibold h-8"
                      />
                    ) : (
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-sm font-semibold truncate">
                            {selectedDocument.name}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {selectedDocument.type} · v{selectedDocument.version} ·{' '}
                            {new Date(selectedDocument.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedDocument.fileUrl &&
                          selectedDocument.mimeType === 'application/pdf' &&
                          !selectedDocument.content && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Uploaded File
                            </Badge>
                          )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {isEditMode ? (
                      <>
                        {/* Auto-save indicator */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                          {isSaving ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-pulse">Saving...</span>
                            </span>
                          ) : lastSaved ? (
                            <span>Saved {lastSaved.toLocaleTimeString()}</span>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setIsEditMode(false);
                            setEditingName(selectedDocument.name);
                            setEditingContent(selectedDocument.content || '');
                            setLastSaved(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" className="h-8" onClick={handleSaveDocument}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setIsEditMode(true)}
                          title={
                            selectedDocument.fileUrl && !selectedDocument.content
                              ? 'Cannot edit uploaded file (no text content)'
                              : 'Edit'
                          }
                          disabled={!!(selectedDocument.fileUrl && !selectedDocument.content)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          title="Link to Application"
                          onClick={() => setIsLinkDialogOpen(true)}
                        >
                          <Link className="h-3.5 w-3.5 mr-1" />
                          {selectedDocument.usedInApplicationIds &&
                          selectedDocument.usedInApplicationIds.length > 0 ? (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                              {selectedDocument.usedInApplicationIds.length}
                            </Badge>
                          ) : (
                            'Link'
                          )}
                        </Button>
                        {(selectedDocument.content || selectedDocument.fileUrl) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Download"
                            onClick={() => {
                              // Handle uploaded files
                              if (selectedDocument.fileUrl && !selectedDocument.content) {
                                const a = document.createElement('a');
                                a.href = selectedDocument.fileUrl;
                                a.download =
                                  selectedDocument.fileName || `${selectedDocument.name}.pdf`;
                                a.click();
                                return;
                              }

                              // Handle text-based documents
                              const content = selectedDocument.content || '';
                              let fileName = selectedDocument.name;
                              let mimeType = 'text/plain';

                              // Set file extension based on current view format
                              if (viewFormat === 'pdf') {
                                fileName = `${fileName}.pdf`;
                                mimeType = 'application/pdf';
                              } else if (viewFormat === 'markdown') {
                                fileName = `${fileName}.md`;
                                mimeType = 'text/markdown';
                              } else if (viewFormat === 'richtext') {
                                fileName = `${fileName}.html`;
                                mimeType = 'text/html';
                              } else {
                                fileName = `${fileName}.txt`;
                              }

                              const blob = new Blob([content], { type: mimeType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = fileName;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                          onClick={() => handleDeleteDocument(selectedDocument)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 overflow-auto scrollbar-hide flex flex-col">
                {selectedDocument.fileName &&
                !selectedDocument.fileUrl &&
                !selectedDocument.content ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedDocument.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDocument.fileSize
                            ? `${(selectedDocument.fileSize / 1024).toFixed(2)} KB`
                            : 'File uploaded'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        File preview not available. Download to view.
                      </p>
                    </div>
                  </div>
                ) : isEditMode ? (
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full h-full min-h-full font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0"
                    placeholder="Write your document content here..."
                  />
                ) : selectedDocument.fileUrl &&
                  selectedDocument.mimeType === 'application/pdf' &&
                  !selectedDocument.content ? (
                  // Uploaded PDF file - only show PDF viewer (no text content to convert)
                  <div className="flex-1 flex flex-col">
                    {numPages && numPages > 1 && (
                      <div className="border-b px-4 py-2 flex items-center justify-center gap-4 bg-muted/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        >
                          ←
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                          Page {currentPage} of {numPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={currentPage >= numPages}
                          onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
                        >
                          →
                        </Button>
                      </div>
                    )}
                    <ScrollArea className="flex-1 scrollbar-hide">
                      <div
                        ref={pdfContainerRef}
                        className="flex flex-col items-center p-6 space-y-4 w-full"
                      >
                        {pdfLoadFailed ? (
                          <div className="text-center py-12 space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                              <FileText className="h-8 w-8 text-destructive" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Failed to load PDF</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Unable to render PDF. Try downloading the file instead.
                              </p>
                            </div>
                            <Button
                              variant="default"
                              onClick={() => {
                                setPdfLoadFailed(false);
                                pdfLoadErrorShownRef.current = null;
                                pdfLoadErrorTimestampRef.current = 0;
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </div>
                        ) : generatedPdfUrl ? (
                          <PDFDocument
                            file={generatedPdfUrl}
                            onLoadSuccess={({ numPages }) => {
                              setNumPages(numPages);
                              setCurrentPage(1);
                              setPdfLoadFailed(false);
                              pdfLoadErrorShownRef.current = null;
                              pdfLoadErrorTimestampRef.current = 0;
                            }}
                            onLoadError={(error) => {
                              console.error('PDF load error:', error);
                              setPdfLoadFailed(true);

                              const errorKey = `${selectedDocument?.id}-${generatedPdfUrl}`;
                              if (pdfLoadErrorShownRef.current !== errorKey) {
                                pdfLoadErrorShownRef.current = errorKey;
                                toast.error('Failed to load PDF', {
                                  description:
                                    'Unable to render PDF file. Try downloading instead.',
                                });
                              }
                            }}
                            className="shadow-lg"
                          >
                            <PDFPage
                              pageNumber={currentPage}
                              width={pdfWidth}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                            />
                          </PDFDocument>
                        ) : (
                          <div className="text-center py-12">
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">Generating preview...</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <Tabs
                    value={viewFormat}
                    onValueChange={(value) =>
                      setViewFormat(value as 'pdf' | 'markdown' | 'richtext' | 'plain' | 'history')
                    }
                    className="flex-1 flex flex-col"
                  >
                    <div className="px-6 pt-4 pb-2 border-b">
                      <TabsList className="grid w-full max-w-3xl grid-cols-5">
                        <TabsTrigger value="pdf" className="text-xs">
                          <File className="h-3 w-3 mr-1.5" />
                          PDF
                        </TabsTrigger>
                        <TabsTrigger value="markdown" className="text-xs">
                          <FileCode className="h-3 w-3 mr-1.5" />
                          Markdown
                        </TabsTrigger>
                        <TabsTrigger value="richtext" className="text-xs">
                          <Type className="h-3 w-3 mr-1.5" />
                          Rich Text
                        </TabsTrigger>
                        <TabsTrigger value="plain" className="text-xs">
                          <FileType className="h-3 w-3 mr-1.5" />
                          Plain Text
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs">
                          <GitBranch className="h-3 w-3 mr-1.5" />
                          History
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="pdf" className="flex-1 m-0 overflow-hidden flex flex-col">
                      {numPages && numPages > 1 && (
                        <div className="border-b px-4 py-2 flex items-center justify-center gap-4 bg-muted/30">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          >
                            ←
                          </Button>
                          <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                            Page {currentPage} of {numPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={currentPage >= numPages}
                            onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
                          >
                            →
                          </Button>
                        </div>
                      )}
                      <ScrollArea className="flex-1 scrollbar-hide">
                        <div
                          ref={pdfContainerRef}
                          className="flex flex-col items-center p-6 space-y-4 w-full"
                        >
                          {pdfLoadFailed ? (
                            <div className="text-center py-12 space-y-4">
                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                                <FileText className="h-8 w-8 text-destructive" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Failed to load PDF</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Unable to render PDF. Try viewing in another format or retry
                                  loading.
                                </p>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="default"
                                  onClick={() => {
                                    setPdfLoadFailed(false);
                                    pdfLoadErrorShownRef.current = null;
                                    pdfLoadErrorTimestampRef.current = 0;
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                                <Button variant="outline" onClick={() => setViewFormat('markdown')}>
                                  View as Markdown
                                </Button>
                              </div>
                            </div>
                          ) : generatedPdfUrl ? (
                            <PDFDocument
                              file={generatedPdfUrl}
                              onLoadSuccess={({ numPages }) => {
                                setNumPages(numPages);
                                setCurrentPage(1);
                                setPdfLoadFailed(false);
                                // Reset error tracking on successful load
                                pdfLoadErrorShownRef.current = null;
                                pdfLoadErrorTimestampRef.current = 0;
                              }}
                              onLoadError={(error) => {
                                console.error('PDF load error:', error);
                                // Mark as failed to stop retry attempts
                                setPdfLoadFailed(true);

                                // Show toast notification once
                                const errorKey = `${selectedDocument?.id}-${generatedPdfUrl}`;
                                if (pdfLoadErrorShownRef.current !== errorKey) {
                                  pdfLoadErrorShownRef.current = errorKey;
                                  toast.error('Failed to load PDF', {
                                    description:
                                      'Unable to render PDF. Try viewing in another format.',
                                  });
                                }
                              }}
                              className="w-full flex flex-col items-center"
                            >
                              {numPages &&
                                Array.from(new Array(numPages), (_, index) => (
                                  <PDFPage
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1}
                                    className="mb-4 shadow-lg max-w-full"
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    width={pdfWidth}
                                  />
                                ))}
                            </PDFDocument>
                          ) : (
                            <div className="text-center py-12">
                              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground mb-2">
                                {selectedDocument.content
                                  ? 'Generating PDF preview...'
                                  : 'No content available to display as PDF'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Try switching to Markdown or Plain Text view
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="markdown" className="flex-1 m-0 overflow-hidden">
                      <ScrollArea className="h-full scrollbar-hide">
                        <div className="prose prose-sm dark:prose-invert max-w-none p-6">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                          >
                            {selectedDocument.content || '*No content available*'}
                          </ReactMarkdown>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="richtext" className="flex-1 m-0 overflow-hidden">
                      <ScrollArea className="h-full scrollbar-hide">
                        <div className="prose prose-sm dark:prose-invert max-w-none p-6 whitespace-pre-wrap">
                          {selectedDocument.content || <em>No content available</em>}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="plain" className="flex-1 m-0 overflow-hidden">
                      <ScrollArea className="h-full scrollbar-hide">
                        <pre className="whitespace-pre-wrap font-mono text-sm p-6">
                          {selectedDocument.content || 'No content available'}
                        </pre>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                      <div className="p-6">
                        <DocumentVersionTimeline document={selectedDocument} />
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Document Selected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a document from the sidebar to view or edit it
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setIsNewDocDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a resume, cover letter, or other document. Supported formats: PDF, DOC, DOCX
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-doc-type">Document Type</Label>
              <select
                id="upload-doc-type"
                value={uploadDocType}
                onChange={(e) =>
                  setUploadDocType(
                    e.target.value as
                      | 'resume'
                      | 'cv'
                      | 'cover-letter'
                      | 'portfolio'
                      | 'transcript'
                      | 'certification'
                      | 'other'
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="resume">Resume</option>
                <option value="cv">CV (Curriculum Vitae)</option>
                <option value="cover-letter">Cover Letter</option>
                <option value="portfolio">Portfolio</option>
                <option value="transcript">Transcript</option>
                <option value="certification">Certification</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload">File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e, uploadDocType)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Choose the document type to help organize your files.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Document Dialog */}
      <Dialog open={isNewDocDialogOpen} onOpenChange={setIsNewDocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Create a new document from scratch or use a template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name</Label>
              <Input
                id="doc-name"
                placeholder="My Resume v2"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type</Label>
              <select
                id="doc-type"
                value={newDocType}
                onChange={(e) =>
                  setNewDocType(
                    e.target.value as
                      | 'resume'
                      | 'cv'
                      | 'cover-letter'
                      | 'portfolio'
                      | 'transcript'
                      | 'certification'
                      | 'other'
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="resume">Resume</option>
                <option value="cv">CV (Curriculum Vitae)</option>
                <option value="cover-letter">Cover Letter</option>
                <option value="portfolio">Portfolio</option>
                <option value="transcript">Transcript</option>
                <option value="certification">Certification</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-content">Content (Optional)</Label>
              <Textarea
                id="doc-content"
                placeholder="Leave empty to use a template..."
                className="min-h-[150px] font-mono text-sm"
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, a template will be automatically generated
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsNewDocDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewDocument}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Dialog */}
      <Dialog open={isCoverLetterDialogOpen} onOpenChange={setIsCoverLetterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Cover Letter</DialogTitle>
            <DialogDescription>
              Create a customized cover letter for your application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="letter-name">Cover Letter Name</Label>
              <Input
                id="letter-name"
                placeholder="Software Engineer - Google"
                value={coverLetterName}
                onChange={(e) => setCoverLetterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Google"
                value={coverLetterCompany}
                onChange={(e) => setCoverLetterCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                placeholder="Senior Software Engineer"
                value={coverLetterPosition}
                onChange={(e) => setCoverLetterPosition(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your cover letter here..."
                className="min-h-[200px]"
                value={coverLetterContent}
                onChange={(e) => setCoverLetterContent(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCoverLetterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCoverLetter}>Create Cover Letter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link to Applications Dialog */}
      <LinkApplicationDialog
        document={selectedDocument}
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
      />

      {/* Floating Drop Zone Panel - appears when dragging */}
      {isDraggingDocument && (
        <div className="fixed right-4 top-20 bottom-4 w-80 bg-background border-2 border-primary rounded-lg shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
          <div className="p-4 border-b bg-primary/5">
            <h3 className="font-semibold flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              Drop to Link Application
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Drag document onto an application to link it
            </p>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {applications.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No applications yet
                </div>
              ) : (
                applications.map((app) => {
                  const doc = documents.find((d) => d.id === draggingDocumentId);
                  const isAlreadyLinked = doc?.usedInApplicationIds?.includes(app.id);

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onDragOver={(e) => throttledAppDragOver(e, app.id)}
                      onDragLeave={() => setDropTargetAppId(null)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setDropTargetAppId(null);

                        if (!draggingDocumentId) return;

                        if (isAlreadyLinked) {
                          toast.info('Document already linked to this application');
                          return;
                        }

                        try {
                          await linkDocumentToApplications(draggingDocumentId, [app.id]);
                          toast.success(`Document linked to ${app.position}`);
                        } catch (error) {
                          toast.error('Failed to link document');
                          console.error(error);
                        }
                      }}
                      className={`
                        w-full text-left p-3 rounded-md border-2 transition-all
                        ${dropTargetAppId === app.id ? 'border-primary bg-primary/10 scale-105' : 'border-transparent bg-muted/50'}
                        ${isAlreadyLinked ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5 cursor-pointer'}
                      `}
                      disabled={isAlreadyLinked}
                    >
                      <div className="font-medium text-sm truncate">{app.position}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {app.companyName}
                      </div>
                      {isAlreadyLinked && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Already linked
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
}
