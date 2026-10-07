"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleNav } from "@/components/shared/role-nav/RoleNav";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { useNaraStore } from "@/providers/nara-provider";

type TabId = "avance" | "recursos" | "resultados" | "datos" | "casos";

const TAB_LABEL: Record<TabId, string> = {
  avance: "Avance",
  recursos: "Recursos",
  resultados: "Resultados",
  datos: "Datos",
  casos: "Casos remitidos",
};

const DEFAULT_TABS: Record<string, TabId[]> = {
  Financiador: ["avance", "recursos", "resultados"],
  Investigación: ["resultados", "datos"],
  "Institución de salud": ["casos"],
};

function fmt(n: number) {
  return n.toLocaleString("es-CO");
}

function buildObserverView(store: ReturnType<typeof useNaraStore>, orgType: string, account: { ethics?: string; org?: string } | null) {
  const S = store.get();
  const people = store.people(S);
  const terrs = S.territories || [];
  const experts = store.experts(S);
  const visits = Object.keys(S.visits || {}).length;
  const flagsOk = (S.flags || []).filter((f: { status: string }) => f.status === "approved").length;
  const flagsAll = (S.flags || []).length;
  const ruralPeople = people.filter((p: { rural?: boolean }) => p.rural).length;
  const ruralPct = people.length ? Math.round((ruralPeople / people.length) * 100) : 0;
  const ruralGoalAvg = terrs.length
    ? Math.round(terrs.reduce((a: number, t: { ruralG?: number }) => a + (t.ruralG || 0), 0) / terrs.length)
    : 0;
  const alDia = terrs.filter((t: { cap?: number; goal?: number }) => t.cap && t.goal && t.cap / t.goal >= 0.3).length;
  const manillas = terrs.reduce((a: number, t: { brD?: number; br?: number }) => a + (t.brD || 0), 0);
  const tablets = experts.filter((e: { tablet?: string | boolean }) => !!e.tablet).length;
  const crisis = (S.alerts || []).filter((a: { sev: string }) => a.sev === "crisis").length;
  const courses = Object.keys((S.recursos && S.recursos.people) || {}).length;
  const refs = (S.referrals || []).filter((r: { to?: string }) => {
    if (orgType !== "Institución de salud") return true;
    const org = account?.org || "";
    return !org || (r.to && String(r.to).includes(org.split(" ")[0]));
  });

  const kpis: Record<string, { label: string; value: string; hint: string }[]> = {
    avance: [
      { label: "Personas captadas", value: fmt(people.length), hint: visits ? visits + " visitas registradas" : "Sin visitas aún" },
      { label: "Territorios al día", value: terrs.length ? alDia + " de " + terrs.length : "0", hint: terrs.length ? "Según meta de captación" : "Sin territorios" },
      { label: "Visitas válidas", value: flagsAll ? Math.round((flagsOk / flagsAll) * 100) + "%" : "—", hint: flagsAll ? flagsOk + " aprobadas de " + flagsAll : "Sin control de calidad aún" },
      { label: "Cuota rural", value: people.length ? ruralPct + "%" : "—", hint: ruralGoalAvg ? "Meta promedio " + ruralGoalAvg + "%" : "Sin meta rural" },
    ],
    recursos: [
      { label: "Presupuesto ejecutado", value: "—", hint: "Sin datos de presupuesto en el store" },
      { label: "Manillas entregadas", value: fmt(manillas), hint: "Según territorios" },
      { label: "Costo por persona", value: "—", hint: "Sin datos de costo" },
      { label: "Tablets en campo", value: fmt(tablets), hint: experts.length ? experts.length + " expertos" : "Sin expertos" },
    ],
    resultados: [
      { label: "Mejoría PHQ-9", value: "—", hint: "Sin series clínicas agregadas" },
      { label: "Crisis atendidas", value: fmt(crisis), hint: crisis ? "Registradas en alertas" : "Sin crisis" },
      { label: "Cursos asignados", value: fmt(courses), hint: people.length ? Math.round((courses / Math.max(1, people.length)) * 100) + "% del caseload" : "Sin caseload" },
      { label: "Sesiones a tiempo", value: "—", hint: "Sin agenda clínica agregada" },
    ],
  };

  const datos = [
    {
      name: "PHQ-9 por semana",
      meta: account?.ethics ? "Seudonimizado · " + account.ethics : "Seudonimizado · requiere aprobación ética",
      estado: account?.ethics ? "Aprobado" : "Pendiente",
    },
    {
      name: "Uso de cursos por canal",
      meta: "Agregado · sin identificadores",
      estado: courses ? "Listo para descarga" : "Sin datos",
    },
    {
      name: "Rutas clínicas vs. campo",
      meta: "Requiere aprobación ética",
      estado: "Pendiente",
    },
  ];

  const casos = refs.map((r: { name?: string; age?: number; reason?: string; status?: string; by?: string; pid?: string }) => ({
    name: r.name || r.pid || "Caso",
    age: r.age || "—",
    reason: r.reason || "Remisión registrada",
    status: r.status || "Activa",
    by: r.by || "Equipo clínico",
  }));

  const activity = (S.activity || [])
    .slice(0, 5)
    .map((a: { text: string; at: number }) => ({
      text: a.text,
      when: store.agoText(a.at),
    }));

  const summary =
    orgType === "Institución de salud"
      ? casos.length
        ? "Hay " + casos.length + " caso" + (casos.length === 1 ? "" : "s") + " remitido" + (casos.length === 1 ? "" : "s") + " a su institución. " + (crisis ? crisis + " en crisis." : "Ninguno en crisis abierta.")
        : "No hay casos remitidos a su institución todavía."
      : orgType === "Investigación"
        ? account?.ethics
          ? "Puede consultar resultados agregados y solicitar extracciones con el número " + account.ethics + ". No hay acceso a historias clínicas identificables."
          : "Configure un número de aprobación ética para solicitar extracciones. No hay acceso a historias clínicas identificables."
        : terrs.length || people.length
          ? "El programa registra " + fmt(people.length) + " personas en " + terrs.length + " territorio" + (terrs.length === 1 ? "" : "s") + "."
          : "Aún no hay captación ni territorios registrados. Los indicadores aparecerán cuando el equipo cargue datos.";

  return { kpis, datos, casos, activity, summary };
}

