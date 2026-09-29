# Changelog · Viva Aerobus Fuel Loading Calculator

Historial de versiones de la app del piloto (`index.html`) y del admin (`admin.html`).
Cada versión publicada en `main` es lo que sirve GitHub Pages.

---

## v1.8 — 2026-09-28 · Unidades de EE. UU. (galones US y lb/gal)

**Motivo.** En estaciones de EE. UU. el ground handler factura en galones US y
reporta la densidad en lb/gal; la calculadora solo hablaba litros y kg/L, así
que el piloto tenía que convertir a mano. El avión (FR/FOB) sigue en kg.

**Regla.** La fórmula **no cambia** (`(kg + 200) / densidad`, ±1.75 %). Solo se
convierte a la entrada y a la salida: la densidad tipeada en lb/gal se pasa a
kg/L antes de calcular, y los litros resultantes se muestran en galones US.

- 1 US gal = 3.785411784 L · 1 kg/L = 8.3454 lb/gal.
- Rango válido de densidad en lb/gal: **6.43–7.01** (equivale a 0.770–0.840 kg/L).
- Estaciones en unidades US: AUS, BFM, CVG, DEN, DFW, IAH, JFK, LAS, LAX, MCO,
  MIA, OAK, ORD, ROW, SAT, SEA y BQN (Puerto Rico). **BOG, HAV, CMW y SJO se
  quedan en litros** por indicación del equipo.

**Cambios en `index.html`:**

| # | Cambio | Riesgo | Detalle |
|---|--------|--------|---------|
| 1 | Selección automática de unidades por aeropuerto (`US_UNIT_AIRPORTS`, `applyAirportUnits`) | Bajo | Al quedar fijado un código válido, la unidad se elige sola. Toast "US station · switched to US gallons & lb/gal". Cambiar de aeropuerto vuelve a elegir sola (borra la elección manual). |
| 2 | Interruptor manual **Liters · kg/L / US gal · lb/gal** siempre visible, bajo el campo Density | Bajo | El piloto puede forzar la unidad en cualquier estación. Si ya había una densidad válida tipeada, se convierte (0.800 ↔ 6.68) para no obligar a reescribirla. |
| 3 | Campo Density con unidad, rango, placeholder y mensajes de error según la unidad activa (`densityRules`, `densityErrorFor`, `isDensityRawValid`) | Bajo | En lb/gal: formato `x.xx`, rango 6.43–7.01. En kg/L: idéntico a antes. |
| 4 | Resultado en galones US cuando aplica: total, low end, high end, badge "US gallons", densidad mostrada en ambas unidades y equivalente en litros en chico | Bajo | En litros la pantalla es idéntica a v1.7. |
| 5 | `readInputs()` devuelve `density` **siempre en kg/L** (+ `densityEntered` tal como se tipeó) | Muy bajo | `compute()`, los registros y la base siguen en kg/L y litros. Ningún número almacenado cambia de unidad. |
| 6 | Registro local con `unit` (`metric`/`us`) y `densityEntered`; a Supabase se manda `unit: 'us'` solo en registros US, como **columna opcional** | Muy bajo | Si la columna `unit` no existe (hoy no existe), el INSERT devuelve 400 y se reintenta sin ella: el registro se guarda igual. Mismo mecanismo que `no_info_reason`. Cuando se agregue la columna, empieza a persistir sola. |
| 7 | Footer `v1.8` | — | |

**Cambios en `admin.html`:**

| # | Cambio | Riesgo | Detalle |
|---|--------|--------|---------|
| 8 | Registros de estaciones US: etiqueta **US** junto al aeropuerto y, debajo de Density / Total (L) / Range (L), el equivalente en lb/gal y galones US (`unitOfRecord`, `.us-alt`) | Bajo | Los valores en litros no se tocan. Si existe la columna `unit` se respeta (un registro en litros desde JFK no muestra galones); si no, se deduce del aeropuerto. |
| 9 | CSV y Excel: 5 columnas nuevas **al final** (`GH Units`, `Density (lb/gal)`, `Total (US gal)`, `Low (US gal)`, `High (US gal)`) | Bajo | Vacías en registros en litros. Van al final para no romper la importación de CSVs anteriores. |

**Cambios en `sw.js`:** `CACHE_VERSION` → `viva-fuel-v22`.

**Pendiente (requiere acceso al dashboard de Supabase):**
`ALTER TABLE fuel_records ADD COLUMN unit text;` — hasta entonces, la unidad se
deduce del aeropuerto en el admin y el primer registro US de cada sesión hace un
POST extra (el 400 + reintento).

**Validación.** 58 comprobaciones automatizadas con Playwright sobre `dist/` con
Supabase interceptado: cálculo en litros idéntico a v1.7 (MEX); JFK → galones
con conversión exacta (0.800 → 6.68 lb/gal, 5,250 L → 1,386 gal); POST con
`unit: 'us'`, densidad en kg/L y litros; 400 simulado → reintento sin `unit` →
registro *synced*; interruptor manual (con conversión de la densidad) y reset al
cambiar de aeropuerto; BOG en litros, BQN en galones; validación de rango en
lb/gal; Wrong load con `unit`; admin con sub-línea US solo en filas US y
respetando `unit = metric`. Sin errores de JS.

### Cómo volver a v1.7 (rollback exacto)

