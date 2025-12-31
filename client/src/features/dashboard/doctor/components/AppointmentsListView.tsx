import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, Loader2 } from "lucide-react";
import { useAppointments } from "@/hooks/mutations/useAppointments";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/utils/permissions";
import { AccessControl } from "@/components/common/AccessControl";
import { useToast } from "@/hooks/use-toast";
import { ReusablePagination } from "@/components/ui/ReusablePagination";

const formatDate = (date: Date, formatStr: string): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (formatStr === 'MMM dd, yyyy') {
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  }
  if (formatStr === 'yyyy-MM-dd') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return date.toLocaleDateString();
};

interface AppointmentsListViewProps {
  onBackToCalendar: () => void;
  onAddTimeSlot: () => void;
  selectedDate: Date | null;
}

export function AppointmentsListView({
  onBackToCalendar,
  onAddTimeSlot,
  selectedDate,
}: AppointmentsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { toast } = useToast();
  const { hasAnyPermission } = usePermissions();
  const hasReadAllAppointments = hasAnyPermission([PERMISSIONS.READ_ALL_APPOINTMENTS]);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const startDate = selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : undefined;
  const endDate = selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : undefined;

  const { data, isLoading, error } = useAppointments({
    page,
    limit,
    search: debouncedSearch || undefined,
    startDate,
    endDate,
  });

  const appointments = data?.appointments || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load appointments. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button onClick={onBackToCalendar} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
        <Button
          onClick={onAddTimeSlot}
          style={{
            background: "#00856F",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          Add Time Slot
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-4 pr-12 py-6"
            style={{
              borderRadius: "28px",
              border: "1px solid #E0E0E0",
              fontSize: "15px",
            }}
            data-testid="input-search-appointments"
          />
          <Search
            className="absolute right-4 top-1/2 -translate-y-1/2"
            size={20}
            color="#78909C"
          />
        </div>
      </div>

      <Card
        className="p-6"
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}
        data-testid="card-appointments-table"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr>
                  <th
                    className="text-left pb-4"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#78909C",
                    }}
                  >
                    Time
                  </th>
                  <th
                    className="text-left pb-4"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#78909C",
                    }}
                  >
                    Date
                  </th>
                  <th
                    className="text-left pb-4"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#78909C",
                    }}
                  >
                    Patient Name
                  </th>
                  <AccessControl permission={PERMISSIONS.READ_ALL_APPOINTMENTS}>
                    <th
                      className="text-left pb-4"
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#78909C",
                      }}
                    >
                      Doctor Name
                    </th>
                  </AccessControl>
                  <th
                    className="text-left pb-4"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#78909C",
                    }}
                  >
                    In Person/Video Call
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={hasReadAllAppointments ? 5 : 4}
                      className="py-8 text-center text-gray-500"
                    >
                      No appointments found
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt, index) => (
                    <tr
                      key={apt.id}
                      className="border-t border-gray-100"
                      data-testid={`row-appointment-${index}`}
                    >
                      <td
                        className="py-4"
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#00856F",
                        }}
                      >
                        {apt.time}
                      </td>
                      <td
                        className="py-4"
                        style={{
                          fontSize: "15px",
                          fontWeight: 500,
                          color: "#37474F",
                        }}
                      >
                        {apt.date}
                      </td>
                      <td
                        className="py-4"
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#00856F",
                        }}
                      >
                        {apt.patientName}
                      </td>
                      <AccessControl permission={PERMISSIONS.READ_ALL_APPOINTMENTS}>
                        <td
                          className="py-4"
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#00856F",
                          }}
                        >
                          {apt.doctorName}
                        </td>
                      </AccessControl>
                      <td
                        className="py-4"
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: apt.type === "Video Call" ? "#00856F" : "#37474F",
                        }}
                      >
                        {apt.type}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} appointments
                </div>
              </div>
              <ReusablePagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

