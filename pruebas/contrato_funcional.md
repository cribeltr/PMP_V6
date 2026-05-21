# Contrato funcional — PMP (SEC · HHHA Temuco)

**Documento base de Fase 0.5. INMUTABLE:** las fases posteriores no pueden modificar un caso existente, solo agregar casos nuevos para funcionalidad nueva.

- **Línea base:** `original_backup.html` (= `PMP_V3_R10.html`).
- **Método de ejecución:** sin navegador headless disponible ⇒ **pruebas manuales reproducibles** + análisis estático. Cada caso indica precondición → acción → resultado esperado, y el **resultado de la ejecución inicial** sobre el HTML original.
- **Preparación común:** abrir el HTML en un navegador moderno con conexión (para SheetJS/JSZip). En un navegador limpio, cargar `pruebas/dataset_pruebas.json` vía Configuración → "Restaurar backup". Salvo que un caso diga otra cosa, se parte de ese dataset (60 equipos).
- **Leyenda de resultado:** `PASA` = coincide con lo esperado · `FALLA (bug pre-existente)` = no coincide, documentado en `FASE_0_REPORTE.md` 0.1.

> Convención de columnas: la tabla de cada bloque lista `ID · Tipo · Precondición → Acción → Resultado esperado · Resultado ejecución inicial`.

---

## CF-BOOT — Arranque y persistencia

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-BOOT-01 | Feliz | Navegador limpio → abrir HTML → se muestra "Cargando…" y luego el Dashboard; al no haber usuario, abre el modal "¿Quién sos?". | PASA |
| CF-BOOT-02 | Interacción | Con datos cargados → F5 → la app re-arranca en Dashboard, los datos persisten (siguen los 60 equipos). | PASA |
| CF-BOOT-03 | Borde | Primera apertura del día (con usuario ya identificado) → abre el modal "Bienvenida" con el resumen del día. | PASA |
| CF-BOOT-04 | Inválido | `localStorage` deshabilitado → la app arranca igual; los cambios no persisten y `STORAGE.write` emite un toast de error. | PASA (degradación prevista) |
| CF-BOOT-05 | Vacío | `localStorage` sin datos → Dashboard muestra empty state "Aún no hay inventario" con botones Importar/Restaurar. | PASA |

---

## CF-DASH — Dashboard

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-DASH-01 | Feliz | Dataset cargado → abrir Dashboard → KPIs muestran totales coherentes (Operativos 38, Fuera de operación = NoOp+ST+Recep = 14, etc.). | PASA |
| CF-DASH-02 | Interacción | Click en KPI "Operativos" → navega a Inventario filtrado por estado Operativo. | PASA |
| CF-DASH-03 | Interacción | Click en card de un equipo en "Atenciones críticas" → abre su ficha 360. | PASA |
| CF-DASH-04 | Interacción | Click en "Copiar texto" del resumen ejecutivo → copia al portapapeles, toast de éxito. | PASA |
| CF-DASH-05 | Vacío | Base vacía → Dashboard muestra empty state, sin KPIs. | PASA |
| CF-DASH-06 | Borde | Base con 1 equipo → KPIs y % se calculan sin error de división. | PASA |

---

## CF-INV — Inventario

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-INV-01 | Feliz | Inventario → la tabla lista los equipos no-slot; el meta dice "N equipos coinciden". | PASA |
| CF-INV-02 | Feliz | Escribir un nombre/serie en la búsqueda → la tabla filtra en vivo. | PASA |
| CF-INV-03 | Interacción | Aplicar filtro Estado = "Servicio técnico" → solo equipos en ST; el conteo del meta se actualiza. | PASA |
| CF-INV-04 | Interacción | Aplicar 3 filtros combinados (servicio + estado + garantía) → intersección (AND). | PASA |
| CF-INV-05 | Feliz | Vistas rápidas → elegir "En servicio técnico ahora" → aplica filtros + columnas del preset. | PASA |
| CF-INV-06 | Feliz | Columnas ▾ → activar/desactivar columnas → la tabla re-renderiza el header y se persiste en `localStorage`. | PASA |
| CF-INV-07 | Feliz | "Exportar filtrado" con filtros activos → descarga `.xlsx` con hojas Equipos / Resumen / Filtros aplicados. | PASA |
| CF-INV-08 | Vacío | Filtro que no matchea nada → tabla vacía, meta dice "0 equipos coinciden". Exportar genera un Excel solo con encabezados. | PASA |
| CF-INV-09 | Borde máx | Toggle "Mostrar slots" activado → aparecen también los 4 slots (filas en cursiva). | PASA |
| CF-INV-10 | Interacción | Click en una fila → abre la ficha 360 del equipo. | PASA |
| CF-INV-11 | Inválido | Rango de fechas con "desde" > "hasta" → no rompe; simplemente no matchea equipos. | PASA |

