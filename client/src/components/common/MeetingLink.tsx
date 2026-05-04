import { useGetMeetingLink } from "@/hooks/mutations/useBooking";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Video, AlertCircle, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/routes";

/**
 * Normalize meeting link from API: service returns string, but guard against
 * response object leaking through (avoids href="[object Object]").
 */
function getMeetingLinkUrl(
	data: string | { meetingLink?: string } | undefined,
): string | null {
	if (typeof data === "string" && data.startsWith("http")) {
		return data;
	}
	if (
		data &&
		typeof data === "object" &&
		typeof (data as { meetingLink?: string }).meetingLink === "string"
	) {
		const url = (data as { meetingLink: string }).meetingLink;
		return url.startsWith("http") ? url : null;
	}
	return null;
}

export const MeetingLink = () => {
	const { bookingId } = useParams<{ bookingId: string }>();
	const [, navigate] = useLocation();
	const { data, isLoading, isError, error, refetch, isRefetching } =
		useGetMeetingLink(bookingId);

	const meetingUrl = getMeetingLinkUrl(data);
	const isLoadingOrRefetching = isLoading || isRefetching;

	const handleJoinMeeting = () => {
		if (!meetingUrl) return;
		window.open(meetingUrl, "_blank", "noopener,noreferrer");
	};

	// No booking ID in route
	if (!bookingId) {
		return (
			<div className="min-h-screen bg-[#f7f9f9] flex flex-col items-center justify-center px-4">
				<div className="w-full max-w-md rounded-[10px] bg-white border border-[#d8dadc] p-8 text-center shadow-sm">
					<AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
					<h1 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-xl mb-2">
						Invalid link
					</h1>
					<p className="[font-family:'Inter',Helvetica] text-sm text-[#000000b2] mb-6">
						This meeting link is invalid or missing a booking reference.
					</p>
					<Button
						variant="outline"
						onClick={() => navigate(ROUTES.DASHBOARD)}
						className="border-[#00856f] text-[#00856f] hover:bg-[#00856f]/5 rounded-[10px]"
					>
						Go to home
					</Button>
				</div>
			</div>
		);
	}

	// Loading
	if (isLoadingOrRefetching && !meetingUrl) {
		return (
			<div className="min-h-screen bg-[#f7f9f9] flex flex-col items-center justify-center px-4">
				<div className="w-full max-w-md rounded-[10px] bg-white border border-[#d8dadc] p-8 flex flex-col items-center shadow-sm">
					<Loader2
						className="h-12 w-12 animate-spin text-[#00856f] mb-6"
						aria-hidden="false"
						role="status"
						aria-label="Loading"
					/>
					<p className="[font-family:'Inter',Helvetica] text-sm text-[#000000b2]">
						Loading your meeting link...
					</p>
				</div>
			</div>
		);
	}

	// Error or no link available
	if (isError || !meetingUrl) {
		return (
			<div className="min-h-screen bg-[#f7f9f9] flex flex-col items-center justify-center px-4">
				<div className="w-full max-w-md rounded-[10px] bg-white border border-[#d8dadc] p-8 text-center shadow-sm">
					<AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
					<h1 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-xl mb-2">
						Meeting link unavailable
					</h1>
					<p className="[font-family:'Inter',Helvetica] text-sm text-[#000000b2] mb-6">
						{error?.message ||
							"The link may not be ready yet or this booking may not support video calls. Please try again or contact support."}
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Button
							onClick={() => refetch()}
							disabled={isLoadingOrRefetching}
							className="bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px]"
						>
							{isLoadingOrRefetching ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Try again
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate(ROUTES.DASHBOARD)}
							className="border-[#00856f] text-[#00856f] hover:bg-[#00856f]/5 rounded-[10px]"
						>
							Go to home
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// Success: show join button
	return (
		<div className="min-h-screen bg-[#f7f9f9] flex flex-col items-center justify-center px-4">
			<div className="w-full max-w-md rounded-[10px] bg-white border border-[#d8dadc] p-8 text-center shadow-sm">
				<div className="flex justify-center mb-6">
					<div className="rounded-full bg-[#00856f]/10 p-4">
						<Video className="h-12 w-12 text-[#00856f]" />
					</div>
				</div>
				<h1 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-xl mb-2">
					Your consultation is ready
				</h1>
				<p className="[font-family:'Inter',Helvetica] text-sm text-[#000000b2] mb-8">
					Click below to join the Zoom meeting. A new tab will open.
				</p>
				<Button
					onClick={handleJoinMeeting}
					className="w-full h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] text-white font-semibold [font-family:'Inter',Helvetica] text-base"
					data-testid="button-join-meeting"
				>
					<Video className="mr-2 h-5 w-5" />
					Join Zoom Meeting
				</Button>
				<button
					type="button"
					onClick={() => navigate(ROUTES.DASHBOARD)}
					className="mt-6 flex items-center justify-center gap-2 w-full [font-family:'Inter',Helvetica] text-sm text-[#00856f] hover:underline"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to home
				</button>
			</div>
		</div>
	);
};
