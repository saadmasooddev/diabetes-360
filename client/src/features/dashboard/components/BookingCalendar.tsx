import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
  availableDates: Date[];
  isLoading?: boolean;
}

export function BookingCalendar({
  selectedDate,
  onDateSelect,
  calendarMonth,
  onMonthChange,
  availableDates,
  isLoading = false,
}: BookingCalendarProps) {
  return (
    <Card
      className="p-4 sm:p-6 mb-4 sm:mb-6"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            month={calendarMonth}
            onMonthChange={onMonthChange}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
            modifiers={{
              hasAvailability: availableDates,
            }}
            modifiersClassNames={{
              hasAvailability: 'bg-teal-100 text-teal-900 font-semibold',
            }}
          />
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
            <div className="w-4 h-4 bg-teal-100 rounded"></div>
            <span>Dates with available slots</span>
          </div>
        </>
      )}
    </Card>
  );
}

