#AttraX春潮Spring黑客松

# Chokepoint

> AI-powered parametric supply-chain delay insurance, priced live by Polymarket.

**Live demo:** https://chokepoint-nine.vercel.app

## What it is

Global trade is a chain of chokepoints — Suez, Hormuz, the Taiwan Strait — and a single delay can vaporize a contract's margin. Chokepoint reads your shipment paperwork, decomposes the route into geopolitical risk factors, prices each one against the corresponding Polymarket prediction market, and quotes a parametric insurance policy in seconds. Hedging that policy in liquid markets is one click away.

## Demo flow

1. Drag a bill of lading, contract, or letter of credit onto the page (multi-doc, per-file type tagging).
2. Claude Opus 4.7 vision extracts a structured `Shipment` JSON — origin/destination, ETA, cargo value, late-delivery penalty.
3. Claude Sonnet 4.6 searches the Polymarket Gamma API and decomposes route risk into 3-6 factors (e.g. *Suez closure by EOY*, *Houthi escalation*, *Strait of Hormuz incident*).
4. Each factor is priced against its market; the quote and decomposition render live on a 3-D globe.
5. One-click "Insure" submits the hedge.

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Vision OCR | Anthropic Claude Opus 4.7 |
| Decomposition agent | Anthropic Claude Sonnet 4.6 (tool runner) |
| Markets data | Polymarket Gamma API |
| Globe / 3-D | react-globe.gl + Three.js |
| Hosting | Vercel |

## Endpoints

- `POST /api/extract` — multi-part upload, returns structured `Shipment`
- `POST /api/decompose` — takes a `Shipment`, returns 3-6 priced factors
- `GET  /api/markets` — proxied Polymarket market lookup

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
    markets/      # Polymarket proxy
  components/     # Globe, panels, quote/insure UI
  lib/            # Shipment schema, risk math, market search, splitting
  map/            # 3-D chokepoint globe view
  quote/          # Quote-flow page
  split/          # Hedge breakdown page
```

## Credits

Built for a hackathon. Underlying market prices are sourced live from [Polymarket](https://polymarket.com); LLM inference is powered by [Anthropic Claude](https://www.anthropic.com/claude).
