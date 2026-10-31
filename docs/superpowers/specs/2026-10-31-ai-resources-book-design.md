# AI Resources Book: Design

## Intent

A public website, built from a public personal GitHub repo, where coworkers
and teammates can learn how AI agents work and find good material on them:
agents, harnesses, evals and related topics.

It should **feel like a software engineering book**. You start from basic
primitives (what a model is) and build up chapter by chapter, through how a
model becomes an agent via the loop, to harnesses and evals. A newcomer reads
it front to back. Someone experienced dips into the chapter they need.

The inspiration for the *feeling* (structure and prose, not tooling) is the
Beancount docs, e.g. https://beancount.github.io/docs/sharing_expenses_with_beancount/.
They are written by one author in a first-person, opinionated, unhurried
voice, with real examples and diagrams, and quiet navigation (chapters on the
left, page outline on the right).

Alongside the chapters sits a **library**: the interviews, talks, articles,
papers and tools the author likes and draws inspiration from. Some of it
won't relate to any chapter. The library is curated and interrelated:
chapters point at items, and items point back at chapters.

## Who writes what

- **The author writes the book.** They find the source material and compose
  the chapter prose themselves, with an agent's help when they ask for it.
  The build must not write chapter content.
- **New library items arrive through Claude Code.** The author opens a
  session in the repo and says "add this talk/article". The repo must make
  that land correctly and consistently.
- There is **no rule** restricting agents from writing prose. Agents behave
  normally: they write prose when asked. Do not put any such restriction in
  `CLAUDE.md`.

## Goals

- A book-shaped site: parts → chapters, ordered, with sidebar and page
  outline.
- A library of resources with typed metadata, browsable by type and by topic.
- Links in both directions between chapters and library items.
- Adding a library item from a fresh Claude Code session is easy, and
  malformed items are caught at build time.
- Real code examples (primarily Pydantic AI, in Python) and diagrams render
  well.
- Push to `main` → site is live on GitHub Pages.

## Non-goals

- **Runnable or tested code.** Code examples are like those in an engineering
  book: correct when written, there to convey the idea. No Python toolchain,
  no CI that runs snippets, no example project.
- Writing any chapter or library note content.
- Comments, accounts, CMS, analytics or anything dynamic.
- Multi-language support.
- An awesome-list feel. It is a book first, and the library supports it.

## Anti-goals (failure even if it works)

- Placeholder prose that reads like real content and that the author would
  have to hunt down and delete.
- A library that feels like a link dump with no connection to the chapters.
- A structure so rigid that an unrelated-but-loved item has nowhere to go.

## Decided: the stack

- **Astro + Starlight** for the site. Starlight's default layout gives the
  sidebar, page outline, built-in search (Pagefind) and dark mode.
- **Bun** as package manager and script runner (not npm/pnpm).
- **Chapters are MDX** in `src/content/docs/`. Folders are the book's parts
  and set the sidebar order.
- **Code blocks** use Starlight's built-in Expressive Code (Python
  highlighting, file name frames, line highlighting). No extra plugin.
- **Diagrams**: Mermaid in fenced code blocks via the `astro-mermaid`
  integration. Hand-made SVGs are allowed next to chapters for anything
  Mermaid draws badly.
- **Library**: a separate Astro content collection in `src/content/library/`,
  one file per resource, with a Zod schema. Invalid entries fail the build
  with a clear error.
- **Deploy**: a GitHub Actions workflow builds with Bun and publishes to
  GitHub Pages on push to `main`.
- **`CLAUDE.md`** at the root describes the repo layout and how to add a
  library entry.

Rough layout:

```
src/content/docs/        ← the book (parts → chapters, .mdx)
src/content/library/     ← one file per resource
src/components/          ← further-reading block, library views
astro.config.mjs         ← Starlight + Mermaid setup
.github/workflows/       ← deploy to Pages
CLAUDE.md
```

## Decided: the book's shape

A tentative table of contents. The author will change it; the build only
needs to create the structure.

- **Part I: Primitives.** What a model is · tokens and the context window ·
  prompting · structured outputs
- **Part II: From model to agent.** Tools · the agent loop · skills · memory
- **Part III: Building and judging agents.** Harnesses · evals · context
  engineering
- **Part IV: In practice.** Coding agents · real-world patterns

The author asked that harnesses and evals come after the basics, as their
own section. The grouping above is a proposal.

Each chapter is the author's prose, plus code and diagrams, plus an
automatically generated **"Further reading"** block listing the library items
linked to that chapter.

