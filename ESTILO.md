# Guía de estilo de trenzia.es

Lo que hay publicado hoy en la web. Si vas a cambiar o añadir algo, mantén esto para que todo se vea igual. Si propones cambiar algo de esta guía, coméntalo antes.

## Colores

| Uso | Color |
|---|---|
| Fondo de página | `#0C0C0C` |
| Naranja de marca (botones, destacados, números, logo) | `#FF5A1F` |
| Texto principal y titulares | `#FFFFFF` |
| Texto de entradilla | `#CFCFD4` |
| Texto de listas | `#E6E6EA` |
| Texto secundario (ayudas, pie) | `#9A9AA2` |
| Bordes y líneas separadoras | `#2A2A2E` |
| Fondo de campos, tarjetas y chips | `#16161A` |
| Naranja suave (fondo de chip seleccionado) | `rgba(255,90,31,.12)` |
| Error | `#FF8A7A` |
| Correcto | `#7DDC9A` |

Solo tema oscuro. Sin degradados ni sombras (la única excepción es la barra naranja a la izquierda de la tarjeta marcada del selector de oposición, hecha con `box-shadow: inset`). El naranja se usa poco: solo para lo que hay que ver primero.

En `probar.css` están como variables: `--o` (naranja), `--k` (fondo), `--line`, `--muted`, `--soft`, `--field`, `--err`, `--ok`. La portada solo define `--o` y `--k`; el resto lo escribe con su valor.

## Tipografía

- Fuente del sistema, sin fuentes externas: `-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- Interlineado 1,6.
- Titular principal (h1): 34 px en la portada y 30 px en las páginas de probadores, negrita, interlineado 1,2. La parte destacada va en naranja (`<em>` sin cursiva). En las páginas legales, 28 px.
- Títulos de sección (h2): 26 px en la portada, 20 px en las páginas de probadores y 21 px en las legales.
- Entradilla: 18 o 19 px, en `#CFCFD4`.
- Nombre "Trenzia" junto al logo: 34 px (28 px en las páginas de probadores), negrita, espaciado de letras -0,5 px.
- Texto pequeño (ayudas, pie): 14 px.
- Campos de formulario: 16 px como mínimo, para que el iPhone no haga zoom.

## Logo

- `logo.svg`: la T de tres trazos en naranja `#FF5A1F`, sin fondo.
- 56 × 56 px en la portada y 44 × 44 px en las páginas de probadores, a la izquierda del nombre "Trenzia". Las páginas legales no llevan logo.

## Formas y componentes

- **Botón principal:** fondo naranja, texto blanco en negrita a 19 px (no menos: con 19 px en negrita cuenta como texto grande y el contraste blanco sobre naranja, 3,1 a 1, cumple; a 17 px no cumple. Decisión de Urko, 07/10), forma de píldora (`border-radius: 999px`), relleno de 13 a 14 px por 22 a 26 px.
- **Botón secundario:** transparente, borde `#CFCFD4`, también en píldora.
- **Etiqueta "Próximamente":** borde y texto naranjas, píldora, 14 px.
- **Tarjetas y cajas:** borde de 1 px `#2A2A2E`, esquinas de 12 px, relleno de 18 a 20 px. Las tarjetas de la lista del selector de oposición, más compactas: 14 × 16 px.
- **Campos de formulario:** fondo `#16161A`, borde `#2A2A2E`, esquinas de 8 px.
- **Chips de filtro:** píldora con borde `#2A2A2E`. Seleccionado: borde y texto naranjas y fondo naranja suave.
- **Foco (accesibilidad):** contorno de 2 px, blanco en los botones de la portada y naranja en los formularios. No se quita nunca.

### Pruebas físicas por oposición (`/oposiciones/`)

Mismas medidas que las páginas de probadores (640 px, h1 de 30 px). Su estilo está en `oposiciones/estilo.css`.

