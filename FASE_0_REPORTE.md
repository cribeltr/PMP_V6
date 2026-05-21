# FASE 0 — Auditoría inicial y contrato funcional

**Herramienta auditada:** `PMP_V3_R10.html` — Programa de Mantenimiento Preventivo (PMP) · Subdepartamento de Equipamiento Clínico (SEC) · Hospital Dr. Hernán Henríquez Aravena, Temuco.
**Tamaño:** 9.227 líneas (HTML + CSS + JavaScript embebidos en un único archivo standalone).
**Fecha de auditoría:** 2026-05-21.
**Alcance de esta fase:** solo lectura, análisis y documentación. **Cero modificaciones de código.**

> El archivo de trabajo `index.html` es, al cierre de Fase 0, **byte-idéntico** a `original_backup.html`. No se modificó ninguna línea de código en esta fase.

---

## Capacidades declaradas (Claude Code)

| Capacidad | Disponible | Cómo se usa en este proyecto |
|---|---|---|
| **Navegador headless** (Playwright / Puppeteer / CDP) | **No.** No hay Chrome/Chromium instalado en el entorno y la política de red puede impedir instalarlo. | Las simulaciones de Fase 0.5 se documentan como **análisis estático del código + pruebas manuales reproducibles paso a paso** (ver `pruebas/contrato_funcional.md`). El contrato funcional queda definido igual y es ejecutable manualmente abriendo el HTML en un navegador. |
| **Entorno Node.js** | **Sí** — Node v22.22.2, npm 10.9.7. | Se usa para scripts auxiliares: el generador determinístico del dataset de pruebas (`pruebas/generar_dataset.js`). |
| **Generación de capturas** | **No** (sin navegador headless). | Las carpetas `snapshots/before/` y `snapshots/after/` quedan creadas pero vacías. El estado visual se describe textualmente en este reporte y en los reportes de fase siguientes. |
| Python 3.11 | Sí | Disponible como alternativa para scripts auxiliares; no se requirió. |

**Consecuencia de ajuste automático de entregables:** el contrato funcional (0.5) se entrega como documento de pruebas manuales reproducibles, no como script Playwright. El dataset de pruebas (0.7) se entrega como JSON cargable vía la función `importBackup()` ya existente en la herramienta.

---

## Resumen ejecutivo de la auditoría

La herramienta **no es un simple registrador**: ya es una aplicación de gestión madura, en su **revisión 10** (R10), con dashboard, inventario con columnas y vistas configurables, ciclos correctivos modelados, pendientes con calendario, importación de maestro Excel con detección de diferencias, asignación mensual de responsables, reportes multi-hoja, anexos imprimibles, agenda de contactos, command palette, temas claro/oscuro y grabación de sesión.

**Hallazgo estratégico (relevante para Fase 3):** muchas de las funcionalidades que el documento de requerimientos pide para la Fase 3 **ya existen** en alguna forma en la herramienta (exportación filtrada a Excel, filtros combinables, dashboard, trazabilidad por timeline, pendientes/recordatorios, informe mensual por servicio, conciliación contra maestro, persistencia). El detalle de qué existe y qué falta está en la sección 0.2 y se resume en el apéndice "Mapeo Fase 3 → estado actual". Esto **no cambia** la Fase 0; se documenta acá para que la planificación de Fase 3 parta de la realidad del código y no duplique lo existente.

**Estado general:** la herramienta funciona y es usable. Se detectaron **22 hallazgos de código** (1 crítico, 2 altos, 9 medios, 10 bajos) y **2 de rendimiento**. El hallazgo crítico rompe por completo el flujo de **vinculación de causal C2**. Ningún hallazgo implica pérdida de datos ya guardados de forma silenciosa, salvo B-03 (el respaldo JSON no incluye dos slices de datos).

---

## 0.1 Auditoría técnica

### Tabla de hallazgos

