import { describe, expect, test } from 'bun:test';
import { isExternal, openExternalInNewTab } from './external-links';

describe('isExternal', () => {
	test('absolute http(s) URLs are external', () => {
		expect(isExternal('https://platform.claude.com/docs')).toBe(true);
		expect(isExternal('http://example.com')).toBe(true);
	});
	test('paths, hashes, and other schemes are not', () => {
		expect(isExternal('/ai-resources/library/')).toBe(false);
		expect(isExternal('#the-response')).toBe(false);
		expect(isExternal('mailto:a@b.c')).toBe(false);
	});
});

describe('openExternalInNewTab', () => {
	test('sets target and rel on external links only', () => {
		const html = '<p><a href="https://example.com">out</a> and <a href="/ai-resources/x/">in</a></p>';
		expect(openExternalInNewTab(html)).toBe(
			'<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">out</a> and <a href="/ai-resources/x/">in</a></p>',
		);
	});
	test('returns HTML without external links unchanged', () => {
		const html = '<p><a href="#x">here</a> &amp; there</p>';
		expect(openExternalInNewTab(html)).toBe(html);
	});
});
