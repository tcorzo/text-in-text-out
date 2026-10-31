# AI Resources

https://tcorzo.github.io/ai-resources/

A book on how AI agents work, from models up to harnesses and evals, and a library of the resources behind it.

## Local development

```sh
bun install
bun dev            # http://localhost:4321/ai-resources/ (draft chapters visible)
bun run build      # production build into dist/ (drafts hidden)
bun test src       # unit tests
bun run test:dist  # build + checks on the built site
```

## First-time GitHub setup

1. Create a public repo named `ai-resources` under `tcorzo` on GitHub, with nothing in it.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and pick **GitHub Actions**. Do this before the first push, or the first deploy fails.
3. `git remote add origin git@github.com:tcorzo/ai-resources.git && git push -u origin main`

Every push to `main` then builds and deploys the site.

## Changing the address

The site address is set by the `site` and `base` lines at the top of `astro.config.mjs`. For a custom domain, set `site` to the domain, set `base` to `'/'`, and add `public/CNAME` containing the domain.
