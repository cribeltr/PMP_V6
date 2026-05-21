# Prompt para Claude Code: Auditoría, Rediseño y Expansión de Herramienta HTML — Gestión de Equipos Médicos

Te entrego un archivo HTML que corresponde a una herramienta funcional que uso para registrar información de equipos médicos. Tu trabajo es auditarla, corregirla, rediseñarla y expandirla siguiendo las fases y reglas de este documento al pie de la letra.

Actúa como **experto senior en programación web, diseño UX/UI y arquitectura de software**. Toma decisiones técnicas y de diseño de forma autónoma. Solo pregúntame si encuentras una ambigüedad real que no puedas resolver por contexto. Cuando preguntes, hazlo con preguntas cerradas (sí/no o entre opciones concretas), no abiertas.

---

## CONTEXTO DE LA HERRAMIENTA

- Soy responsable de gestión de equipos médicos.
- Hoy la herramienta sirve para **registrar** información de equipos.
- La herramienta ya tiene **importación masiva** funcionando (no la rediseñes salvo que detectes bugs).
- Existe un **archivo maestro / cartera** validado por resolución, que es la fuente oficial. El programa es donde llevo el detalle del día a día.
- Necesito que la herramienta deje de ser solo "para registrar" y se convierta en mi herramienta de trabajo diario: que me permita **responder pedidos puntuales, hacer seguimiento, generar alertas, conciliar contra el archivo maestro y tener trazabilidad completa**.
- **No uses IA ni NLP en el programa.** Toda la lógica debe ser determinística, basada en filtros, reglas y estructuras claras.

---

## CAPACIDADES TÉCNICAS DE CLAUDE CODE (declarar antes de empezar)

Antes de iniciar Fase 0, declara explícitamente en un bloque al inicio de `FASE_0_REPORTE.md` (sección "Capacidades declaradas"):

1. **¿Tienes acceso a navegador headless** (Playwright, Puppeteer, Chrome DevTools Protocol)? Si sí, úsalo para toda simulación de Fase 0.5 y todas las validaciones posteriores. Si no, ejecuta las simulaciones como **análisis estático del código + pruebas manuales reproducibles** documentadas paso a paso para que yo las ejecute. En ambos casos, el contrato funcional debe quedar definido.
2. **¿Tienes acceso a entorno Node.js** para correr scripts auxiliares (parseos, conversiones)? Declara qué versiones tienes.
3. **¿Puedes generar capturas** del HTML renderizado? Si no, omite las capturas y reemplázalas por descripciones textuales detalladas del estado visual.

Según lo que declares, ajustarás los entregables sin que yo tenga que decírtelo.

---

## POLÍTICA DE PREGUNTAS Y AUTONOMÍA

- Pregúntame solo en caso de **bloqueo real** (definido más abajo).
- Cuando preguntes, usa preguntas cerradas (sí/no o entre opciones concretas).
- **Si haces una pregunta y no respondo en la siguiente interacción, toma la decisión por defecto más razonable, documenta qué decidiste y por qué, y continúa.** No te quedes esperando.
- Si más adelante quiero cambiar tu decisión, lo haré explícitamente.

---

- **"No romper nada"** significa: toda acción que producía un resultado X antes de un cambio, debe producir exactamente el mismo resultado X después del cambio. Si un cambio modifica un resultado existente sin que yo lo haya pedido, eso es una regresión y debe revertirse.
- **"Simular"** significa: ejecutar el flujo paso a paso como lo haría un usuario real (clic por clic, ingreso de datos por ingreso de datos), y verificar que el resultado coincide con el esperado. Si tienes acceso a herramientas de testing automatizado para HTML (Playwright, Puppeteer, Cypress, jsdom + jest), úsalas. Si no, hazlo manualmente abriendo el HTML en navegador y documentando cada paso.
- **"Contrato funcional"** es la documentación firmada en Fase 0 con el resultado esperado de cada prueba. Es **inmutable**: ninguna fase posterior puede modificarlo, solo extenderlo con pruebas nuevas para funcionalidades nuevas.
- **"Commit pequeño"** es un cambio lógico atómico (una corrección, una funcionalidad nueva, una reorganización de una vista). No mezcles tipos de cambio en un mismo commit.
- **"Bloqueo real"** que justifica preguntarme: pérdida potencial de datos del usuario, ambigüedad entre dos comportamientos opuestos del negocio, requerimiento técnicamente imposible con el stack actual, riesgo de seguridad. Cualquier otra duda la resuelves tú.

---

## REGLAS GENERALES (aplican en todas las fases)

1. **Antes de tocar nada**, crea `original_backup.html` como copia exacta del HTML que te entrego. Este archivo es intocable hasta el final. Si en algún momento todo se rompe sin recuperación, este es el punto de retorno.

2. Después de Fase 0, antes de iniciar Fase 1, crea `pre_fase_1_backup.html`. Antes de iniciar cada fase posterior, crea su respectivo `pre_fase_N_backup.html`. Estos backups intermedios son tu red de seguridad para revertir fases completas si algo sale catastróficamente mal.

3. **Después de cada bloque de cambios** (no de cada fase, sino de cada cambio lógico dentro de una fase), ejecuta la simulación completa del contrato funcional vigente. Si una sola prueba que antes pasaba ahora falla, **revierte ese bloque inmediatamente** y reintenta de otra forma. No acumules cambios sin validar.

4. **Commits descriptivos y pequeños** con mensaje en formato: `[FASE-N][TIPO] descripción corta`. Tipos válidos: `FIX` (corrección de bug), `REFACTOR` (reorganización sin cambio funcional), `STYLE` (cambio visual), `FEAT` (funcionalidad nueva), `TEST` (agregado o modificación de pruebas), `DOC` (documentación).

