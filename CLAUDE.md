# Text In, Text Out

*Text In, Text Out*, a book about AI agents for experienced engineers, plus a library of the resources that the chapters cite. The book goes from models to the agent loop, harnesses, and evals. Built with Astro + Starlight and Bun, and published to GitHub Pages.

## Layout

- `src/content/docs/part-N-*/` holds the book: one folder per part, one `.mdx` per chapter, ordered by `sidebar.order`. Unwritten chapters carry `draft: true`, so they show in `bun dev` and stay off the public site. Publish a chapter by removing that line. To keep one unfinished section of a published chapter off the site, wrap it in `<Draft>` (see below).
- `src/content/library/` holds one YAML file per resource. Add or enrich entries with the `add-library-entry` skill.
- `src/lib/library.ts` holds pure helpers (tested in `src/lib/library.test.ts`). `src/lib/data.ts` loads the collections and fails the build on broken references.
- `src/content/glossary/` holds one YAML file per glossary term. `src/lib/glossary.ts` finds each term's `<Define>` and works out reading order. `src/lib/mentions.ts` marks the first mention of earlier terms in each chapter.
- `src/components/` holds the library item view, the "Further reading" block, the glossary popover, and the `MarkdownContent` override that marks glossary mentions and appends "Further reading" to chapters.

## Gotchas

- Tool versions (bun, node) live in `mise.toml`, the one source CI (`jdx/mise-action`) and Orca's worktree setup (`orca.yaml`) both read. Bump a version there, never in the workflow.
- Astro only *logs* broken content references. The real failure comes from `loadLibrary()` in `src/lib/data.ts`, so keep the library pages using it.
- The site lives under `/ai-resources/`. In components, build internal links with `withBase(import.meta.env.BASE_URL, path)`. In frontmatter fields Starlight doesn't prefix (hero actions), use relative links.
- Diagrams are Mermaid fenced code blocks (`astro-mermaid`). Code examples are illustrative and never run.

## Writing chapters

Before you draft or edit chapter prose, read `docs/voice.md`. It describes who the book is for, how it reads, and where Claude's drafts drift from the author's voice.

The book builds vocabulary one term at a time. A chapter introduces a term with an image or comparison once ("a model is a black box"), and from then on uses only the term ("the model"), never the image. Later chapters reuse the terms earlier chapters defined.

To point at another chapter, use `<ChapterLink id="part-1-primitives/tokens-and-context" />` (`import ChapterLink from '~/components/ChapterLink.astro';`). It shows the chapter's own title, renders as plain text while that chapter is a draft, and fails the build if the id doesn't exist.

To point at a section of the same chapter, use `<SectionLink id="calling-the-model" />` (`import SectionLink from '~/components/SectionLink.astro';`). The id is the heading's slug. It shows the heading's current text, and `link={false}` prints the text without a link, for prose that names a section. An id with no matching heading fails the build, so renaming a heading points you at every reference to fix. Link to a spot that isn't a heading with a `<span id="..." />` and a plain `[text](#id)` link.

To keep a section off the public site while the rest of the chapter publishes, wrap it, heading included, in `<Draft>` … `</Draft>` (`import Draft from '~/components/Draft.astro';`), with blank lines inside the tags. `bun dev` shows it under a "Draft" label. The published site leaves out its content, its headings in the page outline, and the glossary terms it defines. A `<SectionLink>` to a heading inside it fails the published build.

To introduce a term, wrap it with `<Define term="id">word</Define>` (`import Define from '~/components/Define.astro';`) in the sentence that defines it, and add `src/content/glossary/<id>.yaml` with its `definition` (inline Markdown, reference style). A definition covers the whole concept as the book uses it anywhere, not only what its defining chapter has taught so far. When a later chapter adds to a concept (the `system` role, say), update that term's definition too. Italics are plain emphasis, not a definition. In later chapters the first mention of each term is marked automatically. Set `markMentions: false` on a term too central to underline ("model"), and list `skip` phrases where a form means something else ("error message").

## UI

Build UI from Starlight's built-in components first (https://starlight.astro.build/components/using-components/): `Card`, `CardGrid`, `LinkCard`, `LinkButton`, `Badge`, `Aside`, `Tabs`, `Steps`, `FileTree`, `Icon`. If none fits, look for a Starlight plugin (https://starlight.astro.build/resources/plugins/). Write your own HTML/CSS only after both come up empty.

## Rules and what enforces them

| Rule | Enforced by |
|---|---|
| Starlight components, then plugins, then hand-rolled HTML | `src/ui-rules.test.ts` (`bun test src`, also in CI) flags raw markup that has a Starlight equivalent, plus any `<style>` without a `ui-exception` comment (reason and expiry date) or with an expired one |
| Refer to other chapters with `<ChapterLink>`, never by name in prose or with a hand-written link | `src/ui-rules.test.ts` flags "chapter on/about" and relative or `part-` Markdown links. `resolveChapterLink` fails the build on an unknown id |
| Introduce a term with its image once, then use only the term | Review only. A judgment call that no check can make |
| Refer to sections with `<SectionLink>`, never by a hand-written `#heading` link or by name in prose | `src/ui-rules.test.ts` flags `](#slug)` links to a heading, `#` links to no heading or `id`, and a heading's text in prose (drafts included). `resolveSectionLink` fails the build on an unknown id |
| Internal links and `#` hashes on published pages resolve | `starlight-links-validator` fails `bun run build` |
| Library references point at real chapters and entries | `loadLibrary()` in `src/lib/data.ts` fails the build |
| Every `<Define>` has a glossary file, each term is defined once, and every glossary file is defined in some chapter | `loadGlossary()` in `src/lib/data.ts` fails the build |
| Tags are kebab-case | Zod schema in `src/content.config.ts` |
| Internal links carry the `/ai-resources` base | `tests/dist.test.ts` (`bun run test:dist`, also in CI) |
| Draft chapters and `<Draft>` sections stay off the public site | `tests/dist.test.ts` |

## Checks

`bun test src` runs the unit tests. `bun run test:dist` builds the site and checks the output.
