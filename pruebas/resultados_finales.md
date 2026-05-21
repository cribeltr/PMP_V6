# Resultados de la última ejecución de pruebas

**Arnés:** `pruebas/run_pruebas.js` (jsdom) · **Comando:** `npm install jsdom && node pruebas/run_pruebas.js`

---

## Última ejecución — cierre de Fase 1

**Resultado global: 27 / 27 PASA · 0 FALLA.**

| ID | Resultado | Descripción |
|---|---|---|
| A-01 | PASA | La app arranca y carga 60 equipos del dataset |
| A-02 | PASA | Conteo por estado coherente con el dataset |
| A-03 | PASA | Pendientes cargados |
| B-MP-01 | PASA | `MP.register` con resultado SI deja el equipo Operativo |
| B-CIC-01 | PASA | `CICLO.crearSolicitud` abre ciclo y deja el equipo NoOperativo |
| B-CIC-02 | PASA | `CICLO.agregarEnvio` (ciclo nuevo) deja el equipo en ServicioTecnico |
| B-CIC-03 | PASA | El shim `CICLO.crear` con folio vacío sigue lanzando error (causa raíz de B-01) |
| C-B01 | PASA | **B-01** · Vincular causal C2 creando ciclo nuevo funciona y no lanza "modelo viejo" |
| C-B02 | PASA | **B-02** · Vincular causal C3 creando ciclo nuevo funciona y no lanza "modelo viejo" |
| C-B04 | PASA | **B-04** · El selector de ciclo existente (C3) no muestra "undefined" |
| C-B09 | PASA | **B-09** · `renderSessionChip` escapa el nombre de archivo (sin inyección de HTML) |
| D-B03a | PASA | **B-03** · `exportBackup` incluye `tecnicosOficiales` y `diffIgnorados` |
| D-B03b | PASA | **B-03** · `importBackup` restaura `tecnicosOficiales` y `diffIgnorados` |
| D-B06 | PASA | **B-06** · `renderCumplimientoSidecar` recibe el mes por parámetro |
| D-B07 | PASA | **B-07** · `matchKey` tiene clave compuesta de respaldo |
| D-B08 | PASA | **B-08** · `imprimirAnexo1` usa el modelo de ciclo v34 |
| D-B01src | PASA | **B-01** · el modal C2 ya no llama al shim `CICLO.crear` |
| D-B02src | PASA | **B-02** · el modal C3 ya no llama al shim `CICLO.crear` |
| E-dash … E-config | PASA (9) | Render de las 9 vistas sin excepción (no regresión) |

---

## Fase 2 — pruebas añadidas (accesibilidad, navegación, limpieza)

| ID | Resultado | Descripción |
|---|---|---|
| F-01 | PASA | B-11 · los ítems de navegación son accesibles por teclado |
| F-02 | PASA | La navegación está agrupada (rótulos de grupo) |
| F-03 | PASA | B-10 · `field()` asocia el `<label>` con su control vía `for`/`id` |
| F-04 | PASA | B-11 · los KPI clickeables son accesibles por teclado |
| F-05 | PASA | Navegación móvil: botón hamburguesa y velo presentes y funcionales |
| F-06 | PASA | B-14/B-15 · código muerto eliminado |
| F-07 | PASA | El sistema de diseño define escalas de espaciado y tipografía |

**Cierre de Fase 2: 34 / 34 PASA · 0 FALLA.**

---

## Fase 3 — pruebas añadidas (3.8 respaldo automático · 3.12 confirmación escrita)

| ID | Resultado | Descripción |
|---|---|---|
| G-01 | PASA | 3.8 · `guardarAutobackup` crea un snapshot y queda listado |
| G-02 | PASA | 3.8 · la rotación FIFO conserva como máximo 7 snapshots |
| G-03 | PASA | 3.8 · `capacidadStorage` informa uso y porcentaje |
| G-04 | PASA | 3.8 · `eliminarAutobackup` quita un snapshot puntual |
| G-05 | PASA | 3.12 · `confirmarConPalabra` bloquea el botón hasta escribir la palabra |
| G-06 | PASA | 3.12 · `importBackup` y "borrar datos" usan confirmación escrita |
| G-07 | PASA | 3.8 · Configuración muestra la tarjeta de respaldos automáticos |

**Cierre del avance de Fase 3 (3.8 + 3.12): 41 / 41 PASA · 0 FALLA.**

---

## Historial de ejecuciones

| Fecha | Fase | PASA | FALLA | Nota |
|---|---|---|---|---|
| 2026-05-21 | Cierre Fase 1 | 27 | 0 | 8 casos del contrato pasaron de FALLA a PASA; 0 regresiones. |
| 2026-05-21 | Cierre Fase 2 | 34 | 0 | +7 pruebas de accesibilidad/navegación; 0 regresiones sobre las 27 previas. |
| 2026-05-21 | Avance Fase 3 (3.8, 3.12) | 41 | 0 | +7 pruebas de respaldo automático y confirmación escrita; 0 regresiones. |

> Este archivo se actualiza en cada cierre de fase con el resultado de la última corrida completa del arnés.
