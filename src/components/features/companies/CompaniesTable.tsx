import type { ColumnDef, Table } from '@tanstack/react-table';
import { Building2, CheckCircle2, ExternalLink, Pencil, Star, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useConfirm } from '@/hooks/useConfirm';
import { COMPANY_STATUSES, REMOTE_POLICIES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { useCompaniesStore } from '@/stores/companiesStore';
import type { Company } from '@/types';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { CompanyDetailDrawer } from './CompanyDetailDrawer';
import { DataQualityIndicator } from './DataQualityIndicator';

const statusColors: Record<string, string> = {
  target: 'bg-gray-500',
  researching: 'bg-blue-500',
  applied: 'bg-yellow-500',
  interviewing: 'bg-purple-500',
  rejected: 'bg-red-500',
  'not-interested': 'bg-orange-500',
};

interface CompaniesTableProps {
  companies: Company[];
  onTableReady?: (table: Table<Company>) => void;
  onEditCompany?: (company: Company) => void;
}

export function CompaniesTable({ companies, onTableReady, onEditCompany }: CompaniesTableProps) {
  const { deleteCompany } = useCompaniesStore();
  const { confirm } = useConfirm();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDelete = useCallback(
    async (company: Company) => {
      const confirmed = await confirm({
        title: 'Delete Company',
        description: `Are you sure you want to delete ${company.name}?`,
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });

      if (confirmed) {
        deleteCompany(company.id);
        toast.success(`${company.name} deleted`);
      }
    },
    [confirm, deleteCompany],
  );

  const handleRowClick = useCallback((company: Company) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
  }, []);

  const getStatusLabel = useCallback((status?: string) => {
    if (!status) return null;
    const statusConfig = COMPANY_STATUSES.find((s) => s.value === status);
    return statusConfig?.label || status;
  }, []);

  const getStatusColor = useCallback((status?: string) => {
    if (!status) return 'bg-gray-400';
    return statusColors[status] || 'bg-gray-400';
  }, []);

  const getRemotePolicyLabel = useCallback((policy?: string) => {
    if (!policy) return null;
    const policyConfig = REMOTE_POLICIES.find((p) => p.value === policy);
    return policyConfig ? `${policyConfig.icon} ${policyConfig.label}` : policy;
  }, []);

  const columns = useMemo<ColumnDef<Company>[]>(
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
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column}>Company Name</SortableHeader>,
        cell: ({ row }) => {
          return (
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 -m-2 p-2 rounded w-full text-left"
              onClick={() => handleRowClick(row.original)}
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{row.getValue('name')}</span>
                  {row.original.applicationIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {row.original.applicationIds.length}{' '}
                      {row.original.applicationIds.length === 1 ? 'app' : 'apps'}
                    </Badge>
                  )}
                  <DataQualityIndicator company={row.original} variant="inline" />
                </div>
                {row.original.website && (
                  <a
                    href={row.original.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => {
          const industries = row.getValue('industry') as string[] | undefined;
          if (!industries || industries.length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {industries.slice(0, 2).map((ind, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {ind}
                </Badge>
              ))}
              {industries.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{industries.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => {
          const status = row.getValue('status') as string | undefined;
          if (!status) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <Badge className={getStatusColor(status)} variant="outline">
              {getStatusLabel(status)}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'size',
        header: 'Size',
        cell: ({ row }) => {
          const size = row.getValue('size') as string | undefined;
          return size ? (
            <span className="text-sm">{size}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const location = row.getValue('location') as string | undefined;
          return location ? (
            <span className="text-sm">{location}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        accessorKey: 'remotePolicy',
        header: 'Remote Policy',
        cell: ({ row }) => {
          const policy = row.getValue('remotePolicy') as string | undefined;
          if (!policy) return <span className="text-muted-foreground text-sm">—</span>;
          return <div className="text-sm">{getRemotePolicyLabel(policy)}</div>;
        },
      },
      {
        accessorKey: 'ratings.overall',
        id: 'rating',
        header: ({ column }) => <SortableHeader column={column}>Rating</SortableHeader>,
        cell: ({ row }) => {
          const overall = row.original.ratings?.overall;
          if (!overall) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{overall}/5</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'researched',
        header: 'Researched',
        cell: ({ row }) => {
          const researched = row.getValue('researched') as boolean;
          return researched ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        accessorKey: 'applicationIds',
        id: 'applications',
        header: 'Applications',
        cell: ({ row }) => {
          const appIds = row.original.applicationIds || [];
          return appIds.length > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {appIds.length}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <SortableHeader column={column}>Updated</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue('updatedAt') as Date;
          return <span className="text-sm">{formatDate(date)}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div className="flex items-center gap-1">
              {onEditCompany && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCompany(company);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(company);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [
      onEditCompany,
      handleDelete,
      handleRowClick,
      getStatusLabel,
      getStatusColor,
      getRemotePolicyLabel,
    ],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={companies}
        onTableReady={onTableReady}
        hideToolbar={true}
        renderBulkActions={({ selectedRows, table }) => (
          <BulkActionsToolbar
            selectedCompanies={selectedRows}
            onClearSelection={() => table.toggleAllRowsSelected(false)}
          />
        )}
      />

      <CompanyDetailDrawer
        company={selectedCompany}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDelete={handleDelete}
      />
    </>
  );
}
