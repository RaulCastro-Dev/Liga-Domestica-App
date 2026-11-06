'use strict';

/* ==========================================================
   Liga Doméstica - prototipo
   Los datos se guardan en localStorage, con datos de demostración.
   Cuando exista el backend (PHP + MySQL), solo hay que sustituir
   la sección "Capa de datos" por llamadas fetch() a la API.
   ========================================================== */

/* ---------- Capa de datos ---------- */

const CLAVE = 'ligaDomestica.v1';
const DIA = 24 * 60 * 60 * 1000;
const META_CASA = 500; // objetivo cooperativo de la temporada

const hace = (dias, minutos = 0) =>
  new Date(Date.now() - dias * DIA - minutos * 60000).toISOString();

const siguienteId = (lista) => lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;

function crearDatosDemo() {
  const tareas = [
    { id: 1, nombre: 'Fregar los platos', icono: '🍽️', puntos: 10 },
    { id: 2, nombre: 'Sacar la basura', icono: '🗑️', puntos: 5 },
    { id: 3, nombre: 'Poner la lavadora', icono: '🧺', puntos: 10 },
    { id: 4, nombre: 'Tender la ropa', icono: '👕', puntos: 8 },
    { id: 5, nombre: 'Limpiar el baño', icono: '🚽', puntos: 30 },
    { id: 6, nombre: 'Pasar la aspiradora', icono: '🧹', puntos: 15 },
    { id: 7, nombre: 'Hacer la cama', icono: '🛏️', puntos: 3 },
    { id: 8, nombre: 'Cocinar la cena', icono: '🍳', puntos: 20 },
  ];

  const miembros = [
    { id: 1, nombre: 'Mamá', avatar: '👩', rol: 'miembro' },
    { id: 2, nombre: 'Papá', avatar: '👨', rol: 'miembro' },
    { id: 3, nombre: 'Raül', avatar: '🧑‍💻', rol: 'admin' },
    { id: 4, nombre: 'Hermana', avatar: '👧', rol: 'miembro' },
  ];

  // [miembro, tarea, días atrás]
  const historial = [
    [1, 5, 6], [1, 6, 5], [1, 1, 4], [1, 3, 3], [1, 8, 2], [1, 5, 1], [1, 1, 0],
    [2, 2, 6], [2, 3, 5], [2, 6, 4], [2, 5, 3], [2, 1, 2], [2, 2, 1], [2, 8, 0],
    [3, 1, 6], [3, 7, 5], [3, 3, 4], [3, 4, 3], [3, 6, 2], [3, 1, 1], [3, 2, 0],
    [4, 7, 5], [4, 2, 4], [4, 4, 2], [4, 1, 1], [4, 7, 0],
  ];

  const registro = (id, m, t, fecha, estado, confirmadoPor) => {
    const ta = tareas.find((x) => x.id === t);
    return {
      id, tareaId: ta.id, tareaNombre: ta.nombre, icono: ta.icono, puntos: ta.puntos,
      miembroId: m, fecha, estado, confirmadoPor,
    };
  };

  const registros = historial.map(([m, t, d], i) =>
    registro(i + 1, m, t, hace(d, 10 + i * 7), 'confirmada', m === 1 ? 2 : 1)
  );

  // Dos tareas pendientes de confirmar, para que Actividad tenga algo que hacer
  registros.push(registro(registros.length + 1, 1, 2, hace(0, 4), 'pendiente', null));
  registros.push(registro(registros.length + 1, 2, 7, hace(0, 2), 'pendiente', null));

  return {
    yo: 3,
    miembros,
    tareas,
    registros,
    premios: [
      { id: 1, nombre: 'Elegir la película del viernes', icono: '🎬', coste: 40 },
      { id: 2, nombre: 'Saltarte una tarea', icono: '🎟️', coste: 60 },
      { id: 3, nombre: 'Elegir la cena', icono: '🍕', coste: 80 },
      { id: 4, nombre: 'Desayuno en la cama', icono: '🥐', coste: 120 },
    ],
    canjes: [],
  };
}

function cargar() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return JSON.parse(guardado);
  } catch (e) { /* sin almacenamiento: se usan los datos de demo */ }
  return crearDatosDemo();
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* ignorar */ }
}

let estado = cargar();

/* ---------- Cálculos ---------- */

const miembro = (id) => estado.miembros.find((m) => m.id === id);
const confirmadasDe = (id) =>
  estado.registros.filter((r) => r.miembroId === id && r.estado === 'confirmada');
