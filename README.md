# 🏆 Liga Doméstica

Competición familiar por las tareas del hogar: cada tarea da puntos, hay ranking, niveles, rachas, medallas y una tienda de premios. En el futuro, una IA hará de comentarista y de juez de la casa.

> **Estado:** prototipo del front-end, pensado primero para **Android** como app instalable (PWA). Funciona con datos de demostración guardados en `localStorage`; todavía no hay backend ni IA.

## Pensada para Android

- **Diseño Material 3:** barra de navegación inferior, botón flotante, hoja inferior, avisos con «Deshacer» y ondas táctiles.
- **Tema claro y oscuro** automático según el sistema, sin fuentes externas (usa Roboto, la del sistema).
- **Objetivos táctiles de 48 px**, vibración al confirmar y respeto del gesto/barra de navegación de Android.
- **Botón Atrás** del móvil: cierra la hoja inferior y, desde una pestaña, sale de la app.
- **Instalable y con modo sin conexión** (manifest + service worker), con icono adaptable.

## Pantallas

| Pestaña | Qué hace |
|---|---|
| **Ranking** (inicio) | Puntos totales de la familia con anillo de objetivo común, tu posición, podio, clasificación y la crónica de la semana. |
| **Tareas** | Catálogo de tareas con puntos. El administrador puede añadir tareas. |
| **Actividad** | Tareas de los demás que esperan tu confirmación (nadie confirma las suyas) e historial. |
| **Premios** | Los puntos ganados son monedas que se canjean por premios pactados en familia. Canjear no baja tu puesto. |
| **Perfil** | Nivel con título, puntos, racha, medallas e instalación de la app. |

El botón flotante **Registrar tarea** está disponible en Ranking, Actividad y Premios para anotar una tarea en dos toques.

## Instalarla en el móvil

La instalación y el modo sin conexión necesitan HTTPS (o `localhost`). La forma más sencilla de probarla en un Android real es publicarla con **GitHub Pages**:

1. En el repo: *Settings → Pages → Deploy from a branch → `main` / root*.
2. Abre la URL que te da GitHub en **Chrome para Android**.
3. Menú ⋮ → **Instalar aplicación** (o usa el botón de la pestaña Perfil).

## Ejecutar en local

Es una web estática:

```bash
python -m http.server 5174
```

Y abre `http://localhost:5174`. El service worker funciona en `localhost`.

## Estructura

```
liga-domestica/
├── index.html             # Estructura, barra superior y navegación inferior
├── style.css              # Sistema de diseño Material 3 (claro y oscuro)
├── app.js                 # Datos de demo, lógica de puntos y pantallas
├── manifest.webmanifest   # Datos de la app instalable
├── sw.js                  # Service worker (modo sin conexión)
└── icons/                 # Iconos de la app (normal y adaptable)
```

La sección «Capa de datos» de `app.js` está aislada para sustituirla por llamadas a una API.

## Hoja de ruta

1. **Backend con PHP + MySQL:** login con roles, hogares, tareas, registros y premios, con datos compartidos entre móviles.
2. **Narrador semanal con IA:** crónica de la liga a partir del ranking real, guardada en base de datos para limitar el coste.
3. **Notificaciones** al recibir una tarea por confirmar.
4. **Más juego:** duelos, comodines, tribunal familiar, misiones sorpresa y validación con foto.

## Reglas de diseño

- Nadie puede confirmar sus propias tareas.
- Las monedas se gastan, pero el ranking se calcula con los puntos ganados.
- Con menores en casa, la IA recibirá apodos y no datos personales.
- Sin fuentes ni servicios de terceros en el cliente: menos dependencias y mejor privacidad.