5. **Detecta y corrige errores proactivamente** durante todas las fases. Si en Fase 2 ves un bug que no detectaste en Fase 0, agrégalo al reporte de Fase 1 retroactivamente y corrígelo en el momento.

6. **No introduzcas dependencias externas nuevas sin avisarme.** Si una funcionalidad nueva requiere una librería (ej: SheetJS para Excel), me lo dices, y justificas por qué es necesaria antes de incorporarla. Prioriza dependencias servidas vía CDN si el HTML es standalone, o vendoreadas en el mismo archivo si la herramienta debe funcionar offline.

7. **Si la herramienta debe funcionar offline** (que es lo más probable dado que es un HTML), confírmalo en Fase 0 y diséñalo todo asumiendo cero conectividad por defecto.

8. **Decisiones autónomas.** No pidas aprobación intermedia salvo bloqueo real (definido arriba).

9. **Idioma:** todo texto nuevo que agregues a la interfaz (labels, botones, mensajes, tooltips, mensajes de error) debe estar en el mismo idioma que el HTML existente. Si el HTML está en español, todo texto nuevo en español. Mantén consistencia de tono (formal/informal) con lo existente.

10. **Enriquecimiento del historial desde datos existentes:** cuando implementes 3.10, puedes inferir eventos pasados a partir de timestamps ya presentes en los datos (ej: campo `fecha_creacion` → evento "creación inferida"; `fecha_ultima_modificacion` → evento "modificación inferida"). Márcalos claramente como `tipo: "inferido"` para distinguirlos de los registrados en vivo. No inventes valores ni eventos sin base en datos reales.

11. **Idioma de comunicación:** todas tus respuestas, reportes, comentarios en código, mensajes de commit, documentación y cualquier comunicación conmigo deben estar en **español**. Esto aplica también al contenido de los archivos `FASE_N_REPORTE.md`, `REPORTE_FINAL.md`, bitácoras y mensajes de error que generes para mí. El código en sí (nombres de variables, funciones) puede mantenerse en el idioma original del HTML, pero los comentarios deben ir en español.

---

## FASE 0: Auditoría Inicial y Establecimiento del Contrato Funcional

**Objetivo:** Diagnóstico exhaustivo del estado actual. Cero modificaciones al código en esta fase. Solo lectura, análisis y documentación.

### 0.1 Auditoría técnica

Recorre todo el HTML, CSS y JavaScript embebido y detecta:

**Errores y bugs:**
- Errores y warnings en consola del navegador (al cargar y al ejecutar cada acción).
- Funciones declaradas pero nunca invocadas.
- Variables declaradas sin uso.
- IDs duplicados en el HTML (HTML inválido).
- Event listeners duplicados o que se registran múltiples veces sin removerse.
- Promesas sin manejo de error (sin `.catch` o sin `try/catch` en `async/await`).
- Llamadas a APIs del navegador sin verificar disponibilidad (`localStorage`, `IndexedDB`, etc.).
- Operaciones que pueden fallar silenciosamente (parseos JSON sin try/catch, accesos a propiedades de objetos posiblemente null).

**Validaciones débiles:**
- Inputs numéricos sin validación de rango o de tipo.
- Inputs de fecha sin validación de formato o rango.
- Campos requeridos no marcados como tales.
- Inputs de texto sin límite de longitud razonable.
- Faltas de sanitización en inputs que luego se renderean (riesgo XSS).

**Rendimiento:**
- Loops dentro de loops sobre estructuras grandes.
- Manipulación masiva del DOM sin uso de DocumentFragment.
- Re-renders innecesarios al cambiar estado.
- Carga de imágenes sin lazy loading cuando aplique.

**Riesgos de pérdida de datos:**
- ¿Dónde se guardan los datos? (localStorage, sessionStorage, IndexedDB, memoria volátil).
- ¿Qué pasa si el usuario presiona F5 a mitad de un formulario?
- ¿Qué pasa si el navegador limpia el caché?
- ¿Hay límite de capacidad del almacén usado? ¿Qué pasa al llenarse?
- ¿Hay confirmaciones antes de cerrar con cambios sin guardar?

**Entregable 0.1:** Tabla con columnas: `categoría | descripción del problema | ubicación (línea/función) | severidad (crítica/alta/media/baja) | acción propuesta (corregir en Fase 1 / posponer)`.

### 0.2 Mapeo exhaustivo de funcionalidades existentes

Lista **toda** funcionalidad presente en el HTML, sin omitir ninguna. Para cada una documenta:

- **Nombre/identificador** (cómo la voy a referenciar).
- **Ubicación en la interfaz** (en qué vista/sección está).
- **Descripción** (qué hace, en lenguaje funcional).
- **Inputs** (qué datos toma del usuario).
- **Salidas/efectos** (qué produce, qué modifica).
- **Dependencias** (de qué otras funcionalidades o datos depende).
- **Estado actual** (funciona OK / funciona con bugs / no funciona).

**Entregable 0.2:** Inventario completo en formato tabla o lista estructurada.

### 0.3 Auditoría visual y UX

Evalúa con criterios concretos:

**Jerarquía visual:**
- ¿Al abrir cada vista, está claro qué es lo más importante?
- ¿Hay un foco visual primario por vista?
- ¿Los títulos, secciones y acciones tienen pesos visuales coherentes con su importancia?

**Consistencia:**
- ¿El espaciado entre elementos sigue un sistema (base 4px u 8px)?
- ¿Cuántas familias tipográficas hay? (idealmente 1-2).
- ¿Cuántos tamaños de fuente distintos hay? (idealmente 4-6 en una escala modular).
- ¿La paleta de colores tiene propósito definido para cada color, o es arbitraria?
- ¿Los iconos siguen un mismo estilo (todos outline, todos fill, etc.)?
- ¿Botones y elementos similares se ven y comportan igual en toda la app?

