import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableListItemProps<T> {
  item: T;
  children: React.ReactNode;
  className?: string;
  dragHandleClassName?: string;
  showDragHandle?: boolean;
}

/**
 * DraggableListItem - Wrapper component for creating drag-to-reorder lists
 *
 * Uses Framer Motion's Reorder component for smooth drag-and-drop reordering.
 * Provides visual feedback during drag with elevation and shadow effects.
 *
 * @example
 * ```tsx
 * <Reorder.Group axis="y" values={items} onReorder={setItems}>
 *   {items.map((item) => (
 *     <DraggableListItem key={item.id} item={item}>
 *       <div>{item.name}</div>
 *     </DraggableListItem>
 *   ))}
 * </Reorder.Group>
 * ```
 */
export function DraggableListItem<T>({
  item,
  children,
  className,
  dragHandleClassName,
  showDragHandle = true,
}: DraggableListItemProps<T>) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={cn('relative list-none', className)}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        cursor: 'grabbing',
        zIndex: 50,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      <div className="flex items-center gap-2">
        {showDragHandle && (
          <motion.div
            className={cn(
              'cursor-grab active:cursor-grabbing',
              'text-muted-foreground hover:text-foreground',
              'transition-colors',
              dragHandleClassName,
            )}
            onPointerDown={(e) => dragControls.start(e)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <GripVertical className="h-5 w-5" />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </Reorder.Item>
  );
}

/**
 * DraggableList - Container component for reorderable lists
 *
 * Provides the context for drag-and-drop reordering.
 *
 * @example
 * ```tsx
 * const [items, setItems] = useState([...]);
 *
 * <DraggableList items={items} onReorder={setItems}>
 *   {(item) => (
 *     <DraggableListItem item={item}>
 *       <div>{item.name}</div>
 *     </DraggableListItem>
 *   )}
 * </DraggableList>
 * ```
 */
interface DraggableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  children: (item: T) => React.ReactNode;
  className?: string;
  axis?: 'x' | 'y';
}

export function DraggableList<T>({
  items,
  onReorder,
  children,
  className,
  axis = 'y',
}: DraggableListProps<T>) {
  return (
    <Reorder.Group
      axis={axis}
      values={items}
      onReorder={onReorder}
      className={cn('space-y-2', className)}
    >
      {items.map((item) => children(item))}
    </Reorder.Group>
  );
}
