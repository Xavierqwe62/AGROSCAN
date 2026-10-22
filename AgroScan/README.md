# AgroScan

Aplicación Angular 22.2 con componentes standalone para explorar cultivos y administrar parcelas en Google Maps. La configuración original de Angular se conserva.

## Qué se encontró y qué cambió

El checkout recibido (`7d936b7`, único commit inicial) solo contenía la plantilla de Angular. No existían `HeaderComponent`, `HeroComponent`, `MapsComponent`, `CropsService`, el catálogo original ni componentes de sensores. Por ello no fue posible conservar datos agronómicos originales ausentes. Se creó un **catálogo inicial nuevo de 10 cultivos**, identificado en `crops.service.ts`, con fuentes de consulta por ficha. Si se recupera el catálogo original, debe sustituirse conservando los identificadores usados por parcelas guardadas.

Se sustituyó únicamente la pantalla de bienvenida por los componentes de AgroScan; se conservaron Angular, TypeScript, componentes standalone, la configuración del proyecto y su herramienta de pruebas. No hay Bluetooth, IoT, cámara, diagnósticos ni mediciones simuladas en la aplicación.

## Ejecutar

Verificado con Node.js 24.21.0 y npm 11.19.0.

```powershell
npm ci
npm start
```

Abrir http://localhost:4200. Sin configuración de Google Maps, la biblioteca y la navegación funcionan y el mapa muestra un estado de conexión pendiente. No se sustituye por un mapa simulado.

Las únicas dependencias añadidas son el cargador oficial y los tipos de Google Maps; ya están en `package.json` y `package-lock.json`:

```powershell
npm install @googlemaps/js-api-loader
npm install --save-dev @types/google.maps
```

## Configurar Google Maps

