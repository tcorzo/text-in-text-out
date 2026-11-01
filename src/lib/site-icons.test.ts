import { describe, expect, test } from 'bun:test';
import { brandIconFor, contrast, escapeHtml, hoverColors, siteOf, slugFor } from './site-icons';

describe('siteOf', () => {
	test('drops www. and keeps subdomains', () => {
		expect(siteOf('https://www.anthropic.com/research/x')).toBe('anthropic.com');
		expect(siteOf('https://platform.claude.com/docs/en/x')).toBe('platform.claude.com');
	});
});

describe('slugFor', () => {
	test('uses the name before the top-level domain', () => {
		expect(slugFor('platform.claude.com')).toBe('claude');
		expect(slugFor('blog.cloudflare.com')).toBe('cloudflare');
		expect(slugFor('github.com')).toBe('github');
	});
	test('uses an override when the domain name is not the brand', () => {
		expect(slugFor('youtu.be')).toBe('youtube');
	});
});

describe('brandIconFor', () => {
	test('finds a known brand', () => {
		expect(brandIconFor('https://github.com/humanlayer/12-factor-agents')?.title).toBe('GitHub');
	});
	test('returns null for a site Simple Icons lacks', () => {
		expect(brandIconFor('https://langfuse.com/')).toBeNull();
	});
});

describe('hoverColors', () => {
	test('keeps a brand color that stands out on both themes', () => {
		expect(hoverColors('F38020')).toEqual({ hoverLight: '#F38020', hoverDark: '#F38020' });
	});
	test('falls back to the text color where the brand would vanish', () => {
		expect(hoverColors('181717').hoverDark).toBe('var(--sl-color-white)');
		expect(hoverColors('181717').hoverLight).toBe('#181717');
		expect(hoverColors('FFD21E').hoverLight).toBe('var(--sl-color-white)');
	});
	test('contrast is symmetric and 21 for black on white', () => {
		expect(contrast('000000', 'ffffff')).toBeCloseTo(21);
		expect(contrast('ffffff', '000000')).toBeCloseTo(21);
	});
});

describe('escapeHtml', () => {
	test('escapes markup characters', () => {
		expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
	});
});
