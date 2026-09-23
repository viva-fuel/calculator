# Viva Aerobus · Fuel Loading Calculator

Calculadora de carga de combustible para uso de pilotos de Viva Aerobus + vista admin para auditar todos los registros en tiempo real.

## Páginas

| URL | Para quién | Qué hace |
|---|---|---|
| `index.html` | Pilotos | Calcula el rango de carga, valida con ground handler, guarda el registro en el dispositivo y lo envía al backend compartido en segundo plano |
| `admin.html` | Operaciones / vos | Tabla en tiempo real con TODOS los registros de todos los pilotos, filtros, descarga CSV |

## Acceso

GitHub Pages, sin login ni instalación. Funciona en cualquier navegador moderno (desktop, tablet, mobile).

## Cómo se usa (piloto)

1. Setear el **Pilot ID** la primera vez (queda persistido en el dispositivo).
2. Ingresar número de vuelo, FR (KG) y FOB (KG).
3. Pedir la densidad por radio/teléfono al ground handler.
4. La calculadora devuelve el **rango en litros** (low end / high end, ±1.75%) que el piloto le comunica al ground handler.
5. Apretar **Log load** → confirmación inmediata; el registro se guarda en el dispositivo y se sube al backend en segundo plano (si no hay red o tarda más de 8 s, queda en cola y se reenvía solo).
6. Si el ground handler no se comunica, el piloto deja constancia con **No info from GH** (requiere nombre, vuelo y aeropuerto).
7. El indicador **Synced · cloud / Offline · queued** bajo los botones muestra si el último registro ya llegó al servidor.

> Desde v1.7 la vista del piloto ya no muestra la tabla "Load history" ni exporta CSV; la historia completa se consulta y exporta desde `admin.html`. Ver `CHANGELOG.md` para el detalle y el rollback.

## Cómo se usa (admin)

1. Abrir `admin.html` (URL: `<base>/admin.html`).
2. Primera vez pide Bin ID + Master API Key del JSONBin → quedan guardados localmente.
3. Tabla con TODOS los registros, auto-refresh cada 30 s.
4. Filtros por piloto, vuelo, status, rango de fechas y búsqueda libre.
5. Stats arriba (Total / Hoy / Pilotos activos / Incidentes No-info) calculadas según el filtro actual.
6. Botón **Download CSV** exporta lo filtrado.
7. Botón **Sign out** olvida las credenciales en este navegador (no toca el bin).

## Fórmula

```
TOTAL_KG  = FOB − FR
TOTAL_L   = (TOTAL_KG + 200) / densidad
LOW_END   = TOTAL_L × (1 − 0.0175)
HIGH_END  = TOTAL_L × (1 + 0.0175)
```

## Notas técnicas

- HTMLs autocontenidos (HTML + CSS + JS inline). Logo embebido como data URI.
- **Service Worker** (`sw.js`) cachea la app del piloto: carga sin internet a partir de la 2.ª visita.
- Pilotos: cada save va a `localStorage` y al backend. Si está offline, queda encolado y se manda al volver la conexión (auto-resync).
- Admin: solo lee del backend, nunca escribe.
- Compatibilidad: Chrome, Edge, Safari, Firefox modernos.

## Backend compartido (Supabase)

Los registros se guardan en la tabla `fuel_records` de **Supabase** (Postgres). Se configura en `index.html` y `admin.html`:

```js
const SUPABASE_URL      = 'https://....supabase.co';
const SUPABASE_ANON_KEY = '...';
```

Si están vacías, la app del piloto corre en **modo local** (solo guarda en la tablet).

Desde v1.7 la app del piloto escribe únicamente en Supabase. `admin.html` mantiene JSONBin como
fallback de lectura legacy (ver [`SETUP_JSONBIN.md`](./SETUP_JSONBIN.md), histórico).
