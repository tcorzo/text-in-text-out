# The book's voice

Read this before you draft or edit chapter prose. The author writes the book and Claude drafts sections on request, so a draft should read as if the author wrote it. The pairs under "Where Claude's drafts drift" are real corrections from the author, and they are the best guide here.

## The reader

A software engineer. They know HTTP, JSON, Python, API keys, and `curl`, so the book never explains those. They have used ChatGPT or Claude, but they have never built on a model. They have picked up some hype and some wrong ideas along the way.

The book replaces those ideas with an accurate picture, built one idea at a time: the model, then the agent loop, then tools, harnesses, and evals. It feels like a software engineering book. A newcomer reads it front to back, and someone experienced jumps to the chapter they need.

## How it reads

- **Playful framing, exact substance.** The personality lives in openers and headings: "LLM? wtf is that?", "Who _are_ you?", "What's in the box?". The explanations under them are careful and precise. Keep the author's headings, and write new ones in the same spirit, not as flat labels.
- **The model is an engineering object.** It is a function from text to text. Show what goes over the wire: the request, the JSON response, the `usage` you pay for. Explain behavior through that interface, not through metaphors about minds.
- **Concrete first.** A specific example comes before the general point: Ada's name shows statelessness, and the animation shows next-token prediction.
- **Precise verbs and real terms.** The model *outputs* text. It doesn't write, think, know, or decide. When a field has a proper term, use it and define it ("non-determinism"), instead of a friendly paraphrase ("it doesn't repeat itself").
- **Short.** Say the point, and stop. When the ideas are parallel, put them in cards (`CardGrid` and `Card`), not in a run of subsections.
- **Positive.** Say what the model does, then how you work with it. A limitation comes with its mitigation, and that mitigation is the full set of options, not only the one the next chapter covers.
- **"You" voice, present tense.** Plain words, serial commas, no em dashes, and straight quotes.

## Where Claude's drafts drift

Claude over-explains, frames things in the negative, softens precise terms, and flattens the author's playful framing. Each pair below is a real correction.

**Wordy, compared with short.** An h3 for each limit, with two paragraphs each, became four cards of two or three sentences each.

**Negative, compared with positive.**

> Before: **It doesn't take actions.** The model can't run code, search the web, read a file, or send an email.
>
> After: **It describes actions.** The model outputs text, and some of that text can describe an action, like a web search. Your program reads the description and runs the action.

**A human verb, compared with the real one.**

> Before: It can only write text.
>
> After: The model outputs text.

**A paraphrase, compared with the term.**

> Before: **It doesn't repeat itself.**
>
> After: **Its output varies between runs.** … This makes the model *non-deterministic*.

**One fix, compared with all of them.**

> Before: Facts in the request make hallucinations less likely. The Evals chapter covers catching them.
>
> After: A request that contains the facts the answer needs makes hallucinations less likely. Checking the output catches the rest. (The card before it says how the facts get in: directly, or looked up from a knowledge base.)
>
> The author's point: evals aren't the only fix for hallucinations. Supplying the right context is the first one.

**A flat label, compared with the author's framing.** The author titled a section "What can the model do?", not "What the model can't do".

When the author corrects a draft, add the pair here.

## What this voice doesn't cover

- **Glossary definitions** in `src/content/glossary/` are cold, technical reference entries that don't depend on any one API. They don't follow this voice.
- **Code examples** are illustrative and never run. They show the real shape of an API call.
- **Mechanics** stay in `CLAUDE.md`: the vocabulary rule, `<Define>`, `<ChapterLink>`, `<SectionLink>`, and `<Draft>`.