| ID | Categoría | Descripción del problema | Ubicación (línea / función) | Severidad | Acción propuesta |
|---|---|---|---|---|---|
| **B-01** | Bug — funcionalidad rota | **Vinculación de causal C2 rota de extremo a extremo.** `abrirModalVinculacionC2` filtra ciclos con envío usando `c.envio` (campo *singular* del modelo viejo); el modelo v34 usa `c.envios` (array). El filtro `ciclosConEnvio` queda **siempre vacío** ⇒ el modo cae siempre a "nuevo" ⇒ se llama `CICLO.crear()` con `folioSigem:''` ⇒ el shim `CICLO.crear` exige `folioSigem` truthy y lanza `"CICLO.crear() del modelo viejo eliminado…"`. No hay forma de vincular una causal C2. | `abrirModalVinculacionC2` (≈4648–4755): `c.envio` en 4650, 4694, 4727; `CICLO.crear` en 4735. Shim en `CICLO.crear` (1899–1912). | **Crítica** | Corregir en Fase 1: usar `c.envios`/`recepciones` del modelo v34 y reemplazar la llamada a `CICLO.crear` por `CICLO.agregarEnvio` / `agregarRecepcion`. |
| **B-02** | Bug — funcionalidad parcial | **Vinculación C3 / "SI No-Operativo" creando ciclo nuevo es frágil.** El modo "nuevo" llama `CICLO.crear()` (shim de retrocompatibilidad). Si el responsable queda vacío (no es obligatorio en ese formulario), el shim lanza el error confuso `"CICLO.crear() del modelo viejo eliminado…"` en vez de "Elegí un responsable". Además el shim **ignora** `deteccion`, `causalLink`, `startEslabon` y `envio` que el modal le pasa. | `abrirModalVinculacionC3` (4598–4618); `CICLO.crear` (1899–1912). | **Alta** | Corregir en Fase 1: llamar `CICLO.crearSolicitud` directamente y validar responsable obligatorio antes. |
| **B-03** | Pérdida de datos | **El respaldo JSON está incompleto.** `exportBackup` arma el payload solo con `equipos, pendientes, asignaciones, contactos, session`. **No incluye `tecnicosOficiales` ni `diffIgnorados`.** `importBackup` tampoco los restaura. Restaurar un backup pierde la lista de técnicos oficiales gestionada por el usuario y todas las decisiones de "diferencias ignoradas". | `exportBackup` (4163–4180); `importBackup` (4182–4207). | **Alta** | Corregir en Fase 1: incluir ambas slices en export e import. |
| **B-04** | Bug — UI engañosa | El selector de "ciclo a vincular" en la vinculación C3 arma su etiqueta con `c.eslabonActual` (no existe en v34 ⇒ `undefined`) y `c.solicitud?.fecha` (el campo correcto es `fechaEvento`). La etiqueta sale como `"folio · undefined · —"`. | `abrirModalVinculacionC3`, render del `select` (≈4540–4543). | **Media** | Corregir en Fase 1: usar `c.solicitud?.folioSigem` y `c.solicitud?.fechaEvento`; describir el estado real del ciclo. |
| **B-05** | Bug — inconsistencia funcional | La tarjeta "Técnicos oficiales del SEC" de Configuración edita `STATE.tecnicosOficiales`, pero **los dropdowns de técnico de todos los formularios** (`selectTecnico`) usan la constante congelada `TECNICOS_OFICIALES`. Editar la lista en Configuración **no cambia** los dropdowns que el usuario realmente usa. | `selectTecnico` (4243–4264) usa `TECNICOS_OFICIALES`; tarjeta de Config (8783–8826) edita `STATE.tecnicosOficiales`. | **Media** | Definir una única fuente de verdad. Decisión para Fase 1/2. |
| **B-06** | Bug — dato incorrecto | En la vista PMP, los KPIs de cumplimiento (`renderCumplimientoSidecar`) **siempre calculan el mes calendario actual**, ignorando el filtro de mes de la vista. Si el usuario elige otro mes, los KPIs de abajo no coinciden con la tabla. | `renderCumplimientoSidecar` (6727–6742); llamada en `VIEWS.pmp` (6722). | **Media** | Corregir en Fase 1: pasar el mes filtrado a la función. |
| **B-07** | Integridad de datos | Equipos **sin serie ni inventario** ⇒ `matchKey()` devuelve `null` ⇒ en cada reimportación del maestro se tratan como "nuevos" y se **duplican**. | `matchKey` (2983–2989); `importMaestroFile` (2834–2863). | **Media** | Corregir/documentar en Fase 1: clave de match alternativa o aviso explícito al usuario. |
| **B-08** | Bug — salida vacía | `imprimirAnexo1` arma la tabla "Últimos ciclos correctivos" con campos del modelo viejo (`c.apertura`, `c.eslabonActual`, `c.ruta`). Para ciclos v34 esos campos no existen ⇒ celdas vacías. | `imprimirAnexo1` (3476–3533), bloque `cs` (3480–3490). | **Media** | Corregir en Fase 1: leer `c.solicitud`, `c.envios`, `c.reparacion`. |
| **B-09** | Seguridad (XSS) | `renderSessionChip` inserta el nombre del archivo maestro en el DOM vía `innerHTML` sin escapar. Un archivo nombrado con HTML/JS se inyecta. Riesgo real bajo (herramienta local, mono-usuario; el "atacante" es el propio usuario), pero es un sink de XSS. | `renderSessionChip` (5592–5601). | **Media** | Corregir en Fase 1: usar nodos de texto o `escapeHtml`. |
| **B-10** | Accesibilidad | El helper `field(label, control)` crea `<label>` y el control como **hermanos**, sin atributo `for` ni anidamiento. Los lectores de pantalla no asocian etiqueta e input. Afecta a casi todos los formularios. | `field` (4212–4219). | **Media** | Corregir en Fase 2 (rediseño): asociar con `for`/`id` o anidar. |
| **B-11** | Accesibilidad | Ítems de navegación, KPIs, pestañas, pasos y filas de tabla son `<div>`/`<tr>` con `onclick`, **sin `tabindex` ni rol**. No son alcanzables por teclado. El CSS incluso define `:focus-visible` para ellos, pero nunca reciben foco. | `renderNav` (5571–5590); `kpiCard` (5914); `.tab`, filas de tabla varias. | **Media** | Corregir en Fase 2: `role`/`tabindex`/manejo de teclado. |
| **B-12** | Pérdida de datos | No hay `beforeunload`: si el usuario presiona F5 con un formulario (modal) a medio llenar, el estado en memoria (`snap`) se pierde sin aviso. | Transversal a todos los modales de formulario. | **Media** | Evaluar en Fase 1/3: aviso de cambios sin guardar. |
| **B-13** | Pérdida de datos | No hay monitoreo de capacidad de `localStorage`. Al llenarse, `STORAGE.write` captura la excepción de cuota y solo muestra un toast de error; el cambio **no se persiste** y el usuario puede no notarlo. | `STORAGE.write` (1233–1242). | **Media** | Cubrir con Fase 3.8 (alerta de capacidad al 80%). |
| **B-14** | Código muerto | Funciones declaradas y **nunca invocadas**: `rowForEquipo` (6341), `soonView` (6629), `fuzzyMatch` (1195), `sugerirTecnicos` (3265), método `EQ.responsablesActivos` (1454). | Líneas indicadas. | **Baja** | Documentar; opcional eliminar en Fase 2 (refactor). |
| **B-15** | Código muerto | `if (solicitudesAbiertas.length \|\| true)` — el `\|\| true` hace que la condición sea siempre verdadera. El bloque siempre se ejecuta. | `abrirModalEnvioST` (4880). | **Baja** | Documentar; limpiar en Fase 2. |
| **B-16** | Redundancia | Funciones casi duplicadas: `EQ.ciclosAbiertos` vs `CICLO.todosAbiertos` (idénticas); varias funciones solapadas de "lista de técnicos" (`EQ.responsables`, `EQ.responsablesActivos`, `sugerirTecnicos`, `EQ.ejecutores`). | 1443–1460, 1618–1622, 3265–3277. | **Baja** | Unificar en Fase 2 (refactor sin cambio funcional). |
| **B-17** | Validación débil | `abrirModalRegistrarMP` permite fechas **futuras** (el `dateCtl` de la fecha del evento no tiene `max`), aunque el texto de ayuda habla de "registro retroactivo". | `abrirModalRegistrarMP`, `fFecha` (4356–4362). | **Baja** | Documentar; decidir en Fase 1 si se acota a `max=hoy`. |
| **B-18** | Rendimiento / fuga menor | Cada render de la vista Inventario crea un `IntersectionObserver` nuevo sin desconectar el anterior. El observer queda sobre un `sentinel` desconectado del DOM; el GC lo recoge, pero es una fuga menor. | `VIEWS.inv` (6222, 6264). | **Baja** | Documentar; opcional `io.disconnect()` en Fase 2. |
| **B-19** | Validación débil | Las `textarea` (observaciones, descripciones) no tienen `maxlength`. Texto muy largo puede inflar `localStorage`. | `textareaCtl` (4231) y usos. | **Baja** | Documentar; opcional acotar longitud. |
| **B-20** | Inconsistencia menor | `renderFichaTab` (pestaña Historial) ordena por `b.fecha` en vez de `b.fechaEvento \|\| b.fecha`. Funciona porque `fecha` siempre se setea como alias, pero es inconsistente con el resto del código. | `renderFichaTab`, caso `historial` (6521). | **Baja** | Documentar; alinear en Fase 2. |
| **B-21** | Mantenibilidad | Cientos de objetos `style:{}` inline en JS en lugar de clases CSS. Funciona, pero dificulta el rediseño consistente. | Transversal. | **Baja** | Tener en cuenta en Fase 2 (rediseño). |
| **B-22** | Code smell | En `abrirModalVinculacionC3` el parámetro `opts` queda **oculto (shadowed)** por un `const opts` dentro del callback `content`. Funciona porque el parámetro no se usa dentro del callback, pero es frágil. | `abrirModalVinculacionC3` (4477 vs 4513). | **Baja** | Documentar; renombrar en Fase 2. |
| **P-01** | Rendimiento | El Dashboard recalcula varios escaneos completos de `STATE.equipos` en cada render, sin memoización. A la escala actual (cientos de equipos) es rápido; conviene **medir** para el objetivo "<1 s con 1000+ equipos" de la funcionalidad 3.9. | `VIEWS.dash.render` (5627–5901). | **Baja/Media** | Medir con `performance.now()` en Fase 3.9; optimizar solo si supera 1 s. |
| **P-02** | Rendimiento | `EQ.responsables`, `empresasSTUsadas`, etc. recorren `equipos × historial/correctivos` cada vez que se invocan (varias veces por render de algunas vistas). Aceptable a la escala actual. | 1393–1402, 2329–2333. | **Baja** | Documentar; optimizar solo si hace falta. |

