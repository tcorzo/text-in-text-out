// UI rule: Starlight built-in components first, then Starlight plugins, and hand-rolled HTML/CSS last.
// Checked by src/ui-rules.test.ts, which runs in `bun test src` locally and in CI.

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
];

/**
 * A <style> block is hand-rolled CSS. It is allowed only with an exception comment on the
 * line right after it: `/* ui-exception: <reason>; expires: YYYY-MM-DD; approved-by: <name> *\/`
 */
const EXCEPTION = /ui-exception:\s*(?<reason>[^;]+);\s*expires:\s*(?<expires>\d{4}-\d{2}-\d{2});\s*approved-by:\s*(?<by>[^*;]+)/;

export function checkUi(files: SourceFile[], today: string): { errors: string[]; pending: string[] } {
	const errors: string[] = [];
	const pending: string[] = [];
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
							'if neither fits, add `/* ui-exception: <reason>; expires: YYYY-MM-DD; approved-by: <name> */` on the next line',
					);
				} else if (m.groups.expires < today) {
					errors.push(`${at}: ui-exception expired on ${m.groups.expires} — revisit: ${m.groups.reason.trim()}`);
				} else if (m.groups.by.trim() === 'pending') {
					pending.push(`${at}: ${m.groups.reason.trim()}`);
				}
			}
		});
	}
	return { errors, pending };
}
