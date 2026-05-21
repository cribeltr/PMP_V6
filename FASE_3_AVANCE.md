# FASE 3 — Avance de la expansión funcional (acumulativo)

**Backup previo:** `pre_fase_3_backup.html`.
**Verificación continua:** arnés `pruebas/run_pruebas.js` — al cierre de este avance, **41/41 pruebas PASA** (0 regresiones sobre las 34 previas).

> **Estado:** 2 de las 12 funcionalidades de Fase 3 están implementadas y verificadas (3.8 y 3.12). El resto está planificado y documentado en la sección "Pendiente" y en `REPORTE_FINAL.md`. La auditoría 0.2 ya estableció que la mayoría de las 12 funcionalidades **existen parcialmente** en la herramienta; la decisión autónoma adoptada es **enriquecer lo existente** sin reconstruir lo que ya funciona (regla "no romper nada").

---

## 3.8 — Persistencia y respaldo de datos  ✅ Implementada

**Diagnóstico previo (0.6):** la herramienta ya persiste en `localStorage` y tiene exportar/restaurar respaldo (JSON). Faltaba: respaldo automático con rotación, alerta de capacidad y confirmación reforzada al importar.

**Implementado:**
- **Respaldo automático con rotación FIFO (7 snapshots):** clave separada `pmp.v3.autobackups`. Se crea uno **por sesión cada 24 h** (al arrancar, si no hubo uno reciente) y **uno al cerrar la pestaña** si hubo cambios (bandera `_datosModificados`, que se marca en `persist()`). Si no hay espacio, descarta los más antiguos y reintenta.
- **Estimación de capacidad de `localStorage`** (`capacidadStorage()`) y **banner persistente** que aparece en cualquier vista cuando el uso supera el **80 %**.
- **Tarjeta "Respaldos automáticos"** en Configuración: barra de capacidad, lista de snapshots (fecha, motivo, equipos, tamaño), y acciones **Restaurar / Eliminar / Crear respaldo ahora**.
- **Exportación de respaldo completo:** archivo `respaldo_equipos_AAAA-MM-DD-HHMM.json` con toda la base.
- **Importación de respaldo:** valida estructura; muestra los conteos ("vas a reemplazar X por Y equipos"); exige **confirmación escrita** (`IMPORTAR`); crea un snapshot de seguridad **antes** de sobreescribir.
- Refactor: `construirPayloadBackup()` / `aplicarPayloadBackup()` como única fuente del formato de respaldo (lo usan exportar, importar y los snapshots).

**Decisiones tomadas:**
- El límite de `localStorage` se asume en ~5 MB (valor típico). Es una estimación; el banner al 80 % y el reintento con descarte cubren el caso de desbordamiento real.
- Los snapshots se guardan en el mismo `localStorage`. Con bases grandes, 7 snapshots pueden presionar la capacidad; por eso la rotación, el descarte-y-reintento y la alerta. El respaldo manual descargable sigue siendo la red de seguridad principal.

**Pruebas que pasan:** `G-01` (crear snapshot), `G-02` (rotación FIFO ≤7), `G-03` (capacidad), `G-04` (eliminar snapshot), `G-07` (tarjeta en Configuración), `D-B03a/b` (payload completo). Sin regresiones.

---

## 3.12 — Confirmación antes de borrar  ✅ Implementada

> **Nota de orden:** la 3.12 se implementó junto con la 3.8 (y no después de la 3.10) porque la 3.8 **depende** de ella: "confirmación escrita al importar" necesita el diálogo de palabra escrita que define la 3.12. Se respetó así la regla "si una dependencia detecta que falta algo, agregalo y documentalo". La 3.10 queda como siguiente pendiente.

**Implementado:**
- **`confirmarConPalabra({ title, message, palabra, confirmText })`**: diálogo modal con un campo de texto; el botón de confirmar permanece **deshabilitado** hasta que el texto coincide **exactamente** con la palabra. Banner de advertencia rojo, botón en color de peligro.
- Aplicado a las acciones críticas e irreversibles existentes:
  - **Restaurar respaldo** (JSON y snapshot automático) → palabra `IMPORTAR` / `RESTAURAR`.
  - **Borrar todos los datos** → palabra `ELIMINAR`.
- **Eliminar un respaldo automático** usa confirmación simple (`UI.dialog`), según la 3.12 (la palabra escrita se reserva para las acciones críticas).

**Decisiones tomadas:**
- Los otros objetivos que la 3.12 menciona (eliminar equipo, eliminar pendiente, eliminar vista guardada de filtros) **no tienen flujo de borrado en la herramienta actual**; se conectarán a `confirmarConPalabra` / `UI.dialog` cuando esas funcionalidades se construyan (3.2 vistas guardadas, etc.).

**Pruebas que pasan:** `G-05` (botón bloqueado hasta escribir la palabra), `G-06` (importBackup y "borrar datos" usan confirmación escrita).

---

## Preparado para 3.10 (no implementado aún)

Se agregó la slice de datos **`STATE.cambios`** (log de cambios campo-a-campo), persistida e incluida en el respaldo. Está vacía hasta que se implemente la 3.10; su valor por defecto (array vacío) es exactamente la estrategia de migración indicada por el prompt para registros existentes.

---

## Pendiente (10 de 12 funcionalidades) — orden y estado

| # orden | Func. | Estado actual en la herramienta (de 0.2) | Trabajo pendiente |
|---|---|---|---|
| 2 | 3.10 Historial de cambios | Parcial — existe el timeline de eventos por equipo. | Log campo-a-campo + vista global "Actividad reciente". |
| 4 | 3.11 Búsqueda libre | Parcial — command palette `Ctrl+K`. | Caja siempre visible en el header + atajo `/`. |
| 5 | 3.2 Filtros combinables | **Existe** y es extenso. | Vistas guardadas por el usuario (nombrar/editar/eliminar). |
| 6 | 3.1 Exportación filtrada | **Existe**. | Hoja "Metadata" (propósito/destinatario) + log de exportaciones. |
| 7 | 3.3 Trazabilidad | **Existe** (timeline). | Comentario manual como evento; eventos de exportación/conciliación. |
| 8 | 3.4 Pendientes y recordatorios | **Existe** y es completo. | Hora de recordatorio; "posponer/snooze" explícito. |
| 9 | 3.5 Alertas automáticas | Parcial. | Centro de alertas con campana en el header; reglas configurables. |
| 10 | 3.7 Conciliación maestro | **Existe** (import + diferencias). | Aceptar `.csv`; historial de conciliaciones formal. |
| 11 | 3.6 Informe mensual | **Existe**. | Una hoja Excel por servicio + hoja resumen. |
| 12 | 3.9 Dashboard | **Existe** y es completo. | Medir render <1 s; sección de atajos rápidos. |

Cada una se abordará como **enriquecimiento incremental**, extendiendo el contrato funcional con sus casos de prueba antes de implementar (procedimiento 3.0 del prompt).