### Notas técnicas adicionales (sin hallazgo formal)

- **Manejo de errores:** correcto en general. Existe un *pipe* de errores (`bus.on('error')` → toast) y un `window.addEventListener('unhandledrejection')`. Casi todas las funciones `async` que tocan UI están envueltas en `try/catch`. Los `JSON.parse` están protegidos (`STORAGE.read`, `importBackup`, `invColumnasVisibles`).
- **Disponibilidad de APIs del navegador:** los accesos a `localStorage` están envueltos en `try/catch` de forma consistente. `crypto.randomUUID` tiene fallback manual.
- **IDs duplicados:** no se detectaron IDs estáticos duplicados en el HTML. Los IDs dinámicos (`recDot`, datalists de modales) se crean dentro de contenedores que se eliminan al cerrar; sin colisión observada.
- **Listeners:** el listener global de `Ctrl+K` y el `setInterval` del chip de grabación se registran una sola vez en `boot()`. Los listeners de modales/drawers se remueven al cerrar. Sin fugas relevantes salvo B-18.

---

## 0.2 Mapeo de funcionalidades existentes

La herramienta tiene **9 vistas** principales (sidebar) más una capa de modales. Inventario completo:

### Vistas

| # | Identificador | Ubicación | Descripción | Inputs | Salidas / efectos | Dependencias | Estado |
|---|---|---|---|---|---|---|---|
| 1 | **Dashboard** (`dash`) | Sidebar · vista por defecto al abrir | KPIs operacionales, "atenciones críticas" (equipos >30 d, ciclos sin avance, MP pendientes del mes), distribución por estado y familia, resumen ejecutivo copiable, últimos registros MP. | Clicks en KPIs/cards (navegan filtrando). | Navega a otras vistas con filtros pre-aplicados; copia texto al portapapeles. | `STATE.equipos`, `STATE.pendientes`, `CICLO`, `usuarioActual`. | OK |
| 2 | **Inventario** (`inv`) | Sidebar | Tabla de equipos con columnas configurables (18 disponibles), filtros combinables (servicio, familia, estado, empresa ST, responsable, garantía, tiempo en estado, pendientes, rangos de fecha MP/gestión), búsqueda de texto, vistas rápidas (8 presets), toggle de slots, exportación filtrada a Excel, paginación incremental (80/scroll). | Texto de búsqueda, selects de filtro, fechas, checkboxes de columnas, preset elegido. | Filtra y renderiza la tabla; exporta `.xlsx`; persiste columnas y preferencia de slots en `localStorage`. | `EQ.search`, `INV_COLUMNAS`, `invGetPresets`, `XLSX`. | OK |
| 3 | **PMP anual** (`pmp`) | Sidebar | Grilla de cumplimiento del plan anual. Modo "por mes" (tabla de actividad) o "anual" (grilla 12 meses, clickeable). Filtros: servicio, familia, frecuencia, búsqueda. KPIs de cumplimiento. | Modo, mes, filtros, clicks en celdas. | Abre modales de grilla / registrar MP / ficha. | `STATE.equipos`, `CAUSALES`, grilla. | OK · ver **B-06** (KPIs del mes equivocado) |
| 4 | **Ciclos correctivos** (`ciclos`) | Sidebar | Vista global de ciclos abiertos y cerrados de los últimos 60 días, con filtros por estado/empresa/responsable. Tabla con solicitud, último envío, recepción, reparación, pendientes. | Filtros. | Abre la ficha del equipo. | `STATE.equipos[].correctivos`. | OK |
| 5 | **Entregas** (`entregas`) | Sidebar | Asignación mensual de responsables por período. KPIs del mes (programadas/ejecutadas/causalizadas/pendientes) y de asignación (técnicos/equipos/sin asignar), todos clickeables. Cards por técnico expandibles. Importa/exporta plantilla de asignación. | Período, importación de archivo de asignación. | Importa asignación mensual `.xlsx`; exporta plantilla `.xlsx` con validación de lista. | `STATE.asignaciones`, `agruparPorTecnico`, `XLSX`, `JSZip`. | OK |
| 6 | **Pendientes** (`tareas`) | Sidebar | Gestión de pendientes administrativos. Modo Lista (agrupado por urgencia: vencidos, por vencer, abiertos, en curso, esperando, cerrados) o Calendario mensual. Cada pendiente: estados, subtareas, log de notas, edición. Filtros por estado/responsable/rango de fechas. | Filtros, modo, creación/edición de pendientes, subtareas, notas. | CRUD de pendientes; persistencia. | `STATE.pendientes`, `PENDIENTE`. | OK |
| 7 | **Reportes** (`reportes`) | Sidebar | Exportes Excel (reporte general multi-hoja, MP pendientes del mes, historial completo), informe mensual por servicio (con preview + Excel + impresión), anexos imprimibles 1/3/4/5. | Servicio, mes, año; búsqueda de equipo para anexos. | Genera `.xlsx`; abre ventanas de impresión. | `XLSX`, `printDoc`, `calcularInformeServicio`. | OK · ver **B-08** (Anexo 1) |
| 8 | **Agenda** (`agenda`) | Sidebar | Contactos por servicio clínico (supervisor, encargado de equipos, jefe de CR). Búsqueda, filtros, orden. Edición rápida o por drawer. | Búsqueda, filtros, datos de contacto. | CRUD de contactos; persistencia. | `STATE.contactos`, `CONTACTO_TIPOS`. | OK |
| 9 | **Configuración** (`config`) | Sidebar | Datos (versión, maestro cargado, importar maestro, backup/restaurar), técnicos oficiales del SEC, diferencias del maestro ignoradas, usuario actual, grabación de sesión, mantenimiento (borrar todo). | Importaciones, edición de técnicos, usuario. | Importa/exporta; persiste; borra datos. | Todo `STATE`. | OK · ver **B-03**, **B-05** |