function ObservadorInner() {
  const store = useNaraStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const u = store.session();
  const [tab, setTab] = useState<TabId | null>(null);

  useEffect(() => {
    const roleId = (u as { roleId?: string } | null)?.roleId;
    if (!u || (roleId !== "observador" && u.role !== "Observador")) {
      router.replace("/ingreso");
    }
  }, [u, router]);

  const account = useMemo(() => {
    if (!u) return null;
    const S = store.get();
    return (S.accounts || []).find((a: { id: string }) => a.id === u.id) || null;
  }, [store, u]);

  const orgType = (account?.orgType as string) || u?.terr || "Financiador";
  const modules = useMemo<TabId[]>(() => {
    const fromAccount = (account?.modules as TabId[] | undefined)?.filter(
      (m) => m in TAB_LABEL,
    );
    if (fromAccount?.length) return fromAccount;
    return DEFAULT_TABS[orgType] || DEFAULT_TABS.Financiador;
  }, [account, orgType]);

  useEffect(() => {
    if (!modules.length) return;
    const fromUrl = searchParams.get("view") as TabId | null;
    setTab((current) => {
      if (fromUrl && modules.includes(fromUrl)) return fromUrl;
      if (current && modules.includes(current)) return current;
      return modules[0];
    });
  }, [modules, searchParams]);

  const [tick, setTick] = useState(0);
  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);
  const view = useMemo(
    () => buildObserverView(store, orgType, account),
    [store, orgType, account, tick],
  );

  if (!u || !tab) {
    return <div className="min-h-screen bg-nara-crema font-texto" />;
  }

  return (
    <div
      data-screen-label="Observador"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-nara-crema font-texto text-nara-tinta"
    >
      <header className="shrink-0 border-b border-linea bg-nara-blanco">
        <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 md:px-8">
          <div className="flex h-full min-w-0 flex-1 items-stretch gap-2 sm:gap-4">
            <img
              src="/nara/marca/logo/nara-logo.svg"
              alt="NARA"
              className="my-auto block h-7 w-auto shrink-0 sm:h-[34px]"
            />
            <RoleNav
              items={modules.map((m) => ({
                key: m,
                label: TAB_LABEL[m],
                active: tab === m,
                onClick: () => setTab(m),
              }))}
            />
          </div>
          <UserMenu notifKey={u.nk || undefined} />
        </div>
      </header>

      <main className="nara-scroll nara-page min-h-0 flex-1 overflow-y-auto flex flex-col gap-5">
        <section className="nara-page-head flex flex-col gap-1">
          <h1 className="font-titulos text-2xl font-semibold sm:text-3xl">{u.name}</h1>
          <p className="text-[15px] text-texto-secundario">
            {orgType}
            {account?.org ? ` · ${account.org}` : ""}
            {account?.ethics ? ` · ${account.ethics}` : ""}
          </p>
        </section>

        {tab === "avance" || tab === "recursos" || tab === "resultados" ? (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(view.kpis[tab] || []).map((k) => (
              <article
                key={k.label}
                className="flex flex-col gap-2 rounded-2xl border border-linea bg-nara-blanco p-5"
              >
                <span className="text-sm text-texto-secundario">{k.label}</span>
                <span className="font-titulos text-3xl font-semibold">{k.value}</span>
                <span className="text-sm text-texto-secundario">{k.hint}</span>
              </article>
            ))}
          </section>
        ) : null}

        {tab === "datos" ? (
          <section className="flex flex-col gap-3">
            <p className="text-[15px] text-texto-secundario">
              Catálogo de extracciones seudonimizadas. Las solicitudes con datos
              sensibles requieren número de aprobación ética.
            </p>
            {view.datos.map((d) => (
              <article
                key={d.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-linea bg-nara-blanco px-5 py-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-sm text-texto-secundario">{d.meta}</span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    d.estado === "Pendiente"
                      ? "bg-[#F9EBC8] text-nara-tinta"
                      : "bg-exito-suave text-nara-tinta"
                  }`}
                >
                  {d.estado}
                </span>
              </article>
            ))}
          </section>
        ) : null}

        {tab === "casos" ? (
          <section className="flex flex-col gap-3">
            <p className="text-[15px] text-texto-secundario">
              Solo ve los casos remitidos a su institución con autorización del
              paciente.
            </p>
            {view.casos.length ? view.casos.map((c) => (
              <article
                key={c.name}
                className="flex flex-col gap-2 rounded-2xl border border-linea bg-nara-blanco px-5 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {c.name}, {c.age} años
                  </span>
                  <span className="rounded-full bg-nara-calma/40 px-3 py-1 text-sm font-medium">
                    {c.status}
                  </span>
                </div>
                <p className="text-[15px] text-texto-secundario">{c.reason}</p>
                <span className="text-sm text-texto-secundario">Remitida por {c.by}</span>
              </article>
            )) : (
              <p className="text-[15px] text-texto-secundario">No hay casos remitidos todavía.</p>
            )}
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="mb-3 font-titulos text-xl font-semibold">
              Resumen para su organización
            </h2>
            <p className="text-[15px] leading-relaxed text-texto-secundario">
              {view.summary}
            </p>
          </article>
          <article className="rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="mb-3 font-titulos text-xl font-semibold">Actividad reciente</h2>
            <ul className="flex flex-col gap-3">
              {view.activity.length ? view.activity.map((a) => (
                <li key={a.text + a.when} className="flex flex-col gap-0.5 border-b border-linea pb-3 last:border-none last:pb-0">
                  <span className="text-[15px] font-medium">{a.text}</span>
                  <span className="text-sm text-texto-secundario">{a.when}</span>
                </li>
              )) : (
                <li className="text-[15px] text-texto-secundario">Sin actividad registrada.</li>
              )}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}

export function ObservadorScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-nara-crema font-texto" />}>
      <ObservadorInner />
    </Suspense>
  );
}
