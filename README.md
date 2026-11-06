# 🏆 Liga Doméstica

Competición familiar por las tareas del hogar: cada tarea da puntos, hay ranking, rachas, medallas y una tienda de premios. En el futuro, una IA hará de comentarista y de juez de la casa.

> **Estado:** prototipo del front-end. Funciona con datos de demostración guardados en `localStorage`; todavía no hay backend ni IA.

## Pantallas

Navegación inferior con cinco pestañas:

| Pestaña | Qué hace |
|---|---|
| **Ranking** (inicio) | Puntos totales de la familia con barra de objetivo común, podio, clasificación completa y la crónica de la semana. |
| **Tareas** | Catálogo de tareas con puntos. Pulsas «¡Hecho!» y queda pendiente de confirmación. El administrador puede añadir tareas. |
| **Actividad** | Tareas de los demás que esperan tu confirmación (nadie confirma las suyas), tus envíos pendientes y los últimos movimientos. |
| **Premios** | Los puntos ganados son monedas que se canjean por premios pactados en familia. Canjear no baja tu puesto en el ranking. |
| **Perfil** | Tus puntos, tareas, racha y medallas. Incluye un modo demostración para jugar como otro miembro. |

## Ejecutar en local

Es una web estática. Basta con abrir `index.html` o servirla con:

```bash
python -m http.server 5174
```

## Estructura

```
liga-domestica/
├── index.html   # Estructura y navegación inferior
├── style.css    # Estilos (móvil primero, tema oscuro)
└── app.js       # Datos de demo, lógica de puntos y pantallas
```

La sección «Capa de datos» de `app.js` está aislada para sustituirla por llamadas a una API.

## Hoja de ruta

1. **Backend con PHP + MySQL:** login con roles, hogares, tareas, registros y premios.
2. **Narrador semanal con IA:** crónica de la liga a partir del ranking real, guardada en base de datos para limitar el coste.
3. **Más juego:** duelos, comodines, tribunal familiar, misiones sorpresa y validación con foto.

## Reglas de diseño

- Nadie puede confirmar sus propias tareas.
- Las monedas se gastan, pero el ranking se calcula con los puntos ganados.
- Con menores en casa, la IA recibirá apodos y no datos personales.
