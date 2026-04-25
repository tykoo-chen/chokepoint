`#AttraX春潮Spring黑客松`

# JUSTINCASE · 万一

> AI-powered parametric supply-chain delay insurance, priced live by Polymarket.

**Live demo:** https://chokepoint-nine.vercel.app

## What it is

Global trade is a chain of chokepoints — Suez, Hormuz, the Taiwan Strait — and a single delay can vaporize a contract's margin. JUSTINCASE reads your shipment paperwork (or hooks directly into your enterprise Agent), decomposes the route into geopolitical risk factors, prices each one against the corresponding Polymarket prediction market, and quotes a parametric insurance policy in seconds. Hedging that policy in liquid markets is one click away.

> "Your cargo's late, we pay anyway." — pays by timestamp, not by adjuster.

## Demo flow

1. **Connect your enterprise Agent** (Claude Code MCP / Anthropic Open Cloud / your own MCP server) — JUSTINCASE reads ERP, contracts, project ledgers, and ops finance models directly. The Agent surfaces today's policy candidates without you uploading anything. *Or, fall back to single-file upload (drag a bill of lading, contract, or letter of credit).*
2. Claude Opus 4.7 vision extracts a structured `Shipment` JSON — origin/destination, ETA, cargo value, late-delivery penalty.
3. Claude Sonnet 4.6 searches the Polymarket Gamma API and decomposes route risk into 4-5 factors across **海峡 / 天气 / 原料 / 政策 / 宏观** (e.g. *Hormuz blockade lifted by April 30*, *Atlantic storm pre-season*, *WTI hits $150 in May*, *Fed June rate hold*, *BoE April hold*).
4. Each factor is priced against its market; the quote and decomposition render live on a 3-D globe alongside the 4-scenario buyer story (Normal / Coin-flip / Tail / Worst).
5. One-click "Insure" submits the hedge across prediction markets, reinsurance, and derivatives.

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16 (App Router, webpack/turbopack) |
| Vision OCR | Anthropic Claude Opus 4.7 |
| Decomposition agent | Anthropic Claude Sonnet 4.6 (tool runner with `search_polymarket`) |
| Markets data | Polymarket Gamma API (multi-outcome supported via `slug:idx`) |
| Globe / 3-D | react-globe.gl + Three.js (custom day/night ShaderMaterial) |
| Hosting | Vercel |

## Endpoints

- `POST /api/extract` — multi-part upload, returns structured `Shipment`
- `POST /api/decompose` — takes a `Shipment`, returns 4-5 priced factors
- `GET  /api/markets?slugs=…` — proxied Polymarket market lookup, supports `slug:idx` for multi-outcome events

## Local development

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # your key, never commit it
npm run dev
```

### China proxy note

Polymarket's Gamma API is DNS-poisoned in mainland China. If you're behind the Great Firewall, route Node through a local proxy:

```bash
HTTPS_PROXY=http://127.0.0.1:7897 npm run dev
```

(Replace the port with whatever your local proxy uses.)

## Repo layout

```
app/
  api/
    extract/      # Claude Vision OCR -> Shipment JSON
    decompose/    # Claude tool-runner -> factor decomposition
    markets/      # Polymarket proxy (multi-outcome supported)
  components/     # Globe, panels, BetBasisBanner, ScenarioPanel,
                  # LiveMarketsAccordion, UploadBox (Agent + file lanes)
  lib/            # Shipment schema, risk math, market search, splitting
  map/            # 3-D globe view
  quote/          # Quote-flow page
  split/          # Hedge breakdown page
```

## Credits

Built for `#AttraX春潮Spring黑客松`. Underlying market prices are sourced live from [Polymarket](https://polymarket.com); LLM inference is powered by [Anthropic Claude](https://www.anthropic.com/claude).