**Estados visuales (para cada elemento interactivo):**
- Estado normal.
- Estado hover.
- Estado focus (visible para navegación por teclado).
- Estado active/pressed.
- Estado disabled.
- Estado loading (cuando aplique).
- Estado de error (cuando aplique).
- Estado vacío / sin datos (cuando aplique).
- Estado de éxito (cuando aplique).

Documenta cuáles faltan por elemento.

**Accesibilidad básica:**
- Contraste de texto vs fondo: mínimo 4.5:1 para texto normal, 3:1 para texto ≥18px o ≥14px bold (WCAG AA).
- Tamaño mínimo de texto: 14px (idealmente 16px para contenido principal).
- Targets táctiles: mínimo 44x44px.
- Navegación por teclado: ¿se puede recorrer toda la app con Tab? ¿se ve el focus?
- Labels asociados a inputs (atributo `for` o anidamiento).
- Atributos `alt` en imágenes.

**Responsive:**
- ¿Cómo se ve en móvil (375px), tablet (768px), desktop (1280px+)?
- ¿Hay scroll horizontal indeseado en algún breakpoint?
- ¿Los elementos colapsan/reorganizan adecuadamente?

**Entregable 0.3:** Reporte con secciones por cada apartado, con problemas específicos y propuesta de mejora.

### 0.4 Auditoría estructural

**Redundancias:**
- ¿Hay dos botones que hacen lo mismo en lugares distintos?
- ¿Hay dos formularios que capturan la misma información?
- ¿Hay vistas que muestran datos casi idénticos con leves variaciones?
- Si las hay, ¿se pueden unificar?

**Reorganización de vistas:**
- Para cada flujo crítico (registrar equipo, buscar equipo, etc.), cuenta cuántos clics se necesitan hoy.
- Identifica flujos con más de 3 clics que podrían reducirse.
- Identifica agrupaciones poco lógicas (información relacionada que está separada, o información no relacionada que está junta).

**Navegación:**
- Dibuja un mapa de navegación (qué vistas existen, cómo se llega a cada una).
- Identifica vistas huérfanas (sin entrada clara).
- Identifica vistas con múltiples entradas que pueden confundir.

**Entregable 0.4:** Mapa de navegación + lista de redundancias + lista de propuestas de reorganización con justificación.

### 0.5 Plan de simulación y línea base funcional

Para cada funcionalidad mapeada en 0.2, define **al menos** estos casos:

1. **Caso feliz:** uso normal esperado.
2. **Caso borde mínimo:** valor mínimo permitido, campo justo en el límite inferior.
3. **Caso borde máximo:** valor máximo permitido, campo justo en el límite superior.
4. **Caso vacío:** envío con campos requeridos en blanco.
5. **Caso inválido:** input con formato incorrecto (texto donde va número, fecha imposible, etc.).
6. **Caso de interacción:** combinación con otra funcionalidad relacionada.

Para cada caso documenta: **precondición → acción → resultado esperado**.

Ejecuta cada caso sobre el HTML original y documenta el resultado real. Si difiere del esperado, márcalo como bug pre-existente.

**Si tienes herramientas de testing automatizadas disponibles**, genera un script ejecutable (Playwright, Cypress, etc.) que corra toda la simulación con un solo comando. Si no, deja la simulación documentada como pasos manuales reproducibles.

**Entregable 0.5:** Documento o script con todas las pruebas, sus resultados esperados y los resultados de la ejecución inicial. Este documento es el **contrato funcional**.

### 0.6 Inventario de parámetros reales del dominio

Extrae directamente del código del HTML (lectura del JS, datos en localStorage si los hay, opciones de selects, etc.) y documenta:

- **Identificador único de equipo:** qué campo se usa hoy como identificador único (número de serie, código interno, ID generado, etc.). Si hay ambigüedad o duplicados, márcalo como issue y propón el que tenga más sentido.
- **Estados posibles de un equipo:** lista exhaustiva de los valores que puede tomar el campo "estado".
- **Servicios clínicos existentes:** lista de servicios mencionados.
- **Tipos de equipo existentes:** lista de tipos mencionados.
- **Responsables / técnicos externos:** lista si está modelada, o nota si es campo libre.
- **Estructura de los datos guardados:** esquema JSON de cómo se almacena un equipo (todos los campos, sus tipos, cuáles son requeridos).
- **Modelo de persistencia:** localStorage, sessionStorage, IndexedDB, memoria volátil, o ninguno.

**Estos valores son la base sobre la cual se construye Fase 3.** No inventes valores nuevos. Si el HTML tiene un campo `estado` con valores ["operativo", "en_servicio_tecnico"], usa exactamente esos, no inventes "esperando_repuesto" si no existe.

Si una funcionalidad nueva (ej: 3.5 Alertas) requiere un estado o categoría que no existe en el HTML actual, márcalo como pregunta y consúltame.

### 0.7 Generación de datos de prueba

Si la base de datos del HTML está vacía o tiene muy pocos registros (menos de 20 equipos), genera un dataset de prueba realista con:

- 50 equipos como mínimo.
- Distribuidos entre todos los estados, servicios y tipos detectados en 0.6.
- Con fechas de creación distribuidas en los últimos 12 meses.
- Algunos con eventos/historial simulado.
- Algunos con responsables externos repetidos para probar agrupaciones.

Este dataset debe poder cargarse y descargarse fácilmente para que las simulaciones sean reproducibles. Guárdalo como `dataset_pruebas.json` y documenta cómo cargarlo.

**No mezcles datos de prueba con datos reales** si ya hay datos cargados. En ese caso, trabaja con los datos reales y agrega un modo "demo" separado.

### Checkpoint Fase 0

