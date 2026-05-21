# FASE 2 — Reorganización estructural y rediseño UX/UI

**Objetivo:** aplicar los hallazgos de la auditoría 0.3 (UX) y 0.4 (estructura) mejorando diseño, navegación y accesibilidad **sin alterar ninguna funcionalidad**.

- **Backup previo:** `pre_fase_2_backup.html`.
- **Verificación:** arnés `pruebas/run_pruebas.js` — **34/34 pruebas PASA** (27 de Fases 0–1 + 7 nuevas de Fase 2). Las 9 vistas renderizan sin excepción: **0 regresiones**.

> **Nota sobre capturas (capacidad declarada):** este entorno no tiene navegador headless, por lo que no se pueden generar capturas `before/after`. Las carpetas `snapshots/` quedan vacías y los cambios visuales se describen textualmente. Por esta misma razón, los cambios **puramente cosméticos** se hicieron de forma **conservadora**: alterar a ciegas docenas de estilos sería incompatible con la regla "no romper nada" (no hay forma de detectar una regresión visual). Se priorizaron los cambios **estructuralmente verificables** (accesibilidad, navegación, limpieza) que el arnés sí comprueba.

---

## 2.1 Cumplimiento de las reglas estrictas

| Regla | Cumplimiento |
|---|---|
| Prohibido modificar lógica de negocio | ✅ Ningún cambio toca `MP`, `CICLO`, `PENDIENTE`, `EQ` (salvo eliminar un método muerto). |
| Prohibido modificar estructura de datos | ✅ Esquemas, nombres de campos y formatos guardados intactos. `NAV_ITEMS` recibió un campo `grupo` (additivo, configuración de UI, no dato de negocio). |
| Prohibido modificar contratos de funciones | ✅ `field()`, `kpiCard()`, `renderNav()` mantienen firma y valor de retorno. |
| Contrato funcional tras cada bloque | ✅ Arnés 34/34, sin regresiones. |

---

## 2.2 Cambios aplicados (con justificación)

### Accesibilidad

| Cambio | Hallazgo | Justificación |
|---|---|---|
| `field()` asocia `<label>` con su control vía `for`/`id` (id autogenerado). | **B-10** (0.3) | Antes label e input eran hermanos sueltos; los lectores de pantalla no los vinculaban. |
| Ítems de navegación accesibles por teclado: `tabindex="0"`, `role="button"`, activación con Enter/Espacio, `aria-current` en el activo. | **B-11** (0.3) | Antes los `nav-item` eran `<div>` sin foco posible — la app no se podía recorrer con Tab. |
| KPIs clickeables accesibles por teclado (`tabindex`, `role`, Enter/Espacio). | **B-11** | Mismo problema en las tarjetas KPI del Dashboard y otras vistas. |
| Pestañas de la ficha 360 accesibles por teclado. | **B-11** | Las pestañas eran `<div>` solo-click. |
| `--ink-3` oscurecido (`#7a766c` → `#6e6a60`) en tema claro. | 0.3 (contraste) | Antes ~4.2:1 sobre `--paper`; ahora cumple WCAG AA (≥4.5:1) para texto pequeño. |

### Navegación y responsive

| Cambio | Hallazgo | Justificación |
|---|---|---|
| **Navegación móvil:** botón hamburguesa en el topbar (solo <900px) que abre la sidebar como panel lateral (drawer) con velo; se cierra al elegir un ítem o tocar el velo. | 0.3 (responsive) | Antes la sidebar hacía `display:none` en móvil **sin reemplazo**: la única forma de navegar era el command palette. |
| **Sidebar agrupada** en "Operación / Gestión / Sistema" usando los rótulos de grupo (`.nav-group-label`, una clase CSS que existía pero no se usaba). | 0.4 | Los 9 ítems planos se escanean mejor agrupados por propósito. |

### Sistema de diseño

| Cambio | Hallazgo | Justificación |
|---|---|---|
| Tokens de **espaciado** con base 4 px (`--sp-1`…`--sp-6`) y **escala tipográfica** de 6 tamaños (`--fs-xs`…`--fs-xl`) definidos en `:root`. | 0.3 (consistencia) | La auditoría detectó ~13 tamaños de fuente distintos y espaciado sin sistema. Los tokens establecen la escala objetivo. **Adopción:** se dejan disponibles; su migración masiva sobre los estilos inline (B-21) se posterga (ver 2.3). |

### Limpieza estructural

| Cambio | Hallazgo | Justificación |
|---|---|---|
| Eliminadas 4 funciones muertas (`fuzzyMatch`, `sugerirTecnicos`, `rowForEquipo`, `soonView`) y 1 método muerto (`EQ.responsablesActivos`). | **B-14** (0.1) | Código nunca invocado; reduce ruido sin impacto funcional. |
| Eliminada la condición siempre-verdadera `if (… || true)` en `abrirModalEnvioST`. | **B-15** (0.1) | Código muerto dentro del condicional. |

---

## 2.3 Mejoras de Fase 2 documentadas y NO aplicadas (postergadas)

| Tema | Por qué se posterga |
|---|---|
| Migración completa de estilos inline `style:{}` a los tokens/clases CSS (**B-21**). | Son cientos de ocurrencias en 9.000+ líneas. Sin navegador para verificar visualmente, hacerlo a ciegas arriesga regresiones visuales que no se podrían detectar — contrario a "no romper nada". Los tokens quedan definidos para adopción incremental. |
| Filas de tabla accesibles por teclado (parte de **B-11**). | Se priorizó la navegación principal (sidebar, KPIs, pestañas), que cubre el grueso del recorrido con Tab. Las filas siguen abriéndose con click; el command palette ofrece una ruta por teclado a las fichas. |
| Estado visual *loading* en botones de exportación. | Mejora menor; las exportaciones ya muestran un toast "Procesando…". |
| Rediseño visual agresivo (nueva paleta, nuevos tamaños). | La herramienta ya tiene una identidad visual coherente y madura (R10): paleta con roles definidos, un único set de iconos, estados bien resueltos. El principio de "minimalismo funcional" del prompt ("eliminá ruido, no funcionalidad") no encontró ruido que justificara un rediseño de fondo; sí se corrigieron accesibilidad y navegación, que eran las carencias reales. |

---

## 2.4 Estado visual — descripción textual (antes / después)

| Vista / elemento | Antes | Después |
|---|---|---|
| Sidebar (escritorio) | 9 ítems en lista plana. | 9 ítems bajo 3 rótulos de grupo (Operación / Gestión / Sistema). Foco de teclado visible. |
| Sidebar (móvil <900px) | Oculta, sin reemplazo. | Botón hamburguesa en el topbar; se despliega como panel lateral con velo oscuro. |
| Formularios | `<label>` visualmente sobre el input pero sin vínculo programático. | Idénticos a la vista; ahora con `for`/`id` (cambio invisible, mejora de accesibilidad). |
| KPIs y pestañas | Solo respondían a click. | Idénticos a la vista; ahora también responden a Tab + Enter/Espacio, con anillo de foco. |
| Texto secundario (tema claro) | Gris `#7a766c`. | Gris levemente más oscuro `#6e6a60` — diferencia sutil, mejora de legibilidad/contraste. |

---

## Checkpoint Fase 2

- [x] 100 % del contrato funcional intacto (arnés 34/34, 0 regresiones).
- [x] Mejoras visuales y estructurales aplicadas con justificación basada en 0.3 y 0.4.
- [x] `pre_fase_2_backup.html` creado.
- [x] Sin alterar lógica de negocio, estructura de datos ni contratos de función.