const puntosDe = (id) => confirmadasDe(id).reduce((suma, r) => suma + r.puntos, 0);
const gastadoDe = (id) =>
  estado.canjes.filter((c) => c.miembroId === id).reduce((suma, c) => suma + c.coste, 0);
const monedasDe = (id) => puntosDe(id) - gastadoDe(id);

function ranking() {
  const lista = estado.miembros
    .map((m) => ({ ...m, puntos: puntosDe(m.id) }))
    .sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
  // Los empatados comparten posición
  lista.forEach((m, i) => {
    m.posicion = i > 0 && m.puntos === lista[i - 1].puntos ? lista[i - 1].posicion : i + 1;
  });
  return lista;
}

const claveDia = (f) => new Date(f).toLocaleDateString('sv-SE'); // AAAA-MM-DD en hora local

function rachaDe(id) {
  const dias = new Set(confirmadasDe(id).map((r) => claveDia(r.fecha)));
  let d = new Date();
  if (!dias.has(claveDia(d))) d = new Date(d.getTime() - DIA);
  let n = 0;
  while (dias.has(claveDia(d))) {
    n += 1;
    d = new Date(d.getTime() - DIA);
  }
  return n;
}

function cuando(iso) {
  const hoy = new Date(claveDia(new Date()));
  const dif = Math.round((hoy - new Date(claveDia(iso))) / DIA);
  const hora = new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (dif <= 0) return `hoy, ${hora}`;
  if (dif === 1) return `ayer, ${hora}`;
  return `hace ${dif} días`;
}

function infoTemporada() {
  const hoy = new Date();
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return {
    nombre: `Temporada de ${hoy.toLocaleDateString('es-ES', { month: 'long' })}`,
    diasRestantes: fin.getDate() - hoy.getDate(),
  };
}

const pendientesParaMi = () =>
  estado.registros.filter((r) => r.estado === 'pendiente' && r.miembroId !== estado.yo);

/* ---------- Utilidades de interfaz ---------- */

const $ = (selector) => document.querySelector(selector);
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

let temporizadorAviso;
function aviso(texto) {
  const el = $('#toast');
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove('visible'), 2800);
}

