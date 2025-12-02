import type { ColumnDef, Table } from '@tanstack/react-table';
import { Copy, ExternalLink, FileText, Pencil, Trash2 } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DataTable } from '@/components/ui/data-table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useConfirm } from '@/hooks/useConfirm';
import { formatDate } from '@/lib/utils';
import { useApplicationsStore, useDocumentsStore, useSettingsStore } from '@/stores';
import type { Application } from '@/types';
import { ApplicationDialog } from './ApplicationDialog';
import { BulkActions } from './BulkActions';
import { DraggableStatusBadge } from './DraggableStatusBadge';
import { LinkedDocumentsPopover } from './LinkedDocumentsPopover';

const priorityColors: Record<NonNullable<Application['priority']>, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
};

interface ApplicationsTableProps {
  onTableReady?: (table: Table<Application>) => void;
}

export function ApplicationsTable({ onTableReady }: ApplicationsTableProps = {}) {
  const { getFilteredApplications, deleteApplication } = useApplicationsStore();
  const { data: dataSettings } = useSettingsStore();
  const { documents, linkDocumentToApplications } = useDocumentsStore();
  const { confirm } = useConfirm();
  const applications = getFilteredApplications();
  const [editingApplication, setEditingApplication] = useState<Application | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);

  const handleEdit = useCallback((application: Application) => {
    setEditingApplication(application);
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogClose = useCallback(() => {
    setIsEditDialogOpen(false);
    // Small delay before clearing to avoid visual glitches
    setTimeout(() => setEditingApplication(undefined), 200);
  }, []);

  const handleDuplicate = useCallback((application: Application) => {
    // Create a copy of the application without id, dates, and status-dependent fields
    const duplicatedApp: Partial<Application> = {
      companyName: application.companyName,
      position: application.position,
      status: 'target', // Reset to target status
      location: application.location,
      workType: application.workType,
      employmentType: application.employmentType,
      salary: application.salary,
      jobUrl: application.jobUrl,
      jobDescription: application.jobDescription,
      notes: application.notes,
      tags: application.tags,
      priority: application.priority,
      source: application.source,
      referralName: application.referralName,
    };
    setEditingApplication(duplicatedApp as Application);
    setIsEditDialogOpen(true);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent, applicationId: string) => {
    // Check if this is a document being dragged OR files from file system
    if (
      e.dataTransfer.types.includes('application/x-document-id') ||
      e.dataTransfer.types.includes('Files')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'link';
      setDragOverRowId(applicationId);
    }
  }, []);

  const handleRowDragLeave = useCallback(() => {
    setDragOverRowId(null);
  }, []);

  const handleRowDrop = useCallback(
    async (e: React.DragEvent, application: Application) => {
      e.preventDefault();
      setDragOverRowId(null);

      // Check if it's a document from within the app
      const documentId = e.dataTransfer.getData('application/x-document-id');
      if (documentId) {
        // Handle existing document linking
        const isAlreadyLinked = documents.some(
          (doc) => doc.id === documentId && doc.usedInApplicationIds?.includes(application.id)
        );

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
    },
    [documents, linkDocumentToApplications]
  );

  const columns = useMemo<ColumnDef<Application>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'position',
        header: ({ column }) => <SortableHeader column={column}>Position</SortableHeader>,
        cell: ({ row }) => {
          return (
            <div>
              <div className="font-medium">{row.getValue('position')}</div>
              <div className="text-sm text-muted-foreground">{row.original.companyName}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'companyName',
        header: ({ column }) => <SortableHeader column={column}>Company</SortableHeader>,
        cell: ({ row }) => {
          return <div className="font-medium">{row.getValue('companyName')}</div>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => {
          return <DraggableStatusBadge application={row.original} />;
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
        cell: ({ row }) => {
          const priority = row.getValue('priority') as Application['priority'];
          if (!priority) return <span className="text-muted-foreground">-</span>;
          return (
            <Badge className={priorityColors[priority]} variant="outline">
              {priority}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const workType = row.original.workType;
          const location = row.getValue('location') as string;
          return (
            <div>
              <div>{location || 'Not specified'}</div>
              <div className="text-sm text-muted-foreground capitalize">{workType}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'salary.min',
        id: 'salary',
        header: ({ column }) => <SortableHeader column={column}>Salary</SortableHeader>,
        cell: ({ row }) => {
          const salary = row.original.salary;
          if (!salary?.min && !salary?.max)
            return <span className="text-muted-foreground">N/A</span>;

          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: salary?.currency || 'USD',
            maximumFractionDigits: 0,
          });

          if (salary?.min && salary?.max) {
            return (
              <div>
                <div>
                  {formatter.format(salary.min)} - {formatter.format(salary.max)}
                </div>
                {salary.period && (
                  <div className="text-sm text-muted-foreground">per {salary.period}</div>
                )}
              </div>
            );
          }

          return <span>{formatter.format(salary?.min || salary?.max || 0)}</span>;
        },
      },
      {
        accessorKey: 'appliedDate',
        header: ({ column }) => <SortableHeader column={column}>Applied</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue('appliedDate') as Date | undefined;
          return date ? (
            formatDate(date)
          ) : (
            <span className="text-muted-foreground">Not applied</span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <SortableHeader column={column}>Updated</SortableHeader>,
        cell: ({ row }) => {
          return formatDate(row.getValue('updatedAt'));
        },
      },
      {
        id: 'documents',
        header: 'Documents',
        cell: ({ row }) => {
          const linkedDocs = documents.filter((doc) =>
            doc.usedInApplicationIds?.includes(row.original.id)
          );

          if (linkedDocs.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <LinkedDocumentsPopover documents={linkedDocs} applicationId={row.original.id}>
              <button
                type="button"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{linkedDocs.length}</span>
              </button>
            </LinkedDocumentsPopover>
          );
        },
      },
    ],
    [documents]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={applications}
        storageKey="thrive-applications-table"
        initialPageSize={dataSettings.itemsPerPage}
        hideToolbar={true}
        onTableReady={onTableReady}
        renderBulkActions={({ selectedRows, table }) => (
          <BulkActions
            selectedRows={selectedRows}
            onClearSelection={() => table.resetRowSelection()}
          />
        )}
        renderRowContextMenu={(application, rowContent) => {
          return (
            <ContextMenu key={application.id}>
              <ContextMenuTrigger asChild>
                <tr
                  onDragOver={(e) => handleRowDragOver(e, application.id)}
                  onDragLeave={handleRowDragLeave}
                  onDrop={(e) => handleRowDrop(e, application)}
                  className={dragOverRowId === application.id ? 'bg-primary/10' : ''}
                >
                  {/* Extract cells from the original row */}
                  {React.isValidElement(rowContent) &&
                    (rowContent as React.ReactElement<{ children: React.ReactNode }>).props
                      .children}
                </tr>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={() => handleEdit(application)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  View/Edit Application
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleDuplicate(application)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Application
                </ContextMenuItem>
                <ContextMenuSeparator />
                {application.jobUrl && (
                  <ContextMenuItem
                    onClick={() => {
                      window.open(application.jobUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Job Posting
                  </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    if (dataSettings.confirmDelete) {
                      const confirmed = await confirm({
                        title: 'Delete Application',
                        description: `Are you sure you want to delete "${application.position}"?`,
                        type: 'danger',
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                      });

                      if (!confirmed) return;
                    }

                    deleteApplication(application.id);
                    toast.success('Application Deleted', {
                      description: `${application.position} has been deleted`,
                    });
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Application
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        }}
      />

      <ApplicationDialog
        application={editingApplication}
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
      />
    </>
  );
}