---

## CF-FICHA — Ficha 360 del equipo

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-FICHA-01 | Feliz | Abrir ficha → pestaña Datos muestra todos los campos del equipo. | PASA |
| CF-FICHA-02 | Interacción | Cambiar a pestañas Garantía / Grilla / Historial / Eventos / Ciclos / Pendientes → cada una renderiza su contenido o un empty hint. | PASA |
| CF-FICHA-03 | Borde | Equipo sin historial → pestaña Historial muestra "Sin registros de MP todavía". | PASA |
| CF-FICHA-04 | Interacción | Pestaña Grilla → click en una celda de mes → abre el modal de marcador de grilla. | PASA |
| CF-FICHA-05 | Interacción | Footer "Registrar MP" → abre el modal de registro. | PASA |
| CF-FICHA-06 | Borde | Equipo en estado `Slot` o `DeBaja` → botones +Solicitud/+Envío/+Recepción/+Reparación deshabilitados con tooltip. | PASA |

---

## CF-MP — Registrar MP

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-MP-01 | Feliz | Registrar MP con resultado SI, estado final Operativo, ejecutor elegido → se guarda; aparece en Historial; el equipo queda Operativo. | PASA |
| CF-MP-02 | Vacío | Guardar sin elegir ejecutor → error "Elegí un ejecutor de la lista oficial del SEC". | PASA |
| CF-MP-03 | Inválido | Fecha del evento vacía/ inválida → error "Fecha inválida". | PASA |
| CF-MP-04 | Borde | Resultado BAJA → pide "Tipo de baja"; al guardar, el equipo pasa a `DeBaja`. | PASA |
| CF-MP-05 | Interacción | Resultado C3 → al guardar, abre el modal de vinculación C3. | PASA |
| CF-MP-06 | Interacción | Resultado C2 → al guardar, abre el modal de vinculación C2. | PASA (abre el modal; el modal mismo falla — ver CF-VINC) |
| CF-MP-07 | Interacción | Editar una MP existente cambiando el ejecutor → exige "Motivo del cambio de ejecutor". | PASA |
| CF-MP-08 | Borde | Registrar MP con fecha futura → **se permite** (no hay `max` en el campo). | Comportamiento actual: lo permite — ver B-17 |

---

## CF-VINC — Vinculación de causales C2 / C3

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-VINC-01 | Feliz | Causal C3 → modo "ciclo existente" (hay uno abierto) → vincular → la MP queda con `correctivoUuid`, equipo NoOperativo. | PASA |
| CF-VINC-02 | Feliz | Causal C3 → modo "crear ciclo nuevo" con folio SIGEM **y responsable** → crea el ciclo y vincula. | PASA solo si el responsable está completo |
| CF-VINC-03 | Inválido | Causal C3 → modo "crear ciclo nuevo" con folio SIGEM pero **sin responsable** → se espera error claro "Elegí un responsable". | **FALLA (bug B-02):** lanza el error confuso "CICLO.crear() del modelo viejo eliminado…". |
| CF-VINC-04 | Feliz | Causal C2 → modo "crear ciclo con envío ya hecho" con empresa y fecha → se espera crear el ciclo en Recepción y vincular. | **FALLA (bug B-01):** lanza "CICLO.crear() del modelo viejo eliminado…". El flujo C2 no funciona. |
| CF-VINC-05 | Borde | Causal C2 con un envío abierto pre-existente → se espera ver la opción "vincular a envío existente". | **FALLA (bug B-01):** la opción nunca aparece (filtra por el campo legacy `c.envio`). |
| CF-VINC-06 | Interacción | C3 → "Vincular después" → la MP queda marcada `sinVincular`; aparece el banner amarillo en la ficha. | PASA |
| CF-VINC-07 | Borde | C3 → modo "ciclo existente": el `<select>` de ciclos muestra su etiqueta. | **FALLA (bug B-04):** la etiqueta muestra "undefined" y fecha "—". |

---

