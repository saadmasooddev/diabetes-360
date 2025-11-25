import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatTime12 } from '@/lib/utils';
import { ButtonSpinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Slot, SlotType } from '@/services/bookingService';

interface BookingPrice {
  originalFee: string;
  discountedFee: string | null;
  finalPrice: string;
  isDiscounted: boolean;
  isFree: boolean;
  discountPercentage?: number;
}

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: Slot | null;
  selectedSlotTypeId: string | null;
  onSlotTypeSelect: (slotTypeId: string) => void;
  bookingPrice: BookingPrice | null;
  isLoadingPrice: boolean;
  isBooking: boolean;
  onConfirm: () => void;
  autoSelectedSlotTypeId?: string | null;
}

export function BookingConfirmationDialog({
  isOpen,
  onClose,
  selectedSlot,
  selectedSlotTypeId,
  onSlotTypeSelect,
  bookingPrice,
  isLoadingPrice,
  isBooking,
  onConfirm,
  autoSelectedSlotTypeId,
}: BookingConfirmationDialogProps) {
  // Auto-select slot type if provided and not already selected
  const effectiveSlotTypeId = selectedSlotTypeId || autoSelectedSlotTypeId || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>
            Review your booking details and confirm your appointment
          </DialogDescription>
        </DialogHeader>
        {isLoadingPrice ? (
          <div className="p-4 text-center">
            <ButtonSpinner className="mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Calculating price...</p>
          </div>
        ) : bookingPrice && selectedSlot ? (
          <div className="space-y-4 p-4">
            <div>
              <div className="text-sm text-gray-600 mb-2">Time Slot</div>
              <div className="font-medium" style={{ color: '#00453A' }}>
                {formatTime12(selectedSlot.startTime || '')} - {formatTime12(selectedSlot.endTime || '')}
              </div>
            </div>

            {/* Show selected slot type (read-only) */}
            {selectedSlot.types && selectedSlot.types.length > 0 && effectiveSlotTypeId && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Consultation Type</Label>
                <div className="p-4 rounded-lg border border-[#00856F] bg-[#E0F2F1]">
                  <div className="font-medium text-sm" style={{ color: '#00453A' }}>
                    {(() => {
                      const selectedType = selectedSlot.types.find((t) => t.id === effectiveSlotTypeId);
                      if (!selectedType) return '';
                      const displayName = selectedType.type.charAt(0).toUpperCase() + selectedType.type.slice(1);
                      return `${displayName} Consultation`;
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            {effectiveSlotTypeId && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Original Fee:</span>
                  <span className="font-medium">
                    PKR {parseFloat(bookingPrice.originalFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {bookingPrice.isDiscounted && bookingPrice.discountedFee && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Discounted Fee:</span>
                    <span className="font-medium text-green-600">
                      PKR {parseFloat(bookingPrice.discountedFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {bookingPrice.isFree && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Discounted Fee:</span>
                    <span className="font-medium text-green-600">PKR {parseFloat(bookingPrice.originalFee || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold" style={{ color: '#00453A' }}>Total Amount:</span>
                  <span className="text-lg font-bold" style={{ color: '#00856F' }}>
                    PKR {parseFloat(bookingPrice.finalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {bookingPrice.isDiscounted && bookingPrice.discountPercentage && (
                  <div className="text-xs text-green-600 mt-1">
                    You saved {bookingPrice.discountPercentage}% on this consultation
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-red-600">
            Failed to calculate booking price. Please try again.
          </div>
        )}
        <div className="flex gap-2 p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isBooking}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!bookingPrice || !effectiveSlotTypeId || isBooking}
            className="flex-1"
            style={{
              background: (bookingPrice && effectiveSlotTypeId) ? '#00856F' : '#B0BEC5',
              color: '#FFFFFF',
            }}
          >
            {isBooking ? (
              <>
                <ButtonSpinner className="mr-2" />
                Booking...
              </>
            ) : (
              'Book Appointment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