El estado previo quedó marcado con el tag **`v1.7-pre-units`** (commit `74220cc`)
y copiado en `prod-backup-2026-09-28-v1.7/` del workspace (ver `README_ROLLBACK.md`).

Opción A — revertir el commit de v1.8 (recomendada). El commit de código de
v1.8 es **`e58788c`**:

```bash
git revert e58788c
git push origin main
```

Opción B — restaurar los archivos tal cual estaban:

```bash
git checkout v1.7-pre-units -- index.html admin.html sw.js README.md
git commit -m "revert: back to v1.7 (pre-units)"
git push origin main
```

Si se restaura `sw.js` de v1.7 (`CACHE_VERSION = viva-fuel-v21`), subir a `v23`
para forzar la actualización en las tablets.

---

## v1.7 — 2026-09-23 · Performance con red lenta + se quita "Load history"

**Motivo.** Pilotos reportaron la calculadora "lenta / trabada". El diagnóstico
apuntó a la red del cockpit (lenta pero no caída) y no a la cantidad de registros:
la app del piloto nunca descarga registros, solo envía uno por guardado. El
problema era que varias esperas de red no tenían límite de tiempo.

**Cambios en `index.html`:**

| # | Cambio | Riesgo | Detalle |
|---|--------|--------|---------|
| 1 | Timeout de 8 s en el envío a Supabase (`PUSH_TIMEOUT_MS`, `fetchWithTimeout`) | Muy bajo | Si el servidor no responde, el registro queda *pending* en `localStorage` y se reenvía solo (mismo camino que offline). Antes la espera era indefinida. |
| 2 | Confirmación inmediata al guardar | Muy bajo | El modal "upload has been registered" aparece al guardar en la tablet, no al terminar el POST. El envío al servidor pasa a segundo plano (`pushRecordInBackground`). El indicador Synced / Syncing / Offline sigue mostrando el estado real. |
| 3 | Bloqueo anti doble toque (`SUBMIT_COOLDOWN_MS` = 1.5 s, `lockSubmit`) | Muy bajo | Log load / Wrong load / No info quedan deshabilitados 1.5 s tras registrar, para evitar registros duplicados. |
| 4 | Se quita JSONBin del camino de escritura | Muy bajo | JSONBin devolvía `403` (Cloudflare 1010) desde hacía tiempo; solo sumaba latencia al fallar Supabase. `admin.html` no se toca. |
| 5 | Google Fonts sin bloquear el render (`media="print" onload`) | Bajo | La app pinta al instante con fuente del sistema y cambia a la fuente de marca cuando baja. Antes, con red lenta, la pantalla quedaba en blanco esperando el CSS de fuentes. |
| 6 | **Se elimina la sección "02 · Records / Load history"** | Bajo | Desaparecen la tabla de historial del dispositivo y los botones **Download CSV**, **Clear** y **Refresh** de la vista del piloto. Los registros siguen guardándose en la tablet (cola offline) y el admin conserva la exportación completa. El indicador de sincronización se movió debajo de los botones de acción. |
| 7 | Footer `v1.7` | — | |

**Cambios en `sw.js`:**

| # | Cambio | Riesgo | Detalle |
|---|--------|--------|---------|
| 8 | `CACHE_VERSION` → `viva-fuel-v21` | — | Necesario para que las tablets reciban el `index.html` nuevo. |
| 9 | El caché de assets externos (`viva-fuel-runtime`) ya no lleva versión y no se borra en cada release | Bajo | Antes, cada actualización borraba las fuentes cacheadas y la siguiente apertura las volvía a bajar. |

**No incluido a propósito (riesgo medio, pendiente de decisión):** cambiar el
Service Worker a *cache-first* para el HTML. Hoy sigue *network-first*: la
primera apertura con red lenta sigue esperando a la red.

**Validación.** Test automatizado con Playwright sobre `dist/` con Supabase
interceptado (nada llegó a producción): render en <1 s con fuentes
inalcanzables; modal en 0.2 s con red colgada; timeout a los 8 s → pending;
reenvío correcto al evento `online`; doble toque genera 1 solo registro; flujos
OK / Wrong load / No info con motivo; sin errores de JS.

### Cómo volver a v1.6 (rollback exacto)

El estado previo quedó marcado con el tag **`v1.6-pre-perf`** (commit `a54c0af`)
y copiado en la carpeta `prod-backup-2026-09-23-v1.6/` del workspace.

Opción A — revertir el commit de v1.7 (recomendada, conserva historial).
El commit de código de v1.7 es **`f5296fb`**:

```bash
git revert f5296fb
git push origin main
```

Opción B — restaurar los archivos tal cual estaban:

```bash
git checkout v1.6-pre-perf -- index.html sw.js README.md
git commit -m "revert: back to v1.6 (pre-perf)"
git push origin main
```

En ambos casos, GitHub Pages publica en 1–2 min y el Service Worker de las
tablets detecta la versión nueva y recarga solo. Si se restaura `sw.js` de v1.6
(`CACHE_VERSION = viva-fuel-v20`), subir a `v22` para forzar la actualización.

---

## v1.6 — 2026 · No info from GH con motivo

- Popup con 3 motivos al registrar "No info from GH" (auto-cierre a los 3 min).
- Admin: columna y filtro "No-info Reason".
- Low end del rango sin el buffer de +200 kg (v1.5).
- Admin: carga por ventana de 30 días + refresh incremental; historia completa a CSV; archivo .zip por mes.