Chapters should be shorter than the Beancount example. Length will be
settled when the first chapter is written; this does not affect the build.

## Decided: the library

Each resource is one file with typed fields. At minimum it needs:

- title, URL, type (talk, interview, article, paper, tool, repo, newsletter,
  other/inspiration; the exact set is the builder's call)
- author/creator
- tags (free-form, allowed to grow; not a fixed list)
- the author's note on why it's worth someone's time (optional; see Seed library)
- related chapters (optional, so unrelated "inspiration" items are valid)

Generated views:

- a library index, browsable by type and by tag
- a "Further reading" block on each chapter, built from items that list
  that chapter
- on each item (or its listing), the chapters that cite it

## Agent instructions (`CLAUDE.md`)

Covers: what the repo is, where chapters and library entries live, the
library entry fields and an example, how to link an entry to chapters, and
the commands to run (dev server, build). When adding an entry, the agent
should ask the author for the "why it's worth your time" note if the author
didn't give one, rather than inventing it. That rule is about the library
note only, not prose in general.

## Calls made by Claude (not explicitly decided by the author)

- Mermaid via `astro-mermaid` for diagrams, with SVG as fallback.
- The library is a typed content collection, with tags allowed to grow.
- Agents ask for the library note instead of inventing it.
- Seed URLs normalized to each product's public home page: Daytona's
  dashboard link → daytona.io, Modal's pricing page → modal.com, and
  tracking anchors dropped.
- **Unwritten chapters are Starlight drafts.** The build creates one file per
  tentative chapter with only a title and `draft: true` (Starlight's built-in
  flag), and no body text. Drafts show in `bun dev` and are left out of the
  production site, so the public sidebar only shows written chapters. The
  author publishes a chapter by removing the flag.
- **Library entries link to whole chapters by their path id** (e.g.
  `part-2/agent-loop`). Links are checked against the docs collection, so a
  rename that breaks one fails the build. Links to draft chapters are left out
  of the production site instead of failing. There are no section-level links
  for now.

## Seed library

The author supplied a first batch of resources. The build imports all of them
as library entries:

- Building effective AI agents (Anthropic): https://www.anthropic.com/research/building-effective-agents
- Demystifying evals for AI agents (Anthropic): https://www.anthropic.com/research/demystifying-evals-for-ai-agents
- RubyLLM: https://rubyllm.com/
- Pydantic Logfire: https://pydantic.dev/logfire
- Pydantic AI: https://github.com/pydantic/pydantic-ai
- Langfuse: https://langfuse.com/
- Opik (comet-ml): https://github.com/comet-ml/opik
- OpenRouter: https://openrouter.ai/
- LiteLLM: https://docs.litellm.ai/
- Jev 1.13 on OpenRouter (TypeSafe): https://openrouter.ai/typesafe/jev-1.13
- Introducing Clef (Cloudflare Blog): https://blog.cloudflare.com/clef-decision-models/
- HumanLayer: https://github.com/humanlayer/humanlayer
- 12-Factor Agents (HumanLayer): https://github.com/humanlayer/12-factor-agents
- HumanLayer skills: https://github.com/humanlayer/skills
- Pydantic Monty: https://pydantic.dev/monty
- Modal: https://modal.com/
- Daytona: https://www.daytona.io/

Rules for the seed:

- **The author's note is optional in the schema.** None of the seed items has
  a note, and the build must not invent one. Entries without a note render
  without one. The author fills notes in over time.
- Factual fields (title, type, creator, tags, related chapters) may be filled
  in by the builder, since they describe the resource rather than the
  author's opinion.
- In the author's list, some items were nested under others (Pydantic AI
  under Logfire; 12-Factor Agents, skills and Monty under HumanLayer). This
  reads as "related to." The builder may express it through shared tags or a
  `related` field.

## Site address

`https://tcorzo.github.io/ai-resources/` (Astro `site` + `base: '/ai-resources'`).
This was Claude's guess and is not confirmed by the author, so keep it in a
single place in `astro.config.mjs`. All internal links must respect `base`.
The author creates the GitHub repo and sets Pages to deploy from GitHub
Actions. The plan should list those steps for them.

## Left to the builder

- Exact schema field names and the file format of library entries.
- How the library index is laid out and filtered (static pages are fine; no
  client-side app is required).
- Whether item detail pages exist, or the index alone is enough.
- Starlight theme tweaks, if any. Default styling is acceptable.
- Exact CI workflow details.
