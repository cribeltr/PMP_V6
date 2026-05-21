# FASE 3 — Expansión funcional (reporte acumulativo)

**Backup previo:** `pre_fase_3_backup.html`.
**Verificación:** arnés `pruebas/run_pruebas.js` — **84/84 pruebas PASA, 0 regresiones** sobre las 34 de Fases 0–2.

> **Estado: las 12 funcionalidades de Fase 3 están implementadas y verificadas.**
> Enfoque adoptado (decisión autónoma confirmada): **enriquecer lo existente** sin reconstruir lo que ya funcionaba — la auditoría 0.2 mostró que la mayoría de las funcionalidades ya existían parcialmente.

## Orden de implementación

Se siguió el orden del documento (3.8 → 3.10 → 3.12 → 3.11 → 3.2 → 3.1 → 3.3 → 3.4 → 3.5 → 3.7 → 3.6 → 3.9), con una sola variación documentada: la **3.12** se completó junto con la 3.8 porque la 3.8 ("confirmación escrita al importar") depende del diálogo de palabra escrita que define la 3.12.

Antes de cada funcionalidad se extendió el contrato funcional con sus casos de prueba (grupos G a Q del arnés); cada commit corrió el arnés completo confirmando 0 regresiones.

---

## 3.8 — Persistencia y respaldo de datos ✅

- Respaldo automático con **rotación FIFO de 7**: uno por sesión cada 24 h y uno al cerrar la pestaña si hubo cambios (bandera `_datosModificados`).
- Estimación de capacidad de `localStorage` + **banner persistente al 80 %**.
- Tarjeta "Respaldos automáticos" en Configuración: listar, restaurar, eliminar, crear.
- `construirPayloadBackup` / `aplicarPayloadBackup` como única fuente del formato; exportación `respaldo_equipos_*.json`.
- Importación con conteos y confirmación escrita; snapshot de seguridad previo.
- **Decisión:** límite de `localStorage` asumido en ~5 MB (no hay API estándar). **Pruebas:** G-01…G-04, G-07, D-B03a/b.

## 3.10 — Historial de cambios ✅

- Slice `STATE.cambios`; `registrarCambio()` registra cambios campo-a-campo.
- Se capturan: cambios de la importación del maestro (campos y grilla), altas de equipo y ediciones manuales de grilla.
- Vista nueva **"Actividad reciente"** (menú) con filtros por equipo, campo y rango de fechas; pestaña **"Cambios"** en la ficha.
- **Decisión:** registra desde el momento de implementación; no reconstruye historia previa (regla 10 del prompt). **Pruebas:** H-01…H-05.

## 3.12 — Confirmación antes de borrar ✅

- `confirmarConPalabra()`: el botón de confirmar se habilita solo al escribir la palabra exacta.
- Aplicado a "Restaurar respaldo" (`IMPORTAR`/`RESTAURAR`) y "Borrar todos los datos" (`ELIMINAR`). Eliminar respaldo/pendiente/vista usa confirmación simple. **Pruebas:** G-05, G-06.

## 3.11 — Búsqueda libre ✅

- Caja de búsqueda **siempre visible en el header**; atajo `/`; el command palette queda en el ícono de comandos (Ctrl+K).
- `buscarLibre()`: serie, inventario, nombre, modelo, marca, responsable, servicio, observaciones y texto de eventos; indica el campo donde coincide.
- Resultados en vivo (debounce 200 ms), dropdown de 10, navegación por teclado, Enter abre el listado filtrado. **Pruebas:** I-01…I-06.

## 3.2 — Filtros simples y combinables ✅

- Los filtros combinables del Inventario ya existían; se agregaron las **vistas guardadas por el usuario** (guardar combinación de filtros+columnas, renombrar, eliminar, aplicar) en el popover "Vistas rápidas".
- Conteo de resultados como **"Mostrando X de Y equipos"**. **Pruebas:** J-01…J-04.

## 3.1 — Exportación filtrada a Excel ✅

- Modal previo con **propósito** y **destinatario**; hoja **"Metadata"** (fecha, archivo, conteo, propósito, destinatario, filtros legibles).
- **Registro de exportaciones** (`STATE.exportaciones`) + sección "Historial de exportaciones" en Reportes; aviso ante resultado vacío. **Pruebas:** K-01…K-04.

## 3.3 — Trazabilidad por equipo ✅

- La línea de tiempo de eventos ya existía; se agregó el botón **"Agregar comentario"**: la nota libre queda como evento `COMENTARIO` con autor. **Pruebas:** L-01…L-03.

## 3.4 — Pendientes y recordatorios ✅

- Campo de **hora** opcional en el recordatorio (`isoFromDateTime`).
- Acción **"Posponer"** (snooze) con opciones rápidas o fecha personalizada.
- Acción **"Eliminar"** pendiente con confirmación; limpia referencias en equipos. **Pruebas:** M-01…M-04.

## 3.5 — Alertas automáticas ✅

- Reglas configurables: estado >N días, sin actualización >N días, pendiente vencido, pendiente por vencer.
- **Ícono de campana** en el topbar con conteo; **centro de alertas** (panel lateral) ordenado por prioridad con Ver / Reconocer / Resolver.
- Estado de cada alerta persistido (`STATE.alertasEstado`); tarjeta de configuración en Configuración.
- **Decisión:** la regla "mantención preventiva próxima" se cubre con la vista PMP (cumplimiento del mes) y no se duplicó como alerta para no saturar el badge. **Pruebas:** N-01…N-06.

## 3.7 — Conciliación contra archivo maestro ✅

- La importación del maestro con detección de diferencias ya era una conciliación; se agregó **soporte de archivos `.csv`** y el **historial de conciliaciones** (`STATE.conciliaciones`) con sección en Reportes. **Pruebas:** O-01…O-04.

## 3.6 — Informe mensual de preventivas ✅

- `exportInformeMensualMulti`: **una hoja Excel por servicio** + hoja **"Resumen"** (totales por servicio y conteo por resultado).
- Selección de un servicio o "Todos"; mes por defecto = mes anterior. **Pruebas:** P-01…P-03.

## 3.9 — Dashboard ✅

- Sección **"Atajos rápidos"**; KPI **"Alertas activas"** que abre el centro.
- **Medición de render** con `performance.now()`: se informa en consola y se advierte si supera 1 s.
- **Medición observada:** con el dataset de 60 equipos el render del dashboard tarda **~15–60 ms**. La instrumentación queda activa para verificar el objetivo "<1 s con 1000+ equipos" sobre la base real. **Pruebas:** Q-01…Q-03.

---

## Migración de datos existentes

Las funcionalidades que introdujeron slices nuevas (`cambios`, `exportaciones`, `alertasEstado`, `conciliaciones`) las inicializan como **arrays/objetos vacíos** para los datos existentes — no se pide al usuario llenar nada retroactivamente. Todas se incluyen en el respaldo (`construirPayloadBackup`).

## Checkpoint Fase 3

- [x] Las 12 funcionalidades implementadas, cada una con sus pruebas pasando.
- [x] Sin regresiones en el contrato funcional original (84/84 en el arnés).
- [x] Contrato funcional extendido con los casos de prueba de cada funcionalidad (grupos G–Q).