No avances sin tener:
- [x] Declaración de capacidades técnicas hecha al inicio.
- [x] Reporte técnico (0.1) completo.
- [x] Inventario de funcionalidades (0.2) completo.
- [x] Reporte visual/UX (0.3) completo.
- [x] Reporte estructural (0.4) completo.
- [x] Contrato funcional (0.5) documentado y ejecutado al menos una vez sobre el HTML original.
- [x] Inventario de parámetros reales del dominio (0.6) completo.
- [x] Dataset de pruebas generado (0.7) si correspondía.
- [x] `original_backup.html` creado.
- [x] Reporte de Fase 0 entregado como archivo `FASE_0_REPORTE.md` en la raíz del proyecto.

---

## FASE 1: Correcciones Quirúrgicas

**Objetivo:** Corregir solo los errores reales detectados en 0.1 que afecten funcionamiento, datos o estabilidad. Sin tocar diseño ni agregar funcionalidades.

### 1.1 Criterio de corrección

**Corrige obligatoriamente** si el problema es de:
- Severidad crítica o alta según 0.1.
- Pérdida potencial de datos del usuario.
- Riesgo de seguridad (XSS, inyección).
- Funcionalidad rota (caso feliz que no funciona).

**Documenta sin tocar** si el problema es:
- Refactorización opcional sin impacto funcional.
- Mejora cosmética de código.
- Optimización menor de rendimiento sin impacto perceptible.

### 1.2 Procedimiento por cada corrección

1. Crea el commit base (estado antes del cambio).
2. Aplica la corrección.
3. Ejecuta el contrato funcional completo (todas las pruebas de 0.5).
4. Compara con los resultados originales:
   - Si todas las pruebas dan exactamente el mismo resultado que en 0.5: ✓ aceptar el cambio, hacer commit.
   - Si alguna prueba que pasaba ahora falla: revertir el cambio, registrar el intento fallido en bitácora, intentar una solución alternativa.
   - Si una prueba que fallaba ahora pasa: ✓ aceptar el cambio, actualizar el contrato funcional para reflejar el comportamiento correcto, hacer commit con anotación.

### 1.3 Entregables de Fase 1

- Lista de errores corregidos con commit asociado.
- Lista de mejoras opcionales documentadas pero no aplicadas.
- Tabla comparativa: cada prueba del contrato funcional, resultado en 0.5 vs resultado en 1.3. Toda fila debe mostrar coincidencia o mejora (nunca regresión).
- Bitácora de intentos fallidos (si los hubo) con explicación de qué pasó y cómo se resolvió.

### Checkpoint Fase 1

No avances sin que el 100% de las pruebas del contrato funcional pasen igual o mejor que en 0.5.

---

## FASE 2: Reorganización Estructural y Rediseño UX/UI

**Objetivo:** Aplicar los hallazgos de 0.3 y 0.4. Mejorar diseño, navegación y experiencia sin alterar ni una sola funcionalidad existente.

### 2.1 Reglas estrictas

- **Prohibido modificar lógica de negocio.** Solo capa de presentación y organización.
- **Prohibido modificar estructura de datos** (esquemas, nombres de campos, formatos guardados).
- **Prohibido modificar contratos de funciones** (nombres, parámetros, valores de retorno).
- Después de cada bloque de cambios visuales/estructurales, ejecuta el contrato funcional. Si algo se rompe, revierte ese bloque.

### 2.2 Principios de diseño obligatorios

**Minimalismo funcional:** elimina ruido visual, no funcionalidad. Cada elemento debe justificar su presencia. Si dudas si un elemento aporta, sácalo y observa si se nota su ausencia.

**Sistema de espaciado:** elige una unidad base (4px u 8px) y úsala consistentemente. Todos los márgenes, paddings y gaps deben ser múltiplos de la unidad base.

**Escala tipográfica:** define entre 4 y 6 tamaños (ej: 12, 14, 16, 18, 24, 32 px) y úsalos solamente. Define máximo 3 pesos (regular, medium, bold).

**Paleta de colores:** define una paleta restringida con roles claros:
- 1 color primario (acciones principales, links).
- 1 color de fondo principal y 1-2 variantes (superficies elevadas, etc.).
- 1 color de texto principal y 1-2 variantes (secundario, deshabilitado).
- 1 color por estado semántico: éxito (verde), error (rojo), advertencia (amarillo/naranja), info (azul).
- 1 color de borde / divisor neutro.
No introduzcas colores fuera de esta paleta.

**Iconografía consistente:** elige un único set de iconos (Lucide, Heroicons, etc.). Todos del mismo estilo. Mismo grosor de línea si son outline.

**Estados visuales completos:** todo elemento interactivo debe tener todos los estados aplicables definidos en 0.3.

**Jerarquía visual:** en cada vista, identifica el elemento principal y dale más peso (tamaño, color, contraste). El secundario, menos peso. El terciario, menos aún.

**Accesibilidad:**
- Contraste cumpliendo WCAG AA mínimo en todo el sistema.
- Todos los elementos interactivos accesibles por teclado.
- Focus visible y claro.
- Inputs con label asociado.

**Responsive:** verifica funcionamiento en 375px, 768px y 1280px+.

### 2.3 Reorganización aplicada

Implementa las propuestas validadas de 0.4:
- Fusiona vistas redundantes.
- Reduce número de clics en flujos críticos.
- Agrupa información relacionada, separa información no relacionada.
- Limpia el mapa de navegación.

### 2.4 Entregables Fase 2

- Resumen de cambios visuales y estructurales aplicados, con justificación basada en los hallazgos de 0.3 y 0.4.
- Capturas antes/después de cada vista principal.
- Tabla comparativa del contrato funcional confirmando 100% de coincidencia.

### Checkpoint Fase 2

100% del contrato funcional intacto. Mejoras visuales aplicadas con justificación documentada.

---

## FASE 3: Expansión Funcional

**Objetivo:** Implementar las funcionalidades nuevas, en el orden establecido más abajo, validando con el contrato funcional extendido después de cada una.

