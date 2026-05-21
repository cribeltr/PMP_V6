# FASE 1 — Correcciones quirúrgicas

**Objetivo:** corregir solo los errores reales de `FASE_0_REPORTE.md` 0.1 que afectan funcionamiento, datos, seguridad o estabilidad. Sin tocar diseño ni agregar funcionalidades.

- **Backup previo:** `pre_fase_1_backup.html` (= estado al cierre de Fase 0, byte-idéntico al original).
- **Verificación:** arnés automatizado `pruebas/run_pruebas.js` (jsdom) — **27/27 pruebas PASA**, incluidas las 9 vistas renderizando sin excepción (no regresión).
- **Tamaño del cambio:** 100 inserciones, 42 eliminaciones sobre `index.html`. Correcciones aisladas, sin refactor.

---

## 1.1 Criterio aplicado

Se corrigieron **8 hallazgos**: el crítico, los 2 altos y los 5 medios que afectan funcionamiento/datos/seguridad. Se documentaron sin tocar los hallazgos de severidad baja, de refactor opcional o que implican una decisión de diseño (Fase 2/3).

---

## 1.2 Errores corregidos

| ID | Severidad | Qué se corrigió | Cómo | Verificación |
|---|---|---|---|---|
| **B-01** | Crítica | Vinculación de causal **C2** rota de extremo a extremo. | En `abrirModalVinculacionC2`: (a) el filtro `ciclosConEnvio` ahora usa `c.envios[]` del modelo v34 (antes `c.envio`, campo inexistente); (b) el modo "crear ciclo nuevo" llama `CICLO.agregarEnvio(uuid, null, …)` en vez del shim roto `CICLO.crear`; (c) el modo "envío existente" toma la fecha del envío abierto de `c.envios`. | `C-B01` (runtime: crea el ciclo, equipo→ServicioTecnico, sin error "modelo viejo") · `D-B01src`. |
| **B-02** | Alta | Vinculación **C3 / SI-NoOp** creando ciclo nuevo lanzaba un error confuso y descartaba datos. | En `abrirModalVinculacionC3`, modo "nuevo": se llama `CICLO.crearSolicitud(uuid, …)` (API v34) en vez de `CICLO.crear`. `crearSolicitud` valida folio y responsable con mensajes claros, abre el ciclo y crea el pendiente automático. | `C-B02` (runtime) · `D-B02src`. |
| **B-03** | Alta (datos) | El respaldo JSON no incluía `tecnicosOficiales` ni `diffIgnorados`; se perdían al restaurar. | `exportBackup` agrega ambas slices al payload; `importBackup` las restaura (con defaults `[]` / `{}` si el archivo no las trae). | `D-B03a` y `D-B03b`. |
| **B-04** | Media | El selector de "ciclo a vincular" (C3) mostraba `"undefined"` y fecha `"—"`. | La etiqueta del `<select>` se arma con `c.solicitud.folioSigem` / `fechaEvento` y el último evento del ciclo v34. | `C-B04` (runtime: ninguna opción contiene "undefined"). |
| **B-06** | Media (dato incorrecto) | Los KPIs de cumplimiento de la vista PMP siempre mostraban el mes calendario actual. | `renderCumplimientoSidecar(mes)` ahora recibe el mes por parámetro; `VIEWS.pmp` re-renderiza el sidecar dentro de `update()` pasando el mes filtrado. | `D-B06`. |
| **B-07** | Media (integridad) | Equipos sin serie ni inventario se duplicaban en cada reimportación del maestro. | `matchKey()` agrega una clave compuesta de respaldo `n:nombre\|servicio\|marca\|modelo` cuando faltan serie e inventario. No altera el match de equipos que sí los tienen. | `D-B07`. |
| **B-08** | Media (salida vacía) | El Anexo 1 imprimía la tabla "Últimos ciclos correctivos" con celdas vacías. | `imprimirAnexo1` lee el modelo de ciclo v34 (`solicitud`, `envios`, `recepciones`, `reparacion`) en vez de los campos legacy `apertura`/`eslabonActual`/`ruta`. | `D-B08`. |
| **B-09** | Media (seguridad/XSS) | `renderSessionChip` inyectaba el nombre del archivo maestro en `innerHTML` sin escapar. | El contenido se escapa con `escapeHtml` antes de inyectarse. | `C-B09` (runtime: un nombre de archivo malicioso no inyecta `<img>`). |

> Tras esta fase, el shim `CICLO.crear` **ya no se invoca** desde ningún punto de la aplicación (solo queda su definición, que sirve de red de seguridad y se usa en la prueba `B-CIC-03` para documentar la causa raíz). Su eliminación es un refactor opcional postergado a Fase 2.

---

## 1.3 Tabla comparativa del contrato funcional

Casos de `pruebas/contrato_funcional.md` que en la línea base de Fase 0 daban **FALLA** y su resultado tras Fase 1:

