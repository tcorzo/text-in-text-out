// Brand icons for library links, from Simple Icons (bundled at build, nothing fetched).
import * as simpleIcons from 'simple-icons';

export type BrandIcon = {
	title: string;
	path: string;
	/** Hover color on the light theme: the brand color, or the text color when the brand is too light to see. */
	hoverLight: string;
	/** Hover color on the dark theme: the brand color, or the text color when the brand is too dark to see. */
	hoverDark: string;
};

// Hosts whose Simple Icons slug isn't the name in their domain.
const SLUG_OVERRIDES: Record<string, string> = {
	'youtu.be': 'youtube',
	'twitter.com': 'x',
};

// Starlight's page backgrounds, for the contrast check.
const LIGHT_BG = 'ffffff';
const DARK_BG = '17181c';
const TEXT_COLOR = 'var(--sl-color-white)';
// The icons are decorative, so this only catches a brand color that would vanish
// (GitHub's near-black on the dark theme, Hugging Face's yellow on the light one).
// WCAG's 3:1 would also reject most brand oranges, Claude's included.
const MIN_CONTRAST = 1.5;

const bySlug = new Map(
	Object.values(simpleIcons)
		.filter((i): i is simpleIcons.SimpleIcon => typeof i === 'object' && i !== null && 'slug' in i)
		.map((i) => [i.slug, i]),
);

/** The host a reader sees, without "www.": "platform.claude.com". */
export function siteOf(url: string): string {
	return new URL(url).hostname.replace(/^www\./, '');
}

/** The Simple Icons slug to try for a host: the name before the top-level domain ("platform.claude.com" → "claude"). */
export function slugFor(host: string): string {
	if (SLUG_OVERRIDES[host]) return SLUG_OVERRIDES[host];
	const labels = host.split('.');
	return labels.length >= 2 ? labels[labels.length - 2] : host;
}

function luminance(hex: string): number {
	const [r, g, b] = [0, 2, 4].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** The brand color where it stands out against the background, else the theme's text color. */
export function hoverColors(hex: string): { hoverLight: string; hoverDark: string } {
	return {
		hoverLight: contrast(hex, LIGHT_BG) >= MIN_CONTRAST ? `#${hex}` : TEXT_COLOR,
		hoverDark: contrast(hex, DARK_BG) >= MIN_CONTRAST ? `#${hex}` : TEXT_COLOR,
	};
}

/** The brand icon for a link, or null when Simple Icons has none for its site. */
export function brandIconFor(url: string): BrandIcon | null {
	const icon = bySlug.get(slugFor(siteOf(url)));
	if (!icon) return null;
	return { title: icon.title, path: icon.path, ...hoverColors(icon.hex) };
}

/**
 * The icon as inline SVG markup, for Starlight components that take their title as HTML.
 * It fills with currentColor and carries its hover colors as --hover-light and --hover-dark.
 */
export function brandSvg(icon: BrandIcon, className: string): string {
	return (
		`<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" ` +
		`style="--hover-light: ${icon.hoverLight}; --hover-dark: ${icon.hoverDark}">` +
		`<path d="${icon.path}"/></svg>`
	);
}

export function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
