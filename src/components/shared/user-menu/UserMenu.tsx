"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useNaraStore } from "@/providers/nara-provider";

type Props = {
  notifKey?: string;
  compact?: boolean;
};

export function UserMenu({ notifKey, compact }: Props) {
  const store = useNaraStore();
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const [width, setWidth] = useState(1500);

  useEffect(() => {
    const onR = () => setWidth(window.innerWidth);
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if ((bell || menu) && !t?.closest?.("[data-um]")) {
        setBell(false);
        setMenu(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (bell || menu)) {
        setBell(false);
        setMenu(false);
      }
    };
    onR();
    window.addEventListener("resize", onR);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("resize", onR);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [bell, menu]);

  const u = store.session() || { name: "", role: "", terr: "", nk: null };
  const S = store.get();
  const key = notifKey || u.nk;
  const list = key ? S.notifs[key] || [] : [];
  const unread = list.filter((n: { read: boolean }) => !n.read).length;
  const full = !compact && width >= 1100;
  const initials = u.name
    .replace(/^Dra?\. /, "")
    .split(" ")
    .filter((w: string) => /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("");

  return (
    <div
      data-um="1"
      className="relative flex items-center gap-3 font-texto text-nara-tinta sm:gap-3.5"
    >
      {key ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBell(!bell);
              setMenu(false);
            }}
            aria-label="Notificaciones"
            className="relative grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-linea bg-nara-blanco text-nara-tinta"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unread > 0 ? (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-[10px] bg-nara-tinta px-1.5 text-xs font-medium text-white box-border">
                {unread}
              </span>
            ) : null}
          </button>

          {bell ? (
            <div className="absolute top-[calc(100%+8px)] right-0 z-50 flex max-h-[460px] w-[min(360px,calc(100vw-16px))] flex-col overflow-auto rounded-2xl border border-linea bg-nara-blanco shadow-[0_12px_30px_rgba(22,20,19,.15)]">
              <div className="flex items-center justify-between border-b border-[#E6E1D9] px-4 py-3">
                <span className="font-medium">Notificaciones</span>
                <button
                  type="button"
                  onClick={() =>
                    store.set((s: { notifs: Record<string, { read: boolean }[]> }) => {
                      (s.notifs[key as string] || []).forEach((n) => {
                        n.read = true;
                      });
                    })
                  }
                  className="cursor-pointer border-none bg-transparent font-texto text-[13px] text-nara-tinta"
                >
                  Marcar todas como leídas
                </button>
              </div>
              {list.length === 0 ? (
                <span className="px-4 py-5 text-sm text-texto-secundario">
                  No hay notificaciones.
                </span>
              ) : (
                list.slice(0, 30).map(
                  (n: {
                    id: string;
                    text: string;
                    link?: string;
                    at: number;
                    read: boolean;
                  }) => (
                    <a
                      key={n.id}
                      href={
                        n.link?.startsWith("/")
                          ? n.link
                          : n.link?.replace(/\.dc\.html.*/, "")
                            ? mapLegacy(n.link)
                            : "#"
                      }
                      onClick={() =>
                        store.set(
                          (s: {
                            notifs: Record<
                              string,
                              { id: string; read: boolean }[]
                            >;
                          }) => {
                            const x = (s.notifs[key as string] || []).find(
                              (y) => y.id === n.id,
                            );
                            if (x) x.read = true;
                          },
                        )
                      }
                      className="flex gap-2.5 border-b border-[#E6E1D9] px-4 py-3 text-nara-tinta no-underline"
                      style={{ background: n.read ? "#fff" : "#FFF9E3" }}
                    >
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: n.read ? "#DCD6CD" : "#161413",
                        }}
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm leading-snug">{n.text}</span>
                        <span className="text-xs text-texto-secundario">
                          {store.agoText(n.at)}
                        </span>
                      </span>
                    </a>
                  ),
                )
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        <button
          type="button"
          aria-expanded={menu}
          aria-haspopup="menu"
          onClick={() => {
            setMenu(!menu);
            setBell(false);
          }}
          className={[
            "flex h-11 cursor-pointer items-center gap-2.5 rounded-full border bg-nara-blanco font-texto text-nara-tinta transition-colors",
            menu
              ? "border-nara-tinta"
              : "border-linea hover:border-nara-tinta/40",
            full ? "py-1 pr-3 pl-1" : "p-1",
          ].join(" ")}
        >
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-nara-tinta text-sm font-medium text-white">
            {initials}
          </span>
          {full ? (
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span className="max-w-[140px] truncate text-sm font-medium">
                {u.name}
              </span>
              <span className="max-w-[140px] truncate text-xs text-texto-secundario">
                {u.role}
              </span>
            </span>
          ) : null}
          {full ? (
            <span
              className={[
                "text-[10px] text-texto-secundario transition-transform",
                menu ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            >
              ▾
            </span>
          ) : null}
        </button>

        {menu ? (
          <div
            role="menu"
            className="absolute top-[calc(100%+6px)] right-0 z-50 w-[260px] overflow-hidden rounded-2xl border border-linea bg-nara-blanco shadow-[0_12px_30px_rgba(22,20,19,.15)]"
          >
            {/* Puente visual con el botón */}
            <div
              className="pointer-events-none absolute -top-[7px] right-5 h-3.5 w-3.5 rotate-45 border-t border-l border-linea bg-nara-blanco"
              aria-hidden
            />

            <Link
              href="/perfil"
              role="menuitem"
              onClick={() => setMenu(false)}
              className="group relative flex items-start gap-3 px-3.5 py-3.5 text-nara-tinta no-underline transition-colors hover:bg-nara-crema"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nara-tinta text-sm font-medium text-white">
                {initials}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                <span className="truncate text-[15px] font-semibold underline-offset-2 group-hover:underline">
                  {u.name}
                </span>
                <span className="text-[13px] leading-snug text-texto-secundario">
                  {u.role}
                  {u.terr ? ` · ${u.terr}` : ""}
                </span>
                <span className="pt-1 text-xs font-medium text-nara-tinta">
                  Ver y editar perfil
                </span>
              </span>
            </Link>

            <div className="border-t border-[#E6E1D9]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => store.logout()}
              className="w-full cursor-pointer border-none bg-transparent px-3.5 py-3 text-left font-texto text-[15px] text-nara-tinta transition-colors hover:bg-nara-crema"
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function mapLegacy(link: string) {
  if (link.includes("Clinico")) return "/clinico";
  if (link.includes("Experto")) return "/experto";
  if (link.includes("Admin")) return "/inicio";
  if (link.includes("Observador")) return "/observador";
  if (link.includes("PacientePlan")) return "/paciente/plan";
  if (link.includes("Paciente")) return "/paciente";
  return link;
}
