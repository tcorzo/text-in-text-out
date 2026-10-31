---
name: add-library-entry
description: Add or enrich a library entry from a link. Use when the author pastes a URL or a list of URLs, says "add this article/talk/tool/model/repo", or asks to enrich an existing entry.
---

Turn one link into a **connected** library entry: facts from the page, a canonical URL, secondary links, and `related` edges into the rest of the library. Each entry is one YAML file in `src/content/library/<id>.yaml` (kebab-case id). The schema in `src/content.config.ts` is the source of truth for fields; read it first.

Everything you write is **sourced**: it comes from a page you fetched in this session. The one field that belongs to the author is `note`. Ask for it, and leave it out until they give it.

For a list of links, run the steps per link, then do step 5 once more across the whole batch. In a pasted bookmark list, an item nested under another one is `related` to it.

## Steps

1. **Fetch the page.** Record the title, the meta/og description, the published date (`article:published_time` or JSON-LD `datePublished`), the named people (bylines, "Written by…", acknowledgements) and the HTTP status. Use the organisation as `creator` when no person is named. Done when every field you'll fill has a source on the page.

2. **Choose the canonical URL**: the public page that explains the thing. When the link is a dashboard, pricing page, app screen, playground anchor or tracking fragment, go to that product's home or launch page. When it pins a version (a model version on a gateway), check whether a newer version exists. If one does, make the entry about the family, point `url` at the maker's launch post or home page, and keep the pinned page in `links`. Done when `url` loads and would still make sense in a year.

3. **Classify `type`.** A model release is `model` even when the source is a blog post; a GitHub project is `repo`; a hosted product is `tool`.

4. **Harvest secondary links** from the page's body: weights, docs, source repo, API or gateway page, playground, benchmark, eval or demo. Give each a short `label` and confirm it loads. Done when every outbound link in the body is either in `links` or judged irrelevant.

5. **Connect.** Grep the library for entries this page mentions, compares against, benchmarks or builds on, and for entries with the same creator. Add each to `related`, then open the other entry and add this id to its `related` too, so every edge is two-way. Done when every library entry the page names is linked both ways.

6. **Tag.** List the existing tags first (`grep -h '^tags:' src/content/library/*.yaml`) and reuse them. Add a new kebab-case tag only for a genuinely new concept, and report it.

7. **Chapters.** Pick `chapters` ids from `src/content/docs/` (`part-folder/file`) where the resource would be further reading. These are guesses; report them as such.

8. **Summary.** Write one factual line paraphrasing the page's own description. Set `added` to today.

9. **Surface candidates.** List resources linked from the page that might deserve their own entry (a benchmark index, an eval dataset, a companion paper). Offer them; the author decides.

10. **Validate.** Run `bun run build`. It fails on a schema error or a broken `chapters`/`related` reference and names the entry. Done when it passes.

## Report

End with a short list:

- entries created and entries edited (including `related` back-links)
- guesses to confirm: chapters, new tags, canonical-URL changes and why
- candidates from step 9
- a request for the `note` on each new entry