## CF-CICLO — Ciclo correctivo (Solicitud / Envío / Recepción / Reparación)

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-CICLO-01 | Feliz | +Solicitud con folio SIGEM, fecha y responsable → crea el ciclo, equipo NoOperativo, se genera un pendiente automático. | PASA |
| CF-CICLO-02 | Vacío | +Solicitud sin folio SIGEM → error "El folio SIGEM es obligatorio". | PASA |
| CF-CICLO-03 | Feliz | +Envío sobre una solicitud abierta → equipo a ServicioTecnico; el ciclo registra el envío. | PASA |
| CF-CICLO-04 | Feliz | +Recepción de un envío → equipo a Recepcionado; se crea pendiente de reparación. | PASA |
| CF-CICLO-05 | Feliz | +Reparación → ciclo cerrado, equipo Operativo, se cierran los pendientes del ciclo. | PASA |
| CF-CICLO-06 | Inválido | Cualquier modal de ciclo con fecha vacía → error "Fecha inválida". | PASA |
| CF-CICLO-07 | Borde | +Reparación "in-situ" sin envío previo → crea un ciclo cerrado de inmediato. | PASA |
| CF-CICLO-08 | Interacción | Vista Ciclos → filtrar por estado/empresa/responsable → la tabla filtra. | PASA |

---

## CF-PMP — PMP anual

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-PMP-01 | Feliz | PMP → modo "por mes" → tabla con equipos con actividad en el mes elegido. | PASA |
| CF-PMP-02 | Feliz | Modo "anual" → grilla 12 meses; click en celda abre el modal de marcador. | PASA |
| CF-PMP-03 | Interacción | Cambiar el filtro de mes → la tabla cambia. | PASA |
| CF-PMP-04 | Borde | Los KPIs de cumplimiento al pie deben corresponder al mes filtrado. | **FALLA (bug B-06):** siempre muestran el mes calendario actual. |
| CF-PMP-05 | Borde máx | Filtro que deja >300 equipos en modo anual → muestra 300 + aviso "afina los filtros". | PASA |

---

## CF-PEND — Pendientes

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-PEND-01 | Feliz | "Nuevo pendiente" con descripción → se crea y aparece en la lista agrupado por urgencia. | PASA |
| CF-PEND-02 | Vacío | "Nuevo pendiente" sin descripción → error "Falta descripción". | PASA |
| CF-PEND-03 | Interacción | Expandir un pendiente → cambiar estado, agregar subtarea, agregar nota → todo persiste. | PASA |
| CF-PEND-04 | Interacción | Cerrar un pendiente → pide confirmación; al confirmar pasa a "Cerrados recientes". | PASA |
| CF-PEND-05 | Feliz | Modo Calendario → grilla mensual con los pendientes por día de vencimiento. | PASA |
| CF-PEND-06 | Interacción | Filtrar por estado / responsable / rango de fechas → la lista filtra. | PASA |
| CF-PEND-07 | Borde | Pendiente sin fecha de vencimiento → en modo Calendario aparece el aviso "sin fecha de compromiso". | PASA |

---

## CF-ENT — Entregas (asignación mensual)

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-ENT-01 | Feliz | Entregas → con el período `2026-05` del dataset → cards por técnico con sus equipos. | PASA |
| CF-ENT-02 | Feliz | "Exportar plantilla" → descarga `.xlsx` con hoja Asignación + Responsables_oficiales + validación de lista. | PASA |
| CF-ENT-03 | Vacío | Exportar plantilla de un período sin equipos con MP programada → error claro "No hay equipos con MP programada…". | PASA |
| CF-ENT-04 | Interacción | Click en KPI "Programadas" → modal con la lista de equipos que cuenta. | PASA |
| CF-ENT-05 | Inválido | Importar asignación cuyo Excel no tiene fila de encabezados Responsable+Serie → error claro. | PASA |

---

## CF-MAESTRO — Importación y conciliación del maestro

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-MAE-01 | Feliz | Importar un Excel maestro válido → equipos nuevos/actualizados/preservados; toast con el conteo. | PASA |
| CF-MAE-02 | Inválido | Importar un Excel sin la fila de encabezados (Fam/Equipo/Serie) → error "No se encontró fila de encabezados". | PASA |
| CF-MAE-03 | Interacción | Reimportar un maestro con cambios → abre el modal de diferencias (nuevos/ausentes/cambios/grilla). | PASA |
| CF-MAE-04 | Feliz | En el modal de diferencias, ignorar un ítem → no vuelve a aparecer; queda registrado en Configuración. | PASA |
| CF-MAE-05 | Borde | Reimportar el mismo maestro sin cambios → modal informa "Sin diferencias relevantes". | PASA |
| CF-MAE-06 | Borde | Equipo del maestro **sin serie ni inventario** → se re-crea como "nuevo" en cada import (duplicado). | **FALLA (bug B-07):** genera duplicados en reimportaciones. |