function animarNumero(el) {
  const fin = Number(el.dataset.contar);
  if (reducirMovimiento || fin === 0) return;
  const inicio = performance.now();
  const duracion = 700;
  const paso = (t) => {
    const p = Math.min(1, (t - inicio) / duracion);
    el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/* ---------- Pantallas ---------- */

function cronica(lista) {
  const [primero, segundo] = lista;
  if (!primero || primero.puntos === 0) {
    return 'La liga arranca en frío: nadie ha puntuado todavía. ¡El primero que friegue entra en la historia!';
  }
  const ultima = estado.registros
    .filter((r) => r.estado === 'confirmada')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
  let texto = `¡${primero.nombre} manda en la liga con ${primero.puntos} puntos! `;
  if (segundo) {
    const dif = primero.puntos - segundo.puntos;
    texto += dif === 0
      ? `${segundo.nombre} le iguala: ¡empate técnico! `
      : `${segundo.nombre} le sigue a ${dif} puntos y no se rinde. `;
  }
  if (ultima) {
    texto += `Última jugada: ${miembro(ultima.miembroId).nombre} se anota «${ultima.tareaNombre}» (+${ultima.puntos}). `;
  }
  return `${texto}¡Esto no ha terminado!`;
}

function vistaRanking() {
  const lista = ranking();
  const total = lista.reduce((suma, m) => suma + m.puntos, 0);
  const pct = Math.min(100, Math.round((total / META_CASA) * 100));
  const lider = lista[0] && lista[0].puntos > 0 ? lista[0].puntos : 1;
  const medallas = ['🥇', '🥈', '🥉'];

  const columna = (m, i) => `
    <div class="podio-col pos${i + 1}">
      <div class="avatar grande">${esc(m.avatar)}</div>
      <strong>${esc(m.nombre)}</strong>
      <span class="pts">${m.puntos} pts</span>
      <div class="escalon">${medallas[i]}</div>
    </div>`;

  // Orden visual del podio: 2.º, 1.º, 3.º
  const podio = [1, 0, 2]
    .filter((i) => lista[i])
    .map((i) => columna(lista[i], i))
    .join('');

  const filas = lista.map((m) => `
    <div class="fila${m.id === estado.yo ? ' yo' : ''}">
      <span class="pos">${m.posicion}</span>
      <span class="avatar">${esc(m.avatar)}</span>
      <div>
        <div class="nombre">${esc(m.nombre)}${m.id === estado.yo ? ' <span class="etiqueta-tu">tú</span>' : ''}</div>
        <div class="mini"><i style="width:${Math.round((m.puntos / lider) * 100)}%"></i></div>
      </div>
      <span class="pts">${m.puntos} pts</span>
    </div>`).join('');

  return `
    <section class="card total" aria-label="Puntos totales de la familia">
      <div class="etiqueta">Puntos de la familia</div>
      <div class="numero-grande" data-contar="${total}">${total}</div>
      <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Objetivo de la casa">
        <i style="width:${pct}%"></i>
      </div>
      <small>Objetivo de la casa: ${total} / ${META_CASA} pts (${pct}%)</small>
    </section>

    <section class="podio" aria-label="Podio">${podio}</section>

    <div class="seccion-titulo"><h2>Clasificación</h2><small>${esc(infoTemporada().nombre)}</small></div>
    <section aria-label="Clasificación completa">${filas}</section>

    <section class="card cronica">
      <h2>🎙️ La crónica</h2>
      <p>${esc(cronica(lista))}</p>
      <small>Narrador de demostración (sin IA todavía).</small>
    </section>`;
}

function vistaTareas() {
  const lista = estado.tareas.map((t) => `
    <div class="item">
      <span class="icono">${esc(t.icono)}</span>
      <div>
        <div class="titulo">${esc(t.nombre)}</div>
        <div class="detalle">+${t.puntos} puntos</div>
      </div>
      <button class="btn" data-accion="hecho" data-id="${t.id}">¡Hecho!</button>
    </div>`).join('');

  const formulario = miembro(estado.yo).rol === 'admin' ? `
    <div class="seccion-titulo"><h2>Nueva tarea</h2><small>Solo administradores</small></div>
    <form class="nueva card" id="form-tarea">
      <input name="nombre" placeholder="Nombre de la tarea" maxlength="40" required aria-label="Nombre de la tarea">
      <input name="puntos" type="number" min="1" max="100" value="10" required aria-label="Puntos">
      <button class="btn" type="submit">Añadir</button>
    </form>` : '';

  return `
    <h2>¿Qué has hecho hoy?</h2>
    <p class="sub">Pulsa «¡Hecho!» y otro miembro de la familia tendrá que confirmarlo.</p>
    <section class="lista" aria-label="Catálogo de tareas">${lista}</section>
    ${formulario}`;
}

function vistaActividad() {
  const paraMi = pendientesParaMi().map((r) => {
    const quien = miembro(r.miembroId);
    return `
      <div class="item">
        <span class="icono">${esc(r.icono)}</span>
        <div>
          <div class="titulo">${esc(quien.nombre)}: ${esc(r.tareaNombre)}</div>
          <div class="detalle">+${r.puntos} pts · ${cuando(r.fecha)}</div>
        </div>
        <div class="acciones">
          <button class="btn ok" data-accion="confirmar" data-id="${r.id}" aria-label="Confirmar">✔</button>
          <button class="btn no" data-accion="rechazar" data-id="${r.id}" aria-label="Rechazar">✖</button>
        </div>
      </div>`;
  }).join('');

  const mias = estado.registros
    .filter((r) => r.estado === 'pendiente' && r.miembroId === estado.yo)
    .map((r) => `
      <div class="item">
        <span class="icono">${esc(r.icono)}</span>
        <div>
          <div class="titulo">${esc(r.tareaNombre)}</div>
          <div class="detalle">${cuando(r.fecha)}</div>
        </div>
        <span class="estado-pend">⏳ esperando</span>
      </div>`).join('');

  const historial = estado.registros
    .filter((r) => r.estado !== 'pendiente')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10)
    .map((r) => `
      <div class="item">
        <span class="icono">${esc(r.icono)}</span>
        <div>
          <div class="titulo">${esc(miembro(r.miembroId).nombre)}: ${esc(r.tareaNombre)}</div>
          <div class="detalle">${cuando(r.fecha)}</div>
        </div>
        ${r.estado === 'confirmada'
          ? `<span class="estado-ok">+${r.puntos}</span>`
          : '<span class="estado-no">rechazada</span>'}
      </div>`).join('');

  return `
    <h2>Por confirmar</h2>
    <p class="sub">Tareas que han hecho los demás y esperan tu visto bueno.</p>
    <section class="lista">${paraMi || '<div class="vacio">Nada pendiente. ¡Todos al día!</div>'}</section>

    ${mias ? `<div class="seccion-titulo"><h2>Tus envíos</h2></div><section class="lista">${mias}</section>` : ''}

    <div class="seccion-titulo"><h2>Últimos movimientos</h2></div>
    <section class="lista">${historial || '<div class="vacio">Aún no hay movimientos.</div>'}</section>`;
}

function vistaPremios() {
  const monedas = monedasDe(estado.yo);
  const lista = estado.premios.map((p) => `
    <div class="item">
      <span class="icono">${esc(p.icono)}</span>
      <div>
        <div class="titulo">${esc(p.nombre)}</div>
        <div class="detalle">${p.coste} monedas</div>
      </div>
      <button class="btn" data-accion="canjear" data-id="${p.id}" ${monedas < p.coste ? 'disabled' : ''}>Canjear</button>
    </div>`).join('');

  const mios = estado.canjes
    .filter((c) => c.miembroId === estado.yo)
    .slice(-5)
    .reverse()
    .map((c) => `
      <div class="item">
        <span class="icono">🎁</span>
        <div>
          <div class="titulo">${esc(c.premioNombre)}</div>
          <div class="detalle">${cuando(c.fecha)}</div>
        </div>
        <span class="detalle">−${c.coste}</span>
      </div>`).join('');

  return `
    <section class="card monedero">
      <div>
        <div class="sub">Tus monedas</div>
        <div class="numero-grande" data-contar="${monedas}">${monedas}</div>
      </div>
      <span style="font-size:2.5rem" aria-hidden="true">🪙</span>
    </section>
    <p class="sub">Tus puntos ganados son tus monedas. Al canjear un premio se gastan, pero no bajas en el ranking.</p>
    <section class="lista" aria-label="Premios">${lista}</section>
    ${mios ? `<div class="seccion-titulo"><h2>Tus canjes</h2></div><section class="lista">${mios}</section>` : ''}`;
}

function medallasDe(id, lider) {
  const n = confirmadasDe(id).length;
  const racha = rachaDe(id);
  const banos = confirmadasDe(id).filter((r) => /baño/i.test(r.tareaNombre)).length;
  return [
    { icono: '🥇', nombre: 'Líder de la liga', pista: 'Ponte primero en el ranking', ok: lider },
    { icono: '🌟', nombre: 'Primera tarea', pista: 'Completa tu primera tarea', ok: n >= 1 },
    { icono: '💪', nombre: 'Imparable', pista: 'Completa 5 tareas', ok: n >= 5 },
    { icono: '🔥', nombre: 'Racha de 3', pista: '3 días seguidos puntuando', ok: racha >= 3 },
    { icono: '🧼', nombre: 'Maestro del baño', pista: 'Limpia el baño 2 veces', ok: banos >= 2 },
    { icono: '🍳', nombre: 'Cocinillas', pista: 'Cocina la cena 2 veces', ok: confirmadasDe(id).filter((r) => /cocinar/i.test(r.tareaNombre)).length >= 2 },
  ];
}

function vistaPerfil() {
  const yo = miembro(estado.yo);
  const lista = ranking();
  const esLider = lista[0].id === yo.id && lista[0].puntos > 0;
  const opciones = estado.miembros
    .map((m) => `<option value="${m.id}"${m.id === yo.id ? ' selected' : ''}>${esc(m.avatar)} ${esc(m.nombre)}</option>`)
    .join('');
  const medallas = medallasDe(yo.id, esLider)
    .map((m) => `
      <div class="medalla${m.ok ? '' : ' bloqueada'}">
        <div class="ico">${m.icono}</div>
        <strong>${esc(m.nombre)}</strong>
        <small>${m.ok ? '¡Conseguida!' : esc(m.pista)}</small>
      </div>`).join('');

  return `
    <section class="card" style="text-align:center">
      <div class="avatar grande" style="margin:0 auto">${esc(yo.avatar)}</div>
      <h2 style="margin-top:0.5rem">${esc(yo.nombre)}</h2>
      <p class="sub">${yo.rol === 'admin' ? 'Administrador del hogar' : 'Miembro del hogar'}</p>
    </section>

    <section class="stats">
      <div class="card"><strong>${puntosDe(yo.id)}</strong><span>puntos</span></div>
      <div class="card"><strong>${confirmadasDe(yo.id).length}</strong><span>tareas</span></div>
      <div class="card"><strong>${rachaDe(yo.id)}🔥</strong><span>racha (días)</span></div>
    </section>

    <div class="seccion-titulo"><h2>Medallas</h2></div>
    <section class="medallas">${medallas}</section>

    <div class="seccion-titulo"><h2>Modo demostración</h2></div>
    <section class="card">
      <label class="sub" for="jugador">Jugar como:</label>
      <select id="jugador" data-accion="yo">${opciones}</select>
      <button class="btn sec" style="margin-top:0.75rem" data-accion="reiniciar">Reiniciar datos de demo</button>
    </section>`;
}

/* ---------- Navegación ---------- */

const VISTAS = {
  ranking: vistaRanking,
  tareas: vistaTareas,
  actividad: vistaActividad,
  premios: vistaPremios,
  perfil: vistaPerfil,
};

const contenedor = $('#vista');
let actual = 'ranking';

function actualizarMarco() {
  $('#temporada').textContent = `${infoTemporada().nombre} · quedan ${infoTemporada().diasRestantes} días`;

  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.vista === actual) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  const n = pendientesParaMi().length;
  const badge = $('#badge-actividad');
  badge.textContent = n;
  badge.hidden = n === 0;
}