### Modales y subsistemas

| Identificador | Descripción | Estado |
|---|---|---|
| **Ficha 360** (`openFicha`) | Modal del equipo con 7 pestañas: Datos, Garantía, Grilla anual, Historial MP, Eventos (timeline), Ciclos, Pendientes. Acciones: Registrar MP, +Solicitud, +Envío, +Recepción, +Reparación. | OK |
| **Registrar MP** (`abrirModalRegistrarMP`) | Registra o edita una MP con panel de contexto, resultado (SI/NO/FS/BAJA/C1–C8), estado final, ejecutor. Dispara vinculación si corresponde. | OK · ver **B-17** |
| **Vinculación C2** (`abrirModalVinculacionC2`) | Vincula causal C2 a un envío existente o crea ciclo nuevo. | **ROTO — ver B-01** |
| **Vinculación C3 / SI-NoOp** (`abrirModalVinculacionC3`) | Vincula causal C3 (o MP "SI" que dejó el equipo No Operativo) a un ciclo existente, ciclo nuevo o pendiente al servicio clínico. | Parcial · ver **B-02, B-04** |
| **Ciclo correctivo v34** (`abrirModalSolicitudTrabajo`, `abrirModalEnvioST`, `abrirModalRecepcion`, `abrirModalReparacion`) | 4 modales del flujo: Solicitud → Envío(s) → Recepción(es) → Reparación. Genera pendientes automáticos y cambia estados. | OK |
| **Diferencias del maestro** (`abrirModalDiferenciasMaestro`) | Al reimportar el maestro, muestra equipos nuevos/ausentes/con cambios/cambios de grilla. Permite ignorar o crear pendientes por ítem. | OK |
| **Grilla de celda** (`abrirModalGrillaCelda`) | Cambia el marcador (X/R/RA/PM) de un mes. | OK |
| **Identificación de usuario / Bienvenida diaria** | Pide el técnico actual y muestra un resumen del día en la primera apertura diaria. | OK |
| **Command Palette** (`CMDK`, `Ctrl+K`) | Búsqueda y navegación: equipos, vistas, acciones. | OK |
| **Grabación de sesión** (`REC`) | Captura clicks/cambios/submits con timestamps; redacta campos sensibles; descarga log JSON + backup. | OK |
| Importación maestro / asignación | Parseo de Excel con SheetJS; detección de fila de encabezados; merge no destructivo. | OK |

---

