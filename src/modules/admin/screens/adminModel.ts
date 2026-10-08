/* eslint-disable @typescript-eslint/no-explicit-any */
// Auto-ported from Admin.dc.html — keep in sync with prototype logic.
import { CHECKS, NOTES, type AdminUiState } from "./adminConstants";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { resolvePlaceLatLng, terrCenter } from "@/lib/geo/quindioPlaces";

export type AdminModelApi = {
  setState: (patch: Partial<AdminUiState> | ((s: AdminUiState) => AdminUiState)) => void;
  go: (view: string, extra?: Partial<AdminUiState>) => void;
  draft: (code: string) => { s: Record<string, string>; months: number };
  setDraft: (code: string, fn: (d: { s: Record<string, string>; months: number }) => void) => void;
  router: AppRouterInstance;
};

export function buildAdminModel(A: any, st: AdminUiState, api: AdminModelApi) {
  function pruneDraftS(s: Record<string, string>) {
    const allowed = new Set((A.SERVICES || []).map((x: { id: string }) => x.id));
    const out: Record<string, string> = {};
    Object.keys(s || {}).forEach((k) => {
      if (allowed.has(k)) out[k] = s[k];
    });
    return out;
  }
  function draft(code: string) {
    if (st.drafts[code]) {
      const d = st.drafts[code];
      return { s: pruneDraftS(d.s || {}), months: d.months };
    }
    const { r, d } = A.parseCode(code);
    const S0 = A.get();
    const p = (S0.pathOverrides && S0.pathOverrides[code]) || A.defaultPath(r, d);
    return { s: pruneDraftS(Object.assign({}, p.s)), months: p.months };
  }
  function setDraft(code: string, fn: (d: { s: Record<string, string>; months: number }) => void) {
    const d = JSON.parse(JSON.stringify(draft(code)));
    fn(d);
    d.s = pruneDraftS(d.s || {});
    api.setState({ drafts: Object.assign({}, st.drafts, { [code]: d }) });
  }
  api.draft = draft;
  api.setDraft = setDraft;

  function perfVals(A: any, S: any, C: any, st: AdminUiState) {
    const per = st.pfPer || '4w', terr = st.pfTerr || '';
    const P = A.teamPerf(S, per, terr), sk = st.pfSort || 'name', dir = st.pfDir || 1;
    const rows = P.rows.slice().sort((a, b) => { const x = sk === 'mix' ? a.rural - a.ruralG : a[sk], y = sk === 'mix' ? b.rural - b.ruralG : b[sk]; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir; });
    const cols = [['name', 'Experto · territorio'], ['vpd', 'Visitas por día'], ['dur', 'Duración promedio (min)'], ['gps', 'GPS correcto'], ['ver', 'Verificación'], ['rej', 'Rechazadas'], ['gap', 'Tiempo entre visitas (min)'], ['mix', 'Mezcla · rural / 60+'], ['status', 'Estado']];
    const SC = { 'Al día': C.alDia, 'Bajo meta': C.bajoMeta, 'Revisar': C.revisar };
    const mapT = terr || 'Salento', T = A.terrInfo(S, mapT) || { places: [] };
    const places = T.places.slice(0, 10), n = places.length;
    const exps = A.experts(S).filter(e => e.terr === mapT && e.active !== false && !e.isNew);
    const PAL = ['#161413', '#3D6B9A', '#A3B13C', '#C45C26'];
    const h = (str: string) => { let x = 3; for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0; return x; };
    const mapMarkers: { lat: number; lng: number; color: string; tip: string; alert?: boolean; kind: 'place' | 'visit' }[] = [];
    if (!places.length) {
      const [lat, lng] = terrCenter(mapT);
      mapMarkers.push({ lat, lng, color: '#FDCD22', kind: 'place', tip: mapT + ' · centro del municipio' });
    }
    places.forEach(([name, rural]: [string, boolean]) => {
      const [lat, lng] = resolvePlaceLatLng(name, mapT);
      mapMarkers.push({
        lat, lng, color: rural ? '#FDCD22' : '#C4BDB3', kind: 'place',
        tip: name + (rural ? ' · Vereda rural' : ' · Barrio urbano'),
      });
    });
    const visitMarkers: typeof mapMarkers = [];
    exps.forEach((e: any, ei: number) => {
      const wl = e.id === 'andres' || e.id === 'mj'
        ? (S.worklists[e.id] || []).filter((w: any) => /validada|crisis|curso|revision/.test(w.status)).map((w: any) => ({ place: w.place, who: w.time }))
        : Array.from({ length: e.today || 0 }, (_, i) => ({ place: n ? places[(h(e.name) + i * 3) % n][0] : mapT, who: 'visita ' + (i + 1) }));
      const gpsFlag = (S.flags || []).find((f: any) => f.expertName === e.name && /GPS/.test((f.reasons || []).join(' ')) && f.status === 'pending');
      wl.forEach((w: any, i: number) => {
        const place = w.place || mapT;
        const [lat, lng] = resolvePlaceLatLng(place, mapT, h(e.name + i) % 17 + 1);
        const bad = !!(gpsFlag && i === wl.length - 1);
        visitMarkers.push({
          lat, lng,
          color: bad ? '#B42318' : PAL[ei % PAL.length],
          alert: bad,
          kind: 'visit',
          tip: e.name + ' · ' + place + ' · ' + w.who + (bad ? ' · GPS de cierre lejos del inicio' : ''),
        });
      });
    });
    mapMarkers.push(...visitMarkers);
    const pct = (v: number) => v + ' %', A0 = P.program;
    return {
      teamTabs: [['1', 'Equipo'], ['2', 'Desempeño']].map(([k, label]) => ({ label, bd: (st.teamTab || '1') === k ? C.amarillo : 'transparent', fg: (st.teamTab || '1') === k ? C.verde : C.tinta, go: () => api.setState({ teamTab: k }) })),
      teamTab1: (st.teamTab || '1') === '1', teamTab2: st.teamTab === '2',
      pfTerr: terr, setPfTerr: (e: any) => api.setState({ pfTerr: e.target.value }),
      pfPeriods: [['week', 'Esta semana'], ['4w', '4 semanas'], ['month', 'Mes']].map(([k, label]) => ({ label, bg: per === k ? C.verde : '#fff', fg: per === k ? '#fff' : C.verde, go: () => api.setState({ pfPer: k }) })),
      pfCols: cols.map(([k, label]) => ({ label, arrow: sk === k ? (dir > 0 ? ' ↑' : ' ↓') : '', fg: sk === k ? C.verde : C.texto2, go: () => api.setState({ pfSort: k, pfDir: sk === k ? -dir : 1 }) })),
      pfRows: rows.map((r: any) => ({ open: () => { api.router.push('/admin/experto?e=' + encodeURIComponent(r.name)); }, name: r.name, terr: r.terr, vpd: String(r.vpd).replace('.', ','), dur: r.dur + ' min', durFg: r.dur < 20 ? '#7A3A10' : C.tinta, durBg: r.dur < 20 ? '#F7E2D2' : 'transparent', durFw: r.dur < 20 ? 600 : 400, gps: pct(r.gps), gpsFg: r.gps < 90 ? '#7A3A10' : C.tinta, gpsFw: r.gps < 90 ? 600 : 400, ver: pct(r.ver), verFg: r.ver < 88 ? '#7A3A10' : C.tinta, verFw: r.ver < 88 ? 600 : 400, rej: r.rej, gap: r.gap + ' min', gapFg: r.gap < 10 ? '#7A3A10' : C.tinta, gapFw: r.gap < 10 ? 600 : 400, mix: r.rural + ' % / ' + r.ruralG + ' · ' + r.sixty + ' % / ' + r.sixtyG, status: r.status, sc: SC[r.status] })),
      pfAvg: { vpd: String(A0.vpd).replace('.', ','), dur: A0.dur + ' min', gps: pct(A0.gps), ver: pct(A0.ver), rej: String(A0.rej).replace('.', ','), gap: A0.gap + ' min', mix: A0.rural + ' % / ' + A0.ruralG + ' · ' + A0.sixty + ' % / ' + A0.sixtyG },
      mapTerr: mapT,
      mapCenter: terrCenter(mapT),
      mapMarkers,
      mapEmpty: !visitMarkers.length,
      mapLegend: exps.map((e: any, i: number) => ({ name: e.name, c: PAL[i % PAL.length] })),
    };
  }
  function rulesVals(A, S, C, st) {
    A.ensure(S);
    const base = S.rules.pending ? S.rules.pending.draft : { risk: S.rules.risk, dig: S.rules.dig };
    const rd = st.rd || JSON.parse(JSON.stringify(base));
    if (!rd.dig) rd.dig = {};
    if (!Array.isArray(rd.dig.q) || !rd.dig.q.length) {
      rd.dig.q = A.DIGQ.map((x: { q: string; o: string[] }) => ({
        q: x.q,
        o: x.o.map((o: string, i: number) => ({ o, p: i })),
      }));
    }
    if (!Array.isArray(rd.dig.cuts) || !rd.dig.cuts.length) {
      rd.dig.cuts = A.DIG.map((d: { k: string; min: number; max: number }) => ({
        k: d.k,
        min: d.min,
        max: d.max,
      }));
    }
    const upd = fn => { const d = JSON.parse(JSON.stringify(rd)); fn(d); api.setState({ rd: d, rulesMsg: '' }); };
    const num = v => v === '' || isNaN(+v) ? NaN : +v;
    let err = '';
    const rs = rd.risk; if (num(rs[0].min) !== 0 || num(rs[rs.length - 1].max) !== 27) err = 'Los niveles deben cubrir de 0 a 27.';
    rs.forEach((r, i) => { if (!(num(r.min) <= num(r.max))) err = 'Revise el rango de ' + (r.k || 'un nivel') + '.'; if (i && num(r.min) !== num(rs[i - 1].max) + 1) err = 'Los rangos deben ser seguidos, sin huecos ni cruces (' + rs[i - 1].k + ' → ' + r.k + ').'; if (!String(r.k).trim()) err = 'Cada nivel necesita un nombre.'; });
    const digMax = rd.dig.q.reduce((a, q) => a + Math.max.apply(null, q.o.map(o => num(o.p) || 0)), 0);
    const cuts = rd.dig.cuts; if (num(cuts[0].min) !== 0 || num(cuts[cuts.length - 1].max) !== digMax) err = err || 'Los cortes digitales deben cubrir de 0 a ' + digMax + '.';
    cuts.forEach((c, i) => { if (!(num(c.min) <= num(c.max)) || (i && num(c.min) !== num(cuts[i - 1].max) + 1)) err = err || 'Revise los cortes de capacidad digital.'; });
    rd.dig.q.forEach(q => q.o.forEach(o => { if (isNaN(num(o.p)) || num(o.p) < 0) err = err || 'Los puntos deben ser números de 0 en adelante.'; }));
    const changed = JSON.stringify(rd) !== JSON.stringify({ risk: S.rules.risk, dig: S.rules.dig });
    const au = st.au || S.rules.auto, auChanged = JSON.stringify(au) !== JSON.stringify(S.rules.auto);
    const sp = num(st.simPhq ?? '17'), sd = num(st.simDig ?? '6');
    const ri = rs.findIndex(r => sp >= num(r.min) && sp <= num(r.max)), di = cuts.findIndex(c => sd >= num(c.min) && sd <= num(c.max));
    const simOk = ri > -1 && di > -1;
    let sim = { services: [] };
    if (simOk) { const ri2 = Math.min(4, ri), di2 = Math.min(2, di), code = A.code(ri2, di2); const dr = (st.drafts || {})[code]; sim = { code, label: rs[ri].k + ' × digital ' + String(cuts[di].k).toLowerCase(), bg: rs[ri].c + '33', crisis: !!st.simQ9, months: A.defaultPath(ri2, di2).months, services: A.pathList(ri2, di2, dr, { dano: +(st.simDano || 0), perdida: st.simLoss ? 1 : 0 }).map(s => ({ name: s.name, freq: s.freq + (s.channel ? ' · ' + s.channel : '') })) }; }
    const pend = S.rules.pending;
    return {
      pathTabs: [['1', 'Servicios por perfil'], ['2', 'Reglas de clasificación'], ['3', 'Biblioteca']].map(([k, label]) => ({ label, bd: (st.pathTab || '1') === k ? C.amarillo : 'transparent', fg: (st.pathTab || '1') === k ? C.verde : C.tinta, go: () => api.setState({ pathTab: k }) })),
      pathTab1: (st.pathTab || '1') === '1', pathTab2: st.pathTab === '2', pathTab3: st.pathTab === '3', ...libVals(A, S, st),
      rRisk: rs.map((r, i) => ({ k: r.k, c: r.c, min: String(r.min), max: String(r.max), bd: num(r.min) <= num(r.max) ? C.lineas : C.revisar, setK: e => upd(d => { d.risk[i].k = e.target.value; }), setC: e => upd(d => { d.risk[i].c = e.target.value; }), setMin: e => upd(d => { d.risk[i].min = e.target.value.replace(/\D/g, ''); }), setMax: e => upd(d => { d.risk[i].max = e.target.value.replace(/\D/g, ''); }) })),
      rDigQ: rd.dig.q.map((q, qi) => ({ n: qi + 1, q: q.q, opts: q.o.map((o, oi) => ({ o: o.o, p: String(o.p), setO: e => upd(d => { d.dig.q[qi].o[oi].o = e.target.value; }), setP: e => upd(d => { d.dig.q[qi].o[oi].p = e.target.value.replace(/\D/g, ''); }) })) })),
      rCuts: cuts.map((c, i) => ({ k: c.k, min: String(c.min), max: String(c.max), bd: C.lineas, setMin: e => upd(d => { d.dig.cuts[i].min = e.target.value.replace(/\D/g, ''); }), setMax: e => upd(d => { d.dig.cuts[i].max = e.target.value.replace(/\D/g, ''); }) })),
      digMax, rulesErr: !!err && changed, rulesErrText: err, sendRulesBg: err || !changed ? '#8C857C' : C.verde,
      rulesFlash: st.rulesMsg || '', clearRulesFlash: () => api.setState({ rulesMsg: '' }),
      rulesStatus: pend ? 'Hay un cambio esperando aprobación de la Dra. Lucía Marín (líder clínica), enviado ' + A.agoText(pend.at) + '. Mientras tanto siguen las reglas vigentes.' : changed ? 'Tiene cambios sin enviar.' : 'Reglas vigentes · versión ' + ((S.rules.versions && S.rules.versions[0] && S.rules.versions[0].v) || 1) + '.',
      sendRules: () => { if (err) return api.setState({ rulesMsg: err }); if (!changed) return; const clean = JSON.parse(JSON.stringify(rd)); clean.risk.forEach(r => { r.min = +r.min; r.max = +r.max; }); clean.dig.cuts.forEach(c => { c.min = +c.min; c.max = +c.max; }); clean.dig.q.forEach(q => q.o.forEach(o => { o.p = +o.p; })); A.set(s => { const who = (A.session() && A.session().name) || 'Administrador'; s.rules.pending = { draft: clean, at: Date.now(), by: who }; A.pushNotif(s, 'clin', 'Cambio en las reglas de clasificación esperando su aprobación', '/clinico?view=approvals'); A.logActivity(s, (A.session()?.id || "admin"), 'Envió a aprobación un cambio en las reglas de clasificación'); }); api.setState({ rd: null, rulesMsg: 'Enviado a la líder clínica. Se aplicará cuando lo apruebe.' }); },
      resetRules: () => api.setState({ rd: null, rulesMsg: '' }),
      autoV: au, autoSet: { expert: e => api.setState({ au: Object.assign({}, au, { expert: e.target.value }), autoMsg: '' }), clin: e => api.setState({ au: Object.assign({}, au, { clin: e.target.value }), autoMsg: '' }), review: e => api.setState({ au: Object.assign({}, au, { review: e.target.value }), autoMsg: '' }) },
      autoBg: auChanged ? C.verde : '#8C857C', autoMsg: st.autoMsg || '', clearAutoMsg: () => api.setState({ autoMsg: '' }),
      saveAuto: () => { if (!auChanged) return; const L = { territorio: 'por territorio', vereda: 'por vereda o barrio', carga: 'por carga' }; A.set(s => { s.rules.auto = au; s.rules.versions = s.rules.versions || []; const prev = (s.rules.versions[0] && s.rules.versions[0].v) || 1; s.rules.versions.unshift({ v: prev + 1, by: (A.session() && A.session().name) || 'Administrador', at: Date.now(), what: 'Asignación automática: experto ' + L[au.expert] + ', clínico ' + L[au.clin] + ', revisión de ruta ' + au.review.toLowerCase() + '.' }); A.logActivity(s, (A.session()?.id || "admin"), 'Cambió la asignación automática'); }); api.setState({ au: null, autoMsg: 'Guardado. Aplica a las personas nuevas desde hoy.' }); },
      simPhq: st.simPhq ?? '17', simDig: st.simDig ?? '6', setSimPhq: e => api.setState({ simPhq: e.target.value.replace(/\D/g, '') }), setSimDig: e => api.setState({ simDig: e.target.value.replace(/\D/g, '') }),
      simDano: st.simDano || '0', setSimDano: e => api.setState({ simDano: e.target.value }), toggleSimLoss: () => api.setState({ simLoss: !st.simLoss }), simLossBd: st.simLoss ? C.verde : C.texto2, simLossBg: st.simLoss ? C.verde : '#fff', simLossMark: st.simLoss ? '✓' : '',
      toggleSimQ9: () => api.setState({ simQ9: !st.simQ9 }), simQ9Bd: st.simQ9 ? C.rojo : C.texto2, simQ9Bg: st.simQ9 ? C.rojo : '#fff', simQ9Mark: st.simQ9 ? '✓' : '',
      simOk, simBad: !simOk, sim,
      versions: S.rules.versions.map(v => ({ v: v.v, by: v.by, what: v.what, when: A.fmtDay(v.at, { year: true }) }))
    };
  }
  function moreVals(A, S, C, st) {
    const fmt = n => n.toLocaleString('es-CO');
    const all = A.people(S);
    const classified = (p) => !!(p.profile && /^P\d+$/i.test(String(p.profile)));
    const heatGrid = A.RISK.map(() => [0, 0, 0]);
    all.forEach(p => {
      if (!classified(p)) return;
      const c = A.parseCode(p.profile);
      if (heatGrid[c.r]) heatGrid[c.r][c.d] = (heatGrid[c.r][c.d] || 0) + 1;
    });
    const heatMax = Math.max(1, ...heatGrid.flat());
    const heat = A.RISK.map((r, ri) => ({ k: r.k, c: r.c, cells: [0, 1, 2].map(di => { const v = heatGrid[ri][di]; const a = v ? (0.1 + v / heatMax * 0.85) : 0.05; return { v, code: A.code(ri, di), bg: 'rgba(30,94,72,' + a.toFixed(2) + ')', fg: a > 0.45 ? '#fff' : C.tinta }; }) }));
    const evaluadas = all.length;
    const conRuta = all.filter(p => classified(p)).length;
    const primer = all.filter(p => (p.week || 0) > 0).length;
    const activas = all.filter(p => p.status === 'Activa').length;
    const completadas = all.filter(p => /terminar|complet/i.test(p.status || '')).length;
    const sinContacto = all.filter(p => /Sin contacto/i.test(p.status || '')).length;
    const crisisMes = (S.alerts || []).filter(a => a.sev === 'crisis').length;
    const F = [['Evaluadas', evaluadas], ['Con ruta asignada', conRuta], ['Primer contacto de la ruta', primer], ['Activas últimos 14 días', activas], ['Ruta completada', completadas]];
    const denom = Math.max(1, evaluadas);
    const brRows = (S.territories || []).map(t => {
      const info = A.terrInfo(S, t.name) || t;
      const a = info.brA || t.br || 0, d = info.brD || 0, s = Math.min(d, a), av = (info.brAv != null ? info.brAv : t.br || 0) + (((S.terrOv || {})[t.name] || {}).extraBr || 0);
      return {
        open: () => api.setState({ assetTerr: t.name, assetKind: 'manilla' }),
        active: st.assetTerr === t.name && st.assetKind === 'manilla',
        name: t.name, a, d, s, n: Math.max(0, d - s), av, low: av > 0 && av < 50, canAssign: a === 0,
        assign: async e2 => {
          e2 && e2.stopPropagation && e2.stopPropagation();
          try {
            const res = await fetch('/api/assets/bracelets', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terr: t.name, count: 100 }) });
            const data = await res.json();
            if (!res.ok || !data.ok) return api.setState({ msg: data.error || 'No se pudieron asignar manillas.', msgActions: [] });
            A.set(s0 => {
              const x = s0.territories.find(y => y.name === t.name);
              if (x) { x.br = 100; x.brA = 100; x.brAv = 100; }
            });
            api.setState({ msg: '100 manillas asignadas a ' + t.name + ' (guardado en MongoDB).', msgActions: [] });
          } catch (err) {
            api.setState({ msg: 'No se pudo conectar con la base de datos.', msgActions: [] });
          }
        },
      };
    });
    const manillasAsig = brRows.reduce((a, r) => a + r.a, 0);
    const manillasEnt = brRows.reduce((a, r) => a + r.d, 0);
    const manillasDisp = brRows.reduce((a, r) => a + r.av, 0);
    const manillasAssets = (S.assets || []).filter(x => /^MN-/.test(x.code || '') || x.kind === 'manilla');
    const sinDatos = manillasAssets.filter(x => /Sin datos/i.test(x.state || '')).length;
    const elegibles = all.filter(p => classified(p) && A.parseCode(p.profile).r >= 2).length;
    const tabByTerr = {};
    A.experts(S).forEach(e => {
      if (!e.terr) return;
      const row = tabByTerr[e.terr] || { name: e.terr, n: 0, ns: 0, r: 0, last: '—' };
      if (e.tablet) row.n += 1;
      tabByTerr[e.terr] = row;
    });
    (S.assets || []).filter(x => x.kind === 'tablet' || /^TB-/.test(x.code || '')).forEach(a => {
      const row = tabByTerr[a.terr] || { name: a.terr, n: 0, ns: 0, r: 0, last: '—' };
      row.n += 1;
      tabByTerr[a.terr] = row;
    });
    const tabRows = Object.values(tabByTerr).map((row: any) => ({
      open: () => api.setState({ assetTerr: row.name, assetKind: 'tablet' }),
      active: st.assetTerr === row.name && st.assetKind === 'tablet',
      cur: 'pointer', name: row.name, n: row.n, ns: row.ns, r: row.r, last: row.last, fw: row.ns ? 500 : 400, canAssign: false,
    }))
      .concat(A.experts(S).filter(e => !e.tablet).map(e => ({
        name: e.terr + ' · ' + e.name, n: 0, ns: 0, r: 0, last: '—', fw: 400, canAssign: true, assignLabel: 'Asignar tablet',
        assign: async e2 => {
          e2 && e2.stopPropagation && e2.stopPropagation();
          try {
            const res = await fetch('/api/assets/tablet', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expertId: e.id, expertName: e.name }) });
            const data = await res.json();
            if (!res.ok || !data.ok) return api.setState({ msg: data.error || 'No se pudo asignar la tablet.', msgActions: [] });
            A.set(s0 => {
              const x = s0.experts.find(y => y.id === e.id || y.name === e.name);
              if (x) x.tablet = data.expert.tablet;
              s0.assets = s0.assets || [];
              if (data.asset && !s0.assets.find(a => a.code === data.asset.code)) {
                s0.assets.push({ code: data.asset.code, kind: 'tablet', status: 'Asignada', assignedTo: e.id || e.name, terr: e.terr });
              }
            });
            api.setState({
              msg: 'Tablet ' + data.expert.tablet + ' asignada a ' + e.name + ' (guardado en MongoDB).',
              msgActions: [{ label: 'Asignar manillas a Salento', go: () => api.go('assets', { msg: '', assetKind: 'manilla', assetTerr: e.terr }) }],
            });
          } catch (err) {
            api.setState({ msg: 'No se pudo conectar con la base de datos.', msgActions: [] });
          }
        },
        open: () => {}, cur: 'default', active: false,
      })));

    const assetTerr = st.assetTerr || '';
    const assetKind = (st.assetKind === 'tablet' ? 'tablet' : 'manilla') as 'manilla' | 'tablet';
    const assetItems = assetTerr
      ? A.assetList(S, assetTerr, assetKind).map((x: any) => ({
          code: x.code || '—',
          who: x.who || x.person || '—',
          state: x.state || '—',
          sync: x.sync ? A.fmtDay(x.sync) : (x.last || '—'),
          bat: x.bat != null ? x.bat + ' %' : '—',
        }))
      : [];
    const assetBr = assetTerr ? brRows.find((r) => r.name === assetTerr) : null;
    const assetTab = assetTerr ? tabRows.find((r: any) => r.name === assetTerr) : null;
    const assetDetail = assetTerr ? {
      terr: assetTerr,
      kind: assetKind,
      title: assetKind === 'manilla' ? 'Manillas · ' + assetTerr : 'Tablets · ' + assetTerr,
      close: () => api.setState({ assetTerr: '', assetKind: undefined }),
      openTerr: () => api.router.push('/admin/territorio?t=' + encodeURIComponent(assetTerr)),
      summary: assetKind === 'manilla'
        ? [
            { label: 'Asignadas', val: assetBr ? assetBr.a : 0 },
            { label: 'Entregadas', val: assetBr ? assetBr.d : 0 },
            { label: 'Envían datos', val: assetBr ? assetBr.s : 0 },
            { label: 'Disponibles', val: assetBr ? assetBr.av : 0 },
          ]
        : [
            { label: 'Tablets', val: assetTab ? assetTab.n : 0 },
            { label: 'Sin sincronizar +24 h', val: assetTab ? assetTab.ns : 0 },
            { label: 'En reparación', val: assetTab ? assetTab.r : 0 },
            { label: 'Última sync', val: assetTab ? assetTab.last : '—' },
          ],
      items: assetItems,
      empty: assetItems.length === 0
        ? (assetKind === 'manilla'
          ? 'No hay manillas individuales registradas en este territorio. Use «Asignar 100» en el resumen o registre entregas desde campo.'
          : 'No hay tablets registradas en este territorio. Asigne una desde la fila del experto.')
        : '',
    } : null;
    const q = (st.q || '').toLowerCase().trim(), pf = st.pf || {};
    const uniq = a => a.filter((x, i) => x && a.indexOf(x) === i).sort();
    const hasProfile = (p) => !!(p.profile && /^P\d+$/i.test(String(p.profile)));
    const safeParse = (p) => (hasProfile(p) ? A.parseCode(p.profile) : { r: -1, d: -1 });
    const hay = (p) => {
      if (!q) return true;
      const blob = [
        p.code, p.id, p.name, p.terr, p.place, p.age, p.profile, p.status,
        p.expert, p.expertId, p.clin, p.phone, p.email, p.week, p.weeks,
      ].map((x) => String(x ?? '').toLowerCase()).join(' ');
      return blob.includes(q);
    };
    const rOk = (p) => {
      const c = safeParse(p);
      if (pf.terr && p.terr !== pf.terr) return false;
      if (pf.profile === '—') { if (hasProfile(p)) return false; }
      else if (pf.profile && p.profile !== pf.profile) return false;
      if (pf.risk !== undefined && pf.risk !== '' && c.r !== +pf.risk) return false;
      if (pf.dig !== undefined && pf.dig !== '' && c.d !== +pf.dig) return false;
      if (pf.status && p.status !== pf.status) return false;
      if (pf.expert) {
        if (pf.expert === '—') { if (p.expert) return false; }
        else if (p.expert !== pf.expert) return false;
      }
      return hay(p);
    };
    const list = all.filter(rOk);
    const roster = list.slice(0, 300).map((p) => {
      const ri = safeParse(p).r;
      const rc = ri >= 0 && A.RISK[ri] ? A.RISK[ri].c : '#C4BDB3';
      return {
        open: () => { api.router.push('/admin/persona?c=' + encodeURIComponent(p.code || p.id || '')); },
        code: p.code,
        terr: p.terr,
        place: p.place,
        age: p.age,
        profile: hasProfile(p) ? p.profile : 'Sin perfil',
        rc,
        pct: p.weeks ? Math.round((p.week || 0) / p.weeks * 100) + '%' : '0%',
        prog: 'Semana ' + (p.week || 0) + ' de ' + (p.weeks || 0),
        expert: p.expert || 'Sin experto',
        status: p.status,
        fw: /Sin contacto|Sin experto/.test(p.status || '') ? 500 : 400,
      };
    });
    const opt = (all0, lab) => [{ v: '', l: lab }].concat(all0.map(x => typeof x === 'object' ? x : { v: x, l: x }));
    const setPf = k => e => api.setState({ pf: Object.assign({}, pf, { [k]: e.target.value }) });
    const profileOpts = [{ v: '—', l: 'Sin perfil' }].concat(uniq(all.map(p => p.profile).filter(x => x && /^P\d+$/i.test(String(x)))));
    const pFilters = [
      ['terr', 'Territorio', opt(uniq((S.territories || []).map(x => x.name).concat(all.map(p => p.terr))), 'Todos')],
      ['profile', 'Perfil', opt(profileOpts, 'Todos')],
      ['risk', 'Riesgo', opt(A.RISK.map((r, i) => ({ v: String(i), l: r.k })), 'Todos')],
      ['dig', 'Capacidad digital', opt(A.DIG.map((r, i) => ({ v: String(i), l: r.k })), 'Todas')],
      ['status', 'Estado', opt(uniq(all.map(p => p.status)), 'Todos')],
      ['expert', 'Experto', opt([{ v: '—', l: 'Sin experto' }].concat(uniq(all.map(p => p.expert))), 'Todos')],
    ].map(([k, label, opts]) => ({ label, opts, val: pf[k] || '', set: setPf(k), bd: pf[k] ? C.verde : C.lineas }));
    const exportRoster = () => {
      const rows = [['Código', 'Nombre', 'Territorio', 'Vereda o barrio', 'Edad', 'Perfil', 'Semana', 'De', 'Experto', 'Clínico', 'Estado', 'Correo', 'Teléfono']]
        .concat(list.map(p => [p.code, p.name || '', p.terr, p.place, p.age, hasProfile(p) ? p.profile : '', p.week, p.weeks, p.expert || '', p.clin || '', p.status, p.email || '', p.phone || '']));
      const csv = '\ufeff' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'personas-nara.csv';
      a.click();
      A.set(s => A.logActivity(s, (A.session()?.id || "admin"), 'Exportó ' + list.length + ' personas'));
    };
    const digDrop = [0, 1, 2].map(di => {
      const group = all.filter(p => classified(p) && A.parseCode(p.profile).d === di);
      const drop = group.filter(p => /Sin contacto|Sin experto/i.test(p.status || '')).length;
      const pct = group.length ? Math.round(drop / group.length * 100) : 0;
      return [A.DIG[di].k, pct, A.DIG[di].c];
    });
    return {
      q: st.q || '', setQ: e => api.setState({ q: e.target.value }), roster, noRoster: roster.length === 0, rosterCount: list.length + ' de ' + all.length + ' personas' + (list.length > 300 ? ' · se muestran 300' : ''), pFilters, exportRoster, hasPF: Object.values(pf).some(Boolean) || !!q, clearPF: () => api.setState({ pf: {}, q: '' }),
      pk: [
        { label: 'Personas evaluadas', val: fmt(evaluadas), sub: Object.keys(S.visits || {}).length ? Object.keys(S.visits).length + ' visitas registradas' : 'Sin visitas aún' },
        { label: 'Activas en su ruta', val: fmt(activas), sub: 'Con estado activo en el programa' },
        { label: 'Sin contacto +14 días', val: fmt(sinContacto), sub: 'Para reactivar por los expertos' },
        { label: 'Alertas de crisis', val: fmt(crisisMes), sub: crisisMes ? 'Abiertas en el store' : 'Sin alertas' },
      ],
      heat, funnel: F.map(([label, v]) => ({ label, v: fmt(v), w: (Number(v) / denom * 100).toFixed(1) + '%' })),
      dropout: digDrop.map(([label, v, c]) => ({ label, v: v + ' %', w: (Number(v) / Math.max(20, Number(v)) * 100) + '%', c })),
      bk: [
        { label: 'Asignadas', val: fmt(manillasAsig), sub: 'Manillas en territorios' },
        { label: 'Entregadas', val: fmt(manillasEnt), sub: 'Registradas como entregadas' },
        { label: 'Sin datos +7 días', val: fmt(sinDatos), sub: 'Contactar a la persona' },
        { label: 'Elegibles sin manilla', val: fmt(Math.max(0, elegibles - manillasEnt)), sub: 'Riesgo moderado o mayor' },
        { label: 'Disponibles', val: fmt(manillasDisp), sub: 'En bodega de territorio' },
      ],
      brRows, tabRows, assetDetail,
    };
  }
  function libVals(A, S, st) {
    const R = A.REC, RC = S.recursos || {}, ST = RC.status || {}, kind = st.libKind || 'cuentos', ED = RC.courseEdits || {};
    const SB = { 'Aprobado': '#E3F1E8', 'En revisión clínica': '#F9EBC8', 'Borrador': '#F0ECE6', 'Retirado': '#E6E1D9' };
    const items = kind === 'cuentos' ? R.CUENTOS.map(c => ({ id: c.slug, title: c.title, meta: c.temas + ' · ' + c.para + ' · ' + c.pag + ' pág.' + (c.restr ? ' · ' + R.TAG[c.restr] : ''), o: c, cover: R.cover(c.slug) })) : kind === 'videos' ? R.VIDEOS.map(v => ({ id: v.id, title: v.title, meta: 'Video · ' + v.min + ' min · ' + v.tema, o: v })) : kind === 'tecnicas' ? R.TECNICAS.map(v => ({ id: v.id, title: v.title, meta: 'Técnica · ' + v.min + ' min · audio y hoja impresa', o: v })) : R.CURSOS.map(c => ({ id: c.id, title: c.title, meta: 'Curso · ' + c.weeks + ' semanas · ' + c.para, o: { estado: 'Aprobado', version: 2 } }));
    const ov = id => ST[id] || {}, est = it => ov(it.id).estado || it.o.estado || 'Aprobado';
    const setSt = (id, k, v) => A.set(s => { const x = (s.recursos.status[id] = s.recursos.status[id] || {}); x[k] = v; if (k === 'estado') { x.version = (x.version || 1) + 1; A.logActivity(s, (A.session()?.id || "admin"), 'Cambió el estado de un recurso a ' + v); } });
    const sel = items.find(x => x.id === st.libSel);
    const FIELDS = kind === 'cuentos' ? [['title', 'Título'], ['temas', 'Temas'], ['para', 'Para quién'], ['pag', 'Páginas'], ['lect', 'Lectura (min)'], ['audio', 'Audio narrado (min)'], ['uso', 'Uso'], ['nivel', 'Nivel mínimo']] : [['title', 'Título'], ['min', 'Duración (min)'], ['tema', 'Tema']];
    const cId = st.libCourse || 'dormir', C0 = R.curso(cId), mods = C0.mods.map((m, i) => Object.assign({}, m, (ED[cId] || {})[i] || {}));
    const setMod = (i, k) => e => A.set(s => { const E = (s.recursos.courseEdits[cId] = s.recursos.courseEdits[cId] || {}); E[i] = Object.assign({}, E[i], { [k]: e.target.value }); });
    const rules = (RC.rules || R.RULES);
    return { lib: {
      kinds: [['cuentos', 'Cuentos'], ['videos', 'Videos'], ['tecnicas', 'Técnicas'], ['cursos', 'Cursos']].map(([k, label]) => ({ label, bg: kind === k ? '#FDCD22' : '#fff', go: () => api.setState({ libKind: k, libSel: null }) })),
      rows: items.map(it => { const e = est(it); return { hasCover: !!it.cover, cover: it.cover || '', title: it.title, meta: it.meta, estado: e, sBg: SB[e], version: ov(it.id).version || it.o.version || 1, fecha: e === 'Aprobado' ? (it.o.aprobado || '14 sep') : '—', bg: st.libSel === it.id ? '#FFF4CC' : '#fff', pick: () => kind === 'cursos' ? api.setState({ libCourse: it.id, libSel: null }) : api.setState({ libSel: it.id }) }; }),
      hasSel: !!sel, sel: sel ? { title: (ov(sel.id).title) || sel.title, hasCover: !!sel.cover, cover: sel.cover || '', hasTag: !!sel.o.restr, tag: sel.o.restr ? R.TAG[sel.o.restr] : '', estado: est(sel), setEstado: e => setSt(sel.id, 'estado', e.target.value), fields: FIELDS.map(([k, label]) => ({ k: label, v: String(ov(sel.id)[k] != null ? ov(sel.id)[k] : sel.o[k]), set: e => setSt(sel.id, k, e.target.value) })) } : { fields: [] },
      course: cId, setCourse: e => api.setState({ libCourse: e.target.value }), courseOpts: R.CURSOS.map(c => ({ v: c.id, l: c.title, s: c.id === cId })),
      cuentoOpts: R.CUENTOS.filter(c => !c.restr).map(c => ({ v: c.slug, l: c.title })), techOpts: R.TECNICAS.map(t => ({ v: t.id, l: t.title })), videoOpts: R.VIDEOS.map(v => ({ v: v.id, l: v.title })),
      mods: mods.map((m, i) => ({ cOpts: R.CUENTOS.filter(c => !c.restr).map(c => ({ v: c.slug, l: c.title, s: c.slug === m.cuento })), tOpts: R.TECNICAS.map(t => ({ v: t.id, l: t.title, s: t.id === m.tecnica })), vOpts: R.VIDEOS.map(v => ({ v: v.id, l: v.title, s: v.id === m.video })), n: i + 1, cuento: m.cuento, tecnica: m.tecnica, video: m.video, pregunta: m.pregunta, setCuento: setMod(i, 'cuento'), setTecnica: setMod(i, 'tecnica'), setVideo: setMod(i, 'video'), setPregunta: setMod(i, 'pregunta') })),
      rules: rules.map((r, i) => ({ k: r[0], c: (A.RISK[i] || {}).c, v: r[1], set: e => A.set(s => { s.recursos.rules[i][1] = e.target.value; }) }))
    } };
  }
  function renderVals() {
    const S = A.get(); const C = A.C;
    const terrSeen = new Set();
    const allTerr = (S.territories || []).filter((t) => {
      const n = String(t.name || "").trim();
      if (!n || terrSeen.has(n)) return false;
      terrSeen.add(n);
      return true;
    }).map(t => {
      const info = A.terrInfo(S, t.name) || t;
      const nExp = A.experts(S).filter(e => e.terr === t.name && e.active !== false).length;
      const cap = info.cap || 0, goal = info.goal || t.goal || 0;
      return {
        name: t.name, dep: info.dep || t.dep, level: info.level || t.level,
        experts: nExp, cap, goal,
        rural: info.rural || 0, ruralG: info.ruralG || t.ruralG || 0,
        br: info.brAv != null ? info.brAv : (t.br || 0),
        insts: Array.isArray(info.insts) ? info.insts.length : (t.insts || 0),
        isNew: !!t.isNew,
      };
    });
    const terrQ = String(st.terrQ || '').toLowerCase().trim();
    const terrs = allTerr.filter(t => !st.terrFilter || t.name === st.terrFilter).map(t => {
      let status = 'En curso', sc = C.alDia;
      if (!t.cap) { status = 'Sin iniciar'; sc = '#8C857C'; }
      else if (t.goal && t.cap / t.goal < 0.3) { status = 'Captación lenta'; sc = C.bajoMeta; }
      else if (t.rural < t.ruralG - 2) { status = 'Bajo cuota rural'; sc = C.revisar; }
      const ov = (S.terrOv || {})[t.name] || {}; if (ov.paused) { status = 'En pausa'; sc = '#8C857C'; }
      return { open: () => { api.router.push('/admin/territorio?t=' + encodeURIComponent(t.name)); }, name: t.name, dep: t.dep, level: t.level, experts: t.experts, capText: t.cap.toLocaleString('es-CO') + ' / ' + t.goal.toLocaleString('es-CO'), pct: t.goal ? Math.round(t.cap / t.goal * 100) + '%' : '0%', rural: (t.cap ? t.rural + ' %' : '—') + ' / ' + t.ruralG + ' %', bracelets: t.br, insts: t.insts, status, sc, rowBg: t.isNew ? '#FFF9E3' : '#fff' };
    }).filter((t) => {
      if (!terrQ) return true;
      const blob = [t.name, t.dep, t.level, t.experts, t.capText, t.rural, t.bracelets, t.insts, t.status]
        .map((x) => String(x ?? '').toLowerCase())
        .join(' ');
      return blob.includes(terrQ);
    });
    const terrCountLabel = terrs.length + (terrQ || st.terrFilter ? ' de ' + allTerr.length : '') + ' territorios';
    const tf = st.tf; const setTf = k => e => api.setState({ tf: Object.assign({}, tf, { [k]: e.target.value }), tfErr: '' });
    const chk = (group, k, label) => ({ label, mark: tf[group][k] ? '✓' : '', bd: tf[group][k] ? C.verde : C.texto2, bg: tf[group][k] ? C.verde : '#fff', toggle: () => api.setState({ tf: Object.assign({}, tf, { [group]: Object.assign({}, tf[group], { [k]: !tf[group][k] }) }) }) });

    const experts = A.experts(S).map(e => {
      const exKey = e.id === 'andres' || e.name === 'Andrés Ocampo' ? 'andres' : e.id === 'mj' || e.name === 'María José Vélez' ? 'mj' : null;
      let today = e.today || 0, week = e.week || 0, flags = 0, status = 'low';
      if (exKey) { const q = A.quotas(S, exKey); today = q.today; week = q.week; flags = A.openFlags(S, exKey); status = flags ? 'rev' : week >= 34 ? 'ok' : week > 0 ? 'low' : 'low'; }
      else {
        flags = (S.flags || []).filter(x => x.expertName === e.name && x.status === 'pending').length;
        status = flags ? 'rev' : e.isNew || e.training === 'Pendiente' ? 'new' : week >= 34 ? 'ok' : 'low';
      }
      const map = { ok: ['Al día', C.alDia], low: ['Bajo meta', C.bajoMeta], rev: ['Revisar', C.revisar], new: ['Capacitación pendiente', '#8C857C'], off: ['Desactivado', '#8C857C'] };
      const eov = (S.expertOv || {})[e.name] || {}; if (eov.active === false || e.active === false) { status = 'off'; }
      const target = e.target || 9;
      return { open: () => { api.router.push('/admin/experto?e=' + encodeURIComponent(e.name)); }, name: e.name, terr: eov.terr || e.terr, today: today + ' / ' + target, week: week + ' / 45', flags, status: map[status][0], sc: map[status][1], rowBg: e.isNew ? '#FFF9E3' : '#fff' };
    });
    const ef = st.ef; const setEf = k => e => api.setState({ ef: Object.assign({}, ef, { [k]: e.target.value }) });
    const flags = S.flags.map(f => ({ expertName: f.expertName, territory: f.territory, when: f.when, person: f.person, reasons: f.reasons, pending: f.status === 'pending', done: f.status !== 'pending', doneText: f.status === 'approved' ? 'Aprobada · cuenta para la cuota' : f.fromVisit ? 'Rechazada · no cuenta para la cuota' : 'Rechazada · se restó de la cuota',
      approve: async () => {
        try {
          await fetch('/api/flags', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id, status: 'approved' }) });
          if (f.fromVisit && f.wid) {
            await fetch('/api/worklists', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.wid, expertId: f.expert, status: 'validada' }) });
          }
        } catch (e) { /* local fallback */ }
        A.set(s => { const fl = s.flags.find(x => x.id === f.id); if (fl) fl.status = 'approved'; if (f.fromVisit) { const w = (s.worklists[f.expert] || []).find(x => x.id === f.wid); if (w) w.status = 'validada'; } if (s.notifs[f.expert]) A.pushNotif(s, f.expert, 'Visita aprobada en control de calidad: ' + f.person, '/experto'); });
        api.setState({ msg: 'Visita de ' + f.person + ' aprobada. Ya cuenta para la cuota.', msgActions: [] });
      },
      reject: async () => {
        try {
          await fetch('/api/flags', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id, status: 'rejected' }) });
          if (f.fromVisit && f.wid) {
            await fetch('/api/worklists', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.wid, expertId: f.expert, status: 'rechazada' }) });
          }
        } catch (e) { /* local fallback */ }
        A.set(s => { const fl = s.flags.find(x => x.id === f.id); if (fl) fl.status = 'rejected'; if (f.fromVisit) { const w = (s.worklists[f.expert] || []).find(x => x.id === f.wid); if (w) w.status = 'rechazada'; A.pushNotif(s, f.expert, 'Visita rechazada: ' + f.person + ' · no cuenta para la cuota', '/experto'); } else if (s.rejected[f.expert] !== undefined) { s.rejected[f.expert] += 1; A.pushNotif(s, f.expert, 'Visita rechazada: ' + f.person + ' · se restó de su cuota', '/experto'); s.notices[f.expert] = s.notices[f.expert] || []; s.notices[f.expert].unshift({ kind: 'qc', tag: 'Control de calidad', text: 'Su visita a ' + f.person + ' (' + f.when.toLowerCase() + ') fue rechazada: ' + f.reasons.join(' · ').toLowerCase() + '. Se restó de su cuota semanal.' }); } });
        api.setState({ msg: f.fromVisit ? 'Visita rechazada. No cuenta para la cuota de ' + f.expertName + ' y se le avisó.' : 'Visita rechazada. Se restó de la cuota de ' + f.expertName + ' y se le avisó.', msgActions: [] });
      } }));

    const cellFor = (ri, di) => { const code = A.code(ri, di); const dr = api.draft(code); return { code, n: Object.keys(dr.s).length }; };
    const pm = A.RISK.map((r, ri) => ({ k: r.k, c: r.c, cells: [0, 1, 2].map(di => { const x = cellFor(ri, di); const on = st.sel === x.code; return Object.assign(x, { bg: on ? C.verde : r.bg, fg: on ? '#fff' : C.tinta, bd: on ? C.amarillo : 'transparent', pick: () => api.setState({ sel: x.code }) }); }) }));
    const { r: sr, d: sd } = A.parseCode(st.sel); const dr = api.draft(st.sel);
    const req = S.pathRequests.find(x => x.code === st.sel && x.scope === st.scope);
    const pe = {
      title: st.sel + ' · ' + A.RISK[sr].k + ' × digital ' + A.DIG[sd].k.toLowerCase(), people: A.people(S).filter(p => p.profile === st.sel).length,
      rows: A.SERVICES.map(sv => {
        const on = !!dr.s[sv.id];
        return {
          name: sv.name,
          note: NOTES[sv.id] || '',
          op: on ? 1 : 0.6,
          swBg: on ? C.verde : '#C4BDB3',
          x: on ? '25px' : '3px',
          cur: 'pointer',
          toggle: () => {
            api.setDraft(st.sel, d => {
              if (d.s[sv.id]) delete d.s[sv.id];
              else d.s[sv.id] = sv.freqs[0];
            });
          },
          freqs: sv.freqs.map(label => {
            const sel = dr.s[sv.id] === label;
            return {
              label,
              bd: sel ? C.verde : C.lineas,
              bg: sel ? '#FFF4CC' : '#fff',
              fg: on ? C.tinta : C.texto2,
              pick: () => { api.setDraft(st.sel, d => { d.s[sv.id] = label; }); },
            };
          }),
        };
      }),
      warn: false,
      durs: [3, 6, 12].map(m => ({ label: m + ' meses', bd: dr.months === m ? C.verde : C.lineas, bg: dr.months === m ? '#FFF4CC' : '#fff', fg: C.tinta, pick: () => api.setDraft(st.sel, d => { d.months = m; }) })),
      sendBg: C.verde,
      status: req ? 'Enviado a aprobación clínica · pendiente de la líder clínica. Al aprobarse, aplica a personas nuevas y a las actuales en su próxima revisión de ruta.' : 'Los cambios no se aplican de inmediato: la líder clínica debe aprobarlos.'
    };
    const extra = moreVals(A, S, C, st);
    Object.assign(extra, rulesVals(A, S, C, st), perfVals(A, S, C, st));
    return Object.assign({
      vHome: st.view === 'home', view: st.view, showFab: st.view !== 'home' && !st.agentOpen, agentOpen: st.agentOpen,
      openAgent: () => api.setState({ agentOpen: true }), closeAgent: () => api.setState({ agentOpen: false, pendingAsk: '' }), askFromHome: q => api.setState({ agentOpen: true, pendingAsk: q }), pendingAsk: st.pendingAsk || '', ovW: (window.innerWidth / (st.zoom || 1)) + 'px', ovH: (window.innerHeight / (st.zoom || 1)) + 'px', drawerW: window.innerWidth < 720 ? (window.innerWidth / (st.zoom || 1)) + 'px' : '480px',
      ctxLabel: 'Sobre: ' + ({ terr: 'Territorios', team: st.teamTab === '2' ? 'Equipos de campo · Desempeño' : 'Equipos de campo', paths: 'Rutas', people: 'Personas', assets: 'Activos' }[st.view] || 'Inicio'),
      agentAction: (action, p) => {
        if (action === 'detail') api.go(p.target, { terrFilter: p.filter || '', agentOpen: false, msg: '' });
        if (action === 'report') api.router.push('/informe?id=' + p + '&back=/inicio');
      },
      hasFilter: st.view === 'terr' && !!st.terrFilter, terrFilter: st.terrFilter, clearFilter: () => api.setState({ terrFilter: '' }),
      homeLinks: [['terr', 'Territorios', 'Captación, cuotas y estado'], ['team', 'Equipos de campo', S.flags.filter(f => f.status === 'pending').length + ' visitas por revisar'], ['paths', 'Rutas', '15 perfiles'], ['assets', 'Activos', 'Manillas y tablets'], ['users', 'Usuarios y permisos', S.accounts.length + ' cuentas'], ['reports', 'Informes', 'Biblioteca y programados']].map(([k, label, sub]) => ({ id: k, label, sub, go: () => api.go(k, { msg: '', terrFilter: '' }) })),
      dev: A.devMode(), zoom: st.zoom || 1, screenCode: { home: 'AdminHome', terr: 'AdminTerritories', team: 'AdminFieldTeams', paths: st.pathTab === '2' ? 'ClassificationRules' : 'PathEditor', people: 'AdminPeople', assets: 'AdminAssets' }[st.view],
      navActive: st.view, navGo: k => api.go(k, { msg: '' }),
      nav: [['home', 'Inicio'], ['terr', 'Territorios'], ['team', 'Equipos de campo'], ['paths', 'Rutas'], ['people', 'Personas'], ['assets', 'Activos'], ['users', 'Usuarios y permisos'], ['reports', 'Informes']].map(([k, label]) => ({ label, bd: st.view === k ? C.amarillo : 'transparent', fg: st.view === k ? C.verde : C.tinta, go: () => api.go(k, { msg: '' }) })),
      hasMsg: !!st.msg, msg: st.msg, msgActions: st.msgActions,
      clearMsg: () => api.setState({ msg: '', msgActions: [] }),
      vTerr: st.view === 'terr', vTeam: st.view === 'team', vPaths: st.view === 'paths', vPeople: st.view === 'people', vAssets: st.view === 'assets',
      totalCap: allTerr.reduce((a, t) => a + t.cap, 0).toLocaleString('es-CO'), terrs,
      terrQ: st.terrQ || '', setTerrQ: (e) => api.setState({ terrQ: e.target.value }),
      terrCountLabel,
      terrForm: st.terrForm, terrFormBtn: '+ Crear territorio', toggleTerrForm: () => api.setState({ terrForm: true }), closeTerrForm: () => api.setState({ terrForm: false }),
      tf, tfSet: { dep: setTf('dep'), mun: setTf('mun'), goal: setTf('goal'), rural: setTf('rural'), sixty: setTf('sixty') }, tfErr: st.tfErr, clearTfErr: () => api.setState({ tfErr: '' }),
      levels: ['Municipio completo', 'Veredas seleccionadas', 'Barrios seleccionados'].map(label => ({ label, bd: tf.level === label ? C.verde : C.texto2, dot: tf.level === label ? C.verde : '#fff', pick: () => api.setState({ tf: Object.assign({}, tf, { level: label }) }) })),
      modules: [chk('mods', 'base', 'PHQ-9 + capacidad digital (base)'), chk('mods', 'ctx', 'Contexto del sismo'), chk('mods', 'videos', 'Videos adaptados a la región')],
      tinsts: [chk('insts', 'hl', 'Hospital público local'), chk('insts', 'cu', 'Clínica universitaria · teleconsulta'), chk('insts', 'cf', 'Comisaría de familia')],
      saveTerr: async () => {
        if (!tf.mun.trim() || !(parseInt(tf.goal, 10) > 0)) return api.setState({ tfErr: 'Escriba el municipio y una meta de captación mayor que cero.' });
        if (allTerr.find(t => t.name === tf.mun.trim())) return api.setState({ tfErr: 'Ese territorio ya existe.' });
        const name = tf.mun.trim();
        const content = ['PHQ-9 + capacidad digital (base)'].concat(tf.mods.ctx ? ['Contexto del sismo'] : [], tf.mods.videos ? ['Videos adaptados a la región'] : []);
        const payload = {
          name, dep: tf.dep, level: tf.level, goal: parseInt(tf.goal, 10),
          ruralG: parseInt(tf.rural, 10) || 0, sixtyG: parseInt(tf.sixty, 10) || 0,
          insts: Object.values(tf.insts).filter(Boolean).length, content,
        };
        try {
          const res = await fetch('/api/territories', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || !data.ok) return api.setState({ tfErr: data.error || 'No se pudo guardar el territorio.' });
          const t = data.territory;
          A.set(s => {
            s.territories = (s.territories || []).filter(x => x.name !== t.name).concat([t]);
            s.terrOv = s.terrOv || {};
            s.terrOv[t.name] = Object.assign({}, s.terrOv[t.name], { content: t.content || content });
          });
          api.setState({ terrForm: false, ef: Object.assign({}, st.ef, { terr: name }), msg: 'Territorio ' + name + ' creado y guardado en MongoDB. Siguientes pasos:', msgActions: [{ label: 'Asignar expertos', go: () => api.go('team', { expForm: true, msg: '' }) }, { label: 'Asignar manillas', go: () => api.go('assets', { msg: '' }) }] });
        } catch (e) {
          api.setState({ tfErr: 'No se pudo conectar con la base de datos.' });
        }
      },
      expForm: st.expForm, expFormBtn: '+ Crear experto', toggleExpForm: () => api.setState({ expForm: true }), closeExpForm: () => api.setState({ expForm: false }),
      ef, efSet: { name: setEf('name'), phone: setEf('phone'), terr: setEf('terr'), target: setEf('target') }, terrNames: allTerr.map(t => t.name),
      terrChips: allTerr.map(t => ({ n: t.name, bd: ef.terr === t.name ? C.verde : C.lineas, bg: ef.terr === t.name ? '#FFF4CC' : '#fff', fw: ef.terr === t.name ? 500 : 400, pick: () => api.setState({ ef: Object.assign({}, ef, { terr: t.name }) }) })),
      saveExp: async () => {
        if (!ef.name.trim() || ef.phone.replace(/\D/g, '').length < 10) return api.setState({ msg: 'Faltan datos: escriba el nombre y un celular de 10 dígitos.', msgActions: [] });
        if (!ef.terr) return api.setState({ msg: 'Seleccione un territorio para el experto.', msgActions: [] });
        const payload = {
          name: ef.name.trim(),
          phone: ef.phone,
          terr: ef.terr,
          target: parseInt(ef.target, 10) || 9,
        };
        try {
          const res = await fetch('/api/experts', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || !data.ok) return api.setState({ msg: data.error || 'No se pudo guardar el experto.', msgActions: [] });
          const e = data.expert;
          A.set(s => {
            s.experts = (s.experts || []).filter(x => x.id !== e.id).concat([e]);
            const t = (s.territories || []).find(x => x.name === e.terr);
            if (t) t.experts = (t.experts || 0) + 1;
          });
          api.setState({
            expForm: false,
            msg: 'Experto ' + e.name + ' guardado en MongoDB (territorio ' + e.terr + '). Acceso SMS simulado a ' + e.phone + '. Siguiente: asignar tablet y capacitar antes de la primera visita.',
            msgActions: [
              { label: 'Asignar tablet', go: () => api.go('assets', { msg: '' }) },
              { label: 'Revisar la ruta P08', go: () => api.go('paths', { sel: 'P08', msg: '' }) },
            ],
          });
        } catch (err) {
          api.setState({ msg: 'No se pudo conectar con la base de datos.', msgActions: [] });
        }
      },
      experts, flags, flagCount: S.flags.filter(f => f.status === 'pending').length + ' por revisar', checks: CHECKS.map(([k, v]) => ({ k, v })),
      pm, pe, scope: st.scope, setScope: e => api.setState({ scope: e.target.value }),
      sendPath: () => {
        // Copia profunda del borrador actual (incluye s:{} si apagaron todo)
        const live = api.draft(st.sel);
        const draft = JSON.parse(JSON.stringify(live));
        if (!draft.s || typeof draft.s !== 'object') draft.s = {};
        A.set(s => {
          s.pathRequests = (s.pathRequests || []).filter(x => !(x.code === st.sel && x.scope === st.scope));
          s.pathRequests.push({
            id: st.sel + '-' + (st.scope || 'all'),
            code: st.sel,
            scope: st.scope,
            draft,
            at: Date.now(),
            status: 'pending',
          });
          A.pushNotif(s, 'admin', 'Cambio de ruta ' + st.sel + ' esperando aprobación clínica', '/rutas');
        });
        const n = Object.keys(draft.s).length;
        api.setState({
          msg: n
            ? 'Ruta ' + st.sel + ' enviada a aprobación clínica (' + n + ' servicios).'
            : 'Ruta ' + st.sel + ' enviada a aprobación clínica (sin módulos en la app).',
          msgActions: [],
        });
      }
    }, extra);
  }
  return renderVals();
}

