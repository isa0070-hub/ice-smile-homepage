<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project release invariants

Google and Naver search visibility is the primary release constraint for this
site. Treat the following as release blockers for every change, including
security, hosting, and dependency work:

- Do not change public URLs, canonical URLs, titles, descriptions, headings,
  internal links, image alt text, JSON-LD, `robots.txt`, or `sitemap.xml`
  unless the task explicitly requires an SEO change and a before/after review.
- Never expose `/admin`, `/login`, or `/api` routes to indexing.
- Before production, compare the important SEO fields and structured data with
  the current production deployment using normal, Googlebot, and Naver Yeti
  user agents.
- Require successful production build, crawlable 200 responses, working public
  images, and no material mobile LCP/CLS regression before release.
- Deploy to Preview first. Promote to Production only after the SEO checks pass.