### Orden obligatorio de implementación

Las funcionalidades tienen dependencias entre sí. Implementa en este orden:

| # | Funcionalidad | Por qué este orden |
|---|---|---|
| 1 | 3.8 Persistencia y respaldo | Base de todo. Si la herramienta no tiene persistencia real hoy, esto es prerequisito. |
| 2 | 3.10 Historial de cambios | Es el sistema de registro de cambios que alimenta a otras features. |
| 3 | 3.12 Confirmación antes de borrar | Transversal, protege todo lo que viene después. |
| 4 | 3.11 Búsqueda libre | Independiente, valor inmediato. |
| 5 | 3.2 Filtros simples y combinables | Mejora base sobre la cual se construye exportación. |
| 6 | 3.1 Exportación filtrada a Excel | Usa los filtros de 3.2. |
| 7 | 3.3 Trazabilidad por equipo | Se construye sobre 3.10 + comentarios + eventos derivados. |
| 8 | 3.4 Pendientes y recordatorios | Independiente lógicamente pero alimenta 3.5 y 3.9. |
| 9 | 3.5 Alertas automáticas | Usa pendientes (3.4) y estados/fechas. |
| 10 | 3.7 Conciliación contra archivo maestro | Usa historial (3.10) y registros consolidados. |
| 11 | 3.6 Informe mensual de preventivas | Usa datos consolidados y exportación (3.1). |
| 12 | 3.9 Dashboard | Consolida todo lo anterior. Va al final. |

**Si una dependencia detecta que falta algo no contemplado, agrégalo y documéntalo, pero respeta el orden.**

### Aclaración importante: relación entre 3.3 (Trazabilidad) y 3.10 (Historial)

Son sistemas **complementarios, no duplicados**:

- **3.10 Historial de cambios** es el registro **técnico granular** de modificaciones de campos. Captura: campo cambiado, valor anterior, valor nuevo, timestamp. Es el log de bajo nivel.
- **3.3 Trazabilidad por equipo** es la vista **narrativa y funcional**. Se construye **a partir de** 3.10 (traduciendo cambios técnicos a eventos legibles: "Estado cambió de 'operativo' a 'en servicio técnico'") **más** comentarios manuales, recordatorios, exportaciones y conciliaciones.

3.3 NO mantiene su propio almacenamiento paralelo. Lee de 3.10 y de los registros de otras features.

### Migración de datos existentes

Para cada funcionalidad nueva que introduce campos o estructuras nuevas en los datos (3.3, 3.4, 3.5, 3.8, 3.10):

- Define cómo se inicializan esos campos para registros existentes (default sensato: arrays vacíos, null, valores neutros).
- No requieras al usuario que llene esos campos retroactivamente.
- Documenta la estrategia de migración en el reporte de la funcionalidad.

**Historial retroactivo:** 3.10 empieza a registrar **desde el momento de implementación**. No se reconstruye historia previa.

### 3.0 Procedimiento por cada funcionalidad nueva

Antes de implementar cada funcionalidad (3.1 a 3.12 en el orden definido):

1. **Extiende el contrato funcional** con los casos de prueba para la funcionalidad nueva (caso feliz, bordes, errores, integración con lo existente).
2. **Implementa.**
3. **Ejecuta el contrato funcional completo** (pruebas viejas + nuevas).
4. **Valida:**
   - Pruebas viejas: todas deben seguir pasando idénticamente.
   - Pruebas nuevas: todas deben pasar.
5. Si algo de lo viejo se rompió, revierte y reintenta.
6. Si una prueba nueva no pasa, ajusta hasta que pase.
7. Commit con mensaje `[FASE-3][FEAT] 3.X descripción`.
8. **Entrega un mini-reporte** en `FASE_3_AVANCE.md` (acumulativo) con: funcionalidad implementada, decisiones tomadas, pruebas pasando.

### 3.1 Exportación filtrada a archivo Excel

**Comportamiento:**
- En cualquier vista de listado de equipos, debe haber un botón "Exportar a Excel".
- La exportación respeta los filtros activos en ese momento.
- Genera un archivo `.xlsx` descargable.

**Contenido del archivo:**
- Hoja 1 "Equipos": columnas con todos los campos relevantes del equipo (id, nombre, tipo, servicio clínico, estado actual, responsable, fecha último cambio, observaciones).
- Hoja 2 "Metadata": fecha y hora de exportación, filtros aplicados (texto legible), conteo total de equipos exportados, nombre del archivo, propósito (campo libre que se pide antes de exportar).

**Antes de exportar**, modal opcional para ingresar:
- A quién se enviará (opcional).
- Propósito (opcional, ej: "Solicitud jefe", "Reporte mensual").

**Registro:** cada exportación queda guardada en un log interno con: timestamp, filtros aplicados, conteo, destinatario (si se indicó), propósito (si se indicó). Accesible desde una vista "Historial de exportaciones".

**Librería sugerida:** SheetJS (xlsx) vía CDN si la herramienta tiene conexión, vendoreada si es offline.

**Casos de prueba mínimos:**
- Exportar con todos los filtros activos.
- Exportar sin filtros (toda la base).
- Exportar resultado vacío (debe avisar y no generar archivo).
- Exportar con caracteres especiales en datos (tildes, ñ, comillas).
- Verificar que el archivo abre correctamente en Excel.

### 3.2 Filtros simples y combinables

**Dimensiones de filtro mínimas:**
- Estado del equipo (en servicio técnico, esperando repuesto, operativo, dado de baja, en mantención, etc. — usar los estados reales que existan en la herramienta).
- Servicio clínico (pediatría, UCI, urgencias, etc. — usar los reales).
- Tipo de equipo (ventilador mecánico, monitor, bomba, etc. — usar los reales).
- Responsable externo (lista de servicios técnicos / personas).
- Rango de fechas (con selector de fecha desde / hasta).