## 0.3 Auditoría visual y UX

### Jerarquía visual
- **Buena en general.** Cada vista abre con un `view-header` (título 22 px + descripción) y agrupa contenido en secciones con rótulos en mayúsculas. El Dashboard tiene un orden claro: KPIs → atenciones críticas → distribución → resumen → recientes.
- El foco visual primario por vista es identificable. Los KPIs usan color semántico (rojo/ámbar/verde) para señalar urgencia.

### Consistencia
- **Espaciado:** mayormente múltiplos de 2/4 px, pero **sin sistema estricto**: conviven 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28 px. No hay una unidad base aplicada con disciplina (recomendación Fase 2: base 4 px).
- **Tipografía:** una sola familia (`Inter`). Tamaños: se cuentan **~13 valores distintos** (9.5, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15, 18, 22, 24, 32 px) — **fuera del ideal de 4–6**. Pesos: regular (400) y medium (500); el font solo carga 400 y 500, así que "bold" no está disponible (recomendación Fase 2: escala modular acotada).
- **Color:** la paleta tiene roles definidos (tokens `--info/--success/--warning/--danger/--purple` + `--ink-*` + `--paper-*`), comentada como "calmada" para uso prolongado. Es coherente. Riesgo: contraste de `--ink-3` y `--ink-4` (ver Accesibilidad).
- **Iconos:** un único set (Tabler Icons), estilo outline consistente.
- **Botones:** clases `.btn` consistentes con variantes (`primary`, `ghost`, `danger`, `sm`, `icon`). Bien.
- **Code smell de estilo:** cientos de `style:{}` inline en JS (B-21) conviven con las clases CSS, lo que dificulta mantener consistencia.

### Estados visuales de elementos interactivos
| Elemento | Normal | Hover | Focus | Active | Disabled | Loading | Error | Vacío | Éxito |
|---|---|---|---|---|---|---|---|---|---|
| `.btn` | ✓ | ✓ | ✓ (`:focus-visible`) | ✓ | ✓ (`opacity .5`) | ✗ | n/a | n/a | n/a |
| `.input/.select/.textarea` | ✓ | — | ✓ (borde + sombra) | n/a | — | ✗ | ✓ (`.err`) | — | — |
| `.nav-item` | ✓ | ✓ | CSS definido pero **inalcanzable** (B-11) | — | — | — | — | — | — |
| `.kpi`, `.tab`, `.step`, filas `<tr>` | ✓ | ✓ | CSS definido pero **inalcanzable** (B-11) | — | — | — | — | — | — |
| Vistas con datos | — | — | — | — | — | sin spinner (importes muestran toast "Procesando…") | toast de error | `emptyState` bien resuelto | toast de éxito |

**Faltantes:** estado *loading* explícito en botones de exportación/importación (hoy solo un toast); foco real en elementos no-`<button>` (B-11).