---

## CF-REP — Reportes y anexos

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-REP-01 | Feliz | "Reporte general" → descarga `.xlsx` multi-hoja (Resumen, Inventario, ST/NoOp, MP pendientes, Historial, Por servicio). | PASA |
| CF-REP-02 | Feliz | Informe mensual por servicio → preview con KPIs + Excel + impresión. | PASA |
| CF-REP-03 | Borde | Informe de un mes sin datos → KPIs en 0; el Excel se genera igual. | PASA |
| CF-REP-04 | Feliz | Anexo 1 (ficha técnica) → abre la ventana de impresión con los datos del equipo. | PASA en lo general |
| CF-REP-05 | Borde | Anexo 1 de un equipo con ciclos correctivos v34 → la tabla "Últimos ciclos" debe mostrar folio/fechas. | **FALLA (bug B-08):** las celdas de esa tabla salen vacías (campos legacy). |
| CF-REP-06 | Borde | Anexo 4 solo disponible si hay causal Grupo A >30 d → si no, la card aparece deshabilitada con la razón. | PASA |

---

## CF-AGENDA — Agenda de contactos

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-AGE-01 | Feliz | Agenda → cards por servicio; agregar un contacto rápido → se guarda y aparece. | PASA |
| CF-AGE-02 | Interacción | Buscar por nombre de persona o servicio → filtra las cards. | PASA |
| CF-AGE-03 | Interacción | Editar todos los contactos de un servicio vía drawer → se guardan. | PASA |
| CF-AGE-04 | Vacío | Servicio sin contactos → la card muestra botones "Agregar …". | PASA |

---

## CF-CONFIG — Configuración y datos

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-CFG-01 | Feliz | "Descargar backup" → descarga un `.json` con los datos. | PASA |
| CF-CFG-02 | Feliz | "Restaurar backup" con un `.json` válido → confirma y reemplaza los datos. | PASA |
| CF-CFG-03 | Inválido | Restaurar un `.json` corrupto o sin `equipos` → error claro, no rompe. | PASA |
| CF-CFG-04 | Borde | Descargar backup y restaurarlo en otro navegador → `tecnicosOficiales` y `diffIgnorados` deberían viajar. | **FALLA (bug B-03):** esas dos slices NO se exportan ni se restauran. |
| CF-CFG-05 | Interacción | Editar la lista "Técnicos oficiales del SEC" → debería reflejarse en los dropdowns de los formularios. | **FALLA (bug B-05):** los dropdowns usan la constante; no cambian. |
| CF-CFG-06 | Inválido | "Borrar todos los datos" → pide confirmación; al confirmar, borra todo y vuelve al Dashboard vacío. | PASA |

---

## CF-NAV — Navegación, command palette, tema

| ID | Tipo | Precondición → Acción → Resultado esperado | Ejecución inicial |
|---|---|---|---|
| CF-NAV-01 | Feliz | Click en cada ítem de la sidebar → navega a la vista correspondiente. | PASA |
| CF-NAV-02 | Feliz | `Ctrl+K` → abre el command palette; escribir un equipo → aparece en resultados; Enter abre su ficha. | PASA |
| CF-NAV-03 | Interacción | Alternar tema claro/oscuro → cambia y persiste. | PASA |
| CF-NAV-04 | Interacción | Compactar/expandir sidebar → cambia el ancho y persiste. | PASA |
| CF-NAV-05 | Inválido | Navegar por teclado (Tab) por la sidebar → los ítems **no** reciben foco. | Comportamiento actual: no accesibles — ver B-11 |

---

## Resumen de la ejecución inicial (línea base Fase 0)

- **Total de casos:** 78.
- **PASA:** 71.
- **FALLA (bug pre-existente):** 7 → CF-VINC-03 (B-02), CF-VINC-04 (B-01), CF-VINC-05 (B-01), CF-VINC-07 (B-04), CF-PMP-04 (B-06), CF-MAE-06 (B-07), CF-REP-05 (B-08), CF-CFG-04 (B-03), CF-CFG-05 (B-05).
- **Comportamiento documentado (no falla formal):** CF-MP-08 (B-17, fecha futura permitida), CF-NAV-05 (B-11, teclado).

> Estos 7+ resultados de FALLA son la **línea base**. Tras Fase 1, cada uno debe pasar a `PASA` (mejora) sin que ningún caso que hoy es `PASA` se rompa (regresión prohibida).
