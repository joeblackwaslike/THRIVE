import { useNavigate } from '@tanstack/react-router';
import { Briefcase, Calendar, Check, ChevronDown, Clock, GitBranch, Pencil, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApplicationsStore, useDocumentsStore } from '@/stores';
import type { Application, Document } from '@/types';

interface DocumentVersionTimelineProps {
  document: Document;
}

interface VersionNode {
  version: number;
  date: Date;
  applications: Array<{
    id: string;
    name: string;
    companyName: string;
    status: Application['status'];
    linkedAt: Date;
  }>;
}

export function DocumentVersionTimeline({ document }: DocumentVersionTimelineProps) {
  const navigate = useNavigate();
  const { applications } = useApplicationsStore();
  const { updateVersionName } = useDocumentsStore();
  const [editingVersion, setEditingVersion] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // Build timeline data structure
  const timeline = useMemo(() => {
    const nodes: VersionNode[] = [];

    // Find all applications that use this document by checking usedInApplicationIds
    const linkedAppIds = document.usedInApplicationIds || [];
    const linkedApps = applications.filter((app) => linkedAppIds.includes(app.id));

    // Create a map of versions to applications
    const versionMap = new Map<number, VersionNode['applications']>();

    linkedApps.forEach((app) => {
      // Check if app has linkedDocuments structure (new format with version tracking)
      const linkedDoc = app.linkedDocuments?.find((link) => link.documentId === document.id);

      // Use version from linkedDocuments if available, otherwise use current document version
      // (assuming if no version info, it's linked to the current/latest version)
      const version = linkedDoc?.version || document.version;
      const linkedAt = linkedDoc?.linkedAt || app.createdAt;

      if (!versionMap.has(version)) {
        versionMap.set(version, []);
      }

      const versionApps = versionMap.get(version);
      if (versionApps) {
        versionApps.push({
          id: app.id,
          name: app.position,
          companyName: app.companyName,
          status: app.status,
          linkedAt: new Date(linkedAt),
        });
      }
    });

    // Create timeline nodes for each version from 1 to current
    for (let v = 1; v <= document.version; v++) {
      const apps = versionMap.get(v) || [];

      // Estimate date based on document dates and version
      let versionDate = document.createdAt;
      if (v === document.version) {
        versionDate = document.updatedAt;
      } else if (apps.length > 0) {
        // Use the earliest linked date for this version
        versionDate = apps.reduce(
          (earliest, app) => (app.linkedAt < earliest ? app.linkedAt : earliest),
          apps[0].linkedAt,
        );
      }

      nodes.push({
        version: v,
        date: new Date(versionDate),
        applications: apps.sort((a, b) => a.linkedAt.getTime() - b.linkedAt.getTime()),
      });
    }

    return nodes.reverse(); // Most recent first
  }, [document, applications]);

  const handleEditVersionName = (version: number, currentName?: string) => {
    setEditingVersion(version);
    setEditingName(currentName || '');
  };

  const handleSaveVersionName = async () => {
    if (editingVersion === null) return;

    try {
      await updateVersionName(document.id, editingName);
      toast.success('Version name updated');
      setEditingVersion(null);
      setEditingName('');
    } catch {
      toast.error('Failed to update version name');
    }
  };

  const handleCancelEdit = () => {
    setEditingVersion(null);
    setEditingName('');
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-500';
      case 'interviewing':
        return 'bg-purple-500';
      case 'offer':
        return 'bg-green-500';
      case 'accepted':
        return 'bg-emerald-500';
      case 'rejected':
        return 'bg-red-500';
      case 'withdrawn':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: Application['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleApplicationClick = (appId: string) => {
    navigate({ to: '/applications', search: { selected: appId } });
  };

  if (timeline.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No version history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Version History</h3>
        <Badge variant="secondary" className="text-xs">
          {timeline.length} {timeline.length === 1 ? 'version' : 'versions'}
        </Badge>
      </div>

      <div className="relative pr-4">
        {/* Timeline line */}
        <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-border" />

        {/* Timeline nodes */}
        <div className="space-y-6">
          {timeline.map((node, index) => {
            const isLatest = node.version === document.version;
            const hasApplications = node.applications.length > 0;

            return (
              <div
                key={node.version}
                className="relative pl-10 animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Version dot */}
                <div
                  className={`absolute left-0 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                    isLatest
                      ? 'bg-primary border-primary text-primary-foreground'
                      : hasApplications
                        ? 'bg-background border-primary/50'
                        : 'bg-background border-border'
                  }`}
                >
                  <span className="text-[10px] font-bold">{node.version}</span>
                </div>

                {/* Version card */}
                <div
                  className={`group rounded-lg border p-3 transition-colors ${
                    isLatest ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  {/* Version header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {editingVersion === node.version ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder={`Version ${node.version} name`}
                              className="h-7 text-sm flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveVersionName();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={handleSaveVersionName}
                            >
                              <Check className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold">
                              {document.versionName && node.version === document.version
                                ? document.versionName
                                : `Version ${node.version}`}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                handleEditVersionName(node.version, document.versionName)
                              }
                              title="Edit version name"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {isLatest && (
                              <Badge variant="default" className="text-[10px] h-4 px-1.5">
                                Current
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      {editingVersion !== node.version && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <time dateTime={node.date.toISOString()}>
                            {node.date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                        </div>
                      )}
                    </div>

                    {hasApplications && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Briefcase className="h-2.5 w-2.5 mr-1" />
                        {node.applications.length}
                      </Badge>
                    )}
                  </div>

                  {/* Applications using this version */}
                  {hasApplications && (
                    <div className="space-y-2 mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground">
                        Used in applications:
                      </p>
                      <div className="relative">
                        <div className="max-h-[200px] overflow-y-auto scrollbar-hide space-y-1.5">
                          {node.applications.map((app) => (
                            <Button
                              key={app.id}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-auto py-2 px-2 hover:bg-accent"
                              onClick={() => handleApplicationClick(app.id)}
                            >
                              <div className="flex items-start gap-2 w-full text-left">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${getStatusColor(
                                    app.status,
                                  )}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{app.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {app.companyName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                                      {getStatusLabel(app.status)}
                                    </Badge>
                                    <span className="text-[9px] text-muted-foreground">
                                      Linked {app.linkedAt.toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>

                        {/* Scroll indicator - only show if there are more than 3 apps */}
                        {node.applications.length > 3 && (
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none flex items-end justify-center pb-1">
                            <ChevronDown className="h-3 w-3 text-muted-foreground animate-bounce" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!hasApplications && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      Not used in any applications
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>Created {new Date(document.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3 w-3" />
            <span>
              {timeline.reduce((sum, node) => sum + node.applications.length, 0)} total applications
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
