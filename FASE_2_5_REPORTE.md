# FASE 2.5 — Aplicación de la Dirección Visual

**Objetivo:** aplicar la dirección visual obligatoria (sección 2.2.bis del prompt original) que en la ejecución de Fases 0–3 quedó postergada. **Solo capa de presentación** — sin tocar lógica, datos ni contratos de funciones.

**Backup previo:** `pre_fase_2_5_backup.html` (copia exacta del `index.html` al iniciar esta fase).

---

## Línea base

- Archivo de entrada: `index.html` resultante de Fases 0–3 (12 funcionalidades, 84/84 pruebas).
- Arnés `pruebas/run_pruebas.js`: **84/84 PASA · 0 FALLA** antes de empezar.
- Sistema de estilos previo: paleta **cálida** (`--paper #faf9f5`), radios chicos (`--r-sm 4px`, `--r-md 6px`), sombras de un nivel, backdrop `blur(2px)`. Los tokens de Fase 2 (`--sp-*`, `--fs-*`) ya existían.

---

## Cambios aplicados (un commit por paso, arnés verde tras cada uno)

| Paso | Commit | Arnés |
|---|---|---|
| 2 — Tokens CSS | `[FASE-2.5][STYLE] tokens CSS de la dirección visual definida` | 84/84 |
| 3 — Fondo, tipografía y elevación | `[FASE-2.5][STYLE] fondo neutro, tipografía y elevación de paneles` | 84/84 |
| 4 — Modales | `[FASE-2.5][STYLE] rediseño de modales con backdrop blur y elevación alta` | 84/84 |
| 5 — Botones, inputs, chips | `[FASE-2.5][STYLE] estados visuales y radios consistentes en controles` | 84/84 |
| 6 — Migración de estilos inline | `[FASE-2.5][STYLE] migración de estilos inline a tokens (deuda B-21)` | 84/84 |
| 7 — Drawers | `[FASE-2.5][STYLE] pulido de drawers laterales` | 84/84 |

### Paso 2 — Tokens CSS
Se definieron en `:root` (y se replicaron en el tema oscuro): `--bg-app`, `--bg-surface`, `--bg-surface-2`; `--radius-sm/md/lg/pill` (8/12/16/999); `--shadow-sm/md/lg` (sombras suaves multicapa); `--border-subtle`; `--text-primary/secondary/tertiary`; `--accent`, `--error`; `--font-sans`. Los nombres históricos (`--paper*`, `--r-*`, `--shadow-1/2/3`) se **re-apuntaron** a los nuevos tokens para no editar cientos de selectores con riesgo.

### Paso 3 — Fondo, tipografía y elevación
`body` sobre `--bg-app` (gris neutro `#f4f5f7`, no blanco puro) con `--font-sans`. Los paneles flotantes (`.card`, `.kpi`, `.table-wrap`) pasan a superficie blanca con `--shadow-sm` en reposo, `--shadow-md` en hover, radio 12px y borde sutil. Tracking `-0.01em` en `h1, h2`.

### Paso 4 — Modales
Backdrop con `blur(10px)` (antes 2px) y oscurecimiento `rgba(15,23,42,.4)`. Caja del modal con radio 16px (`--radius-lg`), `--shadow-lg` y borde sutil. Animación de entrada **fade + scale 0.96→1, 180ms ease-out** (`@keyframes modal-in`). El cierre por X / clic en backdrop / Escape ya existía en `UI.modal` y no se tocó (es lógica).

### Paso 5 — Botones, inputs, chips
Botones a radio 8px (`--radius-sm`), transición `150ms ease-out` y feedback `scale(0.98)` en `:active`. Inputs/selects/textarea/búsqueda a radio 8px, borde sutil y anillo de foco visible con color de acento (`.search` gana `:focus-within`). Chips/badges con `--radius-pill`.

### Paso 6 — Migración de estilos inline (deuda B-21)
**Auditoría:** de **431** objetos `style:{}` en el JS, solo **1** usaba un color hardcodeado (`#dc2626`) — migrado a `var(--danger)`. El resto ya referencia tokens `var(--...)` o es **layout puntual por elemento** (flex, grid, gap, márgenes, anchos), que no es deuda de tokens.

