import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDocumentsStore } from '@/stores';
import { useApplicationsStore } from '@/stores/applicationsStore';
import type { Application } from '@/types';
import { ApplicationForm } from './ApplicationForm';

interface ApplicationDialogProps {
  application?: Application;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ApplicationDialog({
  application,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ApplicationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { createApplication, updateApplication } = useApplicationsStore();
  const { linkDocumentToApplications, unlinkDocumentFromApplication, documents } =
    useDocumentsStore();

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const handleSubmit = async (data: Partial<Application> & { linkedDocumentIds?: string[] }) => {
    setIsLoading(true);

    try {
      const linkedDocumentIds = data.linkedDocumentIds || [];

      // Remove linkedDocumentIds from application data as it's not part of the Application type
      const { linkedDocumentIds: _, ...applicationData } = data;

      let applicationId: string;

      if (application) {
        // Update existing application
        await updateApplication(application.id, applicationData);
        applicationId = application.id;
      } else {
        // Create new application
        const newApp = await createApplication(
          applicationData as Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
        );
        if (!newApp) {
          throw new Error('Failed to create application');
        }
        applicationId = newApp.id;
      }

      // Link documents to the application
      // First, unlink all previously linked documents that are no longer selected
      if (application) {
        const previouslyLinkedDocs = documents.filter((doc) =>
          doc.usedInApplicationIds?.includes(application.id),
        );

        for (const doc of previouslyLinkedDocs) {
          if (!linkedDocumentIds.includes(doc.id)) {
            // Use the proper unlink function
            await unlinkDocumentFromApplication(doc.id, application.id);
          }
        }
      }

      // Link the selected documents
      for (const docId of linkedDocumentIds) {
        const doc = documents.find((d) => d.id === docId);
        if (doc) {
          const currentAppIds = doc.usedInApplicationIds || [];
          if (!currentAppIds.includes(applicationId)) {
            // Just pass the new application ID - linkDocumentToApplications will merge it
            await linkDocumentToApplications(docId, [applicationId]);
          }
        }
      }

      setOpen(false);
    } catch (error) {
      console.error('Failed to save application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{application ? 'Edit Application' : 'Create New Application'}</DialogTitle>
          <DialogDescription>
            {application
              ? 'Update the details of this job application.'
              : 'Add a new job application to track your progress.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto scrollbar-hide flex-1">
          <ApplicationForm
            application={application}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
