// Checks the production build in dist/. Run via `bun run test:dist` (builds first).
// Expectations are derived from the content, so they hold however many chapters are published.
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findDefines } from '../src/lib/glossary';
import { draftHeadingSlugs } from '../src/lib/sections';

const ROOT = join(import.meta.dir, '..');
const DIST = join(ROOT, 'dist');
const DOCS = join(ROOT, 'src/content/docs');
const LIBRARY = join(ROOT, 'src/content/library');

function walk(dir: string, ext: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : [];
	});
}

const pages = walk(DIST, '.html').map((f) => ({ path: relative(DIST, f), html: readFileSync(f, 'utf8') }));

// Chapters: id like "part-3-building-and-judging/evals", from src/content/docs/part-*/*.mdx
const chapters = walk(DOCS, '.mdx')
	.map((f) => relative(DOCS, f).replace(/\.mdx$/, ''))
	.filter((id) => id.startsWith('part-'))
	.map((id) => ({ id, draft: /^draft:\s*true\s*$/m.test(readFileSync(join(DOCS, `${id}.mdx`), 'utf8')) }));
const drafts = chapters.filter((c) => c.draft).map((c) => c.id);
const publishedIds = chapters.filter((c) => !c.draft).map((c) => c.id);

const entries = walk(LIBRARY, '.yaml').map((f) => Bun.YAML.parse(readFileSync(f, 'utf8')) as {
	title: string;
	chapters?: string[];
});
const cited = new Set(entries.flatMap((e) => e.chapters ?? []));

// Glossary terms: published when their <Define term="id"> sits in a published chapter, outside a <Draft> block.
const GLOSSARY = join(ROOT, 'src/content/glossary');
const termIds = walk(GLOSSARY, '.yaml').map((f) => relative(GLOSSARY, f).replace(/\.yaml$/, ''));
const bodies = chapters.map((c) => ({ id: c.id, body: readFileSync(join(DOCS, `${c.id}.mdx`), 'utf8') }));
const sites = new Map(findDefines(bodies).map((s) => [s.term, s]));
const isPublished = (id: string) => {
	const site = sites.get(id);
	return site !== undefined && publishedIds.includes(site.chapter) && !site.draft;
};
const publishedTerms = termIds.filter(isPublished);
const draftTerms = termIds.filter((id) => !isPublished(id));

const PART_LABELS: Record<string, string> = {
	'part-1-primitives': 'Part I: Primitives',
	'part-2-model-to-agent': 'Part II: From model to agent',
	'part-3-building-and-judging': 'Part III: Building and judging agents',
	'part-4-in-practice': 'Part IV: In practice',
};

describe('production build', () => {
	test('every root-relative link on every page carries the /ai-resources base', () => {
		const offenders = pages.flatMap(({ path, html }) =>
			[...html.matchAll(/href="(\/[^"]*)"/g)]
				.map((m) => m[1])
				.filter((href) => !href.startsWith('/ai-resources/'))
				.map((href) => `${path}: ${href}`),
		);
		expect(offenders).toEqual([]);
	});

	test('library index lists every entry', () => {
		const html = readFileSync(join(DIST, 'library/index.html'), 'utf8');
		expect(entries.map((e) => e.title).filter((t) => !html.includes(`>${t}<`))).toEqual([]);
	});

	test('draft chapters are not built and nothing links to them', () => {
		expect(drafts.filter((id) => pages.some((p) => p.path === `${id}/index.html`))).toEqual([]);
		const offenders = pages.flatMap(({ path, html }) =>
			drafts.filter((id) => html.includes(`href="/ai-resources/${id}/"`)).map((id) => `${path} → ${id}`),
		);
		expect(offenders).toEqual([]);
	});

	test('Further reading appears exactly on published chapters that library entries cite', () => {
		const withBlock = pages.filter((p) => p.html.includes('id="further-reading"')).map((p) => p.path).sort();
		const expected = publishedIds.filter((id) => cited.has(id)).map((id) => `${id}/index.html`).sort();
		expect(withBlock).toEqual(expected);
	});

	test('<Draft> sections stay off published chapters, outline included', () => {
		const leaks = bodies
			.filter((c) => publishedIds.includes(c.id))
			.flatMap((c) => {
				const html = readFileSync(join(DIST, c.id, 'index.html'), 'utf8');
				const slugs = [...draftHeadingSlugs(c.body)].filter((slug) => html.includes(`#${slug}"`) || html.includes(`id="${slug}"`));
				return [...slugs, ...(html.includes('Not on the public site') ? ['the Draft label'] : [])].map((x) => `${c.id}: ${x}`);
			});
		expect(leaks).toEqual([]);
	});

	test('glossary lists exactly the terms introduced in published chapters', () => {
		const html = readFileSync(join(DIST, 'glossary/index.html'), 'utf8');
		expect(publishedTerms.filter((id) => !html.includes(`<dt id="${id}"`))).toEqual([]);
		expect(draftTerms.filter((id) => html.includes(`<dt id="${id}"`))).toEqual([]);
	});

	test('sidebar shows Glossary only when a term is published', () => {
		const html = readFileSync(join(DIST, 'library/index.html'), 'utf8');
		expect(html.includes('href="/ai-resources/glossary/"')).toBe(publishedTerms.length > 0);
	});

	test('sidebar shows a part only when it has a published chapter', () => {
		const html = readFileSync(join(DIST, 'library/index.html'), 'utf8');
		for (const [dir, label] of Object.entries(PART_LABELS)) {
			const hasPublished = publishedIds.some((id) => id.startsWith(`${dir}/`));
			expect({ label, shown: html.includes(label) }).toEqual({ label, shown: hasPublished });
		}
	});
});