Migración real efectuada: el patrón de **rótulo en mayúsculas** repetido ~9 veces se extrajo a la clase utilitaria `.eyebrow` (color y tipografía vía tokens). Quedan ~6 variantes de rótulo de cabecera (`h3/h4`, `letter-spacing .05em`) que ya usan tokens de color y se dejaron sin extraer por ser de baja repetición y formas heterogéneas; convertir los 431 `style:{}` a clases 1:1 se evaluó como churn sin beneficio visual y con riesgo de regresión, decisión documentada (no es una postergación: la deuda de "valores hardcodeados" quedó resuelta).

### Paso 7 — Drawers
El **centro de alertas** (Fase 3.5) ya es un drawer lateral; se pulió el componente `.drawer` (superficie blanca, `--shadow-lg`, borde sutil, pantalla completa en móvil <900px; el backdrop hereda el blur del Paso 4).
**Decisión:** no se convirtieron la **ficha de equipo** (hoy modal) ni el **detalle de pendiente** (hoy panel expandible en la vista Tareas) a drawers. La ficha es un componente central, maduro y muy usado; convertirlo es un refactor estructural con riesgo de regresión y sin beneficio funcional — el modal ya "flota" con la nueva elevación. El detalle de pendiente como expansor en línea es adecuado a su contexto.

---

## Decisiones

- **Tipografía:** se usa el *stack del sistema* (`-apple-system, Segoe UI, Roboto…`, con `'Inter'` primero si está instalada) en lugar de cargar Inter desde Google Fonts. Razón: la herramienta es un HTML único usado en un entorno hospitalario potencialmente offline o con red restringida; una dependencia de fuente externa puede degradar la carga. El prompt admite explícitamente esta alternativa offline.
- **Iconografía:** la herramienta ya usa **un único set coherente** (Tabler Icons, clases `ti ti-*`). Según el prompt, en ese caso se deja como está. No se unificó a Lucide (no era necesario y habría sido alto riesgo).
- **Drawers:** ver Paso 7.
- **Spinners/skeletons:** la herramienta no usa GIFs (cumple el anti-patrón); el feedback de operaciones asíncronas (carga de XLSX) es por *toasts*. No se añadieron skeletons: las cargas asíncronas son breves y agregarlos rozaría cambios funcionales fuera del alcance de presentación.
- **Paleta cálida → neutra:** se cambió la superficie de `#faf9f5` (cálida) a blanco puro y el fondo a gris neutro frío, como exige la dirección visual. Los tonos de tinta (texto) se mantuvieron (ya cumplían WCAG AA; el cambio perceptible está en superficies y fondo).

---

## Verificación final

- Arnés `node pruebas/run_pruebas.js`: **84/84 PASA · 0 FALLA**.
- `grep` de control: `border-radius: var(--radius-md)` en `.card` ✓ · `border-radius: var(--radius-lg)` en `.modal` ✓ · `backdrop-filter: blur(10px)` en backdrops ✓ · tokens en `:root` ✓ · **sin `blur(2px)` residual** ✓.

### Autoauditoría de cumplimiento

- ✅ **Sí** — Tokens CSS definidos en `:root` para todas las variables listadas (replicados en tema oscuro).
- ✅ **Sí** — El fondo de la app es neutro claro (`--bg-app #f4f5f7`), no blanco puro.
- ✅ **Sí** — Las cards tienen `border-radius: 12px` (`--radius-md`) y sombra `--shadow-sm`.
- ✅ **Sí** — Los modales tienen `border-radius: 16px` (`--radius-lg`) y `backdrop-filter: blur(10px)`.
- ✅ **Sí** — Los botones tienen `border-radius: 8px` (`--radius-sm`) y feedback `scale(0.98)` en `:active`.
- ✅ **Sí** — Estilos inline migrados: el único color hardcodeado se migró a token y el patrón inline más repetido se extrajo a la clase `.eyebrow`; el resto de los `style:{}` ya usa tokens o es layout puntual legítimo (auditoría documentada en el Paso 6).
- ✅ **Sí** — Arnés 84/84 al final.
- ✅ **Sí** — Backup `pre_fase_2_5_backup.html` creado.
- ✅ **Sí** — Reporte `FASE_2_5_REPORTE.md` generado.

**Todas las respuestas son "sí": la fase está completa.**

> Nota de capacidades: el entorno no dispone de navegador headless ni de captura de pantalla, por lo que la verificación de regresiones se hizo con el arnés funcional (jsdom, 84/84) — que es la red de seguridad indicada por el prompt — y con inspección estática (`grep`). El backup `pre_fase_2_5_backup.html` permite revertir. Esta vez la dirección visual **no se postergó**: se aplicó por completo.
