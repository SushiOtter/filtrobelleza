# Espejo virtual de maquillaje

Abrir esta carpeta del proyecto en VS Code y elegir **Open with Live Server** sobre `index.html`
(o `python3 -m http.server 8000` y abrir http://localhost:8000).
La cámara requiere `localhost` o HTTPS y permiso del navegador. Usar Chrome o Edge y cerrar otras aplicaciones que estén usando la cámara.

- La interfaz usa una estética profesional en negro, blanco y rojo.
- `js/product-data.js` contiene productos, precios, tonos, ubicaciones y looks de demostración; no son un catálogo ni existencias reales.
- `js/main.js` captura el vídeo en el dispositivo y aplica pigmentos con bordes suavizados, mezcla de luz/sombra y ajuste a los landmarks faciales. Usa segmentación multiclase (MediaPipe) para limitar base, colorete, contorno e iluminador a la piel real, adapta la cobertura al tono medido y suaviza la piel. Sigue siendo una simulación orientativa, no un análisis de segmentación cosmética profesional; el vídeo no se sube ni se almacena.
- El rendimiento se adapta solo: la app mide el coste real de cada fotograma y baja la calidad (resolución, suavizado, frecuencia de detección y segmentación) si detecta tirones. El botón «Calidad» del espejo permite forzar Automática, Alta o Fluida.
- La detección requiere descargar MediaPipe (detección facial y segmentación de piel) y sus modelos desde sus CDN. Se usa aceleración GPU; si la segmentación no dispone de GPU se omite (se usa el óvalo facial como máscara) para evitar bloqueos, y si la detección facial cae a CPU se reduce la calidad automáticamente.
- «Guardar» genera una imagen PNG con la captura y los tonos elegidos; el usuario decide si la descarga. La imagen no se transmite a un servidor.
- La aplicación no genera códigos QR ni comparte la selección por URL: esa función necesita un servicio y una URL pública.
- La simulación de maquillaje es orientativa. La precisión de color depende de la cámara, la iluminación y la pantalla; no sustituye una prueba física.
