import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useThrottledCallback } from '@tanstack/react-pacer';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  DollarSign,
  Eye,
  FileText,
  GripVertical,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { AnimatedBadge } from '@/components/ui/animated-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate } from '@/lib/utils';
import { useApplicationsStore, useDocumentsStore } from '@/stores';
import type { Application } from '@/types';
import { LinkedDocumentsPopover } from './LinkedDocumentsPopover';

interface KanbanCardProps {
  application: Application;
  isOverlay?: boolean;
}

const priorityColors: Record<NonNullable<Application['priority']>, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
};

const workTypeIcons: Record<NonNullable<Application['workType']>, string> = {
  remote: '🏠',
  hybrid: '🔄',
  onsite: '🏢',
};

export function KanbanCard({ application, isOverlay = false }: KanbanCardProps) {
  const { deleteApplication } = useApplicationsStore();
  const { documents, linkDocumentToApplications } = useDocumentsStore();
  const [isDragOver, setIsDragOver] = useState(false);

  // Get linked documents for this application
  const linkedDocuments = documents.filter((doc) =>
    doc.usedInApplicationIds?.includes(application.id)
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Check if this is a document being dragged OR files from file system
    if (
      e.dataTransfer.types.includes('application/x-document-id') ||
      e.dataTransfer.types.includes('Files')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'link';
      setIsDragOver(true);
    }
  }, []);

  // Throttle drag over events to reduce excessive re-renders (50ms for smooth visual feedback)
  const throttledDragOver = useThrottledCallback(handleDragOver, { wait: 50 });

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Check if it's a document from within the app
    const documentId = e.dataTransfer.getData('application/x-document-id');
    if (documentId) {
      // Handle existing document linking
      const isAlreadyLinked = linkedDocuments.some((doc) => doc.id === documentId);
      if (isAlreadyLinked) {
        toast.info('Document already linked to this application');
        return;
      }

      try {
        await linkDocumentToApplications(documentId, [application.id]);
        const docData = JSON.parse(e.dataTransfer.getData('text/plain'));
        toast.success(`${docData.name} linked to ${application.position}`);
      } catch (error) {
        toast.error('Failed to link document');
        console.error('Error linking document:', error);
      }
      return;
    }

    // Handle file system drops
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Filter for supported file types
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html',
    ];

    const validFiles = files.filter((file) => supportedTypes.includes(file.type));

    if (validFiles.length === 0) {
      toast.error('Unsupported file type. Please drop PDF, Word, or text files.');
      return;
    }

    toast.info(`Processing ${validFiles.length} file(s)...`);

    // Process each file
    for (const file of validFiles) {
      try {
        const reader = new FileReader();
        const fileContent: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Detect document type based on filename
        const fileName = file.name.toLowerCase();
        let type:
          | 'resume'
          | 'cover-letter'
          | 'portfolio'
          | 'transcript'
          | 'certification'
          | 'other' = 'other';

        if (fileName.includes('resume') || fileName.includes('cv')) {
          type = 'resume';
        } else if (fileName.includes('cover') || fileName.includes('letter')) {
          type = 'cover-letter';
        } else if (fileName.includes('portfolio')) {
          type = 'portfolio';
        } else if (fileName.includes('transcript')) {
          type = 'transcript';
        } else if (fileName.includes('cert')) {
          type = 'certification';
        }

        // Create the document
        const { addDocument } = useDocumentsStore.getState();
        const newDocument = await addDocument({
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: (type as any).replace(/-/g, '_'),
          fileName: file.name,
          fileUrl: fileContent,
          fileSize: file.size,
          mimeType: file.type,
          tags: [application.companyName, application.position],
          version: 1,
        });

        // Link to this application
        await linkDocumentToApplications(newDocument.id, [application.id]);

        toast.success(`${file.name} uploaded and linked`);
      } catch (error) {
        toast.error(`Failed to process ${file.name}`);
        console.error('Error processing file:', error);
      }
    }
  };

  const cardContent = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        ref={setNodeRef}
        style={style}
        onDragOver={throttledDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'cursor-grab active:cursor-grabbing transition-all',
          isOverlay && 'rotate-3 shadow-lg',
          isDragging && 'opacity-50',
          isDragOver && 'ring-2 ring-primary ring-offset-2 scale-105'
        )}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{application.position}</h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{application.companyName}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {application.priority && (
                <AnimatedBadge
                  className={cn('text-xs h-5', priorityColors[application.priority])}
                  variant="outline"
                  animateOnMount={false}
                >
                  {application.priority}
                </AnimatedBadge>
              )}

              {!isOverlay && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteApplication(application.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 space-y-2">
          {/* Location & Work Type */}
          {(application.location || application.workType) && (
            <div className="flex items-center gap-2 text-xs">
              {application.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{application.location}</span>
                </div>
              )}
              {application.workType && (
                <Badge variant="secondary" className="text-xs h-5">
                  {workTypeIcons[application.workType]} {application.workType}
                </Badge>
              )}
            </div>
          )}

          {/* Salary */}
          {application.salary && (application.salary.min || application.salary.max) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>
                {application.salary.min && application.salary.max
                  ? `${new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: application.salary.currency || 'USD',
                      maximumFractionDigits: 0,
                    }).format(application.salary.min)} - ${new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: application.salary.currency || 'USD',
                      maximumFractionDigits: 0,
                    }).format(application.salary.max)}`
                  : new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: application.salary.currency || 'USD',
                      maximumFractionDigits: 0,
                    }).format(application.salary.min || application.salary.max || 0)}
              </span>
            </div>
          )}

          {/* Dates */}
          {application.appliedDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Applied {formatDate(application.appliedDate)}</span>
            </div>
          )}

          {/* Tags */}
          {application.tags && application.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {application.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs h-5">
                  {tag}
                </Badge>
              ))}
              {application.tags.length > 3 && (
                <Badge variant="outline" className="text-xs h-5">
                  +{application.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Linked Documents */}
          {linkedDocuments.length > 0 && (
            <LinkedDocumentsPopover documents={linkedDocuments} applicationId={application.id}>
              <button
                type="button"
                className="w-full flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="h-3 w-3" />
                <span>
                  {linkedDocuments.length} document{linkedDocuments.length > 1 ? 's' : ''}
                </span>
              </button>
            </LinkedDocumentsPopover>
          )}

          {/* Drag Handle */}
          {!isOverlay && (
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center pt-1 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return cardContent;
}