### Accesibilidad básica
- **Contraste:** `--info/--success/--warning/--danger` están comentados como ≥4.5:1 sobre `--paper`. `--ink` e `--ink-2` cumplen holgadamente. **`--ink-3` (#7c8590 oscuro / #7a766c claro) queda en el límite** para texto pequeño; `--ink-4` se usa para texto muy secundario y **probablemente no cumple AA** para 14 px. Recomendación Fase 2: verificar y subir `--ink-3` si hace falta.
- **Tamaño de texto:** el `body` es 13 px y abundan 11–12 px. **Por debajo del ideal de 14–16 px** para contenido principal. Recomendación Fase 2: subir el cuerpo base.
- **Targets táctiles:** `.btn.sm` (~24 px de alto) e `.btn.icon` (~28 px) están **por debajo de 44×44 px**. Afecta sobre todo en móvil.
- **Navegación por teclado:** parcial. Modales tienen *focus trap*. Inputs y `<button>` son alcanzables. Pero nav-items, KPIs, pestañas y filas de tabla **no** (B-11).
- **Labels:** **no asociados** a sus inputs (B-10).
- **`alt` en imágenes:** no aplica — la herramienta no usa `<img>`; los iconos son fuente de iconos.
- `<html lang="es">` correcto.

### Responsive
- **Desktop (1280 px+):** correcto. `.view` con `max-width: 1400px`.
- **Tablet (768 px):** el breakpoint de 900 px ya colapsó la sidebar; ver móvil.
- **Móvil (375 px):** `@media (max-width:900px)` hace `display:none` a la sidebar **sin reemplazo** (no hay menú hamburguesa). La única navegación en móvil es el botón "Buscar" del topbar (command palette). **Problema de descubribilidad.** Las tablas tienen scroll horizontal (`overflow-x:auto`), aceptable. Recomendación Fase 2: menú móvil real.
- No se detectó scroll horizontal indeseado del layout (solo el intencional de tablas).

---

## 0.4 Auditoría estructural

### Mapa de navegación

```
boot()
  └─ Dashboard (vista por defecto, siempre)
       │  (modal Identificar usuario en 1ª carga; modal Bienvenida 1ª vez del día)
       │
  Sidebar (9 ítems, lista plana, sin agrupación):
       ├─ Dashboard ─┐
       ├─ Inventario ─┤
       ├─ PMP anual ──┤
       ├─ Ciclos ─────┼──► cada vista ──► (click en equipo) ──► Ficha 360 (modal)
       ├─ Entregas ───┤                                            └─ +Solicitud/Envío/Recepción/Reparación
       ├─ Pendientes ─┤                                            └─ Registrar MP ──► Vinculación C2/C3
       ├─ Reportes ───┤
       ├─ Agenda ─────┤
       └─ Configuración┘

  Command Palette (Ctrl+K, desde cualquier vista) ──► navega a vistas / abre fichas / ejecuta acciones
```

- **Vistas huérfanas:** ninguna — las 9 son accesibles desde la sidebar y el command palette.
- **Múltiples entradas que pueden confundir:** "Importar maestro" tiene **4 puntos de entrada** (Dashboard, Configuración, command palette, modal Bienvenida). No es un error, pero conviene unificar el discurso en Fase 2.
- **Routing sin URL:** `Router.go` no usa hash ni history. F5 siempre vuelve al Dashboard y se pierde la vista/los filtros actuales. Decisión de diseño; mejorable en Fase 2/3.
- **Navegación plana:** el CSS define `.nav-group-label` (rótulos de grupo) pero **no se usa**: los 9 ítems van sin agrupar. Con 9 ítems planos la sidebar es manejable, pero agrupar (p. ej. "Operación" / "Datos" / "Sistema") mejoraría el escaneo.

### Redundancias

| Redundancia | Detalle | ¿Unificable? |
|---|---|---|
| `EQ.ciclosAbiertos` vs `CICLO.todosAbiertos` | Funciones idénticas. | Sí — Fase 2. |
| Funciones de "lista de técnicos" | `EQ.responsables`, `EQ.responsablesActivos` (muerta), `sugerirTecnicos` (muerta), `EQ.ejecutores`. | Sí — consolidar en Fase 2. |
| Dos fuentes de "técnicos oficiales" | const `TECNICOS_OFICIALES` vs `STATE.tecnicosOficiales` (B-05). | **Debe** unificarse. |
| `rowForEquipo` vs `rowEquipoDinamico` | La primera quedó muerta tras introducir columnas dinámicas. | Eliminar `rowForEquipo` — Fase 2. |
| Exportaciones dispersas | `exportarInventarioFiltrado` vive en Inventario; `exportReporteGeneral/MPPendientes/Historial` en Reportes; `exportPlantillaAsignacion` en Entregas. | No es error, pero un índice en Reportes ayudaría. |

### Conteo de clics en flujos críticos (hoy)

| Flujo | Clics aproximados | ¿Optimizable? |
|---|---|---|
| Buscar un equipo y abrir su ficha | 2 (`Ctrl+K` → escribir → Enter) o 3 (Inventario → buscar → click fila). | Ya es bueno. |
| Registrar una MP de un equipo | 3 (abrir ficha → "Registrar MP" → guardar). | Aceptable. |
| Crear un ciclo correctivo (solicitud) | 3 (ficha → "+Solicitud" → crear). | Aceptable. |
| Exportar inventario filtrado | 1 desde Inventario. | Óptimo. |
| Ver pendientes propios de hoy | 1 (KPI del Dashboard) o 3 (Pendientes → filtrar). | Bueno. |

No se detectaron flujos críticos con >3 clics evitables. La estructura de navegación es sólida; las oportunidades de Fase 2 son de **presentación y consistencia**, no de reorganización profunda.

---

## 0.5 Plan de simulación y línea base funcional

El contrato funcional completo —casos de prueba con precondición → acción → resultado esperado, y el resultado de la ejecución inicial sobre el HTML original— se entrega en:

> **`pruebas/contrato_funcional.md`**

Cubre, para cada funcionalidad mapeada en 0.2, los 6 tipos de caso exigidos (feliz, borde mínimo, borde máximo, vacío, inválido, interacción). Como no hay navegador headless disponible, se documenta como **pruebas manuales reproducibles paso a paso**, con la indicación de cargar primero `pruebas/dataset_pruebas.json`. Ese documento es el **contrato funcional inmutable** de referencia para las fases siguientes.

---

## 0.6 Inventario de parámetros reales del dominio

Todos los valores siguientes se extrajeron **directamente del código** del HTML. No se inventó ninguno.

### Identificador de equipo
- **Identificador interno único:** `uuid` (string UUID v4, generado por `uuid()`). Es la clave real usada por toda la app (`EQ.byUuid`, `pendientesIds`, `asignaciones[uuid]`, etc.).
- **Clave de negocio para cruzar con el maestro Excel:** `matchKey()` usa **serie** (prioritaria) o, si falta, **inventario**. ⚠️ Si faltan ambas, no hay clave → ver **B-07**.
- Existe además un campo `id` proveniente del maestro (string), de uso referencial.

### Estados posibles de un equipo (`ESTADOS`)
`Operativo` · `NoOperativo` · `ServicioTecnico` · `Recepcionado` · `FueraDeServicio` · `DeBaja` · `Slot`
Estados considerados "no operativos" (`ESTADOS_NO_OPERATIVOS`): `NoOperativo`, `ServicioTecnico`, `Recepcionado`.

### Estados de un pendiente (`ESTADOS_PENDIENTE`)
`Abierto` · `EnCurso` · `Esperando` · `Cerrado`

### Frecuencias de MP (`FRECUENCIAS`)
`Mensual` · `Trimestral` · `Semestral` · `Anual`

### Resultados de MP (`RESULTADOS_MP`)
`SI` (ejecutada) · `NO` (no ejecutada) · `FS` (fuera de servicio) · `BAJA` · `C1`–`C8` (causales).

### Causales (`CAUSALES`) — grupo A (con plazo de 30 días) / grupo B (sin plazo)
- `C1` (A), `C2` (B — equipo en servicio técnico), `C3` (B — espera de repuestos), `C4` (B), `C5` (A), `C6` (A), `C7` (A), `C8` (A).

### Marcadores de grilla anual
`X` (programada) · `R` (reprogramada) · `RA` (reprogramación legado) · `PM` (puesta en marcha).

### Servicios clínicos y tipos de equipo (familias)
**No están enumerados como constantes.** Se derivan dinámicamente de los datos cargados (`EQ.servicios()`, `EQ.familias()`). En el maestro real existen los que el Excel traiga. El dataset de pruebas (0.7) usa: 8 servicios y 10 familias representativos.

### Responsables / técnicos
- Lista oficial **cerrada y hardcodeada** (`TECNICOS_OFICIALES`, 11 entradas, orden institucional): Ricardo Matus Aroca, Ignacio Berner Bergara, Matías Soazo Garrido, Daniel Díaz Neira, Tito Millapán Riquelme, Carlos Bahamondes Seguel, Cristián Beltrán Oviedo, Cristina Rozas Urrutia, Macarena Toledo, Marco Ulloa, "Personal externo".
- `STATE.tecnicosOficiales` es una lista **separada y editable** por el usuario en Configuración (ver inconsistencia **B-05**).
- El campo `responsableMaster` del Excel se considera **referencial, NO fuente de verdad**.

### Esquema de datos de un equipo (`normalizeEquipoFromLegacy`)

```jsonc
{
  "uuid": "string (UUID v4) — requerido, clave interna",
  "id": "string|null — id del maestro, referencial",
  "fam": "string — familia/tipo de equipo",
  "famOriginal": "string — familia tal cual vino del maestro",
  "carpeta": "number|string|null",
  "inventario": "string — N° de inventario (clave de match secundaria)",
  "nombre": "string — nombre/modelo del equipo",
  "servicio": "string — servicio clínico",
  "unidad": "string", "ubicacion": "string", "procedencia": "string",
  "marca": "string", "modelo": "string",
  "serie": "string — N° de serie (clave de match primaria)",
  "anio": "string", "vidaUtil": "string", "clasificacion": "string",
  "enu": "string — ENU / baja", "observacion": "string",
  "frecuencia": "string — una de FRECUENCIAS",
  "responsableMaster": "string — referencial",
  "enGarantia": "boolean", "garantiaHasta": "ISO date|null", "garantiaProveedor": "string",
  "estado": "string — uno de ESTADOS",
  "estadoDesde": "ISO date|null — desde cuándo está en ese estado",
  "esSlot": "boolean — true = posición sin equipo",
  "grilla": "{ '1'..'12': 'X'|'R'|'RA'|'PM'|null }",
  "historial": "[ MP ]   — registros de mantención preventiva",
  "eventos":   "[ Evento ] — timeline de bajo nivel",
  "correctivos": "[ Ciclo v34 ]",
  "pendientesIds": "[ string ] — ids de pendientes ligados"
}
```

Sub-esquemas: **MP** `{id, fecha, fechaEvento, fechaRegistro, mes, resultado, ejecutor, obs, estadoFinal, tipoBaja, correctivoUuid, importadoDelMaestro, motivoCambioEjecutor}`. **Evento** `{id, ts, tsRegistro, tipo, payload}`. **Ciclo v34** `{uuid, abierto, enGarantia, solicitud, envios[], recepciones[], reparacion, eventos[], creado, cerrado, __migradoV34}`. **Pendiente** `{id, tipo, descripcion, equipoUuid, asignado, estado, creado, vence, log[], subtareas[], meta}`.

### Modelo de persistencia
- **`localStorage`**, prefijo `pmp.v3.`. Claves de datos: `equipos`, `pendientes`, `asignaciones`, `contactos`, `session`, `meta`, `tecnicosOficiales`, `diffIgnorados`.
- Claves de preferencias UI (también en `localStorage`): `pmp.v3.usuario`, `pmp.v3.ultimaApertura`, `pmp.v3.ui.theme`, `pmp.v3.ui.sidebar.collapsed`, `pmp.v3.ui.inventario.showSlots`, `pmp.v3.ui.inventario.columnas`.
- **Funciona 100 % offline** salvo dos CDN (SheetJS y JSZip) que se cargan con `defer` y solo se necesitan para importar/exportar Excel. El resto de la app no necesita red. → Ver "Confirmación de modo offline" abajo.
- `SCHEMA_VERSION = 1`. Existe migración desde claves legacy (`pmp_equipos`, etc.) y migraciones idempotentes de pendientes (V33) y ciclos (V34).

### Confirmación de modo offline (regla general 7 del prompt)
La herramienta **debe funcionar offline** y así está diseñada hoy, **con una excepción**: SheetJS (`cdn.sheetjs.com`) y JSZip (`cdnjs.cloudflare.com`) se cargan por CDN. Sin conexión, la app arranca y todo funciona salvo importar/exportar Excel (que avisan con un error claro: *"No se pudo cargar SheetJS… Verificá la conexión"*). **Decisión propuesta para Fase 3** (cuando se toque la 3.1/3.6/3.8): *vendorizar* (incrustar) ambas librerías en el HTML para garantizar offline total. Se documentará y consultará al introducirlas, según la regla general 6.

### Parámetros que faltan para Fase 3
La Fase 3.5 (alertas) y 3.4 (recordatorios) no requieren estados nuevos: los estados y causales actuales alcanzan. La 3.6 (informe de preventivas) y 3.7 (conciliación) ya tienen base. **No se identificó ningún parámetro de dominio inexistente que obligue a consultar al usuario en Fase 0.** Si en Fase 3 alguna funcionalidad nueva requiere un estado/categoría que no existe, se marcará como pregunta cerrada en ese momento.

---

## 0.7 Generación de datos de prueba

La base de la herramienta arranca **vacía** (los datos provienen de importar un Excel maestro; `localStorage` no trae nada). Como hay <20 registros (cero), corresponde generar un dataset de prueba.

- **Archivo:** `pruebas/dataset_pruebas.json` — **60 equipos**, 8 pendientes, 1 período de asignación (`2026-05`), contactos de ejemplo.
- **Generador determinístico:** `pruebas/generar_dataset.js` (Node, semilla fija ⇒ siempre el mismo dataset ⇒ simulaciones reproducibles).
- **Distribución de estados:** Operativo 38 · NoOperativo 5 · ServicioTecnico 6 · Recepcionado 3 · FueraDeServicio 2 · DeBaja 2 · Slot 4.
- **Cobertura:** 8 servicios clínicos, 10 familias, 4 frecuencias; fechas de creación e historial repartidas en los últimos 12 meses; equipos no-operativos con ciclos correctivos v34 coherentes (solicitud/envío/recepción) y eventos `ESTADO`; responsables externos repetidos entre equipos para probar agrupaciones; pendientes vencidos y por vencer; equipos con y sin garantía.
- **Formato:** compatible con la función `importBackup()` ya existente (`{appVersion, schemaVersion, equipos, pendientes, asignaciones, contactos, session}`), más una marca `_datasetPruebas: true`.

### Cómo cargarlo
1. Abrir la herramienta en un navegador **limpio** (sin datos reales) o, si hay datos reales, **descargar primero un backup propio** (Configuración → "Descargar backup").
2. Configuración → **"Restaurar backup"** → elegir `pruebas/dataset_pruebas.json` → confirmar.
3. Para regenerarlo: `node pruebas/generar_dataset.js`.

> **No se mezclan datos de prueba con datos reales.** El dataset es para un navegador de pruebas. La marca `_datasetPruebas` permite identificarlo.

---

## Checkpoint Fase 0

- [x] Declaración de capacidades técnicas hecha al inicio.
- [x] Reporte técnico (0.1) completo — 22 hallazgos de código + 2 de rendimiento.
- [x] Inventario de funcionalidades (0.2) completo — 9 vistas + modales/subsistemas.
- [x] Reporte visual/UX (0.3) completo.
- [x] Reporte estructural (0.4) completo — mapa de navegación, redundancias, conteo de clics.
- [x] Contrato funcional (0.5) documentado en `pruebas/contrato_funcional.md` y con su ejecución inicial registrada.
- [x] Inventario de parámetros reales del dominio (0.6) completo.
- [x] Dataset de pruebas (0.7) generado — `pruebas/dataset_pruebas.json` (60 equipos).
- [x] `original_backup.html` creado (copia exacta, intacta).
- [x] Reporte de Fase 0 entregado como `FASE_0_REPORTE.md` en la raíz.

---

## Apéndice — Mapeo Fase 3 (requerimientos) → estado actual del código

Este apéndice **no es parte de Fase 0**; se incluye para que la planificación de Fase 3 parta de lo que ya existe y no rehaga lo que funciona (regla "no romper nada").

| # Fase 3 | Requerimiento | Estado en R10 | Trabajo estimado |
|---|---|---|---|
| 3.1 | Exportación filtrada a Excel | **Ya existe** (`exportarInventarioFiltrado`, `exportReporteGeneral`, etc.). Falta: hoja "Metadata" con propósito/destinatario y un **log de exportaciones**. | Enriquecer, no crear. |
| 3.2 | Filtros simples y combinables | **Ya existe** y es extenso (Inventario). "Vistas guardadas" existen como *presets* fijos; faltan **vistas guardadas por el usuario** (nombrar/renombrar/eliminar) y el conteo "X de Y" explícito. | Enriquecer. |
| 3.3 | Trazabilidad por equipo | **Ya existe** (ficha → pestaña Eventos, timeline). Falta: comentario manual como evento; algunos tipos de evento (exportación, conciliación). | Enriquecer. |
| 3.4 | Pendientes y recordatorios | **Ya existe** (vista Pendientes, muy completa: estados, subtareas, log, calendario). Falta: hora de recordatorio; "posponer/snooze" explícito. | Enriquecer. |
| 3.5 | Alertas automáticas | **Parcial.** Existen `alertasDeEquipo`, `revisarEquiposVencidos`, banners. Falta: **centro de alertas con campana** en el header, reglas configurables. | Construir lo nuevo sobre lo existente. |
| 3.6 | Informe mensual de preventivas | **Ya existe** (`renderInformeServicioBlock`, Excel + impresión). Falta: una hoja por servicio + hoja resumen. | Enriquecer. |
| 3.7 | Conciliación contra maestro | **Ya existe** (import maestro + modal de diferencias = es una conciliación). Falta: aceptar `.csv`, vista/historial de conciliaciones formal. | Enriquecer. |
| 3.8 | Persistencia y respaldo | **Existe** localStorage + backup/restore. Falta: **respaldo automático con rotación**, alerta de capacidad 80 %, confirmación escrita al importar, y corregir **B-03**. | Construir lo nuevo + corregir B-03. |
| 3.9 | Dashboard | **Ya existe** y es completo. Falta: medir render <1 s; "atajos rápidos" como sección explícita. | Medir y ajustar. |
| 3.10 | Historial de cambios | **Parcial.** Existe el timeline de eventos, pero **no** un log campo-a-campo de ediciones de datos planos del equipo, ni vista global "Actividad reciente". | Construir lo nuevo. |
| 3.11 | Búsqueda libre | **Parcial.** Existe el command palette (`Ctrl+K`). Falta: caja de búsqueda **siempre visible en el header** con dropdown de resultados y atajo `/`. | Construir lo nuevo (reusando `EQ.search`). |
| 3.12 | Confirmación antes de borrar | **Parcial.** `UI.dialog` ya se usa antes de varias acciones destructivas. Falta: **confirmación con palabra escrita** (`ELIMINAR`/`IMPORTAR`) para acciones críticas, y cubrir todos los casos del listado. | Enriquecer `UI.dialog`. |

> Recomendación para la planificación de Fase 3: tratar la mayoría de los puntos como **enriquecimiento incremental** de funcionalidades existentes (respetando sus contratos de función actuales) y construir desde cero solo el **centro de alertas (3.5)**, el **log de cambios campo-a-campo + actividad reciente (3.10)** y la **búsqueda en el header (3.11)**.
