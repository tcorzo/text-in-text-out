import { expect, test } from 'bun:test';
import { markMentions } from './mentions';

const href = (id: string) => `/ai-resources/glossary/#${id}`;
const token = { id: 'token', forms: ['token', 'tokens'], skip: ['token budget'] };
const streaming = { id: 'streaming', forms: ['streaming', 'streaming response'], skip: [] };

test('returns the input unchanged when there is nothing to mark', () => {
	const html = '<p>Tokens!</p><astro-island props="{&quot;a&quot;:1}"></astro-island>';
	expect(markMentions(html, [], href)).toEqual({ html, marked: [] });
});

test('marks only the first mention, case-insensitively, keeping its text', () => {
	const { html, marked } = markMentions('<p>Tokens are small. A token is short.</p>', [token], href);
	expect(marked).toEqual(['token']);
	expect(html).toContain(
		'<a class="glossary-mention" href="/ai-resources/glossary/#token" data-term="token">Tokens</a> are small. A token is short.',
	);
});

test('whole words only, and skip phrases do not count', () => {
	const { marked } = markMentions('<p>A tokenizer and a token budget.</p>', [token], href);
	expect(marked).toEqual([]);
});

test('the longer form wins', () => {
	const { html } = markMentions('<p>A streaming response arrives.</p>', [streaming], href);
	expect(html).toContain('>streaming response</a>');
});

test('never marks inside links, headings, code, dfn, pre, or islands, and keeps them intact', () => {
	const input = [
		'<h2>Tokens</h2>',
		'<p><a href="/x">tokens</a> <code>tokens</code> <dfn>tokens</dfn></p>',
		'<pre><code>tokens</code></pre>',
		'<astro-island props="{}"><p>tokens</p></astro-island>',
		'<p>Then tokens.</p>',
	].join('');
	const { html } = markMentions(input, [token], href);
	expect(html.match(/glossary-mention/g)).toHaveLength(1);
	expect(html).toContain('<p>Then <a class="glossary-mention"');
	expect(html).toContain('<astro-island props="{}"><p>tokens</p></astro-island>');
	expect(html).toContain('<pre><code>tokens</code></pre>');
});
