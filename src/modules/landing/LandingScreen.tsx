"use client";

import { useEffect, useRef, useState } from "react";
import { landingAssets } from "./assets";
import { IngresarCta, LandingFooter, LandingHeader } from "./LandingChrome";

const CANALES = [
  {
    label: "Usuario 1",
    title: "Con su app y TEO.",
    webp: landingAssets.canal1Webp,
    jpg: landingAssets.canal1Jpg,
    alt: "Manos de una persona sosteniendo un celular, con una taza de café y un valle cafetero al amanecer.",
  },
  {
    label: "Usuario 2",
    title: "Por WhatsApp, con audios.",
    webp: landingAssets.canal2Webp,
    jpg: landingAssets.canal2Jpg,
    alt: "Mesa de cocina con luz de mañana, un celular con audífonos, una taza y flores, y manos descansando.",
  },
  {
    label: "Usuario 3",
    title: "Con visitas, llamadas y papel.",
    webp: landingAssets.canal3Webp,
    jpg: landingAssets.canal3Jpg,
    alt: "Calendario de papel con puntos de colores, un lápiz, flores y hojas de cafeto sobre una mesa de madera.",
  },
] as const;

const PASOS = [
  {
    text: "Lo visitamos en casa.",
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path d="M3.5 11 12 4l8.5 7" />
        <path d="M6 9.5V20h12V9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    ),
  },
  {
    text: "Armamos una ruta a su medida.",
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <circle cx="5.5" cy="18.5" r="2" />
        <circle cx="18.5" cy="5.5" r="2" />
        <path d="M7.5 18.5H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7.5" />
      </svg>
    ),
  },
  {
    text: "Lo acompañamos, a su ritmo.",
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.5" />
        <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M13.5 15.2A4.5 4.5 0 0 1 21 18.5" />
      </svg>
    ),
  },
] as const;

