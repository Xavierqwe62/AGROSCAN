# Comprobación de AgroScan

Fecha local: 19 de octubre de 2026 (America/Mexico_City).

## Compilación y pruebas

- `npm run build`: **aprobado**, sin errores ni advertencias de presupuesto. Bundle inicial: **317.98 kB**, transferencia estimada **80.71 kB**; no incluye recursos de Google cargados posteriormente ni imágenes. Salida: `dist/agroscan/browser/`.
- `npm test -- --watch=false`: **41 pruebas aprobadas en 7 archivos**.
- `git diff --check`: sin errores de espacios. Git puede mostrar avisos de conversión LF/CRLF por la configuración de Windows.
- Entorno: Node.js 24.21.0, npm 11.19.0, Angular 22.2 y Vitest 5.0.4.

Los tests incluyen el flujo entre encabezado/biblioteca/mapa; búsqueda con acentos; filtros y estado vacío; selección compartida; expansión accesible; imágenes de respaldo; validación de polígonos simples, cóncavos, cruzados y degenerados; coordenadas inválidas; cruce del antimeridiano; alta, edición, lectura y eliminación de parcelas; conservación ante almacenamiento corrupto o cuota agotada; clics, movimientos e inserciones de vértices mediante eventos de la API; deshacer; confirmaciones; cambio de tipo de mapa; errores de geocodificación/geolocalización; configuración ausente; carga única; autorización tardía y timeout del cargador.

La geometría de Google se sustituye por un doble controlado en las pruebas. Se comprueba que el editor llama a `computeArea` y convierte m² a hectáreas; **no se valida numéricamente el algoritmo de Google contra el servicio real**.

## Navegador

Prueba ejecutada en Chrome headless con Playwright disponible en el entorno de trabajo, sin añadir dependencias de navegador a la aplicación.

- Escritorio: 1440 × 1000; ancho del documento 1440 (sin desbordamiento horizontal).
- Móvil: viewport 390 × 844; ancho del documento 390 (sin desbordamiento horizontal). Es emulación de viewport, no una prueba en teléfono físico.
- Verificados: 10 fichas, búsqueda compartida desde el encabezado, búsqueda sin acentos, detalles, selección reflejada en el panel de parcela, recuperación de filtros sin resultados, filtros por categoría, carga de imágenes, vista previa del menú móvil y cierre con Escape.
- Sin errores JavaScript `pageerror` durante estos recorridos.
- Se corrigió un conflicto entre hover y toque que cerraba la vista previa del menú móvil.
- Se inspeccionaron capturas y se ajustaron las ilustraciones a `object-fit: contain` para mostrar el cultivo completo. Se aumentó el tamaño de entrada de texto en móvil y se aplicó respaldo también a la imagen del cultivo seleccionado.

Una segunda prueba de navegador inyectó un **doble de la API de Maps exclusivamente en el entorno de pruebas**. A través de controles reales de la interfaz comprobó: agregar coordenadas; mínimo de tres vértices; deshacer; eliminar un punto; finalizar; guardar en `localStorage` real; recargar la página; abrir y editar la parcela; guardar sin duplicar; cancelar una eliminación y luego confirmarla. El borrado quedó reflejado en el almacenamiento. No se modifica la aplicación ni se incorpora un mapa simulado a la entrega.

Capturas:

- [Página de escritorio](screenshots/desktop.png).
- [Primer viewport móvil](screenshots/mobile.png).
- [Presentación principal](screenshots/hero.png).

El estado de conexión pendiente visible en las capturas corresponde a la ausencia de API key, no a una simulación de mapa.

## Pendiente de configuración externa

No se proporcionó una clave de Google Maps válida. Por tanto **no se comprobó en vivo** la carga de teselas de mapa/satélite, el cálculo real de Geometry, la geocodificación contra Google, restricciones/facturación de la clave, ni permisos/GPS en un dispositivo físico. El código de integración está implementado y compila; estos puntos deben validarse después de seguir la configuración del README.

Recorrido manual recomendado con la clave configurada:

1. Abrir el mapa, acercar/alejar, arrastrar y alternar Mapa/Satélite.
2. Buscar `Guadalajara, Jalisco` y `20.6597, -103.3496`; probar dirección sin resultados.
3. Permitir y luego denegar ubicación desde la configuración del navegador y comprobar los mensajes.
4. Seleccionar un cultivo, colocar un polígono de al menos tres puntos, mover un vértice, insertar uno en una arista, eliminar otro y deshacer una adición.
5. Intentar cruzar límites y verificar que el cambio sea rechazado conservando la forma previa.
6. Finalizar, nombrar, elegir color y guardar. Recargar; abrir, editar y guardar de nuevo. Crear una segunda parcela y comprobar los colores en el mapa.
7. Cancelar y confirmar el borrado tanto del editor como de una parcela guardada.
8. Comparar una superficie conocida con la medición y revisar el flujo en un móvil físico.

## Datos y alcance

El checkout inicial era la plantilla de Angular y no contenía el catálogo mencionado en el encargo. Los diez cultivos de esta entrega constituyen un catálogo inicial nuevo, con fuentes; no se afirma haber conservado datos originales que no estaban disponibles. No hay sensores, cámara, conexión Bluetooth ni mediciones simuladas. Los datos se guardan por navegador y origen; no existe una base de datos remota ni sincronización entre dispositivos o pestañas simultáneas.
