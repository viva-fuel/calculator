# Changelog · Viva Aerobus Fuel Loading Calculator

Historial de versiones de la app del piloto (`index.html`) y del admin (`admin.html`).
Cada versión publicada en `main` es lo que sirve GitHub Pages.

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
