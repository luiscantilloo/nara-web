"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { RoleNav } from "@/components/shared/role-nav/RoleNav";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { useNaraStore } from "@/providers/nara-provider";

type Kind = "admin" | "clin" | "expert" | "obs" | "patient";

function kindOf(session: {
  role?: string;
  nk?: string | null;
  href?: string;
}): Kind {
  const role = session.role || "";
  if (session.nk === "admin" || /Admin/.test(role)) return "admin";
  if (session.nk === "clin" || /Clín/.test(role)) return "clin";
  if (/Experto/.test(role)) return "expert";
  if (role === "Observador") return "obs";
  if (role === "Paciente") return "patient";
  return "admin";
}

function homeOf(kind: Kind, href?: string) {
  if (href?.startsWith("/")) return href;
  if (kind === "clin") return "/clinico";
  if (kind === "expert") return "/experto";
  if (kind === "obs") return "/observador";
  if (kind === "patient") return "/paciente";
  return "/inicio";
}

function agentRole(kind: Kind, nk: string | null | undefined) {
  if (kind === "admin") return "admin";
  if (kind === "clin") return "clin";
  if (kind === "expert") return nk || "andres";
  return "admin";
}

function initialsOf(name: string) {
  return name
    .replace(/^Dra?\. /, "")
    .split(" ")
    .filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function PerfilTopbar({
  kind,
  home,
  notifKey,
  onOpenAgent,
}: {
  kind: Kind;
  home: string;
  notifKey?: string;
  onOpenAgent: () => void;
}) {
  const router = useRouter();

  if (kind === "admin") {
    return <AdminTopbar active="" onOpenAgent={onOpenAgent} />;
  }

  const clinNav =
    kind === "clin"
      ? [
          { key: "home", label: "Inicio", href: "/clinico" },
          { key: "alerts", label: "Alertas", href: "/clinico?view=alerts" },
          {
            key: "patients",
            label: "Mis pacientes",
            href: "/clinico?view=patients",
          },
        ]
      : [];

  return (
    <header className="box-border flex h-16 shrink-0 items-center justify-between gap-2 border-b border-linea bg-nara-blanco px-3 sm:gap-4 sm:px-6">
      <div className="flex h-full min-w-0 flex-1 items-stretch gap-2 sm:gap-4">
        <Link
          href={home}
          className="flex shrink-0 items-center text-nara-tinta"
        >
          <img
            src="/nara/marca/logo/nara-logo.svg"
            alt="NARA"
            className="block h-7 w-auto sm:h-[34px]"
          />
        </Link>
        {clinNav.length ? (
          <RoleNav
            items={clinNav.map((n) => ({
              key: n.key,
              label: n.label,
              active: false,
              onClick: () => router.push(n.href),
            }))}
          />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {kind === "clin" || kind === "expert" ? (
          <button
            type="button"
            onClick={onOpenAgent}
            aria-label="Abrir TEO"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-nara-tinta bg-nara-blanco px-2.5 font-texto text-sm font-medium text-nara-tinta sm:h-11 sm:px-3.5 sm:text-[15px]"
          >
            <img
              src="/nara/marca/logo/teo-isotipo.svg"
              alt=""
              className="block h-7 w-7 sm:-ml-1.5 sm:h-8 sm:w-8"
            />
            <span className="hidden sm:inline">TEO</span>
          </button>
        ) : null}
        <UserMenu
          notifKey={notifKey}
          compact={kind === "patient"}
        />
      </div>
    </header>
  );
}

export function PerfilScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const session = store.session();
  const [agentOpen, setAgentOpen] = useState(false);

  const sessionId = session?.id ?? "";

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [org, setOrg] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [baseline, setBaseline] = useState({ name: "", contact: "", org: "" });
  const [hydratedId, setHydratedId] = useState("");

  useEffect(() => {
    if (!sessionId) {
      router.replace("/ingreso");
      return;
    }
    // Solo hidratar al entrar o al cambiar de usuario (session() crea objeto nuevo cada render).
    if (hydratedId === sessionId) return;
    const S = store.get();
    const acc =
      (S.accounts || []).find((a: { id: string }) => a.id === sessionId) || null;
    const sess = store.session();
    const next = {
      name: (acc as { name?: string } | null)?.name || sess?.name || "",
      contact:
        (acc as { contact?: string } | null)?.contact ||
        (sess as { contact?: string } | null)?.contact ||
        "",
      org:
        (acc as { org?: string } | null)?.org ||
        (sess as { org?: string } | null)?.org ||
        "",
    };
    setName(next.name);
    setContact(next.contact);
    setOrg(next.org);
    setBaseline(next);
    setHydratedId(sessionId);
  }, [sessionId, hydratedId, router, store]);

  if (!session) {
    return <div className="min-h-0 flex-1 bg-nara-crema font-texto" />;
  }

  const kind = kindOf(session);
  const home = homeOf(kind, session.href);
  const role = session.role || "";
  const terr = session.terr || "";
  const initials = initialsOf(name || session.name);
  const dirty =
    name.trim() !== baseline.name.trim() ||
    contact.trim() !== baseline.contact.trim() ||
    org.trim() !== baseline.org.trim();
  const showAgent = kind === "admin" || kind === "clin" || kind === "expert";
  const aRole = agentRole(kind, session.nk);

  const save = () => {
    const n = name.trim();
    const c = contact.trim();
    if (!n) {
      setErr("Escriba su nombre.");
      return;
    }
    if (!c) {
      setErr("Escriba un correo o celular de contacto.");
      return;
    }
    store.set((s: { accounts: Record<string, unknown>[] }) => {
      const list = s.accounts || [];
      const i = list.findIndex((a: { id?: string }) => a.id === session.id);
      if (i > -1) {
        list[i] = Object.assign({}, list[i], {
          name: n,
          contact: c,
          org: org.trim() || (list[i] as { org?: string }).org || "",
        });
      } else {
        list.push({
          id: session.id,
          name: n,
          contact: c,
          role: session.role,
          org: org.trim() || "Programa NARA",
          terr: session.terr || "—",
          status: "Activo",
        });
      }
      s.accounts = list;
    });
    setBaseline({ name: n, contact: c, org: org.trim() });
    setErr("");
    setMsg("Datos del perfil guardados.");
  };

  const body = (
    <>
      <NaraMsgAlert msg={msg} onClear={() => setMsg("")} />
      <NaraMsgAlert
        msg={err}
        onClear={() => setErr("")}
        options={{ icon: "warning" }}
      />

      <div className="nara-page flex flex-col gap-5 md:gap-6">
        <PageHead>
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-nara-tinta font-titulos text-xl font-semibold text-white sm:h-16 sm:w-16 sm:text-2xl">
                {initials}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h1 className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold leading-tight text-nara-tinta">
                  Mi perfil
                </h1>
                <p className="text-[14px] text-texto-secundario sm:text-[15px]">
                  {role}
                  {terr ? ` · ${terr}` : ""}
                </p>
              </div>
            </div>
            <Link
              href={home}
              className="inline-flex h-10 items-center justify-center rounded-[12px] border-[1.5px] border-linea bg-nara-blanco px-3.5 text-sm font-medium text-nara-tinta no-underline sm:h-11 sm:px-4 sm:text-[15px]"
            >
              ← Volver
            </Link>
          </div>
        </PageHead>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-5">
          <aside className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-4 sm:p-5">
            <span className="font-titulos text-lg font-semibold">Cuenta</span>
            <p className="text-sm leading-relaxed text-texto-secundario">
              Actualice sus datos de contacto. El rol y el ámbito del programa
              los define la administración; no se editan aquí.
            </p>
            <dl className="mt-1 flex flex-col gap-2.5 border-t border-[#E6E1D9] pt-3">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-texto-secundario">Rol</dt>
                <dd className="text-sm font-medium">{role}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-texto-secundario">Ámbito</dt>
                <dd className="text-sm font-medium">{terr || "—"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-texto-secundario">Usuario</dt>
                <dd className="font-mono text-sm font-medium">{session.id}</dd>
              </div>
            </dl>
          </aside>

          <section className="flex flex-col gap-4 rounded-[20px] border border-linea bg-nara-blanco p-4 sm:p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-titulos text-lg font-semibold">
                Datos editables
              </h2>
              <p className="text-sm text-texto-secundario">
                Nombre, correo o celular y organización.
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nombre
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr("");
                }}
                className="box-border h-11 w-full rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none focus:border-nara-tinta"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Correo o celular
              <input
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  setErr("");
                }}
                className="box-border h-11 w-full rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none focus:border-nara-tinta"
                placeholder="correo@ejemplo.co o 310 000 0000"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Organización
              <input
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="box-border h-11 w-full rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none focus:border-nara-tinta"
              />
            </label>

            <div className="flex flex-col gap-2 border-t border-[#E6E1D9] pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={save}
                disabled={!dirty}
                className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta disabled:cursor-not-allowed disabled:opacity-45"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(baseline.name);
                  setContact(baseline.contact);
                  setOrg(baseline.org);
                  setErr("");
                }}
                disabled={!dirty}
                className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta disabled:cursor-not-allowed disabled:opacity-45"
              >
                Descartar
              </button>
              {dirty ? (
                <span className="text-sm text-texto-secundario sm:ml-1">
                  Hay cambios sin guardar
                </span>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </>
  );

  const topbar = (
    <PerfilTopbar
      kind={kind}
      home={home}
      notifKey={session.nk || undefined}
      onOpenAgent={() => setAgentOpen(true)}
    />
  );

  if (showAgent) {
    return (
      <AgentDrawerShell
        data-screen-label="Perfil"
        open={agentOpen}
        drawerWidth="480px"
        onClose={() => setAgentOpen(false)}
        header={topbar}
        drawer={
          <AgentPanel
            role={aRole}
            mode="drawer"
            context="users"
            contextLabel="Perfil"
            onClose={() => setAgentOpen(false)}
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          />
        }
      >
        {body}
      </AgentDrawerShell>
    );
  }

  return (
    <div
      data-screen-label="Perfil"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-nara-crema font-texto text-nara-tinta"
    >
      {topbar}
      <main className="nara-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {body}
      </main>
    </div>
  );
}
