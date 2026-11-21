# Security

Threat notes for Suburb Sense on the live host (`https://suburbsense.grf-technologies.com`, Vercel + Cloudflare). Open-data site: no accounts, no first-party PII store. APIs still proxy third-party services and the deploy carries large GeoJSON.

Not a substitute for a penetration test. Revisit when the attack surface changes (new APIs, new domains, new vendors).

Related: [ARCHITECTURE.md](./ARCHITECTURE.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

## Assets worth protecting

| Asset | If abused |
| --- | --- |
| Addressfinder / DataFinder keys | Bill shock / quota burn |
| Nominatim / OSM | Host IP ban |
| `public/data` briefs + GeoJSON | Egress cost |
| Map tile tokens | Quota burn |
| Site reputation | Spam SEO; XSS if unsafe HTML landed in the app |

## Attack surface

### Path traversal via suburb slugs

Briefs load from `public/data/briefs/{slug}.json`. A slug like `../../.env` would be bad.

**Mitigation:** `isSafeSlug()` — hyphenated `a-z0-9` only — in data loaders and boundary APIs.

### API abuse / cost amplification

`/api/address/*` and `/api/boundary/area` can hit paid or rate-limited upstreams.

**Mitigation:** query length caps; GET/HEAD only; per-IP in-memory rate limits on `/api/*` (stricter on address/boundary); no unauthenticated dump of the national GeoJSON (`slug` required on `/api/boundary/suburbs`).

In-memory limits reset per serverless isolate — keep Cloudflare / Vercel edge rate rules in mind for production traffic.

### Large static file scraping

`all_suburbs.geojson` lives under `web/server-data/boundaries/` (not `public/`). The Next.js server reads it for nearby-suburb queries only. Per-slug boundaries stay in `public/data/boundaries/{slug}.json`. `robots.txt` disallows `/data/` and `/api/`.

### XSS / injection

React escapes text by default. JSON-LD uses `JSON.stringify` with `<` → `\u003c`. Keep search params out of `dangerouslySetInnerHTML`; validate `?area=` with `isSafeSlug`.

### Browser / transport headers

Set in `next.config`: CSP (maps + analytics allowlist), `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `nosniff`, strict referrer, locked-down Permissions-Policy, HSTS, `poweredByHeader: false`.

CSP still allows `'unsafe-inline'` / `'unsafe-eval'` for the Next.js bootstrap — candidate for nonce tightening later.

### SSRF

Boundary fallbacks call fixed upstream hosts with names from our briefs, not arbitrary client URLs. Do not accept raw `url=` query params.

### Secrets

| Kind | Examples |
| --- | --- |
| Server-only | `ADDRESSFINDER_KEY`, `DATAFINDER_API_KEY` |
| Public by design | `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SITE_URL` |

Never commit `.env` files. Rotate keys if leaked.

### Privacy / analytics

GA4 is opt-in via env. Prefer Vercel Analytics by default. Do not send full street addresses as event params (success flags / area slugs only).

## Live checklist

- [x] `NEXT_PUBLIC_SITE_URL` set to `https://suburbsense.grf-technologies.com`
- [x] Secrets only in Vercel project env (not in git)
- [x] `all_suburbs.geojson` server-only under `web/server-data/` and traced into the deploy
- [ ] Cloudflare / platform edge rate limits reviewed under real traffic
- [ ] CSP smoke-tested for both Mapbox and OpenFreeMap modes after header changes
- [ ] `/sitemap.xml` and `/robots.txt` still resolve after deploys
