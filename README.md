# Espejo virtual de maquillaje

Abrir esta carpeta del proyecto en VS Code y elegir **Open with Live Server** sobre `index.html`
(o `python3 -m http.server 8000` y abrir http://localhost:8000).
La cámara requiere `localhost` o HTTPS y permiso del navegador. Usar Chrome o Edge y cerrar otras aplicaciones que estén usando la cámara.

- La interfaz usa una estética profesional en negro, blanco y rojo.
- `js/product-data.js` contiene productos, precios, tonos, ubicaciones y looks de demostración; no son un catálogo ni existencias reales.
- `js/main.js` captura el vídeo en el dispositivo y aplica una simulación visual guiada por landmarks faciales. El vídeo no se sube ni se almacena.
- La detección requiere descargar MediaPipe y su modelo desde sus CDN. Se intenta aceleración GPU y se usa CPU como alternativa.
- «Guardar» genera una imagen PNG con la captura y los tonos elegidos; el usuario decide si la descarga. La imagen no se transmite a un servidor.
- La aplicación no genera códigos QR ni comparte la selección por URL: esa función necesita un servicio y una URL pública.
- La simulación de maquillaje es orientativa. La precisión de color depende de la cámara, la iluminación y la pantalla; no sustituye una prueba física.