function pintar() {
  contenedor.innerHTML = VISTAS[actual]();
  contenedor.querySelectorAll('[data-contar]').forEach(animarNumero);
  actualizarMarco();
}

function ir() {
  const hash = location.hash.slice(1);
  actual = VISTAS[hash] ? hash : 'ranking';
  pintar();
  window.scrollTo(0, 0);
  contenedor.focus({ preventScroll: true });
}

/* ---------- Acciones ---------- */

contenedor.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const id = Number(boton.dataset.id);

  switch (boton.dataset.accion) {
    case 'hecho': {
      const t = estado.tareas.find((x) => x.id === id);
      if (!t) return;
      estado.registros.push({
        id: siguienteId(estado.registros), tareaId: t.id, tareaNombre: t.nombre, icono: t.icono,
        puntos: t.puntos, miembroId: estado.yo, fecha: new Date().toISOString(),
        estado: 'pendiente', confirmadoPor: null,
      });
      aviso('Enviada. Falta que otro miembro la confirme.');
      break;
    }
    case 'confirmar':
    case 'rechazar': {
      const r = estado.registros.find((x) => x.id === id);
      if (!r || r.estado !== 'pendiente' || r.miembroId === estado.yo) return;
      r.estado = boton.dataset.accion === 'confirmar' ? 'confirmada' : 'rechazada';
      r.confirmadoPor = estado.yo;
      aviso(r.estado === 'confirmada'
        ? `+${r.puntos} puntos para ${miembro(r.miembroId).nombre}`
        : 'Tarea rechazada');
      break;
    }
    case 'canjear': {
      const p = estado.premios.find((x) => x.id === id);
      if (!p || monedasDe(estado.yo) < p.coste) return;
      estado.canjes.push({
        id: siguienteId(estado.canjes), premioId: p.id, premioNombre: p.nombre, coste: p.coste,
        miembroId: estado.yo, fecha: new Date().toISOString(),
      });
      aviso(`Canjeado: ${p.nombre}`);
      break;
    }
    case 'reiniciar':
      if (!window.confirm('¿Reiniciar todos los datos de demostración?')) return;
      estado = crearDatosDemo();
      aviso('Datos de demo restaurados.');
      break;
    default:
      return;
  }
  guardar();
  pintar();
});

contenedor.addEventListener('change', (e) => {
  if (e.target.dataset.accion === 'yo') {
    estado.yo = Number(e.target.value);
    guardar();
    pintar();
    aviso(`Ahora juegas como ${miembro(estado.yo).nombre}`);
  }
});

contenedor.addEventListener('submit', (e) => {
  if (e.target.id !== 'form-tarea') return;
  e.preventDefault();
  if (miembro(estado.yo).rol !== 'admin') return;

  const datos = new FormData(e.target);
  const nombre = String(datos.get('nombre')).trim();
  const puntos = Math.round(Number(datos.get('puntos')));
  if (!nombre || nombre.length > 40 || !(puntos >= 1 && puntos <= 100)) {
    aviso('Revisa el nombre (máx. 40) y los puntos (1-100).');
    return;
  }
  estado.tareas.push({ id: siguienteId(estado.tareas), nombre, icono: '⭐', puntos });
  guardar();
  pintar();
  aviso(`Tarea añadida: ${nombre}`);
});

window.addEventListener('hashchange', ir);
ir();