**Comportamiento:**
- Filtros visibles permanentemente en la vista de equipos (sidebar o barra superior, según el diseño definido en Fase 2).
- Múltiples valores dentro de una dimensión: OR (ej: estado = "en servicio técnico" OR "esperando repuesto").
- Entre dimensiones distintas: AND (ej: tipo = "ventilador" AND servicio = "pediatría").
- Conteo de resultados visible en tiempo real ("Mostrando 23 de 458 equipos").
- Botón "Limpiar filtros" visible cuando hay al menos uno activo.
- Resultado mostrado inmediatamente al cambiar cualquier filtro (sin botón "aplicar").

**Vistas guardadas:**
- Botón "Guardar combinación" que pide nombre y guarda los filtros actuales.
- Menú de vistas guardadas accesible desde la barra de filtros.
- Cada vista guardada se puede aplicar con un clic, renombrar y eliminar.

**Casos de prueba mínimos:**
- Aplicar un filtro de cada dimensión por separado.
- Aplicar combinación de 3 filtros.
- Limpiar filtros.
- Guardar una combinación y volver a aplicarla.
- Renombrar y eliminar vista guardada.

### 3.3 Trazabilidad completa por equipo

**Vista "Ficha de equipo":**
- Accesible desde el listado al hacer clic en un equipo.
- Muestra todos los datos del equipo en la parte superior.
- Muestra una **línea de tiempo cronológica descendente** (más reciente arriba) con todos los eventos del equipo.

**Eventos a registrar automáticamente:**
- Creación del registro.
- Cambio de estado (de X a Y, con timestamp y quién lo hizo si aplica).
- Asignación o cambio de responsable.
- Comentario manual agregado.
- Recordatorio creado.
- Recordatorio completado.
- Exportación que incluyó este equipo (con propósito).
- Resultado de conciliación con archivo maestro relacionado a este equipo.

**Estructura interna de cada evento:**
- `equipo_id`, `timestamp`, `tipo_evento`, `descripcion`, `responsable` (si aplica), `datos_adicionales` (objeto con metadata específica del tipo de evento).

**Acción "Agregar comentario":** botón en la ficha para añadir una nota libre que queda como evento en la línea de tiempo.

**Casos de prueba mínimos:**
- Crear un equipo y verificar evento de creación.
- Cambiar estado y verificar evento.
- Agregar comentario y verificar evento.
- Ver línea de tiempo con múltiples eventos en orden correcto.

### 3.4 Pendientes y recordatorios

**Crear pendiente:**
- Desde la ficha de un equipo: botón "Agregar pendiente".
- Desde una vista global "Pendientes": botón "Nuevo pendiente" (puede o no estar asociado a un equipo).

**Campos:**
- Equipo asociado (opcional, dropdown con búsqueda).
- Descripción (requerido, texto libre).
- Fecha de recordatorio (requerido).
- Hora de recordatorio (opcional).
- Notas adicionales (opcional, texto libre).

**Estados de un pendiente:** activo, vencido, completado.

**Actualizaciones:** dentro de un pendiente se pueden agregar entradas adicionales (timestamp + nota), conservando todas las anteriores. Ej: "01/06: Ignacio dijo que enviaba cotización el viernes". "05/06: No llegó la cotización, lo volví a llamar, dijo el lunes".

**Acciones por pendiente:**
- Marcar como completado.
- Posponer (snooze): elegir nueva fecha.
- Editar campos.
- Eliminar (con confirmación, ver 3.12).

**Vista de pendientes:**
- Tabla con: descripción, equipo asociado, fecha, estado, última actualización.
- Filtros: por estado, por equipo, por rango de fecha.
- Pendientes vencidos destacados visualmente.

**Casos de prueba mínimos:**
- Crear pendiente con todos los campos.
- Crear pendiente sin equipo asociado.
- Agregar actualización a un pendiente.
- Marcar como completado.
- Posponer.
- Eliminar.

### 3.5 Alertas automáticas

**Reglas de alerta** (configurables, con valores por defecto):
- Equipo en un mismo estado por más de N días (default 30).
- Equipo sin ninguna actualización en más de N días (default 15).
- Pendiente vencido (cualquier pendiente cuya fecha pasó y no está completado).
- Pendiente por vencer en los próximos N días (default 3).
- Mantención preventiva próxima (basado en cronograma, si existe en la herramienta).

**Centro de alertas:**
- Icono de campana visible en el header con conteo de alertas activas.
- Clic abre un panel lateral con todas las alertas activas, ordenadas por prioridad (vencidas primero).
- Cada alerta tiene acciones: "Ver equipo" (lleva a la ficha), "Reconocer" (marca como vista sin resolver), "Resolver" (la cierra).

**Reglas configurables:**
- Si la herramienta tiene una vista de configuración, agrega allí la sección "Alertas". Si no la tiene, créala como vista nueva accesible desde el menú principal.
- Permite ajustar los valores N de cada regla.
- Cambios se aplican inmediatamente.
- Persistencia de la configuración usa el mismo almacén que el resto de los datos.

**Casos de prueba mínimos:**
- Crear escenario donde se dispare cada tipo de alerta.
- Verificar conteo en campana.
- Reconocer y resolver una alerta.
- Cambiar el valor N de una regla y verificar que se aplica.

### 3.6 Informe mensual de preventivas por servicio clínico

**Vista "Informe mensual de preventivas":**
- Selector de mes (default: mes anterior al actual).
- Selector de servicio clínico (puede ser uno, varios, o "todos").
- Botón "Generar informe".

**Output:**
- Vista previa en pantalla con: por cada servicio seleccionado, listado de equipos con mantención preventiva ese mes, mostrando: equipo, fecha de la mantención, técnico responsable, estado final del equipo, observaciones.
- Botón "Exportar a Excel" que descarga el informe con una hoja por servicio.

