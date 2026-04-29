# Configurar sincronización con Google Sheets

Esta guía te lleva paso a paso para que **todos los registros de todos los pilotos vayan a un único Google Sheet compartido**, en lugar de quedar guardados solo en cada dispositivo.

Tiempo estimado: **5 minutos**. Todo se hace en el navegador, sin terminal.

---

## 1. Crear el Google Sheet

1. Andá a https://sheets.new (te crea un Sheet vacío al instante).
2. Renombralo a algo claro, por ejemplo **`Viva Fuel Log`**.
3. (Opcional) Compartilo con el equipo de operaciones con permiso de **Lector**, así pueden ver/filtrar los datos directamente. *No es necesario para que la app funcione*.

> No hace falta agregar columnas ni encabezados manualmente. El script las crea automáticamente la primera vez.

---

## 2. Pegar el Apps Script

1. En el mismo Sheet, andá a **Extensiones → Apps Script**.
2. Se abre una pestaña con un editor de código. Borrá todo lo que aparece por defecto (`function myFunction() {}`).
3. Abrí el archivo [`apps-script.gs`](./apps-script.gs) que está en esta carpeta y copiá **todo su contenido**.
4. Pegalo en el editor de Apps Script.
5. Apretá el ícono de **disquete** (Guardar) o `Ctrl + S`. Te pedirá un nombre para el proyecto — poné algo como `Viva Fuel Backend`.

---

## 3. Desplegar como Web App

1. Arriba a la derecha del editor de Apps Script, click en **Implementar (Deploy) → Nueva implementación**.
2. Click en el ícono del engranaje al lado de **Seleccionar tipo** y elegí **Aplicación web**.
3. Configurá:
   - **Descripción**: `Viva Fuel Calculator backend` (o lo que quieras)
   - **Ejecutar como**: **Yo** (tu cuenta de Google)
   - **Quién tiene acceso**: **Cualquier usuario**
4. Click en **Implementar**.
5. Te va a pedir que **autorices** el script. Esto es **una sola vez**:
   - Click **Autorizar acceso**
   - Elegí tu cuenta de Google
   - Si aparece "Google no ha verificado esta aplicación" → click en **Configuración avanzada** → **Ir a Viva Fuel Backend (no seguro)** → **Permitir**. (Es seguro, sos vos quien creó el script).
6. Vas a ver una pantalla con la **URL de la app web**, algo tipo:
   ```
   https://script.google.com/macros/s/AKfyc.........../exec
   ```
   Copiá esa URL.

---

## 4. Pegar la URL en el HTML

Tenés dos opciones:

### Opción A — Pasámela y la pongo yo (más rápido)

Mandame la URL en el chat de Cursor con el mensaje:
> "URL del Apps Script: `https://script.google.com/macros/s/AKfyc.../exec`"

Y yo la pego, hago commit y push en 30 segundos.

### Opción B — Hacelo vos

1. Abrí `dist/index.html` (o `fuel-calculator.html`).
2. Buscá la línea (cerca del comienzo del `<script>`):
   ```javascript
   const SHEETS_WEBAPP_URL = '';
   ```
3. Pegá tu URL entre las comillas:
   ```javascript
   const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfyc.../exec';
   ```
4. Guardá y, desde la carpeta `dist/`, corré:
   ```
   git add . ; git commit -m "feat: enable cloud sync" ; git push
   ```

En 30-60 s GitHub Pages re-deploya y la URL pública pasa a modo nube.

---

## 5. Verificar que anda

Una vez configurado:

1. Abrí https://ignaciogaing.github.io/viva-fuel-calculator/
2. En la sección "Histórico" tendría que aparecer un pill verde **"SINCRONIZADO · NUBE"** en lugar de gris **"MODO LOCAL"**.
3. Cargá un registro de prueba con un vuelo ficticio (ej. `VBTEST`).
4. Andá al Sheet → debería aparecer una nueva fila al instante (refrescá si no la ves).
5. Abrí la URL en otro dispositivo (o en modo incógnito): el registro de prueba ya tiene que estar en el histórico.

---

## ¿Cómo funciona en el día a día?

- **Cada "Registrar carga"** se guarda primero local (instantáneo) y al toque se manda al Sheet.
- **Si no hay internet** en el momento, el registro queda local con un **punto magenta** al lado de la fecha (= pendiente). Al recuperar internet, se sincroniza solo en el próximo refresh.
- **El histórico se actualiza automáticamente cada 30 s**, así si otro piloto registra algo mientras vos tenés la app abierta, lo ves aparecer.
- También hay un botón **Refrescar** para forzarlo.
- **Limpiar** ahora solo limpia tu vista local — los registros siguen en el Sheet compartido.

---

## Solución de problemas

### "Sin conexión" (pill rojo)
- Probá refrescar la página
- Verificá que el Sheet y el script no se hayan movido/borrado
- Verificá que el deploy esté en **"Quién tiene acceso: Cualquier usuario"**

### "Modo local" sigue apareciendo después de pegar la URL
- Asegurate de que la URL termine en `/exec` (no en `/edit` o `/dev`)
- Hard refresh (Ctrl + F5) — el navegador puede tener la versión vieja en caché

### Modificar los headers del Sheet
- No los cambies manualmente. Si los necesitás distintos, editá `HEADERS` en `apps-script.gs` y volvé a desplegar el script.

### Crear una **nueva versión** del script (cuando lo cambies)
- En Apps Script: **Implementar → Gestionar implementaciones** → ícono lápiz al lado de tu deploy → **Versión: Nueva versión** → **Implementar**.
- La URL no cambia, queda la misma.
