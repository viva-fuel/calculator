# Viva Aerobus · Fuel Loading Calculator

Calculadora de carga de combustible para uso de pilotos de Viva Aerobus.

## Acceso

La aplicación se publica vía GitHub Pages y es accesible desde cualquier navegador (desktop, tablet, mobile). No requiere instalación ni login.

## Cómo se usa

1. El piloto ingresa el número de vuelo, FR (KG) y FOB (KG).
2. Pide la densidad por radio/teléfono al ground handler.
3. La calculadora devuelve el **rango en litros** (low end / high end, ±1.75%) que el piloto le comunica al ground handler.
4. Apretando **Registrar carga** queda guardado en la tabla con fecha/hora automática.
5. Si el ground handler no se comunica, el piloto puede dejar registro con el botón **No me compartieron la info** (solo requiere número de vuelo).
6. El histórico se descarga como CSV.

## Fórmula

```
TOTAL_KG  = FOB − FR
TOTAL_L   = (TOTAL_KG + 200) / densidad
LOW_END   = TOTAL_L × (1 − 0.0175)
HIGH_END  = TOTAL_L × (1 + 0.0175)
```

## Notas técnicas

- Archivo único `index.html` autocontenido (HTML + CSS + JS inline). Logo embebido como data URI.
- Funciona offline una vez cargado en el navegador.
- Los registros se guardan en `localStorage` del dispositivo — son privados, nunca se suben a GitHub.
- Compatibilidad: navegadores modernos (Chrome, Edge, Safari, Firefox).
