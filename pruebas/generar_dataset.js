/**
 * generar_dataset.js — Generador determinístico del dataset de pruebas (Fase 0.7).
 *
 * Produce `dataset_pruebas.json` en formato compatible con la función
 * `importBackup()` de PMP V3 R10 (claves: appVersion, schemaVersion,
 * exportedAt, equipos, pendientes, asignaciones, contactos, session).
 *
 * Uso:   node pruebas/generar_dataset.js
 * Carga: abrir la herramienta → Configuración → "Restaurar backup" → elegir
 *        pruebas/dataset_pruebas.json. (Reemplaza los datos actuales: usar solo
 *        en un navegador limpio o tras descargar un backup propio.)
 *
 * Es determinístico: un LCG con semilla fija produce siempre el mismo dataset,
 * de modo que las simulaciones del contrato funcional sean reproducibles.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// ---- PRNG determinístico (LCG) ----
let _seed = 20260521;
function rnd() { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function int(min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
function chance(p) { return rnd() < p; }
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(rnd() * 16), v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ---- Parámetros del dominio (extraídos del HTML real, Fase 0.6) ----
const SERVICIOS = ['UCI Adultos', 'Pediatría', 'Urgencia', 'Pabellón Central',
  'Neonatología', 'Medicina Interna', 'Maternidad', 'UTI Pediátrica'];
const FAMILIAS = ['Ventilador mecánico', 'Monitor multiparámetros', 'Bomba de infusión',
  'Desfibrilador', 'Electrobisturí', 'Incubadora neonatal', 'Cuna de calor radiante',
  'Aspirador de secreciones', 'Ecógrafo', 'Lámpara quirúrgica'];
const MARCAS = ['Mindray', 'Dräger', 'Philips', 'GE Healthcare', 'B. Braun', 'Fresenius',
  'Medtronic', 'Hamilton', 'Atom', 'Stryker'];
const FRECUENCIAS = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];
const TECNICOS = ['Ricardo Matus Aroca', 'Ignacio Berner Bergara', 'Matías Soazo Garrido',
  'Daniel Díaz Neira', 'Tito Millapán Riquelme', 'Carlos Bahamondes Seguel',
  'Cristián Beltrán Oviedo', 'Cristina Rozas Urrutia'];
const EMPRESAS_ST = ['Importadora Médica ACME', 'Mindray Service Chile', 'Dräger Soporte',
  'Biomédica Sur Ltda.', 'TecnoSalud SpA'];
// Distribución de estados: 60 equipos.
const ESTADO_PLAN = [
  ...Array(38).fill('Operativo'),
  ...Array(5).fill('NoOperativo'),
  ...Array(6).fill('ServicioTecnico'),
  ...Array(3).fill('Recepcionado'),
  ...Array(2).fill('FueraDeServicio'),
  ...Array(2).fill('DeBaja'),
  ...Array(4).fill('Slot'),
];

const HOY = new Date('2026-05-21T12:00:00Z');
function diasAtras(d) { return new Date(HOY.getTime() - d * 86400000); }
function iso(d) { return d.toISOString(); }

const equipos = [];
const pendientes = [];

for (let i = 0; i < ESTADO_PLAN.length; i++) {
  const estado = ESTADO_PLAN[i];
  const esSlot = estado === 'Slot';
  const fam = pick(FAMILIAS);
  const servicio = pick(SERVICIOS);
  const frecuencia = pick(FRECUENCIAS);
  const u = uuid();

  // Grilla anual: marca X en meses según frecuencia.
  const grilla = {};
  for (let m = 1; m <= 12; m++) grilla[m] = null;
  if (!esSlot) {
    const paso = frecuencia === 'Mensual' ? 1 : frecuencia === 'Trimestral' ? 3
      : frecuencia === 'Semestral' ? 6 : 12;
    for (let m = int(1, paso); m <= 12; m += paso) grilla[m] = 'X';
  }

  const creado = diasAtras(int(20, 360));
  const e = {
    uuid: u,
    id: esSlot ? null : String(1000 + i),
    fam, famOriginal: fam,
    carpeta: esSlot ? null : int(1, 240),
    inventario: esSlot ? '' : `INV-${String(20000 + i)}`,
    nombre: esSlot ? `Slot disponible ${fam}` : `${fam} ${pick(['A', 'B', 'C', 'II', 'Plus'])}`,
    servicio,
    unidad: pick(['Box 1', 'Box 2', 'Sala común', 'Reanimación', 'Sector A']),
    ubicacion: `${servicio} · ${pick(['piso 2', 'piso 3', 'piso 4'])}`,
    procedencia: pick(['Compra MINSAL', 'Donación', 'Traslado interno']),
    marca: pick(MARCAS),
    modelo: `MOD-${int(100, 999)}`,
    serie: esSlot ? '' : `SN${String(700000 + i * 7)}`,
    anio: String(int(2014, 2024)),
    vidaUtil: `${int(1, 10)} años`,
    clasificacion: pick(['Crítico', 'Relevante', 'No crítico']),
    enu: '',
    observacion: chance(0.3) ? 'Equipo con accesorios completos.' : '',
    frecuencia,
    responsableMaster: chance(0.5) ? pick(TECNICOS) : '',
    enGarantia: !esSlot && chance(0.2),
    garantiaHasta: null,
    garantiaProveedor: '',
    estado,
    estadoDesde: null,
    esSlot,
    grilla,
    historial: [],
    eventos: [],
    correctivos: [],
    pendientesIds: [],
  };
  if (e.enGarantia) {
    e.garantiaHasta = iso(diasAtras(-int(30, 400)));
    e.garantiaProveedor = pick(MARCAS) + ' Chile';
  }

  // Evento de creación (sirve de base para el historial inferido — regla 10 del prompt).
  e.eventos.push({
    id: uuid(), ts: iso(creado), tsRegistro: iso(creado),
    tipo: 'ALTA-INVENTARIO', payload: { origen: 'dataset_pruebas' },
  });

  // Historial de MP para equipos no-slot: 0 a 4 registros en los últimos 12 meses.
  if (!esSlot && estado !== 'DeBaja') {
    const nMP = int(0, 4);
    for (let k = 0; k < nMP; k++) {
      const f = diasAtras(int(10, 350));
      const resultado = pick(['SI', 'SI', 'SI', 'NO', 'C1', 'C3', 'C5']);
      const mp = {
        id: uuid(), fecha: iso(f), fechaEvento: iso(f), fechaRegistro: iso(f),
        mes: f.getUTCMonth() + 1, resultado,
        ejecutor: pick(TECNICOS), obs: chance(0.4) ? 'Sin observaciones relevantes.' : '',
        estadoFinal: resultado === 'SI' ? 'Operativo' : null,
        tipoBaja: null, correctivoUuid: null, importadoDelMaestro: false,
        motivoCambioEjecutor: null,
      };
      e.historial.push(mp);
      e.eventos.push({
        id: uuid(), ts: iso(f), tsRegistro: iso(f), tipo: 'MP',
        payload: { resultado: mp.resultado, ejecutor: mp.ejecutor, mes: mp.mes, obs: mp.obs },
      });
    }
    e.historial.sort((a, b) => new Date(a.fechaEvento) - new Date(b.fechaEvento));
  }

  // Estado y ciclo correctivo coherente para estados no-operativos.
  if (estado === 'ServicioTecnico' || estado === 'Recepcionado' || estado === 'NoOperativo') {
    const fSolic = diasAtras(int(8, 75));
    e.estadoDesde = iso(fSolic);
    const ciclo = {
      uuid: uuid(), abierto: true, enGarantia: e.enGarantia,
      solicitud: {
        fechaEvento: iso(fSolic), fechaRegistro: iso(fSolic),
        folioSigem: `${int(19, 26)}-${int(1000, 9999)}`,
        responsable: pick(TECNICOS),
        observaciones: 'Falla detectada en ronda clínica.',
      },
      envios: [], recepciones: [], reparacion: null, eventos: [],
      creado: iso(fSolic), cerrado: null, __migradoV34: true,
    };
    e.eventos.push({ id: uuid(), ts: iso(fSolic), tsRegistro: iso(fSolic),
      tipo: 'SOLICITUD_TRABAJO', payload: { cicloUuid: ciclo.uuid, folioSigem: ciclo.solicitud.folioSigem } });
    e.eventos.push({ id: uuid(), ts: iso(fSolic), tsRegistro: iso(fSolic),
      tipo: 'ESTADO', payload: { a: 'NoOperativo', origen: 'SOLICITUD_TRABAJO' } });

    if (estado === 'ServicioTecnico' || estado === 'Recepcionado') {
      const fEnv = diasAtras(int(4, 40));
      const env = {
        uuid: uuid(), fechaEvento: iso(fEnv), fechaRegistro: iso(fEnv),
        numeroEnvio: String(int(1000, 9999)), empresaST: pick(EMPRESAS_ST),
        responsable: pick(TECNICOS), observaciones: '', recepcionUuid: null, cerrado: false,
      };
      ciclo.envios.push(env);
      e.estadoDesde = iso(fEnv);
      e.eventos.push({ id: uuid(), ts: iso(fEnv), tsRegistro: iso(fEnv),
        tipo: 'ENVIO', payload: { cicloUuid: ciclo.uuid, empresaST: env.empresaST } });
      e.eventos.push({ id: uuid(), ts: iso(fEnv), tsRegistro: iso(fEnv),
        tipo: 'ESTADO', payload: { a: 'ServicioTecnico', origen: 'ENVIO' } });

      if (estado === 'Recepcionado') {
        const fRec = diasAtras(int(1, 6));
        const rec = {
          uuid: uuid(), fechaEvento: iso(fRec), fechaRegistro: iso(fRec),
          guiaDespacho: `GD-${int(100, 999)}`, responsable: pick(TECNICOS),
          observaciones: '', envioUuid: env.uuid,
        };
        ciclo.recepciones.push(rec);
        env.recepcionUuid = rec.uuid; env.cerrado = true;
        e.estadoDesde = iso(fRec);
        e.eventos.push({ id: uuid(), ts: iso(fRec), tsRegistro: iso(fRec),
          tipo: 'RECEPCION', payload: { cicloUuid: ciclo.uuid } });
        e.eventos.push({ id: uuid(), ts: iso(fRec), tsRegistro: iso(fRec),
          tipo: 'ESTADO', payload: { a: 'Recepcionado', origen: 'RECEPCION' } });
      }
    }
    e.correctivos.push(ciclo);
  } else if (estado === 'FueraDeServicio' || estado === 'DeBaja') {
    e.estadoDesde = iso(diasAtras(int(30, 200)));
    e.eventos.push({ id: uuid(), ts: e.estadoDesde, tsRegistro: e.estadoDesde,
      tipo: 'ESTADO', payload: { a: estado, origen: 'dataset_pruebas' } });
  } else if (estado === 'Operativo' && !esSlot) {
    e.estadoDesde = iso(creado);
  }

  equipos.push(e);
}

// ---- Pendientes (3 a 5 ligados a equipos no-operativos + algunos sueltos) ----
const noOp = equipos.filter(e => ['NoOperativo', 'ServicioTecnico', 'Recepcionado'].includes(e.estado));
noOp.slice(0, 6).forEach((e, idx) => {
  const creado = diasAtras(int(2, 30));
  const vence = diasAtras(idx % 2 === 0 ? int(-5, -1) : int(1, 8)); // mezcla vencidos / por vencer
  const p = {
    id: uuid(), tipo: 'ciclo-correctivo',
    descripcion: `Avanzar ciclo correctivo del equipo ${e.nombre}`,
    equipoUuid: e.uuid, asignado: pick(TECNICOS), estado: pick(['Abierto', 'EnCurso', 'Esperando']),
    creado: iso(creado), vence: iso(vence),
    log: [{ ts: iso(creado), nota: 'Creado' }], subtareas: [],
    meta: { cicloUuid: e.correctivos[0] && e.correctivos[0].uuid, tipoAlerta: 'solicitud-abierta' },
  };
  pendientes.push(p);
  e.pendientesIds.push(p.id);
});
// 2 pendientes sin equipo asociado.
for (let k = 0; k < 2; k++) {
  const creado = diasAtras(int(1, 10));
  pendientes.push({
    id: uuid(), tipo: 'general',
    descripcion: k === 0 ? 'Coordinar capacitación de uso con servicio clínico'
      : 'Solicitar cotización de repuestos a proveedor',
    equipoUuid: null, asignado: k === 0 ? '' : pick(TECNICOS), estado: 'Abierto',
    creado: iso(creado), vence: iso(diasAtras(int(-3, 5))),
    log: [{ ts: iso(creado), nota: 'Creado' }], subtareas: [], meta: null,
  });
}

// ---- Asignación mensual del período actual (2026-05) ----
const asignaciones = {};
const periodoActual = '2026-05';
const asign = { __meta: { archivo: 'Asignacion_Mayo_2026.xlsx', fechaCarga: iso(HOY),
  mes: 5, anio: 2026, total: 0, matcheados: 0, sinMatch: [], tecnicos: {} } };
equipos.filter(e => !e.esSlot && e.estado !== 'DeBaja').forEach(e => {
  if (chance(0.8)) {
    const t = pick(TECNICOS);
    asign[e.uuid] = t;
    asign.__meta.matcheados++;
    asign.__meta.tecnicos[t] = (asign.__meta.tecnicos[t] || 0) + 1;
  }
});
asign.__meta.total = asign.__meta.matcheados;
asignaciones[periodoActual] = asign;

const payload = {
  appVersion: '3.0.0-it1',
  schemaVersion: 1,
  exportedAt: iso(HOY),
  _datasetPruebas: true,
  equipos,
  pendientes,
  asignaciones,
  contactos: {
    'UCI Adultos': {
      supervisor: { nombreCompleto: 'MARÍA ELENA SOTO ROJAS', correo: 'msoto@hhha.cl', anexo: '2101', celular: '+56 9 1111 2222' },
      encargadoEquipos: { nombreCompleto: 'JORGE ANDRÉS PINO LAGOS', correo: 'jpino@hhha.cl', anexo: '2102', celular: '' },
      jefeCR: { nombreCompleto: '', correo: '', anexo: '', celular: '' },
      notas: 'Contacto preferente por correo.',
    },
  },
  session: { archivoCargado: 'Maestro_PMP_2026.xlsx', fechaCarga: iso(HOY), sheet: 'PMP2026' },
};

const out = path.join(__dirname, 'dataset_pruebas.json');
fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');

const porEstado = {};
equipos.forEach(e => { porEstado[e.estado] = (porEstado[e.estado] || 0) + 1; });
console.log('dataset_pruebas.json generado:', out);
console.log('  equipos:', equipos.length, JSON.stringify(porEstado));
console.log('  pendientes:', pendientes.length);
console.log('  servicios:', new Set(equipos.map(e => e.servicio)).size,
  '· familias:', new Set(equipos.map(e => e.fam)).size);