- **Tarjeta de organismo** (índice): como las del selector de oposición, 14 × 16 px. Si tiene página, lleva la barra naranja a la izquierda (`box-shadow: inset`) y una flecha `›` naranja.
- **Etiqueta de estado de la convocatoria:** píldora de 12,5 px con borde y texto del mismo color: azul `#8FC7FF` para «Inscripción abierta», verde (el color de correcto) para «Pruebas pendientes», naranja para «Próximamente» y gris `#9A9AA2` para «Cerrada», «Anulada» y «Suspendida». El texto es el estado tal como llega de la app; si no tiene fecha, añade «, sin fecha».
- **Selector de convocatorias:** una tarjeta-botón por convocatoria, una sola elegida (`role="radio"`). La elegida, con borde naranja y la barra naranja a la izquierda.
- **Avisos:** caja de 14 px con borde `#2A2A2E` y borde izquierdo de 3 px: gris para «sin fecha» y «no revisado por Trenzia», naranja para los demás. Siempre va el último: «Lo que vale es la convocatoria oficial».
- **Tablas de marcas:** dentro de un desplegable («Ver la tabla oficial»), dos columnas (Marca y Puntos) con una línea `#2A2A2E` entre filas. Si la prueba puntúa en escala lineal, la tabla tiene solo dos filas y debajo la frase «Entre medias, proporcional (dos decimales)».
- **Calculadora:** una caja por prueba con el campo de la marca (16 px, máximo 150 px de ancho), los puntos en grande (22 px, negrita), una barra de progreso naranja de 6 px y un mensaje de 14 px en verde (apto) o rojo claro (no apto). Debajo, la caja del total (30 px) con la regla de la convocatoria en una lista con ✓, ✕ u ○.
- **Sexo:** control segmentado en píldora; el elegido, con fondo naranja suave y texto naranja.
- **Botón «Prepáralas con Trenzia»:** el botón principal, a `probar.html?oposicion=CODIGO`.

## Maquetación

- Una sola columna centrada: 720 px de ancho máximo en la portada y 640 px en las páginas de probadores.
- Márgenes laterales de 16 a 20 px.
- Móvil primero: casi todas las visitas llegarán desde Instagram y TikTok. En pantalla ancha, como mucho tres columnas (como "Cómo funciona", a partir de 720 px).
- Nunca scroll horizontal.
- Pie con una línea `#2A2A2E` arriba, enlaces en blanco y texto en `#9A9AA2`.

## Técnico

- HTML y CSS a mano, sin frameworks ni librerías.
- Nada cargado de otros servidores (fuentes, scripts, analítica, formularios de terceros). Afecta a la política de privacidad: coméntalo antes. La única conexión es la de las páginas de probadores con nuestro propio servidor (Supabase), que es donde se guardan los datos del formulario.
- Las páginas de probadores comparten `probar.css`. La portada lleva su estilo dentro del propio HTML.
- **`oposiciones/` no se edita a mano:** la genera el generador de la web a partir del archivo de la app (`oposiciones.json` y `nota.js`, que es el cálculo de la app y no se toca). También escribe su bloque de `sitemap.xml`. Para cambiar textos o estilo, se cambia el generador y se vuelve a generar. La calculadora funciona en el navegador: no se conecta a nada ni guarda nada.
- Las páginas legales (privacidad, términos, aviso legal, eliminar cuenta) van en fondo blanco y texto `#1A1A1A` para leerse mejor, con 760 px de ancho máximo. El naranja `#FF5A1F` va en la línea bajo el título y en el borde izquierdo de las citas; los enlaces, en un naranja más oscuro (`#D1490F`) para que se lean sobre blanco.

## Reglas para colaborar

- Trabaja en un fork y abre un Pull Request por idea. Para cambios grandes, cuenta la idea antes en una Issue.
- No borres ni cambies el archivo `CNAME`: sin él, trenzia.es deja de funcionar.
- `probar.html`, `probar-confirmar.html`, `probar-gestionar.html` y `opinion.html` recogen datos de personas y hablan con el servidor. Si necesitas tocarlas, avisa antes.
- Si añades o cambias una página pública, añádela o sube su fecha (`lastmod`) en `sitemap.xml`.
- En el Pull Request, pon capturas en móvil y en ordenador.

## Pendiente

La app y las redes usan fondo `#0A0B0D` y la fuente Inter. La web usa `#0C0C0C` y la fuente del sistema. Unificarlas es una mejora posible, siempre con Inter alojada en la propia web (no desde Google Fonts).