**Estructura del Excel:**
- Hoja por servicio clínico.
- Hoja "Resumen" con conteo total por servicio y por estado final.

**Casos de prueba mínimos:**
- Generar informe de un mes con datos.
- Generar informe de un mes sin datos (debe avisar).
- Generar para un solo servicio.
- Generar para todos los servicios.
- Exportar y verificar Excel.

### 3.7 Conciliación contra archivo maestro

**Vista "Conciliación":**
- Botón "Subir archivo maestro" que acepta `.xlsx` o `.csv`.
- Al subir, valida estructura: si las columnas esperadas no están, muestra error específico (qué columna falta, qué columnas se encontraron).

**Proceso de comparación:**
- Cruza por el **identificador único de equipo detectado y documentado en Fase 0.6**.
- Genera 3 categorías:
  1. **Solo en el programa:** equipos que yo registré que no aparecen en el maestro.
  2. **Solo en el maestro:** equipos del maestro que no están en mi programa.
  3. **En ambos con diferencias:** equipos presentes en ambos pero con campos distintos (estado, fecha, técnico, etc.). Mostrar qué campos difieren y los valores de cada lado.

**Acciones por cada item:**
- **Solo en programa:** acción "Confirmar y mantener en programa" o "Eliminar del programa" o "Marcar para incluir en próximo maestro".
- **Solo en maestro:** acción "Importar al programa" o "Ignorar".
- **Con diferencias:** acción "Usar valor del programa", "Usar valor del maestro", o "Editar manualmente". Por cada campo en conflicto.

**Registro de la conciliación:**
- Cada conciliación queda guardada con: timestamp, nombre del archivo maestro procesado, conteos por categoría, decisiones tomadas por cada item.
- Accesible desde "Historial de conciliaciones".

**Casos de prueba mínimos:**
- Subir maestro con todas las columnas correctas.
- Subir maestro con columna faltante (debe rechazar con mensaje claro).
- Procesar y resolver al menos un item de cada categoría.
- Verificar que el registro queda guardado.

### 3.8 Persistencia y respaldo de datos

**Diagnóstico previo:** en Fase 0.6 ya documentaste el modelo de persistencia actual. Aquí actúa según el caso:

- **Si ya hay persistencia (localStorage/IndexedDB):** mantén ese mecanismo y construye respaldo sobre él. Si es localStorage, calcula uso aproximado y advierte si supera el 80% del límite.
- **Si NO hay persistencia (datos solo en memoria):** implementa persistencia primero (localStorage por defecto si la base proyectada cabe en ~5MB; IndexedDB si se prevé crecimiento mayor). Este es el cambio arquitectónico más grande de toda la Fase 3, hazlo con cuidado y prueba que toda funcionalidad existente sigue funcionando con datos persistentes.
- **Migración:** si pasas de memoria a localStorage, asegúrate de que los datos existentes en runtime queden guardados antes de cualquier recarga.

**Exportación completa de la base:**
- Botón "Exportar respaldo completo" en una vista "Configuración" o "Datos".
- Genera un archivo JSON con toda la base (equipos, eventos, pendientes, alertas, conciliaciones, configuración).
- Nombre del archivo: `respaldo_equipos_YYYY-MM-DD_HHMM.json`.

**Importación de respaldo:**
- Botón "Importar respaldo" que acepta el JSON generado.
- Valida estructura antes de importar. Si está corrupto o no coincide la estructura, rechaza con mensaje claro.
- Antes de sobreescribir, muestra advertencia con conteos: "Vas a reemplazar X equipos actuales por Y equipos del respaldo. Esta acción no se puede deshacer."
- Requiere confirmación escrita ("Escribe IMPORTAR para confirmar").

**Respaldo automático:**
- Guarda un snapshot del estado completo en una clave separada del almacén con frecuencia controlada: **uno por sesión activa cada 24 horas, y uno adicional al cerrar la pestaña si hubo cambios**. No después de cada cambio (saturaría el almacén).
- Mantiene los últimos 7 snapshots (rotación FIFO).
- Vista "Respaldos automáticos" permite restaurar cualquiera (con confirmación).

**Alerta de capacidad:**
- Si el almacenamiento usado supera el 80% del límite, mostrar banner persistente sugiriendo exportar respaldo y limpiar respaldos automáticos antiguos.

**Casos de prueba mínimos:**
- Exportar respaldo, modificar datos, importar respaldo, verificar restauración.
- Importar archivo corrupto (debe rechazar).
- Importar archivo de formato incorrecto (debe rechazar).
- Verificar rotación de respaldos automáticos.

### 3.9 Dashboard inicial

**Vista de entrada al abrir el programa:**

Secciones (orden y peso visual según Fase 2):
1. **Resumen por estado:** tarjetas/cards con conteo de equipos por cada estado (en servicio técnico, esperando repuesto, operativo, etc.). Clic en una card filtra el listado de equipos por ese estado.
2. **Recordatorios y pendientes de hoy:** lista breve de los pendientes con fecha = hoy o vencidos. Clic lleva al pendiente.
3. **Alertas activas:** resumen del centro de alertas. Clic abre el centro.
4. **Equipos sin actualizar:** conteo y acceso rápido a la lista de equipos sin actividad reciente.
5. **Atajos rápidos:** botones grandes a las acciones más frecuentes (registrar equipo, generar informe mensual, exportar, conciliar).

**Comportamiento:**
- El dashboard es la vista por defecto al abrir el programa.
- Debe cargar y renderizar en menos de 1 segundo con una base de 1000+ equipos.
- **Medición:** usa `performance.now()` rodeando el render del dashboard y reporta el tiempo en consola en modo debug. Si tienes navegador headless, mide y reporta en `FASE_3_AVANCE.md`. Si excede 1s, optimiza (memoización, render parcial, lazy de secciones no visibles) antes de marcar la funcionalidad como completa.
- Datos se calculan al cargar (no en tiempo real, salvo refresco manual).

