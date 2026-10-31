// Loads the collections the library views need. Throws on broken references,
// because Astro itself only logs them and the build would otherwise pass.
import { getCollection } from 'astro:content';
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
