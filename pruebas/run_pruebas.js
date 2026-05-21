/**
 * run_pruebas.js — Arnés de pruebas automatizado del contrato funcional.
 *
 * Carga `index.html` en jsdom, lo arranca con `dataset_pruebas.json` y ejecuta
 * aserciones reales sobre la lógica de dominio (MP, CICLO, PENDIENTE) y sobre
 * las correcciones de Fase 1. Lo que no es accesible en tiempo de ejecución
 * (funciones internas) se verifica con aserciones sobre el código fuente.
 *
 * Requisito:  npm install jsdom
 * Uso:        node pruebas/run_pruebas.js
 * Salida:     reporte por consola + código de salida 0 (todo OK) / 1 (fallos).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dataset = JSON.parse(fs.readFileSync(path.join(__dirname, 'dataset_pruebas.json'), 'utf8'));

// Bloque <script> principal de la app (para aserciones sobre el fuente).
let appSrc = '';
{
  const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) if (m[1].includes("use strict")) appSrc = m[1];
}

// ---- mini framework de aserciones ----
const results = [];
function check(id, desc, fn) {
  try { fn(); results.push({ id, desc, ok: true }); }
  catch (e) { results.push({ id, desc, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'aserción falló'); }

(async () => {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/',
    beforeParse(window) {
      window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
      if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      // Pre-sembrar datos para que boot() los cargue sin pasar por migración.
      const L = window.localStorage;
      L.setItem('pmp.v3.meta', JSON.stringify({ schemaVersion: 1, appVersion: '3.0.0-it1' }));
      L.setItem('pmp.v3.equipos', JSON.stringify(dataset.equipos));
      L.setItem('pmp.v3.pendientes', JSON.stringify(dataset.pendientes));
      L.setItem('pmp.v3.asignaciones', JSON.stringify(dataset.asignaciones));
      L.setItem('pmp.v3.contactos', JSON.stringify(dataset.contactos || {}));
      L.setItem('pmp.v3.session', JSON.stringify(dataset.session || {}));
      L.setItem('pmp.v3.usuario', 'Ricardo Matus Aroca');
      L.setItem('pmp.v3.ultimaApertura', new Date().toISOString().slice(0, 10));
    },
  });
  const { window } = dom;
  const doc = window.document;

  // Esperar a que boot() termine (DOMContentLoaded + setTimeout interno de 600 ms).
  await new Promise(r => setTimeout(r, 900));
  const P = window.__pmp;
  if (!P) { console.error('FATAL: __pmp no disponible — la app no arrancó.'); process.exit(1); }

  // helpers de UI
  const ahora = '2026-05-15';
  function modalActual() { return doc.querySelector('#modals .backdrop .modal'); }
  // Los modales se cierran con un setTimeout de animación; en el arnés síncrono
  // hay que limpiarlos a mano antes de abrir el siguiente.
  function cerrarModales() { doc.querySelectorAll('#modals .backdrop').forEach(b => b.remove()); }
  function setCampo(root, labelStart, value, evt) {
    const f = [...root.querySelectorAll('.field')]
      .find(x => (x.querySelector('label')?.textContent || '').trim().startsWith(labelStart));
    if (!f) throw new Error('campo no encontrado: ' + labelStart);
    const ctl = f.querySelector('input,select,textarea');
    ctl.value = value;
    ctl.dispatchEvent(new window.Event(evt || 'input', { bubbles: true }));
    return ctl;
  }
  function clickBoton(root, textoRe) {
    const b = [...root.querySelectorAll('button')].find(x => textoRe.test(x.textContent));
    if (!b) throw new Error('botón no encontrado: ' + textoRe);
    b.click();
  }
  function toastsDanger() {
    return [...doc.querySelectorAll('#toasts .toast.danger')].map(t => t.textContent);
  }
  function limpiarToasts() { doc.querySelectorAll('#toasts .toast').forEach(t => t.remove()); }

  // ============================================================
  // GRUPO A — Arranque y carga de datos
  // ============================================================
  check('A-01', 'La app arranca y carga 60 equipos del dataset', () => {
    assert(P.STATE.equipos.length === 60, 'equipos=' + P.STATE.equipos.length);
  });
  check('A-02', 'Conteo por estado coherente con el dataset', () => {
    const c = P.EQ.countByEstado();
    assert(c.Operativo === 38 && c.ServicioTecnico === 6 && c.Recepcionado === 3,
      JSON.stringify(c));
  });
  check('A-03', 'Pendientes cargados', () => {
    assert(P.STATE.pendientes.length >= 8, 'pendientes=' + P.STATE.pendientes.length);
  });

  // ============================================================
  // GRUPO B — Lógica de dominio: MP y ciclo correctivo v34
  // ============================================================
  check('B-MP-01', 'MP.register con resultado SI deja el equipo Operativo', () => {
    const e = P.STATE.equipos.find(x => x.estado === 'Operativo' && !x.esSlot);
    const n0 = (e.historial || []).length;
    const r = P.MP.register(e.uuid, { fechaEvento: ahora + 'T12:00:00.000Z', mes: 5, resultado: 'SI', ejecutor: 'Ricardo Matus Aroca', estadoFinal: 'Operativo' });
    assert(r.equipo.historial.length === n0 + 1, 'historial no creció');
    assert(r.equipo.estado === 'Operativo', 'estado=' + r.equipo.estado);
  });
  check('B-CIC-01', 'CICLO.crearSolicitud abre ciclo y deja el equipo NoOperativo', () => {
    const e = P.STATE.equipos.find(x => x.estado === 'Operativo' && !x.esSlot && (x.correctivos || []).length === 0);
    const r = P.CICLO.crearSolicitud(e.uuid, { fechaEvento: ahora + 'T12:00:00.000Z', folioSigem: '26-0001', responsable: 'Ignacio Berner Bergara', observaciones: 'prueba' });
    assert(r.ciclo && r.ciclo.abierto, 'ciclo no abierto');
    assert(r.equipo.estado === 'NoOperativo', 'estado=' + r.equipo.estado);
    assert(r.pendiente, 'no se creó el pendiente automático');
  });
  check('B-CIC-02', 'CICLO.agregarEnvio (ciclo nuevo) deja el equipo en ServicioTecnico', () => {
    const e = P.STATE.equipos.find(x => x.estado === 'Operativo' && !x.esSlot && (x.correctivos || []).length === 0);
    const r = P.CICLO.agregarEnvio(e.uuid, null, { fechaEvento: ahora + 'T12:00:00.000Z', numeroEnvio: '5001', empresaST: 'TecnoSalud SpA', responsable: 'Matías Soazo Garrido' });
    assert(r.ciclo && r.ciclo.envios.length === 1, 'envío no registrado');
    assert(r.equipo.estado === 'ServicioTecnico', 'estado=' + r.equipo.estado);
  });
  check('B-CIC-03', 'CICLO.crear (shim viejo) con folioSigem vacío sigue lanzando error (causa raíz de B-01)', () => {
    const e = P.STATE.equipos.find(x => x.estado === 'Operativo' && !x.esSlot);
    let lanzo = false;
    try { P.CICLO.crear(e.uuid, { fechaEvento: ahora, folioSigem: '', responsable: 'X' }); }
    catch (err) { lanzo = /modelo viejo/.test(err.message); }
    assert(lanzo, 'el shim no lanzó el error esperado');
  });

  // ============================================================
  // GRUPO C — Verificación de las correcciones de Fase 1 (runtime)
  // ============================================================

  // B-01: vinculación de causal C2 — modo "crear ciclo con envío ya hecho".
  check('C-B01', 'B-01 · Vincular causal C2 creando ciclo nuevo NO lanza "modelo viejo" y crea el ciclo', () => {
    cerrarModales(); limpiarToasts();
    const e = P.STATE.equipos.find(x => x.estado === 'Operativo' && !x.esSlot && (x.correctivos || []).length === 0);
    const reg = P.MP.register(e.uuid, { fechaEvento: ahora + 'T12:00:00.000Z', mes: 5, resultado: 'C2', ejecutor: 'Ricardo Matus Aroca' });
    const nCiclos0 = (e.correctivos || []).length;
    P.abrirModalVinculacionC2(reg.equipo, reg.mp);
    const m = modalActual();
    assert(m, 'no se abrió el modal C2');
    setCampo(m, 'Fecha del envío', ahora, 'change');
    setCampo(m, 'Empresa', 'TecnoSalud SpA', 'input');
    setCampo(m, 'Folio de envío', '5100', 'input');
    setCampo(m, 'Responsable', 'Ignacio Berner Bergara', 'change');
    clickBoton(m, /Confirmar vinculación/);
    const errs = toastsDanger();
    assert(!errs.some(t => /modelo viejo|CICLO\.crear/.test(t)), 'error "modelo viejo": ' + errs.join(' | '));
    assert((e.correctivos || []).length === nCiclos0 + 1, 'no se creó el ciclo');
    assert(reg.mp.correctivoUuid, 'la MP no quedó vinculada al ciclo');
    assert(e.estado === 'ServicioTecnico', 'estado=' + e.estado);
  });

  // B-02: vinculación de causal C3 — modo "crear ciclo nuevo".
  check('C-B02', 'B-02 · Vincular causal C3 creando ciclo nuevo NO lanza "modelo viejo" y crea el ciclo', () => {
    cerrarModales(); limpiarToasts();
    const e = P.STATE.equipos.find(x => x.estado === 'Operativo' && !x.esSlot && (x.correctivos || []).length === 0);
    const reg = P.MP.register(e.uuid, { fechaEvento: ahora + 'T12:00:00.000Z', mes: 5, resultado: 'C3', ejecutor: 'Ricardo Matus Aroca' });
    const nCiclos0 = (e.correctivos || []).length;
    P.abrirModalVinculacionC3(reg.equipo, reg.mp, { motivo: 'C3' });
    const m = modalActual();
    assert(m, 'no se abrió el modal C3');
    setCampo(m, 'Fecha real del problema', ahora, 'change');
    setCampo(m, 'Folio SIGEM', '26-7777', 'input');
    setCampo(m, 'Responsable', 'Daniel Díaz Neira', 'change');
    clickBoton(m, /Confirmar vinculación/);
    const errs = toastsDanger();
    assert(!errs.some(t => /modelo viejo|CICLO\.crear/.test(t)), 'error "modelo viejo": ' + errs.join(' | '));
    assert((e.correctivos || []).length === nCiclos0 + 1, 'no se creó el ciclo');
    assert(reg.mp.correctivoUuid, 'la MP no quedó vinculada');
    assert(e.estado === 'NoOperativo', 'estado=' + e.estado);
  });

  // B-04: selector de ciclo existente en vinculación C3 sin "undefined".
  check('C-B04', 'B-04 · El selector de ciclo existente (C3) no muestra "undefined"', () => {
    cerrarModales();
    const e = P.STATE.equipos.find(x => x.estado === 'ServicioTecnico' && (x.correctivos || []).some(c => c.abierto));
    const reg = P.MP.register(e.uuid, { fechaEvento: ahora + 'T12:00:00.000Z', mes: 5, resultado: 'C3', ejecutor: 'Ricardo Matus Aroca' });
    P.abrirModalVinculacionC3(reg.equipo, reg.mp, { motivo: 'C3' });
    const m = modalActual();
    assert(m, 'no se abrió el modal');
    const sel = [...m.querySelectorAll('select')].find(s => [...s.options].some(o => /Folio|solicitud/.test(o.textContent)));
    assert(sel, 'no se encontró el select de ciclos');
    const txt = [...sel.options].map(o => o.textContent).join(' | ');
    assert(!/undefined/.test(txt), 'el selector contiene "undefined": ' + txt);
    clickBoton(m, /Vincular después|Cancelar/);
  });

  // B-09: el chip de sesión escapa el nombre de archivo (no inyecta HTML).
  check('C-B09', 'B-09 · renderSessionChip escapa el nombre de archivo (sin inyección de HTML)', () => {
    P.STATE.session.archivoCargado = '<img src=x onerror=alert(1)>.xlsx';
    P.persist('session'); // dispara bus state:change -> renderSessionChip
    const chip = doc.querySelector('#sessionChip');
    assert(chip.querySelector('img') === null, 'se inyectó un <img> en el chip de sesión');
    assert(/&lt;img/.test(chip.innerHTML), 'el nombre no quedó escapado: ' + chip.innerHTML);
  });

  // ============================================================
  // GRUPO D — Aserciones sobre el código fuente (lo no accesible en runtime)
  // ============================================================
  check('D-B03a', 'B-03 · construirPayloadBackup incluye tecnicosOficiales y diffIgnorados', () => {
    const p = P.construirPayloadBackup();
    assert('tecnicosOficiales' in p && 'diffIgnorados' in p, 'faltan slices en el payload del respaldo');
  });
  check('D-B03b', 'B-03 · aplicarPayloadBackup restaura tecnicosOficiales y diffIgnorados', () => {
    const payload = P.construirPayloadBackup();
    payload.tecnicosOficiales = ['PRUEBA-RESTAURA'];
    payload.diffIgnorados = { 'clave-prueba': { ts: 'x' } };
    P.aplicarPayloadBackup(payload);
    assert(P.STATE.tecnicosOficiales.includes('PRUEBA-RESTAURA'), 'no restauró tecnicosOficiales');
    assert(P.STATE.diffIgnorados['clave-prueba'], 'no restauró diffIgnorados');
  });
  check('D-B06', 'B-06 · renderCumplimientoSidecar recibe el mes por parámetro', () => {
    assert(/function renderCumplimientoSidecar\(mes\)/.test(appSrc), 'la función no recibe parámetro mes');
    assert(/renderCumplimientoSidecar\(f\.mes\)/.test(appSrc), 'la vista PMP no pasa el mes filtrado');
  });
  check('D-B07', 'B-07 · matchKey tiene clave compuesta de respaldo', () => {
    const blk = appSrc.slice(appSrc.indexOf('function matchKey'), appSrc.indexOf('function matchKey') + 800);
    assert(/n:\$\{compuesta\}|`n:/.test(blk), 'matchKey no tiene clave de respaldo');
  });
  check('D-B08', 'B-08 · imprimirAnexo1 usa el modelo de ciclo v34 (solicitud, no apertura)', () => {
    const blk = appSrc.slice(appSrc.indexOf('function imprimirAnexo1'), appSrc.indexOf('function imprimirAnexo1') + 1600);
    assert(/c\.solicitud\?\.folioSigem/.test(blk), 'no usa c.solicitud');
    assert(!/c\.apertura\?\.folioSigem/.test(blk), 'todavía usa c.apertura');
  });
  check('D-B01src', 'B-01 · el modal C2 ya no llama al shim CICLO.crear', () => {
    const i = appSrc.indexOf('function abrirModalVinculacionC2');
    const blk = appSrc.slice(i, i + 9000);
    assert(/CICLO\.agregarEnvio\(equipo\.uuid,\s*null/.test(blk), 'no usa CICLO.agregarEnvio');
    assert(!/CICLO\.crear\(equipo\.uuid/.test(blk), 'todavía llama a CICLO.crear');
  });
  check('D-B02src', 'B-02 · el modal C3 ya no llama al shim CICLO.crear', () => {
    const i = appSrc.indexOf('function abrirModalVinculacionC3');
    const blk = appSrc.slice(i, i + 13000);
    assert(/CICLO\.crearSolicitud\(equipo\.uuid/.test(blk), 'no usa CICLO.crearSolicitud');
    assert(!/CICLO\.crear\(equipo\.uuid/.test(blk), 'todavía llama a CICLO.crear');
  });

  // ============================================================
  // GRUPO E — No regresión: smoke test de render de vistas
  // ============================================================
  for (const v of ['dash', 'inv', 'pmp', 'ciclos', 'entregas', 'tareas', 'reportes', 'actividad', 'agenda', 'config']) {
    check('E-' + v, 'Render de la vista "' + v + '" sin excepción', () => {
      P.Router.go(v);
      assert(doc.querySelector('#view').children.length > 0, 'la vista quedó vacía');
    });
  }

  // ============================================================
  // GRUPO F — Fase 2: accesibilidad, navegación y limpieza
  // ============================================================
  check('F-01', 'B-11 · los ítems de navegación son accesibles por teclado', () => {
    P.Router.go('dash');
    const items = [...doc.querySelectorAll('#nav .nav-item')];
    assert(items.length >= 9, 'nav-items=' + items.length);
    assert(items.every(i => i.getAttribute('tabindex') === '0' && i.getAttribute('role') === 'button'),
      'algún nav-item no es accesible por teclado');
  });
  check('F-02', 'La navegación está agrupada (rótulos de grupo)', () => {
    const labels = [...doc.querySelectorAll('#nav .nav-group-label')].map(x => x.textContent);
    assert(labels.includes('Operación') && labels.includes('Gestión') && labels.includes('Sistema'),
      'grupos=' + JSON.stringify(labels));
  });
  check('F-03', 'B-10 · field() asocia el <label> con su control vía for/id', () => {
    cerrarModales();
    P.abrirModalNuevoPendiente();
    const m = modalActual();
    const fields = [...m.querySelectorAll('.field')];
    const conLabel = fields.filter(f => {
      const lbl = f.querySelector('label'), ctl = f.querySelector('input,select,textarea');
      return lbl && ctl && ctl.id && lbl.getAttribute('for') === ctl.id;
    });
    assert(conLabel.length >= 1, 'ningún campo tiene label asociado');
    cerrarModales();
  });
  check('F-04', 'B-11 · los KPI clickeables son accesibles por teclado', () => {
    P.Router.go('dash');
    const kpis = [...doc.querySelectorAll('.kpi[role="button"]')];
    assert(kpis.length > 0 && kpis.every(k => k.getAttribute('tabindex') === '0'),
      'KPIs accesibles=' + kpis.length);
  });
  check('F-05', 'Navegación móvil: botón hamburguesa y velo presentes', () => {
    assert(doc.querySelector('#menuToggle'), 'falta #menuToggle');
    assert(doc.querySelector('#navScrim'), 'falta #navScrim');
    doc.querySelector('#menuToggle').dispatchEvent(new window.Event('click', { bubbles: true }));
    assert(doc.querySelector('#app').classList.contains('nav-open'), 'el menú no se abrió');
    doc.querySelector('#navScrim').dispatchEvent(new window.Event('click', { bubbles: true }));
    assert(!doc.querySelector('#app').classList.contains('nav-open'), 'el menú no se cerró');
  });
  check('F-06', 'B-14/B-15 · código muerto eliminado', () => {
    ['function rowForEquipo', 'function soonView(', 'function fuzzyMatch', 'function sugerirTecnicos']
      .forEach(s => assert(!appSrc.includes(s), 'todavía existe: ' + s));
    assert(!/if\s*\(solicitudesAbiertas\.length \|\| true\)/.test(appSrc), 'todavía existe el if "|| true"');
  });
  check('F-07', 'El sistema de diseño define escalas de espaciado y tipografía', () => {
    assert(/--sp-1:\s*4px/.test(html) && /--fs-base:\s*13px/.test(html),
      'faltan los tokens de diseño');
  });

  // ============================================================
  // GRUPO G — Fase 3.8 (respaldo automático) y 3.12 (confirmación escrita)
  // ============================================================
  check('G-01', '3.8 · guardarAutobackup crea un snapshot y queda listado', () => {
    const n0 = P.listarAutobackups().length;
    const s = P.guardarAutobackup('prueba');
    assert(s && s.id, 'no devolvió el snapshot');
    const lista = P.listarAutobackups();
    assert(lista.some(x => x.id === s.id), 'el snapshot no quedó en la lista');
    assert(lista.length >= Math.min(n0 + 1, 7), 'lista=' + lista.length);
  });
  check('G-02', '3.8 · la rotación FIFO conserva como máximo 7 snapshots', () => {
    for (let i = 0; i < 10; i++) P.guardarAutobackup('rot-' + i);
    assert(P.listarAutobackups().length <= 7, 'snapshots=' + P.listarAutobackups().length);
  });
  check('G-03', '3.8 · capacidadStorage informa uso y porcentaje', () => {
    const c = P.capacidadStorage();
    assert(typeof c.usado === 'number' && typeof c.pct === 'number' && c.pct >= 0 && c.pct <= 100,
      JSON.stringify(c));
  });
  check('G-04', '3.8 · eliminarAutobackup quita un snapshot puntual', () => {
    const s = P.guardarAutobackup('a-borrar');
    P.eliminarAutobackup(s.id);
    assert(!P.listarAutobackups().some(x => x.id === s.id), 'el snapshot no se eliminó');
  });
  check('G-05', '3.12 · confirmarConPalabra deshabilita el botón hasta escribir la palabra', () => {
    cerrarModales();
    P.confirmarConPalabra({ title: 'Prueba', message: 'msg', palabra: 'IMPORTAR', confirmText: 'OK-PRUEBA' });
    const m = modalActual();
    assert(m, 'no se abrió el modal');
    const btn = [...m.querySelectorAll('.modal-f button')].find(b => /OK-PRUEBA/.test(b.textContent));
    assert(btn && btn.disabled, 'el botón debería arrancar deshabilitado');
    const inp = m.querySelector('.field input');
    inp.value = 'otra cosa'; inp.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert(btn.disabled, 'no debería habilitarse con texto incorrecto');
    inp.value = 'IMPORTAR'; inp.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert(!btn.disabled, 'debería habilitarse al escribir la palabra exacta');
    cerrarModales();
  });
  check('G-06', '3.12 · importBackup y "borrar datos" usan confirmación escrita', () => {
    const imp = appSrc.slice(appSrc.indexOf('async function importBackup'), appSrc.indexOf('async function importBackup') + 1400);
    assert(/confirmarConPalabra/.test(imp), 'importBackup no usa confirmarConPalabra');
    assert(/confirmarConPalabra[\s\S]{0,400}ELIMINAR/.test(appSrc), '"borrar datos" no usa confirmación escrita');
  });
  check('G-07', '3.8 · Configuración muestra la tarjeta de respaldos automáticos', () => {
    P.Router.go('config');
    assert(/Respaldos automáticos/.test(doc.querySelector('#view').textContent),
      'la tarjeta de respaldos no aparece en Configuración');
  });

  // ============================================================
  // GRUPO H — Fase 3.10 (historial de cambios)
  // ============================================================
  check('H-01', '3.10 · registrarCambio agrega una entrada al log global', () => {
    const e = P.STATE.equipos.find(x => !x.esSlot);
    const n0 = P.STATE.cambios.length;
    P.registrarCambio(e.uuid, 'CampoPrueba', 'A', 'B', 'edicion');
    assert(P.STATE.cambios.length === n0 + 1, 'el log no creció');
    const last = P.STATE.cambios[P.STATE.cambios.length - 1];
    assert(last.campo === 'CampoPrueba' && last.valorAnterior === 'A' && last.valorNuevo === 'B', JSON.stringify(last));
  });
  check('H-02', '3.10 · cambiosDeEquipo filtra por equipo y ordena descendente', () => {
    const e = P.STATE.equipos.find(x => !x.esSlot);
    P.registrarCambio(e.uuid, 'OtroCampo', '1', '2', 'edicion');
    const arr = P.cambiosDeEquipo(e.uuid);
    assert(arr.length >= 1 && arr.every(c => c.equipoUuid === e.uuid), 'filtro por equipo incorrecto');
    for (let i = 1; i < arr.length; i++) {
      assert(new Date(arr[i-1].ts) >= new Date(arr[i].ts), 'no está ordenado del más reciente al más antiguo');
    }
  });
  check('H-03', '3.10 · el menú incluye la vista "Actividad reciente"', () => {
    P.Router.go('dash');
    const items = [...doc.querySelectorAll('#nav .nav-item span')].map(s => s.textContent);
    assert(items.includes('Actividad'), 'menú=' + JSON.stringify(items));
    assert(!!P.VIEWS.actividad, 'no existe VIEWS.actividad');
  });
  check('H-04', '3.10 · la ficha del equipo tiene pestaña "Cambios"', () => {
    assert(/id: 'cambios', *label: 'Cambios'/.test(appSrc), 'falta la pestaña Cambios en la ficha');
    assert(/case 'cambios':/.test(appSrc), 'renderFichaTab no maneja el caso "cambios"');
  });
  check('H-05', '3.10 · la importación del maestro registra cambios', () => {
    const i = appSrc.indexOf('async function importMaestroFile');
    assert(/registrarCambio/.test(appSrc.slice(i, i + 4500)), 'importMaestroFile no llama a registrarCambio');
  });

  // ---- reporte ----
  const ok = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  console.log('\n===== RESULTADOS DEL CONTRATO FUNCIONAL (arnés automatizado) =====\n');
  results.forEach(r => {
    console.log((r.ok ? '  PASA  ' : '  FALLA ') + r.id.padEnd(10) + ' ' + r.desc + (r.ok ? '' : '\n          → ' + r.err));
  });
  console.log('\n  Total: ' + results.length + '  ·  PASA: ' + ok + '  ·  FALLA: ' + fail + '\n');
  dom.window.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
