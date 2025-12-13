import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusTransitionBadge } from '@/components/ui/status-transition-badge';
import { cn } from '@/lib/utils';
import { useApplicationsStore } from '@/stores';
import type { Application } from '@/types';

interface DraggableStatusBadgeProps {
  application: Application;
}

const STATUS_OPTIONS: Array<{ value: Application['status']; label: string; emoji: string }> = [
  { value: 'target', label: 'Target', emoji: '🎯' },
  { value: 'hunting', label: 'Hunting', emoji: '🔍' },
  { value: 'applied', label: 'Applied', emoji: '📝' },
  { value: 'interviewing', label: 'Interviewing', emoji: '💬' },
  { value: 'offer', label: 'Offer', emoji: '🎉' },
  { value: 'accepted', label: 'Accepted', emoji: '✅' },
  { value: 'rejected', label: 'Rejected', emoji: '❌' },
  { value: 'withdrawn', label: 'Withdrawn', emoji: '↩️' },
];

export function DraggableStatusBadge({ application }: DraggableStatusBadgeProps) {
  const { updateApplication } = useApplicationsStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleStatusChange = (newStatus: Application['status']) => {
    if (newStatus === application.status) return;

    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === newStatus);

    updateApplication(application.id, { status: newStatus });

    toast.success(`${statusOption?.emoji} Status updated to "${statusOption?.label}"`, {
      description: `${application.position} at ${application.companyName}`,
    });
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => {
            setIsDragging(false);
            setIsDropdownOpen(true);
          }}
          whileDrag={{
            scale: 1.05,
            cursor: 'grabbing',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          }}
          whileHover={{ scale: 1.02 }}
          className={cn(
            'inline-flex items-center gap-1 cursor-grab active:cursor-grabbing',
            isDragging && 'z-50',
          )}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground opacity-50" />
          <StatusTransitionBadge status={application.status} showIcon showPulse={isDragging} />
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={cn(
              'flex items-center gap-2',
              option.value === application.status && 'bg-accent',
            )}
          >
            <span className="text-base">{option.emoji}</span>
            <span className="flex-1">{option.label}</span>
            {option.value === application.status && (
              <span className="text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
