// NARA · estado en memoria (sin localStorage). Persistencia: MongoDB vía /api/app-state.
import { schedulePersist } from './persist.js';
import { NARA_SERVICES } from '../nara-services/catalog.js';

const KEY = 'nara-memory-v1';
  // Limpia restos de demos anteriores en el navegador (una vez al cargar el módulo).
  if (typeof window !== 'undefined') {
    try {
      ['nara-demo-v1', 'nara-session', 'nara-devmode', 'nara-typed'].forEach(k => localStorage.removeItem(k));
      Object.keys(localStorage).filter(k => /^(aliento-|nara-)/.test(k)).forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  }
  const C = {
    verde: '#161413', azul: '#161413', amarillo: '#FDCD22', rosa: '#FFA3D0', niebla: '#F0ECE6', blanco: '#FFFFFF', tinta: '#161413',
    texto2: '#5E5750', lineas: '#DCD6CD', ambar: '#3FEA73', ambarTx: '#161413', ambarBg: '#D8FBE3', crisisTx: '#8A1C14',
    rojo: '#B42318', rojoBg: '#FDE7E4', alDia: '#4E9A6B', bajoMeta: '#E0A526', revisar: '#D9692B'
  };
  const RISK = [
    { k: 'Mínimo', c: '#4E9A6B', bg: '#DCEDE2', min: 0, max: 4 },
    { k: 'Leve', c: '#A3B13C', bg: '#EEF2DF', min: 5, max: 9 },
    { k: 'Moderado', c: '#E0A526', bg: '#F9EBC8', min: 10, max: 14 },
    { k: 'Moderado-severo', c: '#D9692B', bg: '#F7E2D2', min: 15, max: 19 },
    { k: 'Severo', c: '#9C2F25', bg: '#EFDCDA', min: 20, max: 27 }
  ];
  const DIG = [
    { k: 'Baja', c: '#D8D2C9', bg: '#F0ECE6', min: 0, max: 4 },
    { k: 'Media', c: '#8C857C', bg: '#E6E1D9', min: 5, max: 8 },
    { k: 'Alta', c: '#161413', bg: '#DCD6CD', min: 9, max: 11 }
  ];
  const riskIdx = t => RISK.findIndex(r => t >= r.min && t <= r.max);
  const digIdx = t => DIG.findIndex(r => t >= r.min && t <= r.max);
  const code = (r, d) => 'P' + String(r * 3 + d + 1).padStart(2, '0');
  const parseCode = (p) => {
    const s = p != null ? String(p) : '';
    if (!/^P\d+$/i.test(s)) return { r: -1, d: -1 };
    const n = parseInt(s.slice(1), 10) - 1;
    if (!Number.isFinite(n) || n < 0) return { r: -1, d: -1 };
    return { r: Math.floor(n / 3), d: n % 3 };
  };

  const PHQ = [
    'Poco interés o placer en hacer las cosas',
    'Se ha sentido decaído/a, deprimido/a o sin esperanza',
    'Dificultad para dormir o dormir demasiado',
    'Se ha sentido cansado/a o con poca energía',
    'Poco apetito o come en exceso',
    'Se ha sentido mal consigo mismo/a, o una carga para su familia',
    'Dificultad para concentrarse',
    'Se mueve o habla muy lento, o está muy inquieto/a',
    'Pensamientos de que estaría mejor muerto/a o de hacerse daño'
  ];
  const PHQ_OPTS = ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'];
  const Q9_EXACT = 'En las últimas dos semanas, ¿con qué frecuencia ha pensado que estaría mejor muerto o muerta, o en hacerse daño de alguna forma?';
  const DIGQ = [
    { q: 'Teléfono', o: ['Ninguno', 'Compartido', 'Smartphone propio'] },
    { q: 'Conexión en casa', o: ['Sin señal', 'Datos limitados', 'Estable'] },
    { q: 'Uso diario', o: ['Solo llamadas', 'WhatsApp y audios', 'Apps y videollamadas'] },
    { q: 'Lectura y escritura', o: ['Prefiere voz', 'Básica', 'Cómoda'] },
    { q: '¿Hablaría con una app?', o: ['No', 'Tal vez', 'Sí'] },
    { q: 'Alguien en casa le ayuda con el celular', o: ['No', 'Sí'] }
  ];
  const CTX = [
    { q: 'Daño en la vivienda', o: ['Ninguno', 'Parcial', 'Total'] },
    { q: 'Perdió a un familiar o allegado', o: ['No', 'Sí'] }
  ];

  // Solo estos 6 servicios en el editor de rutas / perfiles (matriz v2 proyectada).
  // Nombres / notas / freqs: editar por archivo en src/lib/nara-services/<id>.js
  const SERVICES = NARA_SERVICES.map((sv) => ({
    id: sv.id,
    name: sv.name,
    freqs: sv.freqs.slice(),
    note: sv.note || '',
  }));
  const SERVICE_IDS = new Set(SERVICES.map((x) => x.id));
  const prunePathS = (s) => {
    const out = {};
    Object.keys(s || {}).forEach((k) => {
      if (SERVICE_IDS.has(k)) out[k] = s[k];
    });
    return out;
  };
  const CLIN_CH = ['En persona', 'Por teléfono', 'Videollamada o teléfono'];

  // ---------- v7 · Recursos de tratamiento: cuentos, videos, técnicas y cursos ----------
  const cursosFreq = (r) => (r <= 1 ? 'Curso guiado por TEO' : r === 2 ? 'Curso con el experto' : 'Asignado por la psicóloga');
  // v2: con capacidad Baja, Mínimo a Moderado llevan el curso con el experto.
  const cursosMod = (r, d) => (r >= 3 ? 'Asignado por la psicóloga' : d === 0 ? 'Curso con el experto' : cursosFreq(r));
  const REC = (() => {
    const C = (slug, title, temas, para, pag, lect, audio, uso, extra) => Object.assign({ slug, title, temas, para, pag, lect, audio, uso, nivel: 'TEO o experto', restr: null, estado: 'Aprobado', version: 1, aprobado: '14 sep', pages: 0, preguntas: [] }, extra || {});
    const CUENTOS = [
      C('el-pais-de-los-suenos', 'El país de los sueños', 'Sueño, hábitos, pesadillas', 'Todos', 6, 4, 5, 'Ambos', { preguntas: ['¿Qué hace usted antes de dormir?', '¿Qué le gustaría soñar esta noche?'] }),
      C('el-ladron-de-suenos', 'El ladrón de sueños', 'Sueño, miedo, ansiedad, esperanza', 'Adultos', 10, 8, 10, 'Ambos', { pages: 10, preguntas: ['¿Qué le quita el sueño desde el sismo?', '¿Qué le ayuda a calmarse cuando se despierta de noche?', '¿Qué sueño tiene para su familia este año?'] }),
      C('la-bruja-estresona', 'La bruja Estresona', 'Estrés, orden, lealtad', 'Todos', 7, 4, 5, 'Ambos', { pages: 7, preguntas: ['¿Qué siente en el cuerpo cuando hay una réplica?', '¿Qué hace usted para ordenar sus pensamientos?', '¿A quién le puede pedir ayuda cuando se siente tenso?'] }),
      C('el-robot-autocontrol', 'El robot Autocontrol', 'Autocontrol, autocuidado, compañía', 'Todos', 7, 4, 5, 'Ambos'),
      C('el-vaso-medio-lleno', 'El vaso medio lleno o medio vacío', 'Mirada positiva, adversidad', 'Todos', 5, 3, 3, 'Ambos'),
      C('los-tres-cerditos', 'Los tres cerditos', 'Desánimo, alegría, pedir apoyo', 'Todos', 7, 4, 5, 'Ambos'),
      C('la-lunatica', 'La lunática', 'Tristeza, angustia, amistad', 'Adultos', 7, 4, 5, 'Ambos'),
      C('salud-nieves-y-los-7-daninos', 'Salud Nieves y los 7 dañinos', 'Angustia, ansiedad, tristeza y otros malestares', 'Adultos', 10, 8, 10, 'Ambos'),
      C('el-inventario-de-las-cosas-perdidas', 'El inventario de las cosas perdidas', 'Pérdidas, lo que aún podemos hacer', 'Adultos y 60+', 5, 3, 3, 'Ambos'),
      C('la-perdida-del-sol', 'La pérdida del sol', 'Duelo, soledad, recuerdos, esperanza', 'Adultos', 7, 6, 8, 'Ambos'),
      C('la-carta-del-abuelo', 'La carta del abuelo', 'Duelo, resiliencia, familia, mayores', 'Familias y 60+', 7, 5, 6, 'Ambos', { pages: 7, preguntas: ['Si alguien que ya no está le escribiera una carta, ¿qué le gustaría leer?', '¿Qué objeto de su casa le trae un buen recuerdo?', '¿Quién lo ha acompañado desde el sismo?'] }),
      C('la-carrera-del-riesgo', 'La carrera del riesgo', 'Resiliencia familiar, unión', 'Familias', 6, 4, 5, 'Grupo'),
      C('el-espejo-de-la-mente', 'El espejo de la mente', 'Envejecer, sentirse útil, amistad', '60+', 6, 4, 5, 'Ambos'),
      C('las-huellas-en-supermente', 'Las huellas en Supermente', 'Hábitos saludables, mente y cuerpo', 'Todos', 7, 4, 5, 'Ambos'),
      C('salud-y-bienestar', 'Salud y Bienestar', 'Bienestar, amistad, comunidad', 'Todos', 7, 5, 7, 'Ambos', { restr: 'pandemia' }),
      C('la-fatiga-y-la-memoria', 'La fatiga y la memoria', 'Cansancio, memoria (habla del COVID-19)', 'Adultos', 9, 8, 10, 'Individual', { restr: 'pandemia' }),
      C('el-congreso-de-las-emociones', 'El congreso de las emociones', 'Emociones, conflictos, diálogo', 'Todos', 6, 4, 5, 'Grupo'),
      C('un-pais-llamado-mente', 'Un país llamado mente', 'Conflictos, acuerdos, aceptar las diferencias', 'Todos', 7, 5, 6, 'Ambos'),
      C('la-esmeralda-encantada', 'La esmeralda encantada', 'Amistad, cuidar la salud física y mental, valores', 'Todos', 11, 8, 10, 'Ambos'),
      C('el-arbol-que-no-queria-crecer', 'El árbol que no quería crecer', 'Miedo, tristeza, valor de la vida, apoyo de otros', 'Adultos', 7, 4, 5, 'Grupo', { restr: 'acompanamiento', nivel: 'Experto (grupo o PM+) o psicóloga' }),
      C('la-princesa-con-el-corazon-triste', 'La princesa con el corazón triste', 'Tristeza profunda, valorar la vida', 'Adultos', 7, 5, 7, 'Individual', { restr: 'restringido', nivel: 'Solo psicóloga, en sesión', estado: 'Aprobado' })
    ];
    const TEMAS = ['Sueño', 'Miedo', 'Estrés', 'Duelo', 'Tristeza', 'Familia', 'Ánimo', 'Pérdidas', 'Mayores'];
    const TEMA_RX = { 'Sueño': /sueñ|dorm|noche|descans/i, 'Miedo': /miedo|temor|réplica|susto|pánico/i, 'Estrés': /estr[eé]s|ansie|nervi|calma|tensi|preocup/i, 'Duelo': /duelo|muert|falleci|despedi|ausencia/i, 'Tristeza': /trist|depres|llor|soledad/i, 'Familia': /famil|hij|niñ|pareja|crianza|hogar/i, 'Ánimo': /ánimo|animo|alegr|motiva|esperanza|autoestima|ganas/i, 'Pérdidas': /pérdid|perdid|casa|vivienda|cambio|reconstru/i, 'Mayores': /mayor|60\+|vejez|abuel|memoria/i };
    const temaMatch = (x, t) => !t || TEMA_RX[t].test([x.title, x.temas, x.tema, x.para].filter(Boolean).join(' '));
    const TAG = { restringido: 'Uso restringido · solo con psicóloga', acompanamiento: 'Con acompañamiento · experto o psicóloga', pandemia: 'Contexto: pandemia' };
    const V = (id, title, min, tema, emo) => ({ id, title, min, tema, emo, kind: 'video', estado: 'Aprobado', version: 1 });
    const VIDEOS = [V('miedo-sismo', 'El miedo después del sismo', 4, 'Miedo, réplicas', 'curiosidad'), V('no-duermo', '¿Por qué no puedo dormir?', 5, 'Sueño', 'curiosidad'), V('cuerpo-estres', 'Lo que el cuerpo siente con el estrés', 4, 'Estrés', 'curiosidad'), V('perder-casa', 'Cuando perdemos la casa', 6, 'Pérdidas materiales', 'curiosidad'), V('ninos-sismo', 'Hablar del sismo con los niños', 5, 'Familia', 'energia'), V('duelo-camino', 'El duelo no tiene un solo camino', 6, 'Duelo', 'curiosidad'), V('pedir-ayuda', 'Pedir ayuda también es fuerza', 3, 'Buscar apoyo', 'curiosidad'), V('rutina', 'Volver a la rutina, paso a paso', 4, 'Hábitos', 'energia')];
    const T = (id, title, min, tema) => ({ id, title, min, tema, emo: 'calma', kind: 'tecnica', estado: 'Aprobado', version: 1 });
    const TECNICAS = [T('resp-46', 'Respiración 4-6', 2, 'Respiración'), T('resp-dormir', 'Respiración para dormir', 6, 'Sueño'), T('musculos', 'Relajación de los músculos', 10, 'Estrés'), T('54321', '5-4-3-2-1 cuando hay una réplica', 3, 'Miedo, réplicas'), T('lugar-seguro', 'Mi lugar seguro', 7, 'Calma'), T('escaneo', 'Escaneo del cuerpo', 8, 'Calma'), T('caminar', 'Caminar con atención', 5, 'Ánimo'), T('rutina-noche', 'Rutina de la noche', 4, 'Sueño'), T('soltar', 'Soltar la preocupación', 5, 'Preocupación'), T('manos', 'Las manos tibias', 3, 'Calma'), T('bueno-dia', 'Contar lo bueno del día', 3, 'Ánimo'), T('dia-sentido', 'Planear un día con sentido', 6, 'Ánimo')];
    const M = (cuento, tecnica, video, pregunta) => ({ cuento, tecnica, video, pregunta });
    const CURSOS = [
      { id: 'dormir', title: 'Dormir mejor después del sismo', weeks: 4, para: 'Sueño (el más asignado)', mods: [M('el-pais-de-los-suenos', 'rutina-noche', 'no-duermo', '¿Qué cambió en sus noches desde el sismo?'), M('el-ladron-de-suenos', 'resp-dormir', 'miedo-sismo', '¿Qué le ayuda a volver a dormir cuando se despierta?'), M('la-bruja-estresona', 'musculos', 'cuerpo-estres', '¿En qué parte del cuerpo siente la tensión?'), M('las-huellas-en-supermente', 'bueno-dia', 'rutina', '¿Qué hábito quiere mantener?')] },
      { id: 'calma', title: 'Calma cuando tiembla', weeks: 4, para: 'Miedo y estrés', mods: [M('la-bruja-estresona', '54321', 'miedo-sismo', '¿Qué hace su cuerpo cuando tiembla?'), M('el-robot-autocontrol', 'resp-46', 'cuerpo-estres', '¿Qué le ayuda a recuperar la calma?'), M('el-vaso-medio-lleno', 'lugar-seguro', 'pedir-ayuda', '¿A quién le puede pedir ayuda?'), M('un-pais-llamado-mente', 'soltar', 'rutina', '¿Qué preocupación quiere soltar esta semana?')] },
      { id: 'perdimos', title: 'Lo que perdimos', weeks: 4, para: 'Duelo y pérdidas', mods: [M('el-inventario-de-las-cosas-perdidas', 'escaneo', 'perder-casa', '¿Qué conserva todavía?'), M('la-perdida-del-sol', 'lugar-seguro', 'duelo-camino', '¿Qué recuerdo le acompaña?'), M('la-carta-del-abuelo', 'soltar', 'pedir-ayuda', '¿Qué le diría a quien ya no está?'), M('salud-y-bienestar', 'bueno-dia', 'rutina', '¿Qué le da fuerza hoy?')] },
      { id: 'animo', title: 'Ánimo, paso a paso', weeks: 4, para: 'Ánimo bajo', mods: [M('los-tres-cerditos', 'dia-sentido', 'rutina', '¿Qué pequeña cosa quiere hacer mañana?'), M('la-lunatica', 'caminar', 'pedir-ayuda', '¿Con quién le gustaría hablar esta semana?'), M('salud-nieves-y-los-7-daninos', 'escaneo', 'cuerpo-estres', '¿Qué malestar quiere conocer mejor?'), M('el-vaso-medio-lleno', 'bueno-dia', 'rutina', '¿Qué salió bien hoy?')] },
      { id: 'familia', title: 'En familia', weeks: 4, para: 'Familias, grupos de apoyo', mods: [M('la-carrera-del-riesgo', 'resp-46', 'ninos-sismo', '¿Cómo se apoyan en su familia?'), M('el-congreso-de-las-emociones', '54321', 'cuerpo-estres', '¿Qué emoción se nota más en su casa?'), M('la-carta-del-abuelo', 'bueno-dia', 'duelo-camino', '¿Qué historia de familia quiere contar?'), M('la-esmeralda-encantada', 'dia-sentido', 'rutina', '¿Qué plan quieren hacer juntos?')] },
      { id: 'mayores', title: 'La sabiduría de los mayores', weeks: 3, para: '60+', mods: [M('el-espejo-de-la-mente', 'manos', 'rutina', '¿En qué se siente útil hoy?'), M('el-inventario-de-las-cosas-perdidas', 'resp-46', 'perder-casa', '¿Qué aprendió de lo que vivió?'), M('la-carta-del-abuelo', 'bueno-dia', 'pedir-ayuda', '¿Qué consejo le daría a sus nietos?')] }
    ];
    const cuento = slug => CUENTOS.find(c => c.slug === slug);
    const video = id => VIDEOS.find(v => v.id === id);
    const tecnica = id => TECNICAS.find(t => t.id === id);
    const curso = id => CURSOS.find(c => c.id === id);
    const cover = slug => '/nara/recursos/cuentos/portadas/' + slug + '.jpg';
    const page = (slug, n) => '/nara/recursos/cuentos/paginas/' + slug + '/' + String(n).padStart(2, '0') + '.jpg';
    const openLib = c => !c.restr || c.restr === 'pandemia';
    const teoOk = c => !c.restr;
    const channel = d => d === 2 ? 'App · leer y escuchar' : d === 1 ? 'WhatsApp · portada, audio y pregunta' : 'Cuadernillo impreso · audio en la visita';
    function courseFor(x) {
      const phq = x.phq || [], age = x.age || 0, ctx = x.ctx || {};
      if ((phq[2] || 0) >= 2) return { id: 'dormir', motivo: 'porque duerme mal desde el sismo' };
      if (ctx.perdida > 0) return { id: 'perdimos', motivo: 'porque perdió a un familiar en el sismo' };
      if ((phq[0] || 0) >= 2 && (phq[1] || 0) >= 2) return { id: 'animo', motivo: 'porque tiene el ánimo bajo' };
      if (age >= 60) return { id: 'mayores', motivo: 'porque tiene 60 años o más' };
      return { id: 'calma', motivo: 'para manejar el miedo y el estrés' };
    }
    const RULES = [
      ['Mínimo', 'Biblioteca abierta + 1 curso a elección, guiado por TEO; con capacidad digital baja, con el experto'],
      ['Leve', '1 curso recomendado según el motivo principal, guiado por TEO; con capacidad digital baja, con el experto'],
      ['Moderado', '1 curso con el experto (dentro del grupo de apoyo)'],
      ['Moderado-severo', 'Solo cuentos y cursos que asigne la psicóloga, como apoyo a la terapia'],
      ['Severo', 'Igual que moderado-severo; nunca recomendaciones automáticas'],
    ];
    const STATS = { courses: { dormir: [412, 46], calma: [236, 41], perdimos: [158, 52], animo: [121, 38], familia: [64, 57], mayores: [97, 61] }, groupStories: [['la-bruja-estresona', 38], ['el-ladron-de-suenos', 31], ['la-carta-del-abuelo', 24], ['el-congreso-de-las-emociones', 19], ['la-carrera-del-riesgo', 15], ['el-arbol-que-no-queria-crecer', 11]], phq: { done: [486, -5.8], notDone: [602, -3.1] }, topStories: [['el-pais-de-los-suenos', 512], ['el-ladron-de-suenos', 447], ['la-bruja-estresona', 390], ['el-inventario-de-las-cosas-perdidas', 211], ['la-carta-del-abuelo', 198]] };
    return { TEMAS, temaMatch, STATS, CUENTOS, VIDEOS, TECNICAS, CURSOS, TAG, RULES, cuento, video, tecnica, curso, cover, page, openLib, teoOk, channel, courseFor, item: id => cuento(id) || video(id) || tecnica(id) };
  })();
  function recPerson(s, pid) { return ((s.recursos || {}).people || {})[pid] || null; }
  function courseProgress(s, pid) { const p = recPerson(s, pid); if (!p || !p.course) return null; const c = REC.curso(p.course); const done = (p.doneMods || []).length; return { p, c, done, pct: Math.round(done / c.weeks * 100), week: p.week, mod: c.mods[Math.min(p.week, c.weeks) - 1] }; }
  /**
   * Por ahora: los 6 servicios van activos en todos los perfiles (P01–P15).
   * Solo cambian frecuencias / canal según riesgo × digital.
   */
  function defaultPath(r, d) {
    const p = basePath(r, d);
    p.s = prunePathS(p.s);
    return p;
  }
  function basePath(r, d) {
    const s = {};
    const on = (id, freq) => { s[id] = freq; };
    // Los 6 servicios, siempre.
    on('mood', 'Diario');
    on('ia', r <= 1 ? 'Acceso libre' : 'Entre sesiones');
    on('tech', d === 0 ? 'Material impreso' : 'En audio');
    on('cursos', cursosMod(r, d));
    on(
      'clin',
      r <= 1 ? 'Mensual' : r === 2 ? 'Mensual' : r === 3 ? 'Quincenal' : 'Semanal',
    );
    on(
      'revisit',
      r <= 1
        ? d === 0
          ? 'Cada 2 semanas'
          : 'Mensual'
        : r === 2
          ? d === 0
            ? 'Cada 2 semanas'
            : 'Mensual'
          : 'Cada 2 semanas',
    );
    // inactiveMinutes: umbral del perfil para estado Inactivo (default: 1 día).
    if (r <= 1) return { s, months: 3, inactiveMinutes: 1440 };
    if (r === 2) return { s, months: 6, inactiveMinutes: 1440 };
    return { s, months: 12, inactiveMinutes: 1440 };
  }
  // ctx: { dano: 0 ninguno · 1 parcial · 2 total, perdida: 0/1 }
  const needsSocial = ctx => !!ctx && ((ctx.dano || 0) > 0 || (ctx.perdida || 0) > 0);
  function asPathDraft(x) {
    // s:{} vacío cuenta como override explícito (ruta sin módulos).
    if (!x || typeof x !== 'object') return null;
    if (!Object.prototype.hasOwnProperty.call(x, 's') || typeof x.s !== 'object' || !x.s) return null;
    return x;
  }
  function pathList(r, d, override, ctx) {
    if (r < 0 || d < 0 || r > 4 || d > 2) return [];
    const storeOv = cache && cache.pathOverrides && cache.pathOverrides[code(r, d)];
    const explicit = asPathDraft(override) || asPathDraft(storeOv);
    const full = defaultPath(r, d);
    // Por defecto los 6 activos (full). El override gana:
    // - freq string → activo
    // - '' / null → apagado explícito (no se rellena)
    // - clave ausente en override viejo → se toma del default (activo)
    const merged = { ...(full.s || {}) };
    if (explicit && explicit.s && typeof explicit.s === 'object') {
      Object.keys(explicit.s).forEach((k) => {
        if (!SERVICE_IDS.has(k)) return;
        const v = explicit.s[k];
        if (v === '' || v == null) delete merged[k];
        else merged[k] = v;
      });
    }
    const p = {
      s: prunePathS(merged),
      months:
        explicit && explicit.months != null
          ? explicit.months
          : full.months != null
            ? full.months
            : 3,
      inactiveMinutes:
        explicit && explicit.inactiveMinutes != null
          ? explicit.inactiveMinutes
          : full.inactiveMinutes != null
            ? full.inactiveMinutes
            : 1440,
    };

    return SERVICES.filter(x => p.s[x.id]).map(x => ({
      id: x.id, name: x.name, freq: p.s[x.id],
      channel:
        x.id === 'mood' ? 'App · check-in de ánimo' :
        x.id === 'clin' ? CLIN_CH[d] :
        x.id === 'ia' ? 'App' :
        x.id === 'revisit' ? 'Visita en casa' :
        x.id === 'cursos' ? REC.channel(d) :
        x.id === 'tech' ? 'App o impreso' : '',
      main: x.id === 'clin' && r >= 2,
    }));
  }
  /** Ids de la ruta del perfil que la app del paciente puede mostrar. */
  function appModuleIdsFromPath(r, d, override, ctx) {
    return pathList(r, d, override, ctx).map((x) => x.id);
  }
  const HEAT = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

  const PATIENTS = {};

  function emptyPatient(id, name, age) {
    return {
      id, name, age: age || 0, place: '', profile: 'P01', phone: '',
      phq: [], phqDates: [], sleep: null, braceletStatus: '', adherence: null,
      next: '', nextShort: '', consent: false, consentKey: id, signal: '',
      lastCheckin: '', checkinDays: null, summary: null, audios: 0, timeline: [],
      ctx: { dano: 0, perdida: 0 }, practice: [], lastSession: null,
      // sin modulesEnabled → la app usa la ruta clínica hasta que el admin configure
    };
  }

  /** Seed operativo vacío (cero datos). */
  function seed() {
    return {
      v: 5,
      people: [],
      patients: {},
      assets: [],
      alerts: [],
      crisisLog: [],
      closedToday: [],
      worklists: { andres: [], mj: [] },
      weekBase: { andres: 0, mj: 0 },
      rejected: { andres: 0, mj: 0 },
      pendingSync: { andres: 0, mj: 0 },
      notices: { andres: [], mj: [] },
      flags: [],
      territories: [],
      experts: [],
      pathRequests: [],
      pathOverrides: {},
      referrals: [],
      notes: {},
      pathAdjust: {},
      consents: {},
      visits: {},
      diana: { crisis: false },
      pins: {},
      reports: {},
      customReports: [],
      agentLog: [],
      falsePositives: [],
      aiLog: [],
      revisits: { andres: [], mj: [] },
      rosalbaSummary: false,
      rosalbaWA: { step: 0, answered: null, crisis: false, inbox: [] },
      notifs: { clin: [], andres: [], mj: [], admin: [], fin: [], inv: [], inst: [], oscar: [] },
      dianaInbox: [],
      caseload: [],
      accounts: [],
    };
  }

  /** Completa claves faltantes sin reintroducir datos demo. */
  function ensure(s) {
    const def = {
      people: [],
      patients: {},
      assets: [],
      recursos: {
        status: {}, courseEdits: {}, rules: REC.RULES.map(r => r.slice()), assigned: [],
        people: {}, booklets: {}, terrCourses: {},
      },
      rules: {
        risk: RISK.map(r => ({ k: r.k, min: r.min, max: r.max, c: r.c })),
        dig: { q: DIGQ.map(x => ({ q: x.q, o: x.o.map((o, i) => ({ o, p: i })) })), cuts: DIG.map(d => ({ k: d.k, min: d.min, max: d.max })) },
        auto: { expert: 'vereda', clin: 'carga', review: 'Cada 4 semanas' },
        goals: { daily: 9, weekly: 45 },
        pending: null,
        versions: [
          { v: 2, by: 'Daniel Galvis', at: Date.parse('2026-10-08'), what: 'Matriz v2: sin teléfono ⇒ Baja; uso diario ≤ teléfono; ánimo en app solo con capacidad Alta; cursos con el experto en Baja; PM+ en Moderado y Moderado-severo; revisitas en Leve.' },
          { v: 1, by: 'Sistema', at: Date.parse('2026-09-01'), what: 'Reglas iniciales del programa.' },
        ],
      },
      accounts: [],
      activity: [],
      terrOv: {}, expertOv: {}, personOv: {}, assetOv: {}, accessLog: {},
      schedules: [],
      oscarPlan: {},
      groupSessions: { andres: [], mj: [] },
      customReports: [],
      pathOverrides: {},
    };
    let changed = false;
    Object.keys(def).forEach(k => { if (s[k] === undefined) { s[k] = def[k]; changed = true; } });
    if (!s.notifs) { s.notifs = { clin: [], andres: [], mj: [], admin: [], fin: [], inv: [], inst: [], oscar: [] }; changed = true; }
    if (s.notifs && !s.notifs.oscar) { s.notifs.oscar = []; changed = true; }
    if (!Array.isArray(s.accounts)) { s.accounts = []; changed = true; }
    if (s.rules && (!Array.isArray(s.rules.versions) || !s.rules.versions.length)) {
      s.rules.versions = [
        { v: 2, by: 'Daniel Galvis', at: Date.parse('2026-10-08'), what: 'Matriz v2: sin teléfono ⇒ Baja; uso diario ≤ teléfono; ánimo en app solo con capacidad Alta; cursos con el experto en Baja; PM+ en Moderado y Moderado-severo; revisitas en Leve.' },
        { v: 1, by: 'Sistema', at: Date.parse('2026-09-01'), what: 'Reglas iniciales del programa.' },
      ];
      changed = true;
    } else if (s.rules && Array.isArray(s.rules.versions) && !s.rules.versions.some((v) => Number(v.v) === 2)) {
      s.rules.versions.unshift({
        v: 2,
        by: 'Daniel Galvis',
        at: Date.parse('2026-10-08'),
        what: 'Matriz v2: sin teléfono ⇒ Baja; uso diario ≤ teléfono; ánimo en app solo con capacidad Alta; cursos con el experto en Baja; PM+ en Moderado y Moderado-severo; revisitas en Leve.',
      });
      changed = true;
    }
    // Matriz v2: los textos de cursos viven en Mongo (app_state.recursos.rules) y
    // pisaban la plantilla. Si aún no hay matrixVersion ≥ 2, forzar REC.RULES.
    if (s.recursos) {
      const matrixV = Number(s.rules?.matrixVersion || 0);
      const rules = Array.isArray(s.recursos.rules) ? s.recursos.rules : null;
      const looksV1 = rules && rules.some((row) =>
        Array.isArray(row) && (
          /TEO o por WhatsApp/.test(String(row[1] || '')) ||
          (/revisión del experto en la revisita/.test(String(row[1] || '')) && !/capacidad digital baja/.test(String(row[1] || ''))) ||
          /dentro de PM\+/.test(String(row[1] || ''))
        ),
      );
      if (matrixV < 2 || looksV1 || !rules || !rules.length) {
        s.recursos.rules = REC.RULES.map((r) => r.slice());
        if (s.rules) s.rules.matrixVersion = 2;
        changed = true;
      }
    }
    // Reglas hidratadas desde Mongo a veces vienen incompletas (solo cuts, sin dig.q).
    if (s.rules) {
      if (!Array.isArray(s.rules.risk) || !s.rules.risk.length) {
        s.rules.risk = RISK.map(r => ({ k: r.k, min: r.min, max: r.max, c: r.c }));
        changed = true;
      }
      if (!s.rules.dig || typeof s.rules.dig !== 'object') {
        s.rules.dig = {};
        changed = true;
      }
      if (!Array.isArray(s.rules.dig.q) || !s.rules.dig.q.length) {
        s.rules.dig.q = DIGQ.map(x => ({ q: x.q, o: x.o.map((o, i) => ({ o, p: i })) }));
        changed = true;
      }
      if (!Array.isArray(s.rules.dig.cuts) || !s.rules.dig.cuts.length) {
        s.rules.dig.cuts = DIG.map(d => ({ k: d.k, min: d.min, max: d.max }));
        changed = true;
      }
      if (!s.rules.auto) {
        s.rules.auto = { expert: 'vereda', clin: 'carga', review: 'Cada 4 semanas' };
        changed = true;
      }
      if (!s.rules.goals || typeof s.rules.goals !== 'object') {
        s.rules.goals = { daily: 9, weekly: 45 };
        changed = true;
      } else {
        const d = Number(s.rules.goals.daily);
        const w = Number(s.rules.goals.weekly);
        // 0 no es meta válida (rompe las barras «X de 0»).
        if (!(Number.isFinite(d) && d >= 1)) { s.rules.goals.daily = 9; changed = true; }
        if (!(Number.isFinite(w) && w >= 1)) { s.rules.goals.weekly = 45; changed = true; }
      }
    }
    if (!s.patients || typeof s.patients !== 'object') { s.patients = {}; changed = true; }
    if (!Array.isArray(s.crisisLog)) { s.crisisLog = []; changed = true; }
    // Criterio de duración mínima retirado: quitar flags obsoletos y validar esas visitas.
    if (Array.isArray(s.flags) && s.flags.length) {
      const isDurReason = (r) => /mínimo\s*20|minimo\s*20|menos de\s*20\s*minutos|entrevista de\s+\d+/i.test(String(r || ''));
      const isDurOnly = (f) => Array.isArray(f.reasons) && f.reasons.length > 0 && f.reasons.every(isDurReason);
      const obsolete = s.flags.filter(isDurOnly);
      if (obsolete.length) {
        obsolete.forEach((f) => {
          if (f.fromVisit && f.wid && f.expert && s.worklists && s.worklists[f.expert]) {
            const w = s.worklists[f.expert].find((x) => x.id === f.wid);
            if (w && (w.status === 'revision' || f.status === 'pending')) w.status = 'validada';
          }
        });
        s.flags = s.flags.filter((f) => !isDurOnly(f));
        changed = true;
      }
    }
    return changed;
  }
  function applyRules(s) {
    if (!s.rules) return;
    ensure(s);
    (s.rules.risk || []).forEach((r, i) => { if (RISK[i]) Object.assign(RISK[i], { k: r.k, min: r.min, max: r.max, c: r.c }); });
    ((s.rules.dig && s.rules.dig.cuts) || []).forEach((c, i) => { if (DIG[i]) Object.assign(DIG[i], { min: c.min, max: c.max }); });
  }
  function syncPatients(s) {
    Object.keys(PATIENTS).forEach(k => { if (!(s.patients && s.patients[k])) delete PATIENTS[k]; });
    Object.assign(PATIENTS, s.patients || {});
    CASE_IDS.length = 0;
    (s.caseload || []).forEach(c => { if (c && c.id) CASE_IDS.push(c.id); });
    TERRS.length = 0;
    (s.territories || []).forEach(t => {
      TERRS.push({
        name: t.name, dep: t.dep || '', level: t.level || '',
        cap: t.cap || 0, goal: t.goal || 0,
        rural: t.rural || 0, ruralG: t.ruralG || 0,
        sixty: t.sixty || 0, sixtyG: t.sixtyG || 0,
        pace: t.pace || 0,
        brA: t.brA != null ? t.brA : (t.br || 0),
        brD: t.brD || 0,
        brAv: t.brAv != null ? t.brAv : (t.br || 0),
        insts: t.insts || [], content: t.content || [], places: t.places || [],
        isNew: !!t.isNew,
      });
    });
    EXPERT_LIST.length = 0;
    experts(s).forEach(e => EXPERT_LIST.push(e));
    ROSTER.length = 0;
    people(s).forEach(p => ROSTER.push(p));
  }

  let cache = null;
  function get() {
    if (!cache) {
      cache = seed();
      ensure(cache);
      applyRules(cache);
      syncPatients(cache);
    }
    return cache;
  }
  function save() {
    if (cache) syncPatients(cache);
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('nara-change'));
  }
  function set(fn) { const s = get(); fn(s); ensure(s); cache = s; save(); schedulePersist({ get }); }
  function reset() {
    cache = seed();
    ensure(cache);
    sessionId = null;
    devFlag = false;
    save();
  }
  function subscribe(cb) {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('nara-change', cb);
    return () => { window.removeEventListener('nara-change', cb); };
  }

  function ensureExpertBuckets(s, ex) {
    if (!ex) return;
    s.worklists = s.worklists || {};
    if (!Array.isArray(s.worklists[ex])) s.worklists[ex] = [];
    s.revisits = s.revisits || {};
    if (!Array.isArray(s.revisits[ex])) s.revisits[ex] = [];
    s.groupSessions = s.groupSessions || {};
    if (!Array.isArray(s.groupSessions[ex])) s.groupSessions[ex] = [];
    s.notifs = s.notifs || {};
    if (!Array.isArray(s.notifs[ex])) s.notifs[ex] = [];
    s.notices = s.notices || {};
    if (!Array.isArray(s.notices[ex])) s.notices[ex] = [];
    s.weekBase = s.weekBase || {};
    if (s.weekBase[ex] == null) s.weekBase[ex] = 0;
    s.rejected = s.rejected || {};
    if (s.rejected[ex] == null) s.rejected[ex] = 0;
    s.pendingSync = s.pendingSync || {};
    if (s.pendingSync[ex] == null) s.pendingSync[ex] = 0;
  }
  function teamGoals(s) {
    ensure(s);
    const g = (s.rules && s.rules.goals) || {};
    const d = Number(g.daily);
    const w = Number(g.weekly);
    const daily = Number.isFinite(d) && d >= 1 ? d : 9;
    const weekly = Number.isFinite(w) && w >= 1 ? w : Math.max(45, daily * 5);
    return { daily, weekly };
  }
  function dayStartMs(ts) {
    const d = new Date(ts || Date.now());
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function weekStartMs(ts) {
    const d = new Date(ts || Date.now());
    const monOffset = (d.getDay() + 6) % 7; // lunes = inicio de semana operativa
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - monOffset);
    return d.getTime();
  }
  function visitStamp(w) {
    const raw = w && (w.validatedAt || w.at || w.updatedAt || w.createdAt);
    if (raw == null || raw === '') return 0;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    const parsed = Date.parse(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  /** Claves con las que puede estar indexada la cola de un experto (id, accountId, name, legado). */
  function expertWorklistKeys(s, ex) {
    const keys = new Set();
    if (ex != null && ex !== '') keys.add(String(ex));
    const expert = (s.experts || []).find(
      (e) =>
        e &&
        (e.id === ex ||
          e.accountId === ex ||
          e.name === ex ||
          String(e.id) === String(ex) ||
          String(e.accountId || '') === String(ex)),
    );
    if (expert) {
      if (expert.id) keys.add(String(expert.id));
      if (expert.accountId) keys.add(String(expert.accountId));
      if (expert.name) keys.add(String(expert.name));
    }
    // Alias demo legado
    if (ex === 'andres' || (expert && expert.name === 'Andrés Ocampo')) keys.add('andres');
    if (ex === 'mj' || (expert && expert.name === 'María José Vélez')) keys.add('mj');
    return [...keys];
  }
  function worklistForExpert(s, ex) {
    const seen = new Set();
    const out = [];
    expertWorklistKeys(s, ex).forEach((k) => {
      ensureExpertBuckets(s, k);
      (s.worklists[k] || []).forEach((w) => {
        if (!w) return;
        const id = w.id != null ? String(w.id) : '';
        const dedupe = id || JSON.stringify([w.name, w.at, w.status]);
        if (seen.has(dedupe)) return;
        seen.add(dedupe);
        out.push(w);
      });
    });
    return out;
  }
  function quotas(s, ex) {
    ensureExpertBuckets(s, ex);
    const wl = worklistForExpert(s, ex);
    // Cuentan visitas cerradas en campo (evaluadas, por aprobar o crisis).
    const done = wl.filter(x => x && (x.status === 'validada' || x.status === 'por_aprobar' || x.status === 'crisis'));
    const day0 = dayStartMs();
    const week0 = weekStartMs();
    const inToday = (w) => {
      const t = visitStamp(w);
      return t ? t >= day0 : true; // sin fecha → sesión actual
    };
    const inWeek = (w) => {
      const t = visitStamp(w);
      return t ? t >= week0 : true;
    };
    const todayVisits = done.filter(inToday);
    const weekVisits = done.filter(inWeek);
    const g = teamGoals(s);
    // Cuotas rural / 60+: por territorio del experto, o proporciones de la meta diaria.
    const expert =
      (s.experts || []).find(e => e && (e.id === ex || e.accountId === ex || e.name === ex)) || null;
    const terrName = expert && expert.terr ? expert.terr : null;
    const terr = terrName ? terrInfo(s, terrName) : null;
    const ruralPct = terr && Number(terr.ruralG) > 0 ? Number(terr.ruralG) : 20;
    const sixtyPct = terr && Number(terr.sixtyG) > 0 ? Number(terr.sixtyG) : 25;
    let ruralT = Math.max(1, Math.round((g.daily * ruralPct) / 100));
    let sixtyT = Math.max(1, Math.round((g.daily * sixtyPct) / 100));
    if (ex === 'andres' || (expert && expert.name === 'Andrés Ocampo')) {
      ruralT = Math.max(ruralT, 5);
      sixtyT = Math.max(sixtyT, 3);
    } else if (ex === 'mj' || (expert && expert.name === 'María José Vélez')) {
      ruralT = Math.max(ruralT, 1);
      sixtyT = Math.max(sixtyT, 2);
    }
    // Semana = base previa + validadas de la semana − rechazos de QC.
    const weekBaseN = expertWorklistKeys(s, ex).reduce(
      (n, k) => n + (Number(s.weekBase[k]) || 0),
      0,
    );
    const rejectedN = expertWorklistKeys(s, ex).reduce(
      (n, k) => n + (Number(s.rejected[k]) || 0),
      0,
    );
    const week = Math.max(0, weekBaseN + weekVisits.length - rejectedN);
    return {
      today: todayVisits.length,
      todayT: g.daily,
      week,
      weekT: g.weekly,
      rural: todayVisits.filter(x => x.rural).length,
      ruralT,
      sixty: todayVisits.filter(x => Number(x.age) >= 60).length,
      sixtyT,
    };
  }
  function openFlags(s, ex) {
    const keys = new Set(expertWorklistKeys(s, ex));
    return (s.flags || []).filter((f) => {
      if (!f || f.status !== 'pending') return false;
      // No contar solo duración (ruido obsoleto).
      const reasons = f.reasons || [];
      if (
        reasons.length > 0 &&
        reasons.every((r) =>
          /mínimo\s*20|minimo\s*20|menos de\s*20\s*minutos|entrevista de\s+\d+/i.test(
            String(r || ''),
          ),
        )
      ) {
        return false;
      }
      const ek = f.expert != null ? String(f.expert) : '';
      const eid = f.expertId != null ? String(f.expertId) : '';
      const en = f.expertName != null ? String(f.expertName) : '';
      return keys.has(ek) || keys.has(eid) || keys.has(en);
    }).length;
  }

  /** Personas/pacientes a cargo del experto (por id, accountId o nombre). */
  function expertCaseloadIds(s, ex) {
    const keys = new Set(expertWorklistKeys(s, ex));
    const ids = new Set();
    (s.people || []).forEach((p) => {
      if (!p) return;
      const ek = p.expert != null ? String(p.expert) : '';
      const eid = p.expertId != null ? String(p.expertId) : '';
      if (keys.has(ek) || keys.has(eid)) {
        if (p.id != null) ids.add(String(p.id));
        if (p.code) ids.add(String(p.code));
      }
    });
    const patients = s.patients || {};
    Object.keys(patients).forEach((pid) => {
      const p = patients[pid];
      if (!p) return;
      const ek = p.expert != null ? String(p.expert) : '';
      const eid = p.expertId != null ? String(p.expertId) : '';
      if (keys.has(ek) || keys.has(eid) || ids.has(String(p.id || pid))) {
        ids.add(String(p.id || pid));
      }
    });
    return ids;
  }

  /**
   * Alertas abiertas del experto: QC pendiente + crisis abiertas
   * (alertas, cola en crisis, fichas en Crisis).
   */
  function expertAlertCount(s, ex) {
    const keys = new Set(expertWorklistKeys(s, ex));
    const caseload = expertCaseloadIds(s, ex);
    const crisisPids = new Set();
    let n = openFlags(s, ex);

    (s.alerts || []).forEach((a) => {
      if (!a || a.sev !== 'crisis') return;
      if (/closed|cerrada|dismissed|other/i.test(String(a.status || ''))) return;
      const aEx = a.expert != null ? String(a.expert) : '';
      const aExId = a.expertId != null ? String(a.expertId) : '';
      const pid = a.pid != null ? String(a.pid) : '';
      const match =
        keys.has(aEx) ||
        keys.has(aExId) ||
        (pid && caseload.has(pid)) ||
        (a.source &&
          [...keys].some(
            (k) => k.length > 2 && String(a.source).toLowerCase().includes(k.toLowerCase()),
          ));
      if (!match) return;
      if (pid) {
        if (crisisPids.has(pid)) return;
        crisisPids.add(pid);
      }
      n += 1;
    });

    worklistForExpert(s, ex).forEach((w) => {
      if (!w || w.status !== 'crisis') return;
      const pid = w.id != null ? String(w.id) : w.pid != null ? String(w.pid) : '';
      if (pid && crisisPids.has(pid)) return;
      if (pid) crisisPids.add(pid);
      n += 1;
    });

    const patients = s.patients || {};
    Object.keys(patients).forEach((pid) => {
      const p = patients[pid];
      if (!p) return;
      const id = String(p.id || pid);
      if (!caseload.has(id) && !caseload.has(pid)) return;
      const inCrisis =
        p.crisisLock === true ||
        /crisis/i.test(String(p.status || '')) ||
        /crisis/i.test(String(p.signal || ''));
      if (!inCrisis) return;
      if (crisisPids.has(id) || crisisPids.has(pid)) return;
      crisisPids.add(id);
      n += 1;
    });

    return n;
  }

  /**
   * Estado operativo del experto a partir de cuota, alertas y capacitación.
   * No deja «Capacitación pendiente» si ya tiene visitas reales.
   */
  function expertTeamStatus(s, ex, expertRow) {
    const e = expertRow || (s.experts || []).find(
      (x) => x && (x.id === ex || x.accountId === ex || x.name === ex),
    ) || {};
    const eov = (s.expertOv || {})[e.name || ''] || {};
    const active = eov.active !== false && e.active !== false;
    if (!active) return 'off';
    const q = quotas(s, ex);
    const alerts = expertAlertCount(s, ex);
    if (alerts > 0) return 'rev';
    const goals = teamGoals(s);
    const midWeek = Math.max(1, Math.round((goals.weekly * 34) / 45));
    const hasActivity = (q.today || 0) > 0 || (q.week || 0) > 0;
    if (!hasActivity && (e.isNew || e.training === 'Pendiente')) return 'new';
    if ((q.week || 0) >= midWeek) return 'ok';
    return 'low';
  }

  function minsAgo(at) { return Math.max(0, Math.floor((Date.now() - at) / 60000)); }
  function agoText(at) { const m = minsAgo(at); if (m < 1) return 'hace un momento'; if (m < 60) return 'hace ' + m + ' min'; const h = Math.floor(m / 60); return h < 24 ? 'hace ' + h + ' h' : 'hace ' + Math.floor(h / 24) + ' d'; }
  function countdown(at) {
    const left = 30 * 60000 - (Date.now() - at);
    if (left <= 0) return { late: true, text: 'fuera de tiempo · ' + minsAgo(at) + ' min' };
    const m = Math.floor(left / 60000), sec = Math.floor((left % 60000) / 1000);
    return { late: false, text: m + ':' + String(sec).padStart(2, '0') + ' para la meta de 30 min' };
  }

  // Lista de palabras clave de crisis · mantenida por la líder clínica · revisión mensual (última: 1 sep)
  const CRISIS_TERMS = [
    'suicid', 'suisid', 'matarme', 'matarm', 'quitarme la vida', 'kitarme la vida', 'acabar con mi vida', 'acabar con todo', 'no quiero vivir', 'ya no quiero vivir', 'no kiero vivir',
    'quiero morir', 'kiero morir', 'me quiero morir', 'mejor muert', 'estaria mejor muert', 'estaría mejor muert', 'me muero', 'morirme', 'hacerme da', 'hacerme dano', 'cortarme',
    'ya no aguanto mas', 'ya no aguanto más', 'no aguanto mas', 'no aguanto más', 'quisiera desaparecer', 'quiero desaparecer', 'desaparecer para siempre', 'no quiero seguir', 'no le veo sentido', 'mejor sin mi', 'mejor sin mí', 'ser una carga', 'despedirme'
  ];
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function crisisCheck(text) { const n = norm(text); if (/^\s*ayuda\s*!*$/.test(n)) return 'AYUDA'; const hit = CRISIS_TERMS.find(k => n.includes(norm(k))); return hit || null; }
  function logAgent(role, q, a) { set(s => { s.agentLog.push({ role, q, a: (a || '').slice(0, 200), at: Date.now() }); }); }
  function logAi(pid, channel, text) { set(s => { s.aiLog.push({ pid, channel, text, at: Date.now() }); }); }

  const SAMPLE = {
    severeByTerr: [],
    rejectedMonth: [],
    sleepBands: [],
    weeks: [],
    budget: [],
    improveByDig: [],
    terr: [],
    braceletAvail: []
  };

  function pushNotif(s, key, text, link) { (s.notifs[key] = s.notifs[key] || []).unshift({ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 5), text, link, at: Date.now(), read: false }); }
  function notify(key, text, link) { set(s => pushNotif(s, key, text, link)); }
  /** Log durable de movimientos de crisis (creación, toma, reintento, cierre…). */
  function pushCrisisLog(s, entry) {
    if (!s || !entry) return;
    s.crisisLog = Array.isArray(s.crisisLog) ? s.crisisLog : [];
    const row = Object.assign(
      {
        id: 'cl' + Date.now() + Math.random().toString(36).slice(2, 6),
        at: Date.now(),
      },
      entry,
    );
    s.crisisLog.unshift(row);
    if (s.crisisLog.length > 800) s.crisisLog = s.crisisLog.slice(0, 800);
  }
  function addAlert(a) {
    set(s => {
      const at = a.at || Date.now();
      const row = Object.assign({ at, status: a.sev === 'crisis' ? 'new' : 'open' }, a);
      s.alerts = s.alerts.filter(x => x.id !== a.id); s.alerts.unshift(row);
      if (a.sev === 'crisis') {
        pushCrisisLog(s, {
          type: 'created',
          alertId: row.id,
          pid: row.pid || null,
          name: row.name || 'Sin nombre',
          age: row.age,
          place: row.place,
          profile: row.profile,
          by: row.createdBy || row.source || 'Sistema',
          byRole: row.createdByRole || (/app/i.test(String(row.source || '')) ? 'paciente' : /campo|experto/i.test(String(row.source || '')) ? 'experto' : 'sistema'),
          source: row.source || '',
          what: row.what || 'Alerta de crisis creada',
          detail: row.phone ? 'Teléfono: ' + row.phone : '',
          status: 'new',
          at,
        });
        pushNotif(s, 'clin', 'Nueva alerta de crisis: ' + a.name, '/clinico/crisis');
        if (a.expert) pushNotif(s, a.expert, 'Crisis enviada: ' + a.name + ' · esperando a la clínica de turno', '/experto');
      }
      else if (a.sev === 'info' && /Nueva paciente/.test(a.what)) pushNotif(s, 'clin', 'Nueva paciente asignada: ' + a.name, '/clinico/pacientes');
    });
  }

  // Sesión y modo desarrollador (solo memoria; se pierden al recargar hasta MongoDB)
  const USERS = [];
  let sessionId = null;
  let devFlag = false;
  const ROLE_HREF = {
    Administrador: '/inicio', Administradora: '/inicio',
    'Experto de campo': '/experto', 'Experta de campo': '/experto',
    Clínico: '/clinico', Clínica: '/clinico',
    Paciente: '/paciente', Observador: '/observador',
  };
  const ROLE_ID_HREF = {
    admin: '/inicio', experto: '/experto', clinico: '/clinico',
    paciente: '/paciente', observador: '/observador',
  };
  const ROLE_NK = {
    Administrador: 'admin', Administradora: 'admin',
    Clínico: 'clin', Clínica: 'clin',
  };
  const ROLE_ID_NK = { admin: 'admin', clinico: 'clin' };
  const ROLE_LABEL_TO_ID = {
    Administrador: 'admin', Administradora: 'admin',
    'Experto de campo': 'experto', 'Experta de campo': 'experto',
    Clínico: 'clinico', Clínica: 'clinico',
    Paciente: 'paciente', Observador: 'observador',
  };
  const OBS_MODULES = [
    { id: 'avance', name: 'Avance', desc: 'Captación, cuotas y ritmo (agregado)' },
    { id: 'recursos', name: 'Recursos', desc: 'Presupuesto, manillas y costo por persona (agregado)' },
    { id: 'resultados', name: 'Resultados', desc: 'Mejoría y crisis atendidas (agregado)' },
    { id: 'datos', name: 'Datos seudonimizados', desc: 'Catálogo de datos y solicitudes de extracción (exige número de aprobación ética)' },
    { id: 'casos', name: 'Casos remitidos', desc: 'Solo los casos remitidos a su institución, con autorización del paciente' }
  ];
  // Observador es un solo rol (sin tipos Financiador / Investigación / Institución).
  const OBS_DEFAULT_MODULES = OBS_MODULES.map((m) => m.id);
  /** @deprecated Los 3 tipos quedaron unificados; se mantiene por compatibilidad de lecturas antiguas. */
  const OBS_TEMPLATES = {
    Financiador: OBS_DEFAULT_MODULES.slice(),
    Investigación: OBS_DEFAULT_MODULES.slice(),
    'Institución de salud': OBS_DEFAULT_MODULES.slice(),
  };
  function isAdminRole(role) { return !!role && /Admin/i.test(role); }
  function accountAsUser(a) {
    if (!a || a.status !== 'Activo') return null;
    const role = a.role || '';
    const roleId = a.roleId || ROLE_LABEL_TO_ID[role] || null;
    const href = ROLE_ID_HREF[roleId] || ROLE_HREF[role] || '/ingreso';
    const nk = ROLE_ID_NK[roleId] || ROLE_NK[role] || (roleId === 'experto' || roleId === 'observador' || roleId === 'paciente' ? a.id : null);
    return {
      id: a.id, name: a.name, role, roleId,
      email: a.email || '',
      terr: (a.terr && a.terr !== '—') ? a.terr : (a.orgType || a.org || ''),
      href, nk, contact: a.contact || a.email || '', org: a.org || '',
      patientId: a.patientId || undefined,
      orgType: a.orgType || undefined,
      modules: Array.isArray(a.modules) ? a.modules : undefined,
    };
  }
  function session() {
    if (typeof window === 'undefined' || !sessionId) return null;
    const a = (get().accounts || []).find(x => x.id === sessionId);
    return accountAsUser(a);
  }
  function login(id) {
    if (typeof window === 'undefined') return;
    sessionId = id;
    window.dispatchEvent(new Event('nara-change'));
  }
  function logout() {
    if (typeof window === 'undefined') return;
    sessionId = null;
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .catch(() => {})
      .finally(() => { location.href = '/ingreso'; });
  }
  function requireSession(ids) {
    const u = session();
    if (!u) {
      if (typeof window !== 'undefined') location.replace('/ingreso');
      return null;
    }
    if (!ids) return u;
    const role = u.role || '';
    const roleId = u.roleId || ROLE_LABEL_TO_ID[role] || null;
    const aliases = {
      paula: 'admin', admin: 'admin',
      andres: 'experto', mj: 'experto', experto: 'experto',
      lucia: 'clinico', clinico: 'clinico',
      obs: 'observador', observador: 'observador',
      paciente: 'paciente',
    };
    const ok =
      ids.includes(u.id) ||
      (roleId && ids.includes(roleId)) ||
      ids.some((id) => aliases[id] && aliases[id] === roleId) ||
      ((ids.includes('paula') || ids.includes('admin')) && isAdminRole(role));
    if (!ok) {
      if (typeof window !== 'undefined') location.replace('/ingreso');
      return null;
    }
    return u;
  }
  function devMode() { return !!devFlag; }
  function setDevMode(v) {
    devFlag = !!v;
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('nara-change'));
  }
  const param = k => (typeof window === 'undefined' ? null : new URLSearchParams(location.search).get(k));

  // Catálogos operativos vacíos; la fuente de verdad será MongoDB.
  const PEOPLE = [];
  const CASE_IDS = [];
  function territoryDist(name) {
    const st = get();
    const t = (st.territories || []).find(x => x.name === name);
    if (!t || !t.cap) return null;
    const share = (t.cap || 0) / Math.max(1, (st.territories || []).reduce((a, x) => a + (x.cap || 0), 0));
    const rural = (t.ruralG || 0) / 100;
    const g = HEAT.map((row, ri) => row.map((v, di) => Math.round(v * share * (di === 0 ? Math.min(1.6, 0.6 + rural * 0.3) : di === 2 ? Math.max(0.5, 1.3 - rural * 0.2) : 1))));
    const tot = g.reduce((a, r) => a + r.reduce((b, v) => b + v, 0), 0) || 1;
    const k = (t.cap || 0) / tot;
    const g2 = g.map(r => r.map(v => Math.round(v * k)));
    const diff = (t.cap || 0) - g2.reduce((a, r) => a + r.reduce((b, v) => b + v, 0), 0);
    if (g2[0]) g2[0][1] = (g2[0][1] || 0) + diff;
    return g2;
  }

  const TERRS = [];
  const EXPERT_LIST = [];
  const CLINICIANS = [['Dra. Lucía Marín', 'Quindío'], ['Dr. Felipe Ruiz', 'Risaralda'], ['Dra. Carolina Úsuga', 'Caldas']];
  const TCODE = { 'Salento': 'SAL', 'Armenia': 'ARM', 'Calarcá': 'CAL', 'Pereira': 'PER', 'Manizales': 'MAN', 'Chinchiná': 'CHI' };
  const ROSTER = [];

  function person(s, code) {
    const list = people(s);
    const p = list.find(x => x.code === code || x.id === code);
    if (!p) return null;
    const ov = (s.personOv || {})[code] || (s.personOv || {})[p.code] || {};
    return Object.assign({}, p, ov);
  }
  function people(s) {
    const base = Array.isArray(s.people) ? s.people : [];
    return base.map(p => Object.assign({}, p, (s.personOv || {})[p.code] || (s.personOv || {})[p.id] || {}));
  }
  function terrInfo(s, name) {
    const t = (s.territories || []).find(x => x.name === name);
    if (!t) return null;
    const mapped = {
      name: t.name, dep: t.dep || '', level: t.level || '',
      cap: t.cap || 0, goal: t.goal || 0,
      rural: t.rural || 0, ruralG: t.ruralG || 0,
      sixty: t.sixty || 0, sixtyG: t.sixtyG || 0,
      pace: t.pace || 0,
      brA: t.brA != null ? t.brA : (t.br || 0),
      brD: t.brD || 0,
      brAv: t.brAv != null ? t.brAv : (t.br || 0),
      insts: t.insts || [], content: t.content || [], places: t.places || [],
      isNew: !!t.isNew,
    };
    return Object.assign({}, mapped, (s.terrOv || {})[name] || {});
  }
  function experts(s) {
    return (s.experts || []).map((e, i) => Object.assign({
      id: e.id || ('e' + i),
      name: e.name,
      terr: e.terr,
      today: e.today || 0,
      week: e.week || 0,
      phone: e.phone || '',
      since: e.since || '',
      tablet: e.tablet || null,
      training: e.training || 'Pendiente',
      active: e.active !== false,
      isNew: !!e.isNew,
    }, (s.expertOv || {})[e.name] || {}));
  }
  function assetList(s, terr, kind) {
    const stored = (s.assets || []).filter(a => a.terr === terr && (!kind || a.kind === kind || (kind === 'tablet' ? /^TB-/.test(a.code) : /^MN-/.test(a.code))));
    if (stored.length) {
      return stored.map(x => Object.assign({}, x, (s.assetOv || {})[x.code] || {}));
    }
    const out = [];
    if (kind === 'tablet') {
      experts(s).filter(e => e.terr === terr && e.tablet).forEach(e => {
        out.push({ code: e.tablet, who: e.name, state: 'Asignada', sync: null, bat: null, terr, kind: 'tablet' });
      });
    }
    return out.map(x => Object.assign(x, (s.assetOv || {})[x.code] || {}));
  }
  function ctxFor(pid) { const P = PATIENTS[pid]; return P && P.ctx ? P.ctx : null; }
  function crisisLines(terr) {
    const L = [{ tel: 'tel:123', label: 'Llamar al 123', text: 'Si está en peligro ahora: llame al 123.', sub: 'Emergencias: envía ayuda al lugar.', main: true }, { tel: 'tel:192', label: 'Línea 192, opción 4', text: 'Si necesita hablar con alguien: Línea 192, opción 4.', sub: 'Orientación en salud mental del Ministerio de Salud.' }];
    const s = get(), ov = terr && s.terrOv && s.terrOv[terr];
    if (ov && ov.crisisLine && ov.crisisLine.trim()) L.push({ tel: 'tel:' + ov.crisisLine.replace(/[^\d+]/g, ''), label: ov.crisisLine.trim(), text: 'Línea de crisis de ' + terr + ': ' + ov.crisisLine.trim() + '.', sub: 'Línea local registrada por el programa.' });
    return L;
  }
  // Desempeño del equipo de campo · mismas cifras para la pantalla y para el asistente
  function teamPerf(s, period, terr) {
    const pk = period || '4w';
    const rows = experts(s).filter(e => e.active !== false && (!terr || e.terr === terr)).map(e => {
      const t = terrInfo(s, e.terr) || { ruralG: 0, sixtyG: 0 };
      const exKey = e.id || e.accountId || e.name;
      const q = quotas(s, exKey);
      const weekVisits = q ? q.week : (e.week || 0);
      const vpd = weekVisits ? +(weekVisits / 4.2).toFixed(1) : 0;
      const rejKeys = expertWorklistKeys(s, exKey);
      const rej = rejKeys.reduce((n, k) => n + ((s.rejected && s.rejected[k]) || 0), 0);
      const stKey = expertTeamStatus(s, exKey, e);
      const status =
        stKey === 'rev'
          ? 'Revisar'
          : stKey === 'off'
            ? 'Desactivado'
            : stKey === 'new'
              ? 'Sin datos'
              : stKey === 'ok'
                ? 'Al día'
                : weekVisits === 0
                  ? 'Sin datos'
                  : 'Bajo meta';
      return { name: e.name, terr: e.terr, vpd, dur: 0, gps: 0, ver: 0, rej, gap: 0, rural: 0, ruralG: t.ruralG || 0, sixty: 0, sixtyG: t.sixtyG || 0, status };
    });
    const avg = k => rows.length ? rows.reduce((a, r) => a + r[k], 0) / rows.length : 0;
    const program = { vpd: +avg('vpd').toFixed(1), dur: Math.round(avg('dur')), gps: Math.round(avg('gps')), ver: Math.round(avg('ver')), rej: +avg('rej').toFixed(1), gap: Math.round(avg('gap')), rural: Math.round(avg('rural')), ruralG: Math.round(avg('ruralG')), sixty: Math.round(avg('sixty')), sixtyG: Math.round(avg('sixtyG')) };
    return { rows, program, period: { week: 'Esta semana', '4w': 'Últimas 4 semanas', month: 'Este mes' }[pk] };
  }
  function logActivity(s, uid, text) { (s.activity = s.activity || []).unshift({ uid, text, at: Date.now() }); }
  function logAccess(s, code, who, what) { const l = (s.accessLog = s.accessLog || {}); (l[code] = l[code] || []).unshift({ who, what, at: Date.now() }); }

  // Fechas relativas: el «hoy» de los datos es el martes 29 sep 2026; todas las fechas se corren
  // los mismos días que hay entre esa fecha y la fecha real, y conservan su distancia con hoy.
  const BASE = new Date(2026, 8, 29);
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const OFFSET = Math.round((today0() - BASE) / 86400000);
  const MS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const ML = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const monIdx = m => { m = m.toLowerCase(); if (m === 'sept') return 8; let i = ML.indexOf(m); if (i < 0) i = MS.indexOf(m); return i; };
  const cap = (w, like) => like && like[0] === like[0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w;
  const DRX = /(?:(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)(,?) )?(\d{1,2})(?:(–|-| al | y )(\d{1,2}))?( de)? (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|sept|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?![a-záéíóúñ])( de \d{4}| \d{4})?/gi;
  function shiftDate(day, mon, year, off) { const d = new Date(year || 2026, mon, day); d.setDate(d.getDate() + off); return d; }
  function shiftText(str, off) {
    const o = off === undefined ? OFFSET : off; if (!str || !o) return str;
    return String(str).replace(DRX, (m, wd, comma, d1, sep, d2, de, mon, yr) => {
      const mi = monIdx(mon); if (mi < 0) return m;
      const y = yr ? parseInt(yr.replace(/\D/g, ''), 10) : 2026;
      const a = shiftDate(+d1, mi, y, o), b = d2 ? shiftDate(+d2, mi, y, o) : null, last = b || a;
      const long = mon.length > 4 || mon.toLowerCase() === 'mayo';
      const mName = x => long ? ML[x.getMonth()] : MS[x.getMonth()];
      let out = (wd ? cap(WD[a.getDay()], wd) + comma + ' ' : '') + a.getDate();
      if (b) out += (a.getMonth() !== b.getMonth() ? (de || '') + ' ' + mName(a) : '') + sep + b.getDate();
      out += (de || '') + ' ' + (mon[0] === mon[0].toUpperCase() ? cap(mName(last), 'X') : mName(last));
      if (yr) out += (/de/.test(yr) ? ' de ' : ' ') + last.getFullYear();
      return out;
    });
  }
  // Para fechas reales (Date.now): se escriben en la escala de los datos y la capa de fechas las lleva a hoy.
  function fmtDay(d, opts) { const x = new Date(d); x.setDate(x.getDate() - OFFSET); return (opts && opts.wd ? cap(WD[x.getDay()], 'X') + ' ' : '') + x.getDate() + ' ' + (opts && opts.long ? ML[x.getMonth()] : MS[x.getMonth()]) + (opts && opts.year ? ' ' + x.getFullYear() : ''); }
  function installDateShift() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!OFFSET || window.__alientoShift) return; window.__alientoShift = true;
    const done = new WeakMap(), TEST = new RegExp(DRX.source, 'i');
    // Texto que escribe un usuario: nunca se desplaza. Además de [data-real-date], se recuerda lo escrito con fecha
    // (TKEY) para que tampoco se corra cuando se muestra dentro de otro texto (alertas, notificaciones, fichas).
    let typed = [];
    const slot = new WeakMap();
    document.addEventListener('input', e => {
      const el = e.target; if (!el || !/^(INPUT|TEXTAREA)$/.test(el.tagName) || /^(date|time|number|password|checkbox|radio)$/i.test(el.type || '')) return;
      const v = String(el.value || '').trim(), i = slot.get(el);
      if (!TEST.test(v)) { if (i !== undefined) { typed[i] = ''; } return; }
      if (i !== undefined && typed[i] !== undefined) typed[i] = v; else { typed.push(v); slot.set(el, typed.length - 1); }
      typed = typed.filter(Boolean).slice(-200);
    }, true);
    const isTyped = v => { const t = v.trim(); return typed.some(r => r && (t.includes(r) || (t.length >= 5 && r.includes(t)))); };
    const fixText = n => {
      const v = n.nodeValue; if (done.get(n) === v || !v || v.length < 5) return;
      const p = n.parentElement; if (p && p.closest && p.closest('[data-real-date],script,style,textarea,x-dc,template')) { done.set(n, v); return; }
      if (!TEST.test(v) || isTyped(v)) { done.set(n, v); return; }
      const out = shiftText(v); done.set(n, out); if (out !== v) n.nodeValue = out;
    };
    const walk = root => { if (root.nodeType === 3) return fixText(root); if (root.nodeType !== 1) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) fixText(t); };
    const start = () => { walk(document.body); new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') fixText(m.target); else m.addedNodes.forEach(walk); })).observe(document.body, { subtree: true, childList: true, characterData: true }); };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }
  installDateShift();

  // Mapa del territorio: cifras por vereda o barrio derivadas del store (sin mocks)
  function placeMap(s, terr) {
    const t = terrInfo(s, terr); if (!t) return null;
    const exps = experts(s).filter(e => e.terr === terr && e.active !== false);
    const sess = [].concat((s.groupSessions || {}).andres || [], (s.groupSessions || {}).mj || []);
    const short = n => n.replace(/^(Vereda|Barrio) /, '');
    const cohort = people(s).filter(p => p.terr === terr);
    const places = (t.places && t.places.length)
      ? t.places
      : Array.from(new Set(cohort.map(p => p.place).filter(Boolean))).map(name => [name, /Vereda/i.test(name), cohort.filter(p => p.place === name).length]);
    const rows = places.map(([name, rural, nStored], i) => {
      const local = cohort.filter(p => p.place === name || (p.place && p.place.indexOf(short(name)) > -1));
      const n = local.length || nStored || 0;
      const goal = t.goal && places.length ? Math.round(t.goal / places.length) : n;
      const risk = [0, 0, 0, 0, 0];
      local.forEach(p => { const ri = parseCode(p.profile || 'P01').r; if (ri >= 0 && ri < 5) risk[ri]++; });
      const al = (s.alerts || []).filter(a => a.place && a.place.indexOf(short(name)) > -1 && !/closed|cerrada/.test(a.status || ''));
      const ex = exps[i % Math.max(1, exps.length)] || null;
      const next = sess.filter(g => (g.title + ' ' + g.place).indexOf(short(name)) > -1).map(g => (g.kind === 'pmplus' ? 'PM+ · ' : 'Grupo de apoyo · ') + 'hoy ' + g.time);
      const bands = local.filter(p => parseCode(p.profile || 'P01').r >= 2).length;
      return {
        name, rural: !!rural, n, goal, pct: goal ? Math.round(n / goal * 100) : 0,
        sixty: local.filter(p => (p.age || 0) >= 60).length,
        risk, km: 0,
        alerts: al.length, crisis: al.filter(a => a.sev === 'crisis').length,
        alertList: al.map(a => a.name + ' · ' + (a.sev === 'crisis' ? 'crisis' : 'revisar')),
        expert: ex ? ex.name : 'Sin asignar', next, bands, bandsFree: 0,
      };
    });
    const low = rows.filter(r => r.goal > 0 && r.pct < 30), farSev = rows.filter(r => r.risk[4] > 0 && r.km > 20);
    return { terr, rows, low, farSev, summary: rows.length ? (low.length + (low.length === 1 ? ' vereda o barrio' : ' veredas o barrios') + ' bajo el 30 % de captación · ' + farSev.length + ' con personas en riesgo severo sin clínico a menos de 20 km') : 'Sin veredas ni barrios registrados' };
  }
  const small = v => v > 0 && v < 10 ? 'Menos de 10' : String(v);

  const AlientoStore = {
    OFFSET, shiftText, fmtDay, today0, needsSocial, crisisLines, ctxFor, teamPerf, OBS_MODULES, OBS_DEFAULT_MODULES, OBS_TEMPLATES, ensure, TERRS, EXPERT_LIST, CLINICIANS, ROSTER, TCODE, person, people, terrInfo, experts, assetList, logActivity, logAccess,
    KEY, C, RISK, DIG, PHQ, PHQ_OPTS, Q9_EXACT, DIGQ, CTX, SERVICES, CLIN_CH, HEAT, PATIENTS, emptyPatient,
    riskIdx, digIdx, code, parseCode, defaultPath, pathList, appModuleIdsFromPath, cursosFreq, cursosMod,
    get, set, reset, subscribe, ensureExpertBuckets, teamGoals, quotas, openFlags, expertAlertCount, expertTeamStatus, minsAgo, agoText, countdown, addAlert, pushCrisisLog,
    CRISIS_TERMS, crisisCheck, logAgent, logAi, SAMPLE,
    USERS, session, login, logout, requireSession, devMode, setDevMode, param, notify, pushNotif, PEOPLE, CASE_IDS, territoryDist, placeMap, small, REC, recPerson, courseProgress
  };

if (typeof window !== 'undefined') {
  window.AlientoStore = AlientoStore;
}

export default AlientoStore;
