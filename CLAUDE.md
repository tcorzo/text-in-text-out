# AI Resources

A book about AI agents (models → agent loop → harnesses → evals), plus a library of the resources behind it. Built with Astro + Starlight and Bun, and published to GitHub Pages.

## Layout

- `src/content/docs/part-N-*/` holds the book: one folder per part, one `.mdx` per chapter, ordered by `sidebar.order`. Unwritten chapters carry `draft: true`, so they show in `bun dev` and stay off the public site. Publish a chapter by removing that line.
- `src/content/library/` holds one YAML file per resource. Add or enrich entries with the `add-library-entry` skill.
- `src/lib/library.ts` holds pure helpers (tested in `src/lib/library.test.ts`). `src/lib/data.ts` loads the collections and fails the build on broken references.
- `src/components/` holds the library item view, the "Further reading" block and the `MarkdownContent` override that appends it to chapters.

## Gotchas

- Astro only *logs* broken content references. The real failure comes from `loadLibrary()` in `src/lib/data.ts`, so keep the library pages using it.
- The site lives under `/ai-resources/`. In components, build internal links with `withBase(import.meta.env.BASE_URL, path)`. In frontmatter fields Starlight doesn't prefix (hero actions), use relative links.
- Diagrams are Mermaid fenced code blocks (`astro-mermaid`). Code examples are illustrative and never run.

## Checks

`bun test src` runs the unit tests. `bun run test:dist` builds the site and checks the output.
