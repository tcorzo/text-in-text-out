// Where the glossary popover goes, in viewport coordinates. Pure, so `bun test` covers it.

const GAP = 6;
const EDGE = 8;

/** Below the mention when it fits, otherwise above it, and never past the screen's sides. */
export function placePopover(
	mention: { top: number; bottom: number; left: number },
	popover: { width: number; height: number },
	viewport: { width: number; height: number },
): { top: number; left: number } {
	const fitsBelow = mention.bottom + GAP + popover.height <= viewport.height - EDGE;
	const top = fitsBelow ? mention.bottom + GAP : mention.top - GAP - popover.height;
	const left = Math.min(Math.max(EDGE, mention.left), viewport.width - popover.width - EDGE);
	return { top, left };
}
