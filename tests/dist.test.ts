// Checks the production build in dist/. Run via `bun run test:dist` (builds first).
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dir, '..', 'dist');
const read = (p: string) => readFileSync(join(DIST, p), 'utf8');

function htmlFiles(dir = DIST): string[] {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
	});
}

const SEED_TITLES = [
	'Building effective AI agents',
	'Demystifying evals for AI agents',
	'Jev',
	'Clef and Clef-flash',
	'Pydantic AI',
	'Pydantic Logfire',
	'Pydantic Monty',
	'RubyLLM',
	'Langfuse',
	'Opik',
	'OpenRouter',
	'LiteLLM',
	'HumanLayer',
	'12-Factor Agents',
	'HumanLayer skills',
	'Modal',
	'Daytona',
];

describe('production build', () => {
	test('every root-relative link on every page carries the /ai-resources base', () => {
		const offenders = htmlFiles().flatMap((f) =>
			[...readFileSync(f, 'utf8').matchAll(/href="(\/[^"]*)"/g)]
				.map((m) => m[1])
				.filter((href) => !href.startsWith('/ai-resources/'))
				.map((href) => `${f.slice(DIST.length)}: ${href}`),
		);
		expect(offenders).toEqual([]);
	});

	test('library index lists every seed entry', () => {
		const html = read('library/index.html');
		const missing = SEED_TITLES.filter((t) => !html.includes(`>${t}</a>`));
		expect(missing).toEqual([]);
	});

	test('no page links to a draft chapter', () => {
		const offenders = htmlFiles().filter((f) => /href="\/ai-resources\/part-/.test(readFileSync(f, 'utf8')));
		expect(offenders).toEqual([]);
	});

	test('draft chapters are not built, so no Further reading leaks out', () => {
		const html = htmlFiles().filter((f) => readFileSync(f, 'utf8').includes('Further reading'));
		expect(html).toEqual([]);
	});
});
