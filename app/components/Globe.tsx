"use client";
import { Case, Chokepoint } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

const GlobeComp = dynamic(() => import("react-globe.gl"), { ssr: false });

type PathData = {
  coords: [number, number, number][];
  color: string[]; // one color per waypoint — react-globe.gl interpolates
  stroke: number;
  dashAnimate: number;
};

type RingData = { lat: number; lng: number; color: string; maxRadius: number; propagationSpeed: number; repeatPeriod: number };

type PointData = { lat: number; lng: number; color: string; radius: number; altitude: number };

type HtmlData = { lat: number; lng: number; chokepoint: Chokepoint; live: number };

function severityColor(s: Chokepoint["severity"]): string {
  switch (s) {
    case "critical": return "#ff5a4a";
    case "high": return "#ff9a3c";
    case "med": return "#ffd166";
    default: return "#7dffb1";
  }
}

/** Great-circle distance in degrees (rough; fine for "nearest chokepoint" ranking). */
function distDeg(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = a.lat - b.lat;
  let dLng = a.lng - b.lng;
  if (dLng > 180) dLng -= 360;
  if (dLng < -180) dLng += 360;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** Blend green → amber → red based on probability 0..1. */
function probColor(p: number): string {
  // 0 → green, 0.5 → amber, 1 → red
  if (p <= 0.5) {
    const t = p / 0.5;
    const r = Math.round(0x7d + (0xff - 0x7d) * t);
    const g = Math.round(0xff - (0xff - 0xb3) * t);
    const b = Math.round(0xb1 - (0xb1 - 0x47) * t);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  const t = (p - 0.5) / 0.5;
  const r = 0xff;
  const g = Math.round(0xb3 - (0xb3 - 0x5a) * t);
  const b = Math.round(0x47 - (0x47 - 0x4a) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** For each waypoint: find the nearest chokepoint within 18° and return its prob weighted by proximity. */
function probAtPoint(
  waypoint: { lat: number; lng: number },
  chokepoints: Chokepoint[],
  liveProbs: Record<string, number>,
): number {
  let best = 0;
  for (const c of chokepoints) {
    const d = distDeg(waypoint, c);
    if (d > 18) continue;
    const proximity = 1 - d / 18; // 0 at 18°, 1 at 0°
    const p = liveProbs[c.id] ?? c.probability;
    const contrib = p * proximity;
    if (contrib > best) best = contrib;
  }
  return best;
}

function buildHtml(d: HtmlData, lang: "zh" | "en"): HTMLElement {
  const el = document.createElement("div");
  el.className = "globe-marker";
  const pct = (d.live * 100).toFixed(1);
  const sev = severityColor(d.chokepoint.severity);
  const sevLabel =
    lang === "en"
      ? d.chokepoint.severity.toUpperCase()
      : d.chokepoint.severity === "critical"
      ? "极高"
      : d.chokepoint.severity === "high"
      ? "高"
      : d.chokepoint.severity === "med"
      ? "中"
      : "低";
  const riskLabel = lang === "en" ? "RISK" : "风险";
  const name = lang === "en" ? d.chokepoint.name : d.chokepoint.nameZh;
  const question = lang === "en" ? d.chokepoint.marketQuestion : d.chokepoint.marketQuestionZh;
  const liveLabel = lang === "en" ? "● LIVE" : "● 实时";
  const mktLabel = lang === "en" ? "MKT · 24h" : "市场 · 24h";
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;font-family:var(--font-geist-mono),ui-monospace,Menlo,monospace;">
      <div style="width:1px;height:46px;background:linear-gradient(to bottom, ${sev}, transparent);"></div>
      <div style="min-width:160px;padding:6px 8px;background:rgba(11,15,20,0.94);border:1px solid ${sev};box-shadow:0 0 16px ${sev}44;color:#d6dde6;">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;letter-spacing:0.15em;color:#7b8896;">
          <span>${d.chokepoint.id}</span>
          <span style="color:${sev};">${riskLabel} ${sevLabel}</span>
        </div>
        <div style="font-size:11px;color:#d6dde6;margin-top:1px;">${name}</div>
        <div style="display:flex;align-items:baseline;gap:6px;margin-top:4px;">
          <span style="font-size:18px;font-weight:600;color:#ffb347;font-variant-numeric:tabular-nums;">${pct}%</span>
          <span style="font-size:9px;color:#7b8896;">${mktLabel}</span>
        </div>
        <div style="font-size:9px;color:#7b8896;margin-top:2px;line-height:1.3;">${question}</div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#4a5663;margin-top:4px;border-top:1px solid #1a2430;padding-top:3px;">
          <span>${d.chokepoint.marketSource}</span>
          <span style="color:#7dffb1;">${liveLabel}</span>
        </div>
      </div>
    </div>
  `;
  return el;
}

/** Build a day/night shader material. */
function buildDayNightMaterial(): THREE.ShaderMaterial {
  const loader = new THREE.TextureLoader();
  const dayTex = loader.load("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
  const nightTex = loader.load("//unpkg.com/three-globe/example/img/earth-night.jpg");

  return new THREE.ShaderMaterial({
    uniforms: {
      dayTex: { value: dayTex },
      nightTex: { value: nightTex },
      sunDir: { value: new THREE.Vector3(1, 0.1, 0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalW;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTex;
      uniform sampler2D nightTex;
      uniform vec3 sunDir;
      varying vec2 vUv;
      varying vec3 vNormalW;
      void main() {
        vec3 n = normalize(vNormalW);
        vec3 s = normalize(sunDir);
        float cosSun = dot(n, s);
        // Smooth day/night blend with soft terminator
        float mixF = smoothstep(-0.25, 0.35, cosSun);
        vec3 day = texture2D(dayTex, vUv).rgb;
        vec3 night = texture2D(nightTex, vUv).rgb * 1.35;
        vec3 col = mix(night, day, mixF);
        // Amber terminator band
        float term = 1.0 - clamp(abs(cosSun) * 3.0, 0.0, 1.0);
        col += vec3(1.0, 0.55, 0.15) * term * 0.18;
        // Slight orange cast on the day side so it fits the PPW palette
        col = mix(col, col * vec3(1.05, 0.95, 0.8), mixF * 0.35);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export default function Globe({
  case_,
  chokepoints,
  focus,
  height = 560,
}: {
  case_: Case;
  chokepoints: Chokepoint[];
  focus?: { lat: number; lng: number; altitude?: number };
  height?: number;
}) {
  const t = useT();
  const { lang } = useLang();
  const ref = useRef<GlobeMethods>(undefined);
  const [live, setLive] = useState<Record<string, number>>(() =>
    Object.fromEntries(chokepoints.map((c) => [c.id, c.probability])),
  );
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 800, h: height });
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Day/night shader material is built once on the client.
  const globeMaterial = useMemo(() => (typeof window !== "undefined" ? buildDayNightMaterial() : undefined), []);

  // Sun rotation animation — 1 full day ≈ 60 s real time (tunable).
  useEffect(() => {
    if (!globeMaterial) return;
    let raf = 0;
    const startTs = Date.now();
    const loop = () => {
      const t = (Date.now() - startTs) / 1000; // seconds
      const angle = (t / 60) * Math.PI * 2; // 60s per "day"
      const mat = globeMaterial as unknown as { uniforms: { sunDir: { value: THREE.Vector3 } } };
      mat.uniforms.sunDir.value.set(Math.cos(angle), 0.2, Math.sin(angle));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [globeMaterial]);

  useEffect(() => {
    function measure() {
      if (wrapRef.current) {
        setSize({ w: wrapRef.current.clientWidth, h: height });
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [height]);

  // Hydrate local probs from props (live-refreshed upstream) then micro-wobble
  useEffect(() => {
    setLive((prev) => {
      const next = { ...prev };
      for (const c of chokepoints) next[c.id] = c.probability;
      return next;
    });
  }, [chokepoints]);

  useEffect(() => {
    const t = setInterval(() => {
      setLive((prev) => {
        const next = { ...prev };
        for (const c of chokepoints) {
          const drift = (Math.random() - 0.5) * 0.010;
          const base = prev[c.id] ?? c.probability;
          next[c.id] = Math.max(0.005, Math.min(0.995, base + drift));
        }
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [chokepoints]);

  useEffect(() => {
    if (ready && ref.current) {
      const target = focus ?? { lat: 10, lng: 70, altitude: 2.3 };
      ref.current.pointOfView({ lat: target.lat, lng: target.lng, altitude: target.altitude ?? 2.3 }, 1600);
      const controls = ref.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.2;
        controls.enableZoom = true;
      }
    }
  }, [ready, focus]);

  // Route with per-waypoint color based on nearest chokepoint probability
  const peakProb = chokepoints.reduce((m, c) => Math.max(m, live[c.id] ?? c.probability), 0);
  const pathCoords: [number, number, number][] = case_.waypoints.map((w) => [w.lat, w.lng, 0.012]);
  const pathColors = case_.waypoints.map((w) => probColor(probAtPoint(w, chokepoints, live)));
  const altCoords: [number, number, number][] | null = case_.altRoute ? case_.altRoute.map((w) => [w.lat, w.lng, 0.007]) : null;
  const altColors = case_.altRoute?.map(() => "#2d7d4e") ?? [];

  // Dash animate time: higher peak probability → slower flow (visually "stuck")
  const dashTime = Math.round(1200 + peakProb * 6000); // 1.2s at 0 prob → 7.2s at 1.0

  const paths: PathData[] = [
    { coords: pathCoords, color: pathColors, stroke: 1.8, dashAnimate: dashTime },
    ...(altCoords ? [{ coords: altCoords, color: altColors, stroke: 0.8, dashAnimate: 6500 }] : []),
  ];

  const rings: RingData[] = chokepoints.map((c) => ({
    lat: c.lat,
    lng: c.lng,
    color: severityColor(c.severity),
    maxRadius: c.severity === "critical" ? 6 : c.severity === "high" ? 4.5 : 3.2,
    propagationSpeed: 2.2,
    repeatPeriod: c.severity === "critical" ? 900 : c.severity === "high" ? 1300 : 1900,
  }));

  const endpoints: PointData[] = [
    { lat: case_.origin.lat, lng: case_.origin.lng, color: "#7dffb1", radius: 0.6, altitude: 0.015 },
    { lat: case_.destination.lat, lng: case_.destination.lng, color: "#ffb347", radius: 0.7, altitude: 0.02 },
  ];

  // Ship dot that walks the route
  const [shipT, setShipT] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      // higher peak prob = slower ship
      const step = 0.003 + (1 - peakProb) * 0.010;
      setShipT((p) => (p + step) % 1);
    }, 90);
    return () => clearInterval(t);
  }, [peakProb]);

  const shipPos = useMemo(() => {
    const coords = case_.waypoints;
    const segs = coords.length - 1;
    const total = shipT * segs;
    const i = Math.min(Math.floor(total), segs - 1);
    const frac = total - i;
    const a = coords[i];
    const b = coords[i + 1];
    // simple linear interp — fine at this resolution
    let lng = a.lng + (b.lng - a.lng) * frac;
    const lat = a.lat + (b.lat - a.lat) * frac;
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    return { lat, lng };
  }, [shipT, case_.waypoints]);

  const shipPoint: PointData[] = [
    { lat: shipPos.lat, lng: shipPos.lng, color: probColor(peakProb), radius: 0.45, altitude: 0.025 },
  ];

  const htmlData: HtmlData[] = chokepoints.map((c) => ({
    lat: c.lat,
    lng: c.lng,
    chokepoint: c,
    live: live[c.id] ?? c.probability,
  }));

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      <GlobeComp
        ref={ref}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(5,7,10,0)"
        globeMaterial={globeMaterial}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere={true}
        atmosphereColor="#ffb347"
        atmosphereAltitude={0.20}
        showGraticules={true}

        pathsData={paths}
        pathPoints={(d: unknown) => (d as PathData).coords}
        pathPointLat={(p: unknown) => (p as [number, number, number])[0]}
        pathPointLng={(p: unknown) => (p as [number, number, number])[1]}
        pathPointAlt={(p: unknown) => (p as [number, number, number])[2]}
        pathColor={(d: unknown) => (d as PathData).color}
        pathStroke={(d: unknown) => (d as PathData).stroke}
        pathDashLength={0.3}
        pathDashGap={0.2}
        pathDashAnimateTime={(d: unknown) => (d as PathData).dashAnimate}
        pathTransitionDuration={0}

        ringsData={rings}
        ringLat={(d: unknown) => (d as RingData).lat}
        ringLng={(d: unknown) => (d as RingData).lng}
        ringColor={(d: unknown) => (t: number) => {
          const col = (d as RingData).color;
          const alpha = Math.round((1 - t) * 180).toString(16).padStart(2, "0");
          return `${col}${alpha}`;
        }}
        ringMaxRadius={(d: unknown) => (d as RingData).maxRadius}
        ringPropagationSpeed={(d: unknown) => (d as RingData).propagationSpeed}
        ringRepeatPeriod={(d: unknown) => (d as RingData).repeatPeriod}

        pointsData={[...endpoints, ...shipPoint]}
        pointLat={(d: unknown) => (d as PointData).lat}
        pointLng={(d: unknown) => (d as PointData).lng}
        pointColor={(d: unknown) => (d as PointData).color}
        pointAltitude={(d: unknown) => (d as PointData).altitude}
        pointRadius={(d: unknown) => (d as PointData).radius}

        htmlElementsData={htmlData}
        htmlLat={(d: unknown) => (d as HtmlData).lat}
        htmlLng={(d: unknown) => (d as HtmlData).lng}
        htmlAltitude={0.02}
        htmlElement={(d: object) => buildHtml(d as HtmlData, lang)}

        onGlobeReady={() => setReady(true)}
      />

      <div className="pointer-events-none absolute top-3 left-3 text-[10px] text-faint tracking-widest">
        <div>{t("地球 · DAY/NIGHT · v2026.04", "GLOBE · DAY/NIGHT · v2026.04")}</div>
        <div className="text-amber-dim">
          {t("数据源 · AIS + POLYMARKET + PORTWATCH", "FEED · AIS + POLYMARKET + PORTWATCH")}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-faint tracking-widest">
        <div>{t("◉ 实线 = 按风险着色的计划航线", "◉ Solid = planned route, colored by risk")}</div>
        <div>{t("◎ 虚线 = 备选航线(可对冲)", "◎ Dashed = alternate route (hedgeable)")}</div>
        <div className="mt-1 flex items-center gap-1">
          <span className="w-2 h-1" style={{ background: probColor(0) }} />
          <span className="w-2 h-1" style={{ background: probColor(0.5) }} />
          <span className="w-2 h-1" style={{ background: probColor(1) }} />
          <span className="text-faint ml-1">{t("低 → 高风险", "low → high risk")}</span>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-[10px] text-faint tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber pulse-dot" />{" "}
        {t("船流速 = 风险反比", "Ship speed = inverse of risk")}
      </div>
    </div>
  );
}