| Caso (contrato) | Hallazgo | Resultado Fase 0 | Resultado Fase 1 | Prueba del arnés |
|---|---|---|---|---|
| CF-VINC-03 | B-02 | FALLA | **PASA** (mejora) | C-B02 |
| CF-VINC-04 | B-01 | FALLA | **PASA** (mejora) | C-B01 |
| CF-VINC-05 | B-01 | FALLA | **PASA** (mejora) | C-B01 / D-B01src |
| CF-VINC-07 | B-04 | FALLA | **PASA** (mejora) | C-B04 |
| CF-PMP-04 | B-06 | FALLA | **PASA** (mejora) | D-B06 |
| CF-MAE-06 | B-07 | FALLA | **PASA** (mejora) | D-B07 |
| CF-REP-05 | B-08 | FALLA | **PASA** (mejora) | D-B08 |
| CF-CFG-04 | B-03 | FALLA | **PASA** (mejora) | D-B03a/b |
| CF-CFG-05 | B-05 | FALLA | FALLA (postergado, ver 1.4) | — |

Los **71 casos** que en Fase 0 daban PASA siguen en PASA: el arnés re-renderiza las 9 vistas sin excepción (`E-dash` … `E-config`) y ejecuta la lógica de dominio (`B-MP-01`, `B-CIC-01/02/03`) sin cambios de comportamiento. **No hay regresiones.** Resultado global del arnés: **27/27 PASA** (ver `pruebas/resultados_finales.md`).

---

## 1.4 Mejoras documentadas y NO aplicadas (postergadas)

Se mantienen sin tocar en Fase 1 por ser refactor opcional, cosmético, de accesibilidad o por implicar una decisión de diseño:

| ID | Severidad | Por qué se posterga | Fase sugerida |
|---|---|---|---|
| **B-05** | Media | Editar "Técnicos oficiales" en Configuración no afecta los dropdowns. Corregirlo exige **decidir la fuente de verdad única** (constante vs. estado editable): es una decisión de diseño, no una corrección mecánica. | Fase 2 |
| **B-10** | Media | Labels no asociados a inputs — corregir el helper `field()` toca la capa de presentación. | Fase 2 (rediseño) |
| **B-11** | Media | Navegación por teclado en nav-items/KPIs/pestañas/filas — afecta presentación y semántica. | Fase 2 |
| **B-12** | Media | Aviso `beforeunload` con cambios sin guardar — es funcionalidad nueva. | Fase 3 |
| **B-13** | Media | Monitoreo de capacidad de `localStorage` — lo cubre explícitamente la funcionalidad 3.8. | Fase 3 |
| **B-14** | Baja | Código muerto (`rowForEquipo`, `soonView`, `fuzzyMatch`, `sugerirTecnicos`, `EQ.responsablesActivos`) — eliminarlo es refactor sin impacto funcional. | Fase 2 |
| **B-15** | Baja | `if (… || true)` en `abrirModalEnvioST` — limpieza de código. | Fase 2 |
| **B-16** | Baja | Funciones redundantes (`EQ.ciclosAbiertos`/`CICLO.todosAbiertos`, listas de técnicos) — unificación es refactor. | Fase 2 |
| **B-17** | Baja | Fechas futuras permitidas en Registrar MP — comportamiento ambiguo (el texto habla de "retroactivo"); se decide en Fase 2/3. | Fase 2/3 |
| **B-18** | Baja | `IntersectionObserver` sin desconectar — fuga menor, el GC la recoge. | Fase 2 |
| **B-19** | Baja | Sin `maxlength` en textareas. | Fase 2/3 |
| **B-20** | Baja | Orden de Historial por `b.fecha` — funciona; inconsistencia cosmética. | Fase 2 |
| **B-21** | Baja | Estilos inline en JS — se aborda naturalmente con el rediseño. | Fase 2 |
| **B-22** | Baja | Shadowing de `opts` — renombrado cosmético. | Fase 2 |
| **P-01 / P-02** | Baja | Rendimiento — se mide en Fase 3.9; optimizar solo si hace falta. | Fase 3 |

---

## 1.5 Bitácora de intentos

No hubo intentos fallidos ni reversiones. Cada corrección es un cambio aislado; el arnés `run_pruebas.js` se ejecutó tras aplicarlas y dio 27/27 sin regresiones a la primera (tras corregir 6 falsos negativos del propio arnés —ventanas de búsqueda de código demasiado cortas y modales que se cierran con retardo de animación—, que no eran fallos del código de la herramienta).

---

## Checkpoint Fase 1

- [x] 100 % del contrato funcional pasa **igual o mejor** que en Fase 0 (8 casos FALLA→PASA, 0 regresiones).
- [x] Lista de errores corregidos con su verificación.
- [x] Lista de mejoras opcionales documentadas pero no aplicadas.
- [x] Tabla comparativa del contrato funcional.
- [x] `pre_fase_1_backup.html` creado.