function mixHex(a: string, b: string, t: number) {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = parse(a);
  const B = parse(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i]! - v) * t)).join(",")})`;
}

export function LandingScreen() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [mainBg, setMainBg] = useState("#F0ECE6");
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const threadWrapRef = useRef<HTMLDivElement>(null);
  const threadPathRef = useRef<SVGPathElement>(null);
  const knotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const threadLenRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.style.scrollSnapType = "y mandatory";
    root.style.scrollBehavior = reduce ? "auto" : "smooth";

    const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    let io: IntersectionObserver | undefined;

    if (!reduce && "IntersectionObserver" in window) {
      reveals.forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(12px)";
        el.style.transition = "opacity .7s ease, transform .7s ease";
        el.style.transitionDelay = `${el.dataset.delay || 0}ms`;
      });
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            const t = e.target as HTMLElement;
            if (!e.isIntersecting) {
              t.style.opacity = "0";
              t.style.transform = "translateY(24px)";
              return;
            }
            t.style.opacity = "1";
            t.style.transform = "none";
          });
        },
        { threshold: 0.15 },
      );
      reveals.forEach((el) => io!.observe(el));
    }

    const layoutThread = () => {
      const wrap = threadWrapRef.current;
      const path = threadPathRef.current;
      if (!wrap || !path) return;
      const cards = Array.from(wrap.querySelectorAll<HTMLElement>("[data-thread-grid] > article"));
      const w = wrap.getBoundingClientRect();
      const pts = cards.map((c) => {
        const r = c.getBoundingClientRect();
        return [r.left - w.left + r.width / 2, r.top - w.top] as const;
      });
      const oneCol = pts.some((p) => Math.abs(p[1] - pts[0]![1]) > 4);
      const svg = wrap.querySelector<SVGElement>("[data-thread-svg]");
      if (svg) svg.style.display = oneCol ? "none" : "";
      if (oneCol || !pts.length) return;
      const lift = 34;
      let d = `M ${-24} ${pts[0]![1] + 10} C ${pts[0]![0] * 0.4} ${pts[0]![1] + 10}, ${pts[0]![0] * 0.7} ${pts[0]![1]}, ${pts[0]![0]} ${pts[0]![1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1]!;
        const [x1, y1] = pts[i]!;
        const mx = (x0 + x1) / 2;
        d += ` C ${x0 + (mx - x0) * 0.6} ${y0 - lift * 1.6}, ${x1 - (x1 - mx) * 0.6} ${y1 - lift * 1.6}, ${x1} ${y1}`;
      }
      const last = pts[pts.length - 1]!;
      d += ` C ${last[0] + (w.width - last[0]) * 0.3} ${last[1]}, ${last[0] + (w.width - last[0]) * 0.6} ${last[1] + 10}, ${w.width + 24} ${last[1] + 10}`;
      path.setAttribute("d", d);
      knotRefs.current.forEach((k, i) => {
        if (k && pts[i]) {
          k.setAttribute("cx", String(pts[i]![0]));
          k.setAttribute("cy", String(pts[i]![1]));
        }
      });
      threadLenRef.current = path.getTotalLength();
      path.style.strokeDasharray = String(threadLenRef.current);
    };

    const onScroll = () => {
      const vh = window.innerHeight;
      const mid = vh / 2;
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-bg]"));
      if (secs.length) {
        const c = secs.map((s) => {
          const r = s.getBoundingClientRect();
          return { col: s.dataset.bg!, y: r.top + r.height / 2 };
        });
        let col = c[0]!.col;
        if (mid >= c[c.length - 1]!.y) col = c[c.length - 1]!.col;
        else {
          for (let i = 0; i < c.length - 1; i++) {
            if (mid >= c[i]!.y && mid < c[i + 1]!.y) {
              const t = (mid - c[i]!.y) / (c[i + 1]!.y - c[i]!.y);
              const e = t * t * (3 - 2 * t);
              col = mixHex(c[i]!.col, c[i + 1]!.col, e);
              break;
            }
          }
        }
        setMainBg(col);
      }

      const wrap = threadWrapRef.current;
      const path = threadPathRef.current;
      if (path && wrap && threadLenRef.current) {
        const r = wrap.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (vh * 0.95 - r.top) / (vh * 0.6)));
        path.style.strokeDashoffset = (threadLenRef.current * (1 - t)).toFixed(1);
        knotRefs.current.forEach((k, i, all) => {
          if (!k) return;
          const on = t >= (i + 0.5) / (all.length + 1);
          k.style.opacity = on ? "1" : "0";
        });
      }
    };

    let raf = 0;
    const onScrollRaf = () => {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        onScroll();
      });
    };

    layoutThread();
    onScroll();
    window.addEventListener("resize", layoutThread);
    window.addEventListener("scroll", onScrollRaf, { passive: true });
    const t = window.setTimeout(layoutThread, 800);

    return () => {
      io?.disconnect();
      window.clearTimeout(t);
      window.removeEventListener("resize", layoutThread);
      window.removeEventListener("scroll", onScrollRaf);
      root.style.scrollSnapType = "";
      root.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = videoOpen ? "hidden" : "";
    if (videoOpen) {
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
        void v.play().catch(() => {});
      }
      closeRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeVideo();
      };
      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("keydown", onKey);
        document.documentElement.style.overflow = "";
      };
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [videoOpen]);

  function openVideo() {
    setVideoOpen(true);
  }

  function closeVideo() {
    videoRef.current?.pause();
    setVideoOpen(false);
    openRef.current?.focus();
  }

  return (
    <div className="min-h-svh overflow-x-clip bg-nara-crema text-nara-tinta">
      <div data-chrome="">
        <LandingHeader />
      </div>

      <main style={{ background: mainBg }} className="transition-colors duration-300">
        {/* 01 Portada */}
        <section
          id="inicio"
          className="relative flex min-h-svh snap-start snap-always items-center px-[clamp(16px,6vw,96px)] pb-12 pt-[110px]"
        >
          <picture className="absolute inset-0 overflow-hidden">
            <source srcSet={landingAssets.heroWebp} type="image/webp" />
            <img
              src={landingAssets.heroJpg}
              alt="Amanecer sobre colinas verdes de cafetales, con palmas de cera y casas de campo."
              fetchPriority="high"
              className="h-full w-full object-cover object-[25%_50%] motion-safe:animate-[nara-kenburns_22s_ease-in-out_infinite_alternate]"
            />
          </picture>
          <div
            data-reveal=""
            className="relative flex w-full max-w-[580px] flex-col gap-5 rounded-[20px] bg-nara-crema/90 p-[clamp(24px,4vw,44px)]"
          >
            <div className="flex items-start gap-4">
              <h1 className="min-w-0 flex-1 text-balance font-titulos text-[clamp(32px,5.4vw,56px)] font-semibold leading-[1.08] tracking-[-0.01em]">
                Cada persona, en el canal que puede usar.
              </h1>
              <img
                src={landingAssets.teoEnergia}
                alt=""
                aria-hidden
                className="h-auto w-[clamp(56px,8vw,84px)] shrink-0 motion-safe:animate-[nara-float_3.6s_ease-in-out_infinite_alternate]"
              />
            </div>
            <p className="text-pretty font-texto text-[clamp(18px,1.6vw,21px)] leading-[1.45]">
              Programa de acompañamiento post-sismo del Eje Cafetero.
            </p>
            <div className="flex">
              <IngresarCta />
            </div>
          </div>
        </section>

        {/* 02 El problema */}
        <section
          data-bg="#FFC28F"
          className="flex min-h-svh snap-start snap-always items-center justify-center bg-transparent px-[clamp(16px,6vw,96px)] pb-16 pt-[110px]"
        >
          <div className="flex w-full max-w-[1180px] flex-wrap items-center justify-center gap-[clamp(32px,6vw,88px)]">
            <div data-reveal="" className="flex flex-none items-end justify-center gap-[clamp(12px,2vw,28px)]">
              <img
                src={landingAssets.naraDuda}
                alt="NARA, con expresión de duda."
                className="h-auto w-[clamp(130px,20vw,240px)] motion-safe:animate-[nara-float_3.6s_ease-in-out_infinite_alternate]"
              />
              <img
                src={landingAssets.teoDuda}
                alt="TEO, con expresión de duda."
                className="h-auto w-[clamp(130px,20vw,240px)] motion-safe:animate-[nara-float_4.1s_ease-in-out_1.4s_infinite_alternate]"
              />
            </div>
            <div data-reveal="" className="flex max-w-[600px] flex-1 basis-[380px] flex-col gap-[22px]">
              <h2 className="text-balance font-titulos text-[clamp(30px,4.6vw,52px)] font-semibold leading-[1.1]">
                Pedir ayuda no debería depender de tener celular, señal o cómo llegar.
              </h2>
              <p className="text-pretty font-texto text-[clamp(18px,1.6vw,21px)] leading-[1.5]">
                Después del sismo, el miedo puede quedarse. El acompañamiento tiene que llegar a todas las personas.
              </p>
            </div>
          </div>
        </section>

        {/* 03 Tres canales */}
        <section
          data-bg="#F0ECE6"
          className="flex min-h-svh snap-start snap-always flex-col items-center justify-center gap-[clamp(32px,5vw,56px)] bg-transparent px-[clamp(16px,5vw,80px)] pb-16 pt-[110px]"
        >
          <h2
            data-reveal=""
            className="text-balance text-center font-titulos text-[clamp(32px,5vw,56px)] font-semibold leading-[1.1]"
          >
            Nadie se queda por fuera.
          </h2>
          <div ref={threadWrapRef} className="relative w-full max-w-[1200px]">
            <div
              data-thread-grid=""
              className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[clamp(16px,2.4vw,28px)]"
            >
              {CANALES.map((c) => (
                <article
                  key={c.label}
                  data-reveal=""
                  className="flex flex-col overflow-hidden rounded-[20px] border border-linea bg-nara-blanco"
                >
                  <picture className="block aspect-[3/2]">
                    <source srcSet={c.webp} type="image/webp" />
                    <img src={c.jpg} loading="lazy" alt={c.alt} className="h-full w-full object-cover" />
                  </picture>
                  <div className="flex flex-col gap-2 px-6 pb-[26px] pt-[22px]">
                    <p className="font-texto text-sm font-semibold uppercase tracking-[0.06em] text-texto-secundario">
                      {c.label}
                    </p>
                    <p className="font-titulos text-[clamp(22px,2vw,26px)] font-medium leading-[1.2]">{c.title}</p>
                  </div>
                </article>
              ))}
            </div>
            <svg
              data-thread-svg=""
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
            >
              <path
                ref={threadPathRef}
                data-thread=""
                d=""
                fill="none"
                stroke="#161413"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {(["#FFA3D0", "#FDCD22", "#3FEA73"] as const).map((fill, i) => (
                <circle
                  key={fill}
                  ref={(el) => {
                    knotRefs.current[i] = el;
                  }}
                  r="7"
                  fill={fill}
                  stroke="#161413"
                  strokeWidth="2"
                  cx="-99"
                  cy="-99"
                  className="opacity-0 transition-opacity duration-[400ms]"
                />
              ))}
            </svg>
          </div>
          <button
            ref={openRef}
            type="button"
            onClick={openVideo}
            className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-linea bg-transparent px-5 font-texto text-[17px] font-semibold text-nara-tinta hover:bg-nara-blanco"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M10 8.5v7l5.5-3.5z" />
            </svg>
            Ver cómo funciona
          </button>
        </section>

        {/* 04 Cómo funciona */}
        <section
          data-bg="#FFE189"
          className="flex min-h-svh snap-start snap-always items-center justify-center bg-transparent px-[clamp(16px,6vw,96px)] pb-16 pt-[110px]"
        >
          <div className="flex w-full max-w-[1180px] flex-wrap items-center justify-center gap-[clamp(32px,6vw,88px)]">
            <img
              data-reveal=""
              src={landingAssets.teoEnergia}
              alt="TEO, con expresión de curiosidad."
              loading="lazy"
              className="h-auto w-[clamp(170px,26vw,320px)] shrink-0 motion-safe:animate-[nara-float_3.6s_ease-in-out_infinite_alternate]"
            />
            <div className="flex max-w-[620px] flex-1 basis-[400px] flex-col gap-7">
              <h2
                data-reveal=""
                className="text-balance font-titulos text-[clamp(32px,5vw,56px)] font-semibold leading-[1.1]"
              >
                Siempre hay una persona detrás.
              </h2>
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {PASOS.map((p, i) => (
                  <li
                    key={p.text}
                    data-reveal=""
                    data-delay={String(i * 260)}
                    className="flex items-center gap-4"
                  >
                    {p.icon}
                    <span className="font-texto text-[clamp(19px,1.7vw,22px)] font-medium leading-[1.35]">
                      {p.text}
                    </span>
                  </li>
                ))}
              </ol>
              <div data-reveal="" className="rounded-[20px] bg-nara-blanco p-[clamp(20px,3vw,28px)]">
                <p className="text-pretty font-texto text-lg leading-[1.55]">
                  TEO acompaña; no reemplaza a su psicóloga. Nada cuenta hasta que una persona lo confirma. Si hay una
                  crisis, una persona del equipo lo llama: nuestra meta es en menos de 30 minutos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 05 Datos y cierre */}
        <section className="relative flex min-h-svh snap-start snap-always items-center justify-end px-[clamp(16px,7vw,120px)] pb-12 pt-[110px]">
          <picture className="absolute inset-0 overflow-hidden">
            <source srcSet={landingAssets.cierreWebp} type="image/webp" />
            <img
              src={landingAssets.cierreJpg}
              loading="lazy"
              alt="Ramas de cafeto con cerezas rojas y gotas de rocío, con el sol saliendo sobre las colinas."
              className="h-full w-full object-cover object-[15%_50%] motion-safe:animate-[nara-kenburns_22s_ease-in-out_infinite_alternate]"
            />
          </picture>
          <div
            data-reveal=""
            className="relative flex w-full max-w-[480px] flex-col gap-4 rounded-[20px] bg-nara-crema/90 p-[clamp(24px,4vw,40px)]"
          >
            <div className="flex items-end gap-2.5">
              <img
                src={landingAssets.char1}
                alt=""
                aria-hidden
                loading="lazy"
                className="h-16 w-auto motion-safe:animate-[nara-float_3.6s_ease-in-out_infinite_alternate]"
              />
              <img
                src={landingAssets.char2}
                alt=""
                aria-hidden
                loading="lazy"
                className="h-[58px] w-auto motion-safe:animate-[nara-float_4.1s_ease-in-out_0.9s_infinite_alternate]"
              />
              <img
                src={landingAssets.char3}
                alt=""
                aria-hidden
                loading="lazy"
                className="h-16 w-auto motion-safe:animate-[nara-float_4.6s_ease-in-out_1.8s_infinite_alternate]"
              />
            </div>
            <h2 className="text-balance font-titulos text-[clamp(32px,4.6vw,52px)] font-semibold leading-[1.1]">
              Sus datos son suyos.
            </h2>
            <p className="text-pretty font-texto text-[clamp(18px,1.6vw,21px)] leading-[1.5]">
              Usted decide quién los ve y puede retirar su permiso cuando quiera.
            </p>
            <p className="font-texto text-[15px] text-texto-secundario">Ley 1581 de 2012.</p>
            <div className="flex pt-1.5">
              <IngresarCta />
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      {videoOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Video: cómo funciona NARA"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(22,20,19,0.82)] p-4"
          onClick={closeVideo}
        >
          <div
            className="relative flex w-[min(1100px,100%,calc((100svh-112px)*16/9))] flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                ref={closeRef}
                type="button"
                onClick={closeVideo}
                className="min-h-12 rounded-[14px] bg-nara-crema px-5 font-texto text-[17px] font-semibold text-nara-tinta"
              >
                Cerrar
              </button>
            </div>
            <video
              ref={videoRef}
              src={landingAssets.video}
              poster={landingAssets.videoPoster}
              controls
              playsInline
              preload="metadata"
              className="block aspect-video max-h-[calc(100svh-112px)] w-full rounded-[20px] bg-nara-tinta"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
