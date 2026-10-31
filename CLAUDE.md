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

## Writing chapters

The book builds vocabulary one term at a time. A chapter introduces a term with an image or comparison once ("a model is a black box"), and from then on uses only the term ("the model"), never the image. Later chapters reuse the terms earlier chapters defined.

To point at another chapter, use `<ChapterLink id="part-1-primitives/tokens-and-context" />` (`import ChapterLink from '~/components/ChapterLink.astro';`). It shows the chapter's own title, renders as plain text while that chapter is a draft, and fails the build if the id doesn't exist.

## UI

Build UI from Starlight's built-in components first (https://starlight.astro.build/components/using-components/): `Card`, `CardGrid`, `LinkCard`, `LinkButton`, `Badge`, `Aside`, `Tabs`, `Steps`, `FileTree`, `Icon`. If none fits, look for a Starlight plugin (https://starlight.astro.build/resources/plugins/). Write your own HTML/CSS only after both come up empty.

## Rules and what enforces them

| Rule | Enforced by |
|---|---|
| Starlight components, then plugins, then hand-rolled HTML | `src/ui-rules.test.ts` (`bun test src`, also in CI) flags raw markup that has a Starlight equivalent, plus any `<style>` without a `ui-exception` comment (reason and expiry date) or with an expired one |
| Refer to other chapters with `<ChapterLink>`, never by name in prose or with a hand-written link | `src/ui-rules.test.ts` flags "chapter on/about" and relative or `part-` Markdown links. `resolveChapterLink` fails the build on an unknown id |
| Introduce a term with its image once, then use only the term | Review only. A judgment call that no check can make |
| Library references point at real chapters and entries | `loadLibrary()` in `src/lib/data.ts` fails the build |
| Tags are kebab-case | Zod schema in `src/content.config.ts` |
| Internal links carry the `/ai-resources` base | `tests/dist.test.ts` (`bun run test:dist`, also in CI) |
| Draft chapters stay off the public site | `tests/dist.test.ts` |

## Checks

`bun test src` runs the unit tests. `bun run test:dist` builds the site and checks the output.
