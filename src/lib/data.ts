// Loads the collections the library views need. Throws on broken references,
// because Astro itself only logs them and the build would otherwise pass.
import { getCollection } from 'astro:content';
import { checkGlossary, findDefines, readingOrder } from './glossary';
import { findBrokenRefs } from './library';

export async function loadLibrary() {
	const [items, docs] = await Promise.all([getCollection('library'), getCollection('docs')]);

	const broken = findBrokenRefs(items, new Set(docs.map((d) => d.id)));
	if (broken.length > 0) {
		throw new Error(`Broken library references:\n  ${broken.join('\n  ')}`);
	}

	const published = new Set(docs.filter((d) => !(import.meta.env.PROD && d.data.draft)).map((d) => d.id));
	const titles = new Map(docs.map((d) => [d.id, d.data.title]));
	return { items, published, titles };
}

/** The glossary, checked against the chapters' <Define> sites. Throws when they disagree. */
export async function loadGlossary() {
	const [terms, docs] = await Promise.all([getCollection('glossary'), getCollection('docs')]);
	const sites = findDefines(docs.map((d) => ({ id: d.id, body: d.body ?? '' })));

	const errors = checkGlossary(terms.map((t) => t.id), sites);
	if (errors.length > 0) {
		throw new Error(`Glossary errors:\n  ${errors.join('\n  ')}`);
	}

	const order = readingOrder(docs);
	const published = new Set(docs.filter((d) => !(import.meta.env.PROD && d.data.draft)).map((d) => d.id));
	const titles = new Map(docs.map((d) => [d.id, d.data.title]));
	// A term defined inside a <Draft> block is unpublished until the block is: no glossary entry, no marked mentions.
	const visible = import.meta.env.PROD ? sites.filter((s) => !s.draft) : sites;
	return { terms, sites: visible, order, published, titles };
}
