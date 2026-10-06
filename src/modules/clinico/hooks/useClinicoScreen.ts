// @ts-nocheck
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireSession } from "@/hooks/useRequireSession";
import { useNaraStore } from "@/providers/nara-provider";

const INSTS = [
  { id: "hsal", label: "Hospital local de Salento · Psicología y psiquiatría" },
  { id: "hdep", label: "Hospital departamental · Psiquiatría" },
  { id: "cuni", label: "Clínica universitaria · Teleconsulta" },
];
const OUTCOMES = [
  "Contactado · plan de seguridad acordado",
  "Contactado · remitido a urgencias",
  "No contestó · reintentar en 10 min",
  "Falso positivo · cerrar y enviar a revisión de la lista",
];

export function useClinicoScreen() {
  const store = useNaraStore();
  const session = useRequireSession(["lucia"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [st, setStateRaw] = useState({
    view: "home",
    agentOpen: false,
    pid: "gloria",
    outcome: {},
    copied: "",
    note: "",
    refInst: "hsal",
    refReason: "Insomnio que no cede después de las réplicas. Considerar medicación.",
    refErr: false,
    msg: "",
    zoom: 1,
    pendingAsk: "",
    fileFrom: null,
    asg: null,
  });
  const setState = useCallback((u) => {
    setStateRaw((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
  }, []);

  useEffect(() => {
    const v0 = searchParams.get("view");
    const p0 = searchParams.get("pid");
    if (v0) setState({ view: v0 });
    if (p0) setState({ view: "file", pid: p0 });
  }, [searchParams, setState]);

  function openFile(pid, fromAgent) {
    const st0 = st;
    const from =
      st0.view === "file"
        ? st0.fileFrom
        : { view: st0.view, agent: !!fromAgent };
    setState({
      view: "file",
      pid,
      fileFrom: from,
      msg: "",
      note: "",
      refReason:
        pid === "gloria"
          ? "Insomnio que no cede después de las réplicas. Considerar medicación."
          : "",
    });
    window.scrollTo(0, 0);
  }

  function recFile(A, S, P) {
    const R = A.REC,
      pr = A.recPerson(S, P.id),
      cp = A.courseProgress(S, P.id),
      as = ((S.recursos || {}).assigned || []).filter((x) => x.pid === P.id);
    const o = {
      assign: () =>
        setState({ asg: { pid: P.id, name: P.name, q: "", tipo: "", tema: "", para: "" } }),
      has: !!cp,
      none: !cp,
      mods: [],
      read: "Ninguno todavía",
      techs: [],
      answers: [],
      noAns: true,
      assigned: as.map(
        (x) =>
          "Asignado por usted: «" +
          (R.item(x.id) || R.curso(x.id) || {}).title +
          "»" +
          (x.session ? " · se trabajará en sesión" : ""),
      ),
    };
    if (!pr) return o;
    if (cp)
      Object.assign(o, {
        title: cp.c.title,
        meta:
          "Semana " +
          cp.week +
          " de " +
          cp.c.weeks +
          " · " +
          cp.done +
          " semanas hechas · " +
          pr.by,
        mods: cp.c.mods.map((m, i) => {
          const n = i + 1,
            done = pr.doneMods.includes(n);
          return {
            c: done ? "#4E9A6B" : n === cp.week ? "#E0A526" : "#E6E1D9",
            l:
              "S" +
              n +
              " · " +
              R.cuento(m.cuento).title +
              " · " +
              (done ? "hecha" : n === cp.week ? "esta semana" : "próxima"),
          };
        }),
      });
    const rd = Object.keys(pr.read || {}).map((s) => R.cuento(s).title);
    if (rd.length) o.read = rd.join(" · ");
    o.techs = Object.keys(pr.tech4w || {}).map((k) => ({
      n: R.tecnica(k).title,
      v: pr.tech4w[k] + (pr.tech4w[k] === 1 ? " vez" : " veces"),
    }));
    o.answers = (pr.answers || [])
      .filter((a) => a.shared)
      .map((a) => ({ h: "«" + R.cuento(a.slug).title + "» · " + a.q, a: a.a }));
    o.noAns = !o.answers.length;
    return o;
  }

  function asVals(A, S, stLocal) {
    const g = stLocal.asg;
    if (!g) return { asOpen: false, as: { items: [], temas: [] } };
    const R = A.REC,
      up = (v) => setState({ asg: Object.assign({}, g, v) });
    const all = []
      .concat(
        R.CURSOS.map((c) => ({
          kind: "curso",
          id: c.id,
          title: c.title,
          temas: c.para,
          para: c.id === "mayores" ? "60+" : c.id === "familia" ? "Familias" : "Todos",
          meta: "Curso · " + c.weeks + " semanas · " + c.para,
        })),
        R.CUENTOS.map((c) => ({
          kind: "cuento",
          id: c.slug,
          title: c.title,
          temas: c.temas,
          para: c.para,
          restr: c.restr,
          cover: R.cover(c.slug),
          meta: "Cuento · " + c.temas + " · " + c.para + " · " + c.lect + " min",
        })),
        R.VIDEOS.map((v) => ({
          kind: "video",
          id: v.id,
          title: v.title,
          temas: v.tema,
          para: "Todos",
          meta: "Video · " + v.min + " min · " + v.tema,
        })),
        R.TECNICAS.map((t) => ({
          kind: "tecnica",
          id: t.id,
          title: t.title,
          temas: t.tema,
          para: "Todos",
          meta: "Técnica · " + t.min + " min · " + t.tema,
        })),
      );
    const q = (g.q || "").toLowerCase();
    const list = all.filter(
      (x) =>
        (!g.tipo || x.kind === g.tipo) &&
        (!g.tema || R.temaMatch(x, g.tema)) &&
        (!g.para || x.para.includes(g.para)) &&
        (!q || (x.title + " " + x.temas).toLowerCase().includes(q)),
    );
    const save = (x, sessionFlag) => {
      A.set((s) => {
        s.recursos.assigned.push({
          pid: g.pid,
          id: x.id,
          kind: x.kind,
          session: !!sessionFlag,
          by: "Dra. Lucía Marín",
          at: Date.now(),
        });
        const pr = s.recursos.people[g.pid];
        if (x.kind === "curso" && pr) {
          pr.course = x.id;
          pr.week = 1;
          pr.doneMods = [];
          pr.by = "Asignado por la psicóloga";
        }
      });
      up({
        confirm: null,
        msg:
          "«" +
          x.title +
          "» quedó asignado a " +
          g.name +
          (sessionFlag ? " para trabajarlo en sesión." : "."),
      });
    };
    const cf = g.confirm && all.find((x) => x.id === g.confirm);
    return {
      asOpen: true,
      asMaxH: window.innerHeight / (stLocal.zoom || 1) - 80 + "px",
      as: {
        name: g.name,
        q: g.q,
        tipo: g.tipo,
        tema: g.tema,
        para: g.para,
        setQ: (e) => up({ q: e.target.value }),
        setTipo: (e) => up({ tipo: e.target.value }),
        setTema: (e) => up({ tema: e.target.value }),
        setPara: (e) => up({ para: e.target.value }),
        temas: R.TEMAS,
        close: () => setState({ asg: null }),
        hasMsg: !!g.msg,
        msg: g.msg,
        clearMsg: () => up({ msg: "" }),
        confirming: !!cf,
        cTag: cf ? R.TAG[cf.restr] : "",
        cTitle: cf ? cf.title : "",
        cWarn:
          cf && cf.restr === "restringido"
            ? "habla de un intento de suicidio. Solo se asigna para leerlo en sesión, nunca por primera vez a solas. TEO no lo menciona."
            : "tiene un personaje que dice «no quiero vivir». Se usa con el experto en grupo o PM+, o en sesión con usted.",
        confirm: () => cf && save(cf, true),
        cancel: () => up({ confirm: null }),
        items: list.map((x) => ({
          title: x.title,
          meta: x.meta,
          hasCover: !!x.cover,
          cover: x.cover || "",
          hasTag: !!x.restr,
          tag: x.restr ? R.TAG[x.restr] : "",
          tagBg: x.restr === "pandemia" ? "#F0ECE6" : "#FDE7E4",
          pick: () =>
            x.restr === "restringido" || x.restr === "acompanamiento"
              ? up({ confirm: x.id, msg: "" })
              : save(x, false),
        })),
      },
    };
  }

  function rv() {
    const A = store;
    const S = A.get();
    const C = A.C;
    const pending = S.alerts.filter((a) => a.sev === "crisis" && a.status === "new").length;
    const SEV = {
      crisis: ["Crisis", C.rojo, "#fff"],
      revisar: ["Revisar", "#F7E2D2", "#7A3A10"],
      info: ["Informativa", "#E6E1D9", C.azul],
    };
    const order = { crisis: 0, revisar: 1, info: 2 };
    const alerts = S.alerts
      .slice()
      .sort((a, b) => order[a.sev] - order[b.sev] || b.at - a.at)
      .map((a) => {
        const [sevLabel, tagBg, tagFg] = SEV[a.sev];
        const isCrisis = a.sev === "crisis";
        const cd = isCrisis && a.status !== "other" ? A.countdown(a.at) : null;
        const pick = st.outcome[a.id];
        return Object.assign({}, a, {
          sevLabel,
          tagBg,
          tagFg,
          ago: A.agoText(a.at),
          cd: isCrisis ? (a.status === "other" ? "Tomado por un colega" : cd.text) : "",
          cdFg: cd && cd.late ? "#8A1C14" : C.tinta,
          bd: isCrisis && a.status !== "other" ? C.rojo : C.lineas,
          shadow: isCrisis && a.status === "new" ? "0 0 0 4px #FDE7E4" : "none",
          canTake: isCrisis && a.status === "new",
          isOther: a.status === "other",
          isMine: a.status === "mine" || a.status === "retry",
          isInfo: !isCrisis,
          hasFile: !!(a.pid && A.PATIENTS[a.pid]),
          take: () =>
            A.set((s) => {
              const x = s.alerts.find((y) => y.id === a.id);
              x.status = "mine";
              x.takenAt = Date.now();
            }),
          copy: () => {
            try {
              navigator.clipboard.writeText(a.phone);
            } catch (e) {}
            setState({ copied: a.id });
          },
          copyLabel: st.copied === a.id ? "Copiado" : "Copiar",
          retryText:
            a.status === "retry"
              ? "No contestó. La alerta sigue abierta · reintente a las " + a.retryAt
              : "",
          outcomes: OUTCOMES.map((label, i) => ({
            label,
            bd: pick === i ? C.verde : C.lineas,
            dot: pick === i ? C.verde : "#fff",
            pick: () => setState({ outcome: Object.assign({}, st.outcome, { [a.id]: i }) }),
          })),
          closeLabel: pick === 2 ? "Registrar intento" : "Cerrar alerta",
          close: () => {
            if (pick === undefined) return;
            if (pick === 2) {
              const d = new Date(Date.now() + 600000);
              A.set((s) => {
                const x = s.alerts.find((y) => y.id === a.id);
                x.status = "retry";
                x.retryAt = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
              });
              return;
            }
            A.set((s) => {
              const x = s.alerts.find((y) => y.id === a.id);
              s.alerts = s.alerts.filter((y) => y.id !== a.id);
              x.status = "closed";
              x.outcome = OUTCOMES[pick];
              x.closedAt = Date.now();
              s.closedToday.unshift(x);
              if (pick === 3)
                s.falsePositives.push({
                  name: x.name,
                  what: x.what,
                  term: x.term || "",
                  at: Date.now(),
                });
              if (x.expert)
                A.pushNotif(
                  s,
                  x.expert,
                  "Crisis atendida: " + x.name + " · " + OUTCOMES[pick],
                  "/experto",
                );
              if (x.expert)
                s.notices[x.expert].unshift({
                  kind: "crisis",
                  tag: "Crisis atendida",
                  text:
                    "La Dra. Lucía Marín atendió la alerta de " +
                    x.name +
                    ": " +
                    OUTCOMES[pick] +
                    ". Revisita dentro de 48 horas.",
                });
            });
          },
          dismiss: () =>
            A.set((s) => {
              const x = s.alerts.find((y) => y.id === a.id);
              s.alerts = s.alerts.filter((y) => y.id !== a.id);
              x.outcome = "Vista";
              s.closedToday.unshift(x);
            }),
          open: () => openFile(a.pid),
        });
      });
    const closed = S.closedToday.map((c) => ({
      name: c.name,
      outcome: c.outcome,
      canReopen:
        (c.pid === "diana" && S.diana.crisis) ||
        (c.pid === "rosalba" && S.rosalbaWA.crisis && c.sev === "crisis"),
      reopen: () =>
        A.set((s) => {
          if (c.pid === "diana") {
            s.diana.crisis = false;
            s.dianaInbox.push({
              id: "d" + Date.now(),
              text: "Su psicóloga revisó su mensaje y reabrió su conversación con TEO.",
              tab: "chat",
              seen: false,
            });
          }
          if (c.pid === "rosalba") s.rosalbaWA.crisis = false;
        }),
      reopenLabel:
        c.pid === "diana"
          ? "Reabrir la conversación con TEO"
          : "Reabrir el acompañamiento por WhatsApp",
      meta:
        c.sev === "crisis"
          ? "Crisis · respondida en " +
            Math.max(1, Math.round(((c.takenAt || c.closedAt) - c.at) / 60000)) +
            " min"
          : SEV[c.sev][0],
    }));

    const ids = A.CASE_IDS.slice();
    (S.caseload || []).forEach((c) => {
      if (!A.PATIENTS[c.id])
        A.PATIENTS[c.id] = {
          id: c.id,
          name: c.name,
          age: c.age,
          place: c.place,
          profile: c.profile,
          phone: "—",
          phq: [c.phq],
          phqDates: ["Hoy"],
          sleep: null,
          braceletStatus: "Según la ruta",
          adherence: null,
          next: "Primera llamada dentro de 7 días",
          nextShort: "Primera llamada",
          consent: true,
          signal: "Nueva",
          summary: null,
          audios: 0,
          timeline: [
            {
              d: "Hoy",
              t: "Visita de campo · " + c.expert,
              x: "Evaluación inicial. PHQ-9 " + c.phq + ". Perfil " + c.profile + ".",
            },
          ],
        };
      ids.push(c.id);
    });
    if (S.visits.rosalba && !S.visits.rosalba.crisis) ids.push("rosalba");
    if (
      S.visits.hernan ||
      S.alerts.find((a) => a.id === "a-hernan") ||
      S.closedToday.find((a) => a.id === "a-hernan")
    )
      ids.unshift("hernan");
    const sigColor = (t) =>
      /Crisis/.test(t)
        ? "#8A1C14"
        : /Sueño|subiendo|Faltó/.test(t)
          ? "#9A4D14"
          : /Mejorando/.test(t)
            ? C.verde
            : C.tinta;
    const patients = ids.map((id) => {
      const P = A.PATIENTS[id];
      if (!P) return null;
      const { r } = A.parseCode(P.profile);
      const mx = 27;
      const pts = P.phq.length === 1 ? [P.phq[0], P.phq[0]] : P.phq;
      const spark = pts
        .map((v, i) => (4 + i * (82 / (pts.length - 1))).toFixed(1) + "," + (26 - (v / mx) * 24).toFixed(1))
        .join(" ");
      return {
        name: P.name,
        age: P.age,
        place: P.place,
        profile: P.profile,
        rc: A.RISK[r].c,
        spark,
        last: P.phq[P.phq.length - 1],
        next: P.nextShort,
        adh: P.adherence == null ? "—" : P.adherence + " %",
        signal: P.signal,
        sigFg: sigColor(P.signal),
        open: () => openFile(id),
      };
    }).filter(Boolean);

    const fallbackId = ids.find((id) => A.PATIENTS[id]);
    const P = A.PATIENTS[st.pid] || (fallbackId ? A.PATIENTS[fallbackId] : null) || A.emptyPatient(st.pid || "—", "Sin paciente", 0);
    if (!Array.isArray(P.phq) || !P.phq.length) P.phq = [0];
    const pc = A.parseCode(P.profile || 'P01');
    const consent = P.consentKey && S.consents && S.consents[P.consentKey] ? S.consents[P.consentKey].remision : P.consent;
    const ref = S.referrals.find((x) => x.pid === P.id);
    const cur = P.phq[P.phq.length - 1],
      base = P.phq[0];
    let sleepKpi = {
      label: "Sueño · últimas 5 noches",
      val: P.braceletStatus || "—",
      sub: "Sin datos de manilla",
      subFg: C.texto2,
    };
    if (P.sleep) {
      const l5 = P.sleep.slice(-5),
        prev = P.sleep.slice(0, -5);
      const a5 = l5.reduce((a, b) => a + b, 0) / 5,
        ap = prev.reduce((a, b) => a + b, 0) / prev.length;
      const fmt = (n) => n.toFixed(1).replace(".", ",");
      sleepKpi = {
        label: "Sueño · últimas 5 noches",
        val: fmt(a5) + " h",
        sub: (a5 < ap - 1 ? "Bajó desde " : "Promedio previo ") + fmt(ap) + " h",
        subFg: a5 < ap - 1 ? "#9A4D14" : C.texto2,
      };
    }
    const cx = (i) => 70 + i * (500 / Math.max(1, P.phq.length - 1));
    const cy = (v) => 10 + ((27 - v) / 27) * 195;
    const bands = A.RISK.map((r) => ({
      k: r.k,
      bg: r.bg,
      y: cy(r.max + (r.max === 27 ? 0 : 1)),
      h: cy(r.min) - cy(r.max + (r.max === 27 ? 0 : 1)),
      ty: (cy(r.min) + cy(r.max + (r.max === 27 ? 0 : 1))) / 2 + 4,
    }));
    const phqPts = P.phq.map((v, i) => ({
      x: P.phq.length === 1 ? 315 : cx(i),
      y: cy(v),
      ly: cy(v) - 12,
      v,
      d: P.phqDates[i],
    }));
    const sy = (h) => 200 - (h / 8) * 185;
    const bars = (P.sleep || []).map((h, i) => ({
      x: 36 + i * 39.5,
      cx: 51 + i * 39.5,
      y: sy(h),
      h: 200 - sy(h),
      c: h < 4.5 ? "#D9692B" : "#A9D4FF",
      v: h.toFixed(1).replace(".", ","),
      ty: sy(h) - 6,
      lbl: h < 4.5 ? "bajo" : i === 13 ? "anoche" : "",
      lc: h < 4.5 ? "#9A4D14" : C.texto2,
    }));
    const notes = (S.notes[P.id] || []).map((n) => ({
      d: "Hoy",
      t: "Nota de sesión · Dra. Lucía Marín",
      x: n,
    }));
    const adj = (S.pathAdjust[P.id] || []).map((n) => ({ d: "Hoy", t: "Cambio de ruta", x: n }));
    const refT = ref
      ? [{ d: ref.date, t: "Remisión · " + (INSTS.find((i) => i.id === ref.inst) || {}).label, x: ref.reason + " · " + ref.status }].concat(
          ref.contra ? [{ d: "Hoy", t: "Contrarreferencia · Hospital local de Salento", x: ref.contra }] : [],
        )
      : [];
    const aiT = (S.aiLog || [])
      .filter((l) => l.pid === P.id)
      .map((l) => ({ d: "Registro IA", t: l.channel, x: l.text }));
    const timeline = P.timeline.concat(refT, adj, notes, aiT).reverse();
    const f = {
      rec: recFile(A, S, P),
      name: P.name,
      age: P.age,
      place: P.place,
      profile: P.profile,
      risk: A.RISK[pc.r].k,
      rc: A.RISK[pc.r].c,
      rbg: A.RISK[pc.r].bg,
      dig: A.DIG[pc.d].k,
      dc: A.DIG[pc.d].c,
      dbg: A.DIG[pc.d].bg,
      consText: consent ? "Autorizó remisión" : "No autorizó compartir su caso",
      consBg: consent ? "#FFF4CC" : "#F0ECE6",
      consFg: consent ? C.verde : C.tinta,
      kpis: [
        {
          label: "PHQ-9 actual",
          val: cur + " de 27",
          sub:
            P.phq.length > 1
              ? cur < base
                ? "Bajó " + (base - cur) + " desde " + base
                : "Subió " + (cur - base) + " desde " + base
              : "Medición inicial",
          subFg: cur < base ? C.verde : cur > base ? "#9A4D14" : C.texto2,
        },
        sleepKpi,
        {
          label: "Adherencia",
          val: P.adherence == null ? "—" : P.adherence + " %",
          sub: "Sesiones y check-ins",
          subFg: C.texto2,
        },
        {
          label: "Próxima sesión",
          val: P.next.split(" · ")[0],
          sub: P.next.split(" · ").slice(1).join(" · ") + " · " + P.phone,
          subFg: C.tinta,
        },
      ],
      bands,
      phqPts,
      phqLine: phqPts.map((p) => p.x + "," + p.y).join(" "),
      hasSleep: !!P.sleep,
      noSleep: !P.sleep,
      braceletStatus: "Manilla: " + (P.braceletStatus || "no aplica"),
      bars,
      refY: sy(4.5),
      refTy: sy(4.5) - 6,
      hasSummary: !!P.summary,
      summary: P.summary,
      audioLink: P.audios
        ? "Escuchar los " + P.audios + " audios originales"
        : "Ver conversaciones originales",
      timeline,
      canRefer: consent && !ref,
      referBlocked: !consent,
      referred: !!ref,
      referredText: ref
        ? "Remitida a " +
          (INSTS.find((i) => i.id === ref.inst) || {}).label +
          " el " +
          ref.date +
          ". Estado: " +
          ref.status +
          "." +
          (ref.contra ? " Contrarreferencia recibida." : "")
        : "",
    };
    const ruleLines = (pd) => {
      const L = [];
      pd.draft.risk.forEach((r, i) => {
        const o = S.rules.risk[i];
        if (r.k !== o.k || r.min !== o.min || r.max !== o.max || r.c !== o.c)
          L.push(
            "Nivel " +
              o.k +
              ": " +
              o.k +
              " " +
              o.min +
              "–" +
              o.max +
              " → " +
              r.k +
              " " +
              r.min +
              "–" +
              r.max +
              (r.c !== o.c ? " · color nuevo" : ""),
          );
      });
      pd.draft.dig.cuts.forEach((c, i) => {
        const o = S.rules.dig.cuts[i];
        if (c.min !== o.min || c.max !== o.max)
          L.push("Digital " + o.k + ": " + o.min + "–" + o.max + " → " + c.min + "–" + c.max);
      });
      pd.draft.dig.q.forEach((q, qi) =>
        q.o.forEach((x, oi) => {
          const o = S.rules.dig.q[qi].o[oi];
          if (x.o !== o.o || x.p !== o.p)
            L.push(
              "Pregunta «" +
                q.q +
                "»: «" +
                o.o +
                "» (" +
                o.p +
                " pts) → «" +
                x.o +
                "» (" +
                x.p +
                " pts)",
            );
        }),
      );
      return L.length ? L : ["Sin diferencias con las reglas vigentes."];
    };
    const approvals = [];
    if (S.rules.pending) {
      const pd = S.rules.pending;
      approvals.push({
        title: "Reglas de clasificación",
        meta: "Enviado por " + pd.by + " · " + A.agoText(pd.at),
        lines: ruleLines(pd).concat(["La regla de crisis (pregunta 9 mayor que 0) no cambia."]),
        approve: () => {
          A.set((s) => {
            const p = s.rules.pending;
            s.rules.risk = p.draft.risk;
            s.rules.dig = p.draft.dig;
            s.rules.pending = null;
            s.rules.versions.unshift({
              v: s.rules.versions[0].v + 1,
              by: "Dra. Lucía Marín (líder clínica)",
              at: Date.now(),
              what:
                "Aprobó el cambio de reglas enviado por " +
                p.by +
                ": " +
                ruleLines(p).join(" · "),
            });
            A.pushNotif(
              s,
              "admin",
              "La líder clínica aprobó el cambio en las reglas de clasificación",
              "/rutas?tab=2",
            );
            A.logActivity(s, "lucia", "Aprobó un cambio en las reglas de clasificación");
          });
          setState({ msg: "" });
        },
        reject: () =>
          A.set((s) => {
            s.rules.pending = null;
            A.pushNotif(
              s,
              "admin",
              "La líder clínica devolvió sin aprobar el cambio en las reglas",
              "/rutas?tab=2",
            );
            A.logActivity(s, "lucia", "Devolvió un cambio en las reglas de clasificación");
          }),
      });
    }
    (S.pathRequests || []).forEach((rq) => {
      const { r, d } = A.parseCode(rq.code);
      const curPath = A.pathList(r, d),
        nx = A.pathList(r, d, rq.draft);
      approvals.push({
        title:
          "Ruta " +
          rq.code +
          " · " +
          A.RISK[r].k +
          " × digital " +
          A.DIG[d].k.toLowerCase(),
        meta: rq.scope === "all" ? "Todos los territorios" : "Solo " + rq.scope,
        lines: nx
          .map(
            (x) =>
              x.name +
              " · " +
              x.freq +
              (curPath.find((c) => c.id === x.id && c.freq === x.freq) ? "" : " (cambia)"),
          )
          .concat(
            curPath
              .filter((c) => !nx.find((x) => x.id === c.id))
              .map((c) => "Se quita: " + c.name),
          )
          .concat(["Duración: " + rq.draft.months + " meses"]),
        approve: () =>
          A.set((s) => {
            s.pathOverrides = s.pathOverrides || {};
            s.pathOverrides[rq.code] = rq.draft;
            s.pathRequests = s.pathRequests.filter(
              (x) => x !== rq && !(x.code === rq.code && x.scope === rq.scope),
            );
            s.rules.versions.unshift({
              v: s.rules.versions[0].v + 1,
              by: "Dra. Lucía Marín (líder clínica)",
              at: Date.now(),
              what:
                "Aprobó la ruta " +
                rq.code +
                " (" +
                (rq.scope === "all" ? "todos los territorios" : rq.scope) +
                ").",
            });
            A.pushNotif(
              s,
              "admin",
              "Ruta " + rq.code + " aprobada por la líder clínica",
              "/rutas",
            );
          }),
        reject: () =>
          A.set((s) => {
            s.pathRequests = s.pathRequests.filter(
              (x) => !(x.code === rq.code && x.scope === rq.scope),
            );
            A.pushNotif(
              s,
              "admin",
              "Ruta " + rq.code + " devuelta sin aprobar",
              "/rutas",
            );
          }),
      });
    });
    const apprN = approvals.length;
    return {
      dev: A.devMode(),
      zoom: st.zoom || 1,
      isHome: st.view === "home",
      view: st.view,
      showFab: st.view !== "home" && !st.agentOpen,
      agentOpen: st.agentOpen,
      openAgent: () => setState({ agentOpen: true }),
      closeAgent: () => setState({ agentOpen: false, pendingAsk: "" }),
      askFromHome: (q) => setState({ agentOpen: true, pendingAsk: q }),
      pendingAsk: st.pendingAsk || "",
      ovW: window.innerWidth / (st.zoom || 1) + "px",
      ovH: window.innerHeight / (st.zoom || 1) + "px",
      drawerW: window.innerWidth < 720 ? window.innerWidth / (st.zoom || 1) + "px" : "480px",
      ctxLabel:
        "Sobre: " +
        ({ alerts: "Alertas", patients: "Mis pacientes", file: "Ficha de " + P.name }[st.view] ||
          "Inicio"),
      goAlerts: () => setState({ view: "alerts" }),
      openCount: S.alerts.length,
      upcoming: ids
        .map((id) => A.PATIENTS[id])
        .filter((p) => p && p.next)
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          next: p.next,
          open: () => openFile(p.id),
        })),
      agentAction: (action, p) => {
        if (action === "detail") {
          if (p.target === "file") openFile(p.pid, true);
          else setState({ view: p.target });
          setState({ agentOpen: false });
        }
        if (action === "file") {
          openFile(p, true);
          setState({ agentOpen: false });
        }
        if (action === "prep-gloria")
          router.push(
            "/informes?t=session-gloria&back=" + encodeURIComponent("/clinico"),
          );
        if (action === "report")
          router.push(
            "/informes?id=" + p + "&back=" + encodeURIComponent("/clinico"),
          );
        if (action === "use-ref-gloria")
          setState({
            refReason: p.draft,
            pid: "gloria",
            view: "file",
            msg: "Borrador confirmado en el formulario de remisión. Revise y envíe.",
          });
      },
      screenCode: {
        home: "ClinicianHome",
        alerts: "ClinicianAlerts",
        patients: "ClinicianCaseload",
        file: "CaseFile",
      }[st.view],
      nav: [["home", "Inicio"], ["alerts", "Alertas"], ["patients", "Mis pacientes"]]
        .concat(apprN ? [["approvals", "Aprobaciones · " + apprN]] : [])
        .map(([k, label]) => {
          const active =
            (st.view === "file" ? (st.fileFrom || {}).view : st.view) === k;
          return {
            key: k,
            label,
            active,
            bd: active ? C.amarillo : "transparent",
            fg: active ? C.verde : C.tinta,
            go: () => setState({ view: k }),
          };
        }),
      critText: pending
        ? pending + (pending === 1 ? " crisis sin tomar" : " crisis sin tomar")
        : "Sin crisis pendientes",
      critBd: pending ? C.rojo : C.lineas,
      critBg: pending ? C.rojoBg : "#fff",
      critFg: pending ? "#8A1C14" : C.texto2,
      isAlerts: st.view === "alerts",
      isPatients: st.view === "patients",
      isFile: st.view === "file",
      isApprovals: st.view === "approvals",
      goHome: () => setState({ view: "home" }),
      fileBackLabel:
        "← Volver a " +
        ({ home: "Inicio", alerts: "Alertas", patients: "Mis pacientes", approvals: "Aprobaciones" }[
          (st.fileFrom || {}).view
        ] || "Mis pacientes") +
        ((st.fileFrom || {}).agent ? " y al asistente" : ""),
      fileBack: () => {
        const fr = st.fileFrom || { view: "patients" };
        setState({ view: fr.view || "patients", agentOpen: !!fr.agent && fr.view !== "home" });
        window.scrollTo(0, 0);
      },
      approvals,
      noApprovals: !approvals.length,
      fRoute: (() => {
        const pc2 = A.parseCode(P.profile);
        return A.pathList(pc2.r, pc2.d, null, P.ctx).map((x) => ({
          name: x.name,
          freq: x.freq + (x.channel ? " · " + x.channel : ""),
        }));
      })(),
      alerts,
      noAlerts: alerts.length === 0,
      closed,
      noClosed: closed.length === 0,
      patients,
      f,
      noteText: st.note,
      setNote: (e) => setState({ note: e.target.value }),
      addNote: () => {
        if (!st.note.trim()) return;
        A.set((s) => {
          (s.notes[P.id] = s.notes[P.id] || []).push(st.note.trim());
        });
        setState({ note: "", msg: "Nota agregada a la línea de tiempo." });
      },
      adjust: ["Subir a sesiones semanales", "Bajar intensidad", "Agregar revisita del experto"].map(
        (label) => ({
          label,
          go: () => {
            A.set((s) => {
              (s.pathAdjust[P.id] = s.pathAdjust[P.id] || []).push(
                label + ". Notificado a la paciente y al experto.",
              );
              const ex = /Armenia/.test(P.place) ? "mj" : "andres";
              if (label === "Agregar revisita del experto") {
                (s.revisits[ex] = s.revisits[ex] || []).push({
                  name: P.name,
                  place: P.place.split(",")[0],
                  when: "Esta semana",
                  why: "Pedida por la Dra. Lucía Marín",
                });
                A.pushNotif(s, ex, "Nueva revisita asignada: " + P.name, "/experto");
              }
              if (P.id === "diana")
                s.dianaInbox.push({
                  id: "d" + Date.now(),
                  text: "Su psicóloga hizo un cambio en su ruta. Tóquelo para verlo.",
                  tab: "route",
                  seen: false,
                });
            });
            setState({
              msg: "Ruta ajustada: " + label.toLowerCase() + ". Se notificó a la paciente y al experto.",
            });
          },
        }),
      ),
      insts: INSTS,
      refInst: st.refInst,
      setRefInst: (e) => setState({ refInst: e.target.value }),
      refReason: st.refReason,
      setRefReason: (e) => setState({ refReason: e.target.value, refErr: false }),
      refBd: st.refErr ? C.revisar : C.lineas,
      refer: () => {
        if (!st.refReason.trim())
          return setState({ refErr: true, msg: "Escriba el motivo de la remisión." });
        A.set((s) => {
          s.referrals.unshift({
            id: "r-" + P.id,
            pid: P.id,
            name: P.name,
            age: P.age,
            date: "29 sep",
            by: "Dra. Lucía Marín",
            reason: st.refReason.trim(),
            phq: P.phq[0] + " → " + cur,
            status: "Pendiente de cita",
            inst: st.refInst,
          });
          s.alerts = s.alerts.filter((a) => a.pid !== P.id || a.sev === "crisis");
          if (st.refInst === "hsal")
            A.pushNotif(s, "inst", "Nueva remisión: " + P.name, "/observador?view=casos");
          if (P.id === "diana")
            s.dianaInbox.push({
              id: "d" + Date.now(),
              text: "Su psicóloga la remitió a otra institución. Vea los detalles en Mi ruta.",
              tab: "route",
              seen: false,
            });
        });
        setState({ msg: "Remisión enviada. La institución la ve en «Casos remitidos»." });
      },
      msg: st.msg,
      clearMsg: () => setState({ msg: "" }),
    };
  }

  const v = useMemo(() => {
    if (!session) return null;
    if (typeof window === "undefined") return null;
    const base = rv();
    const asPart = asVals(store, store.get(), st);
    return { ...base, ...asPart };
  }, [session, st, store, router]);

  return { v, session };
}