1. En [Google Cloud Console](https://console.cloud.google.com/), crear o elegir un proyecto y vincular una cuenta de facturación.
2. Habilitar **Maps JavaScript API** y **Geocoding API**. La búsqueda de direcciones usa Geocoder; no requiere Places API. Geometry se carga como biblioteca de Maps JavaScript, no como API separada.
3. Crear una clave en **APIs y servicios → Credenciales → Crear credenciales → Clave de API**.
4. Editar la clave. En **Restricciones de aplicación**, seleccionar **Sitios web (referencias HTTP)**. Añadir exclusivamente los orígenes utilizados, por ejemplo:
   - `http://localhost:4200/*`
   - `http://127.0.0.1:4200/*`
   - `http://127.0.0.1:4201/*` solo si se usa el puerto de verificación de esta entrega.
   - `https://agroscan.tudominio.mx/*` para producción, sustituyéndolo por el dominio real.
5. En **Restricciones de API**, seleccionar **Restringir clave** y permitir solamente **Maps JavaScript API** y **Geocoding API**. Configurar cuotas y alertas de consumo en el proyecto.
6. Crear el archivo local de configuración (si ya existe, editarlo sin sobrescribir su clave):

```powershell
if (!(Test-Path public/config.json)) {
  Copy-Item public/config.example.json public/config.json
}
```

7. Introducir la clave de navegador restringida en `public/config.json`:

```json
{
  "googleMapsApiKey": "TU_CLAVE_DE_NAVEGADOR_RESTRINGIDA"
}
```

8. Guardar y recargar la página. Si cambia una clave que ya se cargó, se necesita una recarga completa porque el cargador oficial configura la API una vez por documento. El botón de reintentar permite recuperar fallos de red o una configuración inicialmente ausente.

`public/config.json` está excluido de Git y se copia al resultado de compilación. En un despliegue, proporcionar este archivo mediante la configuración del entorno de publicación, antes del build o como `dist/agroscan/browser/config.json`. No publicar credenciales de cuentas de servicio ni claves privadas. La clave de Maps JavaScript es una credencial de navegador y **es visible en las peticiones del cliente**; su protección se basa en restricciones de dominio/API, no en ocultarla en el JavaScript. No compartirla por el chat.

La geolocalización pide permiso solo al pulsar «Mi ubicación». En producción requiere HTTPS; localhost se admite como contexto seguro. Denegar el permiso no impide buscar direcciones o coordenadas.

Referencias oficiales: [carga de Maps JavaScript](https://developers.google.com/maps/documentation/javascript/load-maps-js-api), [polígonos editables](https://developers.google.com/maps/documentation/javascript/shapes), [Geometry](https://developers.google.com/maps/documentation/javascript/geometry), [Geocoding](https://developers.google.com/maps/documentation/javascript/geocoding), [restricciones de claves](https://developers.google.com/maps/api-security-best-practices). Se usa `Polygon` nativo; no se usa DrawingManager, [retirado de Maps JavaScript](https://developers.google.com/maps/documentation/javascript/reference/drawing).

## Flujo de uso

1. Buscar o filtrar la biblioteca; abrir «Ver cuidados y etapas» para consultar riego, CE, etapas y fuentes.
2. Pulsar «Seleccionar cultivo». Se comparte la selección con el panel de parcelas y se navega al mapa.
3. Buscar una dirección o coordenadas con punto decimal, por ejemplo `20.6597, -103.3496`. Alternar Mapa/Satélite o usar la ubicación del dispositivo.
4. Pulsar «Nueva parcela» y colocar puntos mediante clics o toques. También se pueden agregar coordenadas desde «Edición precisa de puntos».
5. Arrastrar los vértices o los puntos intermedios nativos del polígono para ajustar/agregar límites. Seleccionar un vértice con clic o menú contextual y usar el botón `−` para quitarlo. Cada punto también tiene botones accesibles en el editor de coordenadas. «Deshacer» elimina la última adición, incluidas las inserciones en aristas.
6. Se rechazan coordenadas fuera del rango admitido, duplicados, límites superpuestos, cruces y polígonos sin superficie. Un borrador puede tener menos de tres puntos; no puede finalizarse ni guardarse hasta ser válido.
7. «Finalizar», asignar nombre, cultivo y color, y «Guardar parcela». La superficie se calcula mediante `google.maps.geometry.spherical.computeArea`, se presenta en m² y se divide entre 10,000 para hectáreas.
8. Seleccionar una parcela de «Mis parcelas» o directamente en el mapa para verla. «Editar límites» permite volver a modificarla. Los cambios requieren guardar de nuevo. Eliminar una parcela y borrar una delimitación requieren confirmación.

Las superficies son estimaciones geográficas de planificación, no levantamientos topográficos. Los datos agrícolas son referencias, no mediciones: la humedad del suelo se describe cualitativamente y la CE se identifica como umbral de salinidad **ECe**, no como receta de fertirriego. Algunas referencias dependen de variedad/clima, como se indica en las fichas.

## Archivos y conexión entre componentes

| Archivo/carpeta | Responsabilidad |
| --- | --- |
| `src/app/app.*` | Composición de la página y pie de página |
| `src/app/header/` | Búsqueda compartida, navegación activa, previews con hover/foco/toque y menú móvil |
| `src/app/hero/` | Presentación y guía de tres pasos con enlaces funcionales |
| `src/app/crop-library/` | Filtros, búsqueda, fichas, selección y respaldo de imágenes |
| `src/app/maps/` | Mapa real, búsquedas, geolocalización, edición de límites, medición y formulario |
| `src/app/services/crops.service.ts` | Catálogo inicial y signals compartidas `search` y `selectedCrop` |
| `src/app/services/google-maps-loader.service.ts` | Configuración en tiempo de ejecución, carga única de Maps/Geometry/Geocoding, errores y plazos de espera |
| `src/app/services/parcel.service.ts` | Persistencia separada de la UI, validación y errores de localStorage |
| `src/app/models/` | Contratos `Crop`, `Parcel`, `ParcelPoint` |
| `src/app/utils/polygon.ts` | Validación de coordenadas, cruces, duplicados y superficies degeneradas |
| `src/app/shared/icon.component.ts` | Iconografía SVG coherente |
| `src/styles.css` | Colores, tipografía, controles, responsive y movimiento reducido |

`HeaderComponent` y `CropLibraryComponent` usan la misma señal de búsqueda de `CropsService`. La biblioteca publica `selectedCrop`; el mapa la aplica al borrador. Al abrir una parcela guardada se restaura su cultivo. `ParcelService` usa la clave `agroscan.parcels.v1` y solo actualiza su estado después de que el navegador confirme la escritura. Un error de cuota no se presenta como éxito. Si encuentra datos dañados, los conserva y bloquea su sobrescritura hasta un restablecimiento confirmado.

Para una futura base de datos, sustituir la implementación de persistencia del servicio por un repositorio asíncrono manteniendo los modelos y las validaciones. La versión actual guarda datos únicamente en este navegador/origen; no sincroniza dispositivos, usuarios ni pestañas abiertas simultáneamente.

## Ilustraciones

- Originales: `public/assets/crops/<id>.png` y `public/assets/hero-farm.png`.
- Versiones optimizadas utilizadas por la web: `public/assets/crops/<id>.webp` y `public/assets/hero-farm.webp`.
- Identificadores: `maiz`, `tomate`, `trigo`, `frijol`, `aguacate`, `chile`, `papa`, `lechuga`, `zanahoria`, `fresa`.
- Respaldo coherente: `public/assets/crops/fallback.webp` (plántula en papel recortado).
- Cada ilustración se generó individualmente con la herramienta integrada ImageGen. Prompts completos y archivos: [docs/image-prompts.md](docs/image-prompts.md).
- La ruta pública es `assets/crops/...`: Angular copia el contenido de `public/` según `angular.json`. Si se sustituyen imágenes, conservar estos nombres o actualizar el campo `image` del catálogo.
- Las fichas usan carga diferida; las versiones WebP suman menos de 1 MB incluyendo el hero. Se conservan los PNG originales de mayor resolución.

## Comprobación

```powershell
npm test -- --watch=false
npm run build
```

La salida de producción se guarda en `dist/agroscan/browser/`. El presupuesto de estilos por componente se ajustó a advertencia de 12 kB y máximo de 16 kB para el editor de mapa, que incluye panel, herramientas y edición accesible de vértices. El presupuesto inicial de la aplicación permanece en 500 kB de advertencia y 1 MB de máximo.

La evidencia de pruebas, revisión de navegador y límites de verificación está en [docs/verification.md](docs/verification.md). **La prueba de conexión real con Google Maps queda pendiente de una clave restringida válida y sus servicios habilitados**. Las pruebas del editor usan dobles de la API; no demuestran carga de teselas, facturación, exactitud del servicio de Google ni permisos reales del dispositivo.
