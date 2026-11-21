# Deployment — suburbsense.grf-technologies.com

## Target

| Item | Value |
| --- | --- |
| App | Suburb Sense (Next.js in `web/`) |
| Host | Vercel |
| Public URL | `https://suburbsense.grf-technologies.com` |
| DNS | Cloudflare (on `grf-technologies.com`) |

## Architecture

- **Company site** stays on `https://grf-technologies.com`
- **Suburb Sense** runs on the **subdomain** (separate Vercel project)
- Linked from the GRF site under “Our own products”

## Vercel project settings

- **Root Directory:** `web`
- **Framework:** Next.js
- **Region:** Sydney (`syd1`) preferred for NZ users
- **Environment variables (Production):**

  | Name | Value |
  | --- | --- |
  | `NEXT_PUBLIC_SITE_URL` | `https://suburbsense.grf-technologies.com` |
  | `ADDRESSFINDER_KEY` | (optional) |
  | `DATAFINDER_API_KEY` | (optional) |
  | `NEXT_PUBLIC_MAPBOX_TOKEN` | (optional) |
  | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | (optional) |

## Serving data

Briefs and boundaries are produced by `make pipeline` and live under:

- `web/public/data/` (public JSON / per-suburb GeoJSON)
- `web/server-data/boundaries/all_suburbs.geojson` (server-only, nearby map)

These are gitignored for the source repo. For production:

1. **CLI deploy from a machine that has run the pipeline** (uploads local `public/data` + `server-data`), or  
2. Commit selected `public/data` artefacts to git / CI artifact for Git-based deploys  

`web/.vercelignore` intentionally does **not** exclude those folders.

## Custom domain (Vercel + Cloudflare)

The apex `grf-technologies.com` stays on your existing host. Only the **subdomain** points at Vercel.

### 1. Add the domain in Vercel

1. Open [Vercel → grf-tech/suburbsense → Settings → Domains](https://vercel.com/grf-tech/suburbsense/settings/domains)  
2. Add: `suburbsense.grf-technologies.com`  
3. Copy the recommended DNS record (normally a **CNAME** to `cname.vercel-dns.com`)

### 2. Create the DNS record in Cloudflare

1. Cloudflare → **grf-technologies.com** → **DNS** → **Add record**  
2. **Type:** CNAME  
3. **Name:** `suburbsense`  
4. **Target:** `cname.vercel-dns.com` (or exactly what Vercel shows)  
5. **Proxy status:** start with **DNS only** (grey cloud) until Vercel shows the domain as **Valid**  
6. Save — do not add a separate A/AAAA for `suburbsense`

SSL on Cloudflare: **Full** or **Full (strict)** once the certificate is issued.

Propagation is often a few minutes; can take longer.

## Smoke checks after go-live

- [ ] `https://suburbsense.grf-technologies.com` loads  
- [ ] `/area/otatara-invercargill-city` shows Aug data + trend  
- [ ] Map loads (zoom controls visible)  
- [ ] `/methodology` and `/glossary` OK  
- [ ] `meta.json` / freshness banner shows expected `data_through`  
