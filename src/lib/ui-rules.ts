// UI rule: Starlight built-in components first, then Starlight plugins, and hand-rolled HTML/CSS last.
// Checked by src/ui-rules.test.ts, which runs in `bun test src` locally and in CI.
import GithubSlugger from 'github-slugger';

export type SourceFile = { path: string; content: string };

/** Raw markup that has a Starlight built-in equivalent. */
const REPLACEMENTS: Array<{ pattern: RegExp; use: string }> = [
	{ pattern: /<article\b/, use: '<Card> or <LinkCard> from @astrojs/starlight/components' },
	{ pattern: /<aside\b/, use: '<Aside> from @astrojs/starlight/components' },
	{ pattern: /<button\b/, use: '<LinkButton> from @astrojs/starlight/components' },
	{ pattern: /class="[^"]*\b(badge|tag|chip|pill)s?\b[^"]*"[^>]*>\s*#?\{/, use: '<Badge> from @astrojs/starlight/components' },
	{ pattern: /class="[^"]*\b(card|button|btn)\b[^"]*"/, use: '<Card>/<LinkCard>/<LinkButton> from @astrojs/starlight/components' },
	{ pattern: /<ol[^>]*class="[^"]*steps/, use: '<Steps> from @astrojs/starlight/components' },
	{ pattern: /[←→]\s*\w+<\/a>/, use: '<LinkButton icon="left-arrow"|"right-arrow"> from @astrojs/starlight/components' },
	// Chapter references: named in prose, or linked by hand with a path that breaks on renames and drafts.
	{ pattern: /\bchapter (?:on|about)\b/i, use: '<ChapterLink id="part-N-…/chapter" /> from ~/components/ChapterLink.astro' },
	{ pattern: /\]\((?:\.\.?\/|\/(?:ai-resources\/)?part-)/, use: '<ChapterLink id="part-N-…/chapter" /> from ~/components/ChapterLink.astro' },
];

/**
 * A <style> block is hand-rolled CSS. It is allowed only with an exception comment on the
 * line right after it: `/* ui-exception: <reason>; expires: YYYY-MM-DD *\/`
 */
const EXCEPTION = /ui-exception:\s*(?<reason>[^;]+);\s*expires:\s*(?<expires>\d{4}-\d{2}-\d{2})/;

export function checkUi(files: SourceFile[], today: string): { errors: string[] } {
	const errors: string[] = [];
	for (const { path, content } of files) {
		const lines = content.split('\n');
		lines.forEach((line, i) => {
			const at = `${path}:${i + 1}`;
			for (const { pattern, use } of REPLACEMENTS) {
				if (pattern.test(line)) errors.push(`${at}: hand-rolled markup — use ${use}`);
			}
			if (/^\s*<style\b/.test(line)) {
				const m = EXCEPTION.exec(lines[i + 1] ?? '');
				if (!m?.groups) {
					errors.push(
						`${at}: hand-rolled <style> — prefer Starlight components or a Starlight plugin; ` +
							'if neither fits, add `/* ui-exception: <reason>; expires: YYYY-MM-DD */` on the next line',
					);
				} else if (m.groups.expires < today) {
					errors.push(`${at}: ui-exception expired on ${m.groups.expires} — revisit: ${m.groups.reason.trim()}`);
				}
			}
		});
		if (path.endsWith('.mdx')) errors.push(...checkSectionRefs(path, lines));
	}
	return { errors };
}

const SECTION_LINK = '<SectionLink id="…" /> from ~/components/SectionLink.astro';

/**
 * Section references in a chapter. Runs on the source, so it covers drafts, which
 * starlight-links-validator skips. A heading's slug and text change when it is renamed, so
 * a hand-written `[x](#slug)` breaks and a section named in prose goes stale.
 */
function checkSectionRefs(path: string, lines: string[]): string[] {
	const errors: string[] = [];
	const slugger = new GithubSlugger();
	const headings: Array<{ slug: string; text: string }> = [];
	const ids = new Set<string>();
	let fenced = false;
	const prose = lines.map((line) => {
		if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
		return fenced || /^\s*(```|~~~)/.test(line) ? '' : line;
	});
	for (const line of prose) {
		const h = /^#{2,6}\s+(.+?)\s*$/.exec(line);
		if (h) {
			const text = h[1].replace(/[_*`]/g, '');
			headings.push({ slug: slugger.slug(text), text });
		}
		for (const m of line.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
	}
	const slugs = new Set(headings.map((h) => h.slug));
	prose.forEach((line, i) => {
		const at = `${path}:${i + 1}`;
		if (/^#{1,6}\s/.test(line)) return;
		for (const m of line.matchAll(/\]\(#([^)\s]+)\)/g)) {
			if (slugs.has(m[1])) errors.push(`${at}: hand-written link to section #${m[1]} — use ${SECTION_LINK}`);
			else if (!ids.has(m[1])) errors.push(`${at}: link to #${m[1]}, but no heading or id="${m[1]}" in this file has that id`);
		}
		for (const { slug, text } of headings) {
			if (!text.includes(' ')) continue;
			if (new RegExp(`[a-z,] ${RegExp.escape(text)}(?!\\w)`).test(line)) {
				errors.push(`${at}: section "${text}" named in prose — use <SectionLink id="${slug}" link={false} /> from ~/components/SectionLink.astro`);
			}
		}
	});
	return errors;
}
