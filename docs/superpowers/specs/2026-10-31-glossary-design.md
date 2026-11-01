# Glossary design

## Why

The book builds vocabulary one term at a time. A chapter introduces a term once, with its image or
comparison, and from then on uses only the term (see "Writing chapters" in `CLAUDE.md`). The
glossary turns that rule into something a reader can use: a place to go back to and reinforce what
the chapters taught.

A reader reaches for it in two directions:

1. **Word to concept.** While rereading, they meet a term they've forgotten. They need the
   definition back without hunting for the chapter that introduced it.
2. **Concept to word.** They remember the idea ("the model keeps nothing between calls") but not
   the word for it.

## Goals

- Every term has one home: the spot in a chapter where it's introduced. The glossary entry links
  back to that spot.
- In every chapter that comes after the one introducing a term, the **first mention** of that term
  is marked. On desktop, hovering shows
  the short definition, and clicking goes to the term's glossary entry. On a phone, a tap shows
  the definition along with a button that goes to the glossary entry.
- The glossary page groups terms by the chapter that introduces them, in reading order. That
  order serves "concept to word": a reader who remembers where they learned an idea scans that
  chapter's group. Starlight's built-in search indexes the page, so searching the idea's words
  finds the term too.
- The glossary and the chapters can't drift apart. The build fails when they disagree.

## Non-goals

- Marking every mention. Only the first mention per chapter is marked; later ones stay plain.
- Hand-marking mentions. A rule finds them.
- Defining terms with plain italics. Italics stay ordinary emphasis (the heading "Who _are_ you?"
  uses them that way).

## Anti-goals

- A page full of underlines. If marking turns noisy, it has failed even if it works.
- Rewriting the author's prose. Adding `<Define>` around an existing word is the only change to
  chapter text.

## Decided

### Marking where a term is introduced

A component wraps the word at the spot where a term is introduced:

```mdx
import Define from '~/components/Define.astro';

A model that keeps nothing between calls is called <Define term="stateless">stateless</Define>.
```

- `term` is the glossary entry's id. The slot is the text as it reads in the sentence.
- It renders the word in italics today. The style lives in that one component, so it can change
  later without touching chapters.
- The element carries an id the glossary links to, so "Introduced in" lands on the sentence.
- The chapter a term belongs to is **derived** from where its `<Define>` sits. It's never written
  in the glossary data.

### Glossary data

One YAML file per term in `src/content/glossary/`, as a content collection, the same way the
library works. Fields:

- `term`: the term as the glossary shows it ("stateless").
- `forms`: other ways the term appears in prose, used to find mentions ("tokens" for "token",
  "streaming response" for "streaming").
- `definition`: one short sentence. This is the hover text and the glossary entry.
- `image` (optional): the image or comparison the chapter used ("a black box").
- `skip` (optional): phrases where a form means something else ("error message", "data model").
  A match inside one of these phrases isn't a mention. This keeps wrong-sense matches out without
  touching chapter text. (Claude's call, from the builder check.)
- `markMentions` (optional, default true): set it to false for a term so central that marking it
  would add noise on every page ("model"). The term stays in the glossary and keeps its
  `<Define>`, but its mentions are never marked. The author decides which terms get it.

The file name is the id that `<Define term="...">` uses.

### Marking later mentions

At build time, in every chapter that comes **after** the one that defines a term, in reading order
(part folder order, then `sidebar.order`), the first mention of the term gets a dotted underline.
Chapters before the defining one stay unmarked, because their readers haven't met the term yet
(Claude's call, from the builder check). Terms with `markMentions: false` are never marked.

A mention is the term or one of its `forms`, as a whole word and
case-insensitive. The longer form wins when two overlap ("streaming response" before
"streaming").

### Checks that fail the build

- A `<Define>` names a term with no glossary file.
- A term is defined more than once across the book.
- A glossary file's term is never defined in any chapter.

Add each check to the "Rules and what enforces them" table in `CLAUDE.md`, and add a line under
"Writing chapters" saying how to introduce a term.

### Who writes the content

Claude drafts each term's `definition` (and `image`) from the chapter text, and the author
approves them, the same as the rest of the prose.

### First terms

Chapter 1 (`part-1-primitives/what-is-a-model.mdx`) already introduces these, in italics today:
*stateless*, *message*, *role*, *tokens*, *streaming*. Each one gets a glossary file, and its
italics become a `<Define>`. "Model" (image: a black box, `markMentions: false`) gets an entry too. Its
`<Define>` wraps "model" in the first body sentence of "A model is a black box" ("From the
outside, a model is a function."), not the heading, so headings stay free of terms (the author's
decision). The author edits this
chapter concurrently: re-read it before each edit, and change only those words.

## Left to the builder

- **Draft chapters.** Follow the existing rule that drafts stay off the public site (see
  `resolveChapterLink` and `tests/dist.test.ts`). In a production build, a term whose defining
  chapter is a draft doesn't appear on the glossary page and isn't marked in other chapters. In
  `bun dev`, everything shows. The glossary sidebar link hides when no term is published, like
  empty parts (`src/routeData.ts`).
- **Where marking happens.** A remark or rehype plugin, or something else. It must skip code,
  headings, links, and the `<Define>` element itself.
- **The hover and tap UI.** Starlight has no popover or tooltip component, and no plugin provides
  one (checked the plugin list and npm on 2026-10-31). Hand-rolled markup and CSS are allowed here
  under the UI rule. Any `<style>` needs a `ui-exception` comment with a reason and expiry. Use
  Starlight components where they fit (`LinkButton` for the phone's "go to glossary" button).
  It must work with a keyboard (focus shows the definition) and follow the light and dark themes.
- **The glossary page.** It lives at `/glossary/`, built the way the library page is (a
  `StarlightPage` under `src/pages/`), with a sidebar link after the library. Within a chapter's
  group, terms are in order of where they're introduced. Each entry shows the term, the
  definition, the image if any, and "Introduced in" linking to the `<Define>` spot.
- **Tests.** Pure logic (finding first mentions, grouping, ordering, the checks) gets unit tests
  in `bun test src`. The built site gets checks in `tests/dist.test.ts`: every published term is
  on the glossary page, and marked mentions link under the `/ai-resources` base.
