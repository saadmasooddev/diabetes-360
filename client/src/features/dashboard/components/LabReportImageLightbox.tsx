import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface LabReportImageLightboxProps {
	open: boolean;
	onClose: () => void;
	src: string;
}

export function LabReportImageLightbox({
	open,
	onClose,
	src,
}: LabReportImageLightboxProps) {
	return (
		<Lightbox
			open={open}
			close={onClose}
			slides={[{ src }]}
			plugins={[Zoom]}
			zoom={{
				maxZoomPixelRatio: 3,
				scrollToZoom: true,
			}}
			styles={{
				container: {
					backgroundColor: "rgba(0, 0, 0, 0.9)",
				},
			}}
			render={{
				buttonPrev: () => null,
				buttonNext: () => null,
			}}
		/>
	);
}