**Casos de prueba mínimos:**
- Verificar que conteos coinciden con datos reales.
- Clic en cada sección lleva al destino correcto.
- Dashboard se actualiza al volver desde otra vista.

### 3.10 Historial de cambios

**Registro automático:** cualquier modificación a cualquier campo de cualquier equipo se registra. Estructura por entrada:
- `timestamp`, `equipo_id`, `campo_modificado`, `valor_anterior`, `valor_nuevo`, `tipo_accion` (creación, edición, eliminación).

**Vista en ficha de equipo:**
- Pestaña o sección "Historial" dentro de la ficha.
- Tabla cronológica descendente con: fecha/hora, campo, antes, después.

**Vista global de actividad:**
- Vista "Actividad reciente" accesible desde el menú principal.
- Muestra los últimos N cambios de toda la base.
- Filtros: por equipo, por tipo de campo, por rango de fechas.

**Casos de prueba mínimos:**
- Modificar un campo, verificar que aparece en historial del equipo.
- Eliminar un equipo, verificar entrada en historial global.
- Filtrar actividad reciente.

### 3.11 Búsqueda libre

**Caja de búsqueda:**
- Siempre visible en el header (en todas las vistas).
- Atajo de teclado para enfocarla (`/` o `Ctrl+K`).

**Campos en los que busca:**
- Número de serie del equipo.
- Código interno.
- Nombre/modelo del equipo.
- Marca / fabricante.
- Responsable externo.
- Observaciones.
- Texto en eventos / comentarios.

**Comportamiento:**
- Resultados en tiempo real mientras se escribe (con un debounce de 200ms).
- Dropdown bajo la caja con los primeros 10 resultados.
- Cada resultado muestra: nombre del equipo, identificador, estado actual, dónde matchea (qué campo).
- Click en un resultado lleva a la ficha del equipo.
- Tecla `Enter` lleva a la vista de listado con la búsqueda aplicada como filtro de texto.

**Casos de prueba mínimos:**
- Búsqueda por cada campo soportado.
- Búsqueda sin resultados.
- Búsqueda con tildes/ñ.
- Navegación con teclado en los resultados (flechas + Enter).

### 3.12 Confirmación antes de borrar

**Modal de confirmación obligatorio para:**
- Eliminar un equipo.
- Eliminar un pendiente.
- Eliminar una vista guardada de filtros.
- Eliminar un respaldo automático.
- Importar un respaldo (que sobreescribe la base).
- Cualquier acción que destruya datos sin posibilidad de undo.

**Estructura del modal:**
- Título claro: "¿Eliminar [tipo de objeto]?"
- Cuerpo: descripción de qué se va a eliminar, con identificador del objeto.
- Advertencia visual (color rojo, icono) si es acción crítica.
- Para acciones críticas (importar respaldo, eliminar equipo con historial): requerir escribir una palabra de confirmación (`ELIMINAR`, `IMPORTAR`).
- Botones: "Cancelar" (default focus) y "Eliminar" (color rojo, requiere clic intencional).

**Casos de prueba mínimos:**
- Intentar eliminar y cancelar (no debe pasar nada).
- Intentar eliminar y confirmar.
- En acciones críticas, validar que sin escribir la palabra exacta no se puede confirmar.

### Checkpoint Fase 3

Cada una de las 12 funcionalidades implementada, con sus pruebas pasando, y sin regresiones en el contrato funcional original.

---

## ENTREGA FINAL

Al terminar Fase 3, entrega:

1. **`index.html`** (o el nombre original): herramienta actualizada y funcional.
2. **`original_backup.html`**: copia del HTML original intacta.
3. **Backups intermedios:** `pre_fase_1_backup.html`, `pre_fase_2_backup.html`, `pre_fase_3_backup.html`.
4. **Carpeta `pruebas/`** con:
   - `contrato_funcional.md` (línea base de Fase 0 + extensiones de Fase 3).
   - Script de pruebas automatizado si pudiste crearlo, con instrucciones de ejecución.
   - `resultados_finales.md` con el resultado de la última ejecución de todas las pruebas.
5. **Reportes por fase** en la raíz:
   - `FASE_0_REPORTE.md` (auditoría completa).
   - `FASE_1_REPORTE.md` (correcciones aplicadas + mejoras pospuestas).
   - `FASE_2_REPORTE.md` (cambios visuales y estructurales con justificación).
   - `FASE_3_AVANCE.md` (acumulativo, una sección por funcionalidad nueva).
6. **`REPORTE_FINAL.md`** con:
   - Resumen ejecutivo de qué se hizo.
   - Tabla final del contrato funcional: prueba | resultado inicial (Fase 0) | resultado final (Fase 3). 100% debe coincidir o mejorar.
   - **Lista de mejoras opcionales pendientes** (heredadas de Fase 1) para que yo decida si las aplico en una iteración futura.
   - **Decisiones de diseño tomadas autónomamente** con justificación breve de cada una.
   - **Decisiones tomadas por defecto ante preguntas no respondidas**, listadas explícitamente para que pueda revisarlas y revertir cualquiera si quiero.
7. **Capturas** (si tienes capacidad de generarlas): carpetas `snapshots/before/` y `snapshots/after/` con capturas de cada vista principal. Si no, descripción textual del estado visual en cada reporte de fase.
8. **`dataset_pruebas.json`** si fue generado en Fase 0.7.

---

## INSTRUCCIÓN FINAL

**Empieza por la Fase 0. No avances sin validar cada checkpoint. No saltes pasos. No mezcles fases. No tomes atajos.**

Si en algún momento entras en duda sobre si un cambio puede romper algo, **revierte y consulta** antes de avanzar.
