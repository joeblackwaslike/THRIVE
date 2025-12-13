import { faIR } from 'date-fns/locale';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import type { DayButton } from 'react-day-picker';
import { DayPicker, getDefaultClassNames, useDayPicker } from 'react-day-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

// Convert Western numerals to Persian numerals
function toPersianNumber(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit, 10)]);
}

// Custom caption with year selector
function CalendarCaption({ displayMonth }: { displayMonth: Date }) {
  const { goToMonth } = useDayPicker();
  const { display } = useSettingsStore();
  const currentYear = displayMonth.getFullYear();
  const isPersian = display.calendarType === 'persian';

  // Generate year range (10 years back, 10 years forward)
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleYearChange = (year: string) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(parseInt(year, 10));
    goToMonth(newDate);
  };

  // Use Persian locale for month name if Persian calendar is selected
  const locale = isPersian ? 'fa-IR' : 'default';
  const monthName = displayMonth.toLocaleString(locale, { month: 'long' });

  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-xs font-medium">{monthName}</span>
      <Select value={currentYear.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="h-6 w-auto gap-1 border-0 px-1 text-xs font-medium hover:bg-accent focus:ring-0">
          <SelectValue>{isPersian ? toPersianNumber(currentYear) : currentYear}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()} className="text-xs">
              {isPersian ? toPersianNumber(year) : year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Root component for calendar
function CalendarRoot({
  className,
  rootRef,
  ...props
}: {
  rootRef?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
}

// Chevron component for navigation arrows
function CalendarChevron({
  className,
  orientation,
  ...props
}: {
  className?: string;
  orientation?: 'left' | 'right' | 'up' | 'down';
} & React.HTMLAttributes<SVGElement>) {
  if (orientation === 'left') {
    return <ChevronLeftIcon className={cn('h-3.5 w-3.5', className)} {...props} />;
  }

  if (orientation === 'right') {
    return <ChevronRightIcon className={cn('h-3.5 w-3.5', className)} {...props} />;
  }

  return <ChevronDownIcon className={cn('h-3.5 w-3.5', className)} {...props} />;
}

// Caption label component that renders the year selector
function CalendarCaptionLabel({
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { displayMonth?: Date }) {
  const displayMonth = props.displayMonth || new Date();
  return <CalendarCaption displayMonth={displayMonth} />;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const defaultClassNames = getDefaultClassNames();
  const { display } = useSettingsStore();
  const isPersian = display.calendarType === 'persian';

  // Use Persian locale when Persian calendar is selected
  const locale = isPersian ? faIR : undefined;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      dir={isPersian ? 'rtl' : 'ltr'}
      className={cn('bg-background p-3 [--cell-size:2.25rem]', className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString('default', { month: 'short' }),
        formatDay: (date) => {
          const day = date.getDate();
          return isPersian ? toPersianNumber(day) : day.toString();
        },
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-3 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-3', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: 'icon' }),
          'h-7 w-7 select-none p-0 opacity-50 hover:opacity-100',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: 'icon' }),
          'h-7 w-7 select-none p-0 opacity-50 hover:opacity-100',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-7 w-full items-center justify-center px-8',
          defaultClassNames.month_caption,
        ),
        caption_label: cn('text-xs font-medium select-none', defaultClassNames.caption_label),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground w-9 flex-1 select-none text-[0.65rem] font-normal',
          defaultClassNames.weekday,
        ),
        week: cn('mt-1 flex w-full', defaultClassNames.week),
        day: cn(
          'group/day relative h-9 w-9 p-0 text-center text-xs font-normal select-none',
          defaultClassNames.day,
        ),
        range_start: cn('rounded-l-md', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md', defaultClassNames.range_end),
        today: cn('font-semibold', defaultClassNames.today),
        outside: cn('text-muted-foreground opacity-40', defaultClassNames.outside),
        disabled: cn('text-muted-foreground opacity-30', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: CalendarRoot,
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
        CaptionLabel: CalendarCaptionLabel,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'h-9 w-9 p-0 font-normal text-xs rounded-md',
        'hover:bg-accent hover:text-accent-foreground',
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-primary-foreground',
        'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:hover:bg-primary data-[range-start=true]:hover:text-primary-foreground',
        'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:hover:bg-primary data-[range-end=true]:hover:text-primary-foreground',
        'data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground',
        'data-[range-start=true]:rounded-l-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
