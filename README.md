# trenzia-web

Web de Trenzia, la app para preparar las pruebas físicas de las oposiciones.
Se publica en https://trenzia.es con GitHub Pages desde la rama main.

La guía rápida para probadores está en https://trenzia.es/guia-trenzia.pdf (solo se enlaza desde los correos y no se indexa): al cambiarla, se sustituye `guia-trenzia.pdf` con el mismo nombre en otro PR.

Guía de estilo de la web (colores, tipografía, componentes y reglas para colaborar): [ESTILO.md](ESTILO.md).

Para colaborar: fork y un Pull Request por idea. Las reglas están en ESTILO.md.

**Vigilancia** (`.github/workflows/vigilancia.yml`): cada 30 minutos comprueba la portada, `probar`, `/oposiciones/`, una ficha, la función de altas (OPTIONS) y que el certificado caduque en más de 14 días. Si algo falla, GitHub manda el correo de «workflow failed» al dueño del repo. **GitHub desactiva los workflows programados tras 60 días sin actividad en el repo**: si pasa tanto tiempo sin commits, hay que volver a activarlo en la pestaña Actions.
