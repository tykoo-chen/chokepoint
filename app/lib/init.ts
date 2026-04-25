// Bootstrap module — imported by every API route that makes outbound calls.
// In CN dev networks, HTTPS_PROXY (Clash/Shadowsocks) routes everything; on
// Vercel the env var is unset and we skip the dispatcher.
import { ProxyAgent, setGlobalDispatcher } from "undici";

const PROXY =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;

let installed = false;
if (PROXY && !installed) {
  try {
    setGlobalDispatcher(new ProxyAgent(PROXY));
    installed = true;
  } catch {
    // ignore
  }
}

export const PROXY_USED = PROXY ?? null;
