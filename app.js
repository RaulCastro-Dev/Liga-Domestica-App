'use strict';

/* ==========================================================
   Liga Doméstica - prototipo (PWA pensada para Android)
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

  const registro = (id, m, t, fecha, estadoReg, confirmadoPor) => {
    const ta = tareas.find((x) => x.id === t);
    return {
      id, tareaId: ta.id, tareaNombre: ta.nombre, icono: ta.icono, puntos: ta.puntos,
      miembroId: m, fecha, estado: estadoReg, confirmadoPor,
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

// Niveles con título gracioso: uno cada 40 puntos
const NIVELES = [
  'Novato del polvo', 'Aprendiz de escoba', 'Fregona júnior',
  'Guardián del fregadero', 'Maestro de la mopa', 'Leyenda doméstica',
];
const PUNTOS_NIVEL = 40;

function nivelDe(puntos) {
  const i = Math.min(NIVELES.length - 1, Math.floor(puntos / PUNTOS_NIVEL));
  const ultimo = i === NIVELES.length - 1;
  const desde = i * PUNTOS_NIVEL;
  return {
    numero: i + 1,
    titulo: NIVELES[i],
    siguiente: ultimo ? null : (i + 1) * PUNTOS_NIVEL,
    pct: ultimo ? 100 : Math.round(((puntos - desde) / PUNTOS_NIVEL) * 100),
  };
}

/* ---------- Utilidades de interfaz ---------- */

const $ = (selector) => document.querySelector(selector);
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const vibrar = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };
const esStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const esc = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// Aviso (snackbar) con acción opcional de deshacer
let temporizadorAviso;
let accionDeshacer = null;

function aviso(texto, deshacer) {
  accionDeshacer = deshacer || null;
  $('#snack-texto').textContent = texto;
  $('#snack-accion').hidden = !deshacer;
  $('#snackbar').classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(
    () => $('#snackbar').classList.remove('visible'),
    deshacer ? 5500 : 3000
  );
}

function confeti() {
  if (reducirMovimiento) return;
  const cont = $('#confeti');
  const emojis = ['🎉', '⭐', '✨', '🧹', '🫧'];
  for (let i = 0; i < 22; i += 1) {
    const s = document.createElement('span');
    s.textContent = emojis[i % emojis.length];
    s.style.left = `${Math.round(10 + Math.random() * 80)}%`;
    s.style.setProperty('--x', `${Math.round((Math.random() - 0.5) * 220)}px`);
    s.style.setProperty('--r', `${Math.round(Math.random() * 720 - 360)}deg`);
    s.style.animationDelay = `${Math.round(Math.random() * 250)}ms`;
    s.addEventListener('animationend', () => s.remove());
    cont.appendChild(s);
  }
}

function animarNumero(el) {
  const fin = Number(el.dataset.contar);
  if (reducirMovimiento || fin === 0) return;
  const inicio = performance.now();
  const duracion = 800;
  const paso = (t) => {
    const p = Math.min(1, (t - inicio) / duracion);
    el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

// Onda táctil estilo Material
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.pulsable');
  if (!el || el.disabled || reducirMovimiento) return;
  const r = el.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 2;
  const onda = document.createElement('span');
  onda.className = 'ripple';
  onda.style.width = `${d}px`;
  onda.style.height = `${d}px`;
  onda.style.left = `${e.clientX - r.left - d / 2}px`;
  onda.style.top = `${e.clientY - r.top - d / 2}px`;
  onda.addEventListener('animationend', () => onda.remove());
  el.appendChild(onda);
});

/* ---------- Hoja inferior ---------- */

const hoja = $('#hoja');

function abrirHoja(html) {
  $('#hoja-cuerpo').innerHTML = html;
  if (!hoja.open) {
    hoja.showModal();
    history.pushState({ hoja: true }, ''); // el botón Atrás de Android cierra la hoja
  }
}

function cerrarHoja() {
  if (!hoja.open) return;
  hoja.close();
  // Quita la entrada de historial que se añadió al abrir
  if (history.state && history.state.hoja) history.back();
}

// El botón Atrás de Android (o el gesto) cierra la hoja sin salir de la app
window.addEventListener('popstate', () => { if (hoja.open) hoja.close(); });
hoja.addEventListener('click', (e) => { if (e.target === hoja) cerrarHoja(); });
hoja.addEventListener('cancel', (e) => { e.preventDefault(); cerrarHoja(); }); // tecla Esc

function htmlHojaRegistrar() {
  const lista = estado.tareas.map((t) => `
    <button class="lista-item pulsable" data-accion="hecho" data-id="${t.id}">
      <span class="lead">${esc(t.icono)}</span>
      <span class="txt"><span class="tit">${esc(t.nombre)}</span></span>
      <span class="pts-chip">+${t.puntos}</span>
    </button>`).join('');
  return `
    <h2 id="hoja-titulo">¿Qué has hecho?</h2>
    <p class="sub">Elige la tarea. Otro miembro de la familia tendrá que confirmarla.</p>
    <div class="lista">${lista}</div>`;
}

function htmlHojaJugador() {
  const lista = estado.miembros.map((m) => `
    <button class="lista-item pulsable" data-accion="yo" data-id="${m.id}">
      <span class="lead">${esc(m.avatar)}</span>
      <span class="txt">
        <span class="tit">${esc(m.nombre)}</span>
        <span class="det">${m.rol === 'admin' ? 'Administrador' : 'Miembro'}</span>
      </span>
      <span>${m.id === estado.yo ? '✔' : ''}</span>
    </button>`).join('');
  return `
    <h2 id="hoja-titulo">¿Quién juega?</h2>
    <p class="sub">Modo demostración. En la versión real, cada persona tendrá su propia cuenta.</p>
    <div class="lista">${lista}</div>`;
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

function mensajePuesto(lista) {
  const i = lista.findIndex((m) => m.id === estado.yo);
  const yo = lista[i];
  if (lista[0].puntos === 0) {
    return { emoji: '🏁', titulo: 'En la parrilla de salida', texto: 'Nadie ha puntuado todavía. ¡Sé el primero!' };
  }
  if (i === 0) {
    const seg = lista[1];
    return {
      emoji: '👑',
      titulo: '¡Vas primero!',
      texto: seg ? `Le sacas ${yo.puntos - seg.puntos} puntos a ${seg.nombre}. ¡No te relajes!` : 'Estás solo en la cima.',
    };
  }
  const delante = lista[i - 1];
  const dif = delante.puntos - yo.puntos;
  return {
    emoji: dif === 0 ? '🤝' : '🏃',
    titulo: `Vas ${yo.posicion}.º`,
    texto: dif === 0
      ? `Empatas con ${delante.nombre}. ¡Un esfuerzo más!`
      : `Te faltan ${dif} puntos para alcanzar a ${delante.nombre}.`,
  };
}

function anillo(pct) {
  const c = 2 * Math.PI * 52;
  const off = c * (1 - pct / 100);
  return `
    <svg class="anillo" viewBox="0 0 120 120" role="img" aria-label="${pct}% del objetivo de la casa">
      <circle class="pista" cx="60" cy="60" r="52"/>
      <circle class="valor" cx="60" cy="60" r="52" style="--c:${c.toFixed(1)};--off:${off.toFixed(1)}"/>
    </svg>`;
}

function vistaRanking() {
  const lista = ranking();
  const total = lista.reduce((suma, m) => suma + m.puntos, 0);
  const pct = Math.min(100, Math.round((total / META_CASA) * 100));
  const lider = lista[0] && lista[0].puntos > 0 ? lista[0].puntos : 1;
  const medallas = ['🥇', '🥈', '🥉'];
  const puesto = mensajePuesto(lista);
  const t = infoTemporada();

  const columna = (m, i) => `
    <div class="podio-col pos${i + 1}">
      ${i === 0 && m.puntos > 0 ? '<span class="corona" aria-hidden="true">👑</span>' : ''}
      <div class="avatar grande">${esc(m.avatar)}</div>
      <strong>${esc(m.nombre)}</strong>
      <span class="puntos">${m.puntos} pts</span>
      <div class="escalon">${medallas[i]}</div>
    </div>`;

  // Orden visual del podio: 2.º, 1.º, 3.º
  const podio = [1, 0, 2].filter((i) => lista[i]).map((i) => columna(lista[i], i)).join('');

  const filas = lista.map((m) => `
    <div class="fila p${m.posicion}${m.id === estado.yo ? ' yo' : ''}">
      <span class="posbadge">${m.posicion}</span>
      <span class="avatar">${esc(m.avatar)}</span>
      <div>
        <div class="nombre">${esc(m.nombre)}${m.id === estado.yo ? '<span class="etiqueta-tu">tú</span>' : ''}</div>
        <div class="mini"><i style="width:${Math.round((m.puntos / lider) * 100)}%"></i></div>
      </div>
      <span class="pts">${m.puntos} pts</span>
    </div>`).join('');

  return `
    <section class="hero" aria-label="Puntos totales de la familia">
      <div class="anillo-wrap">
        ${anillo(pct)}
        <div class="centro"><span class="num" data-contar="${total}">${total}</span><small>puntos</small></div>
      </div>
      <div>
        <h2>Puntos de la familia</h2>
        <p>Objetivo de la casa: ${total} de ${META_CASA}</p>
        <div class="chips">
          <span class="chip">${pct}%</span>
          <span class="chip">⏳ ${t.diasRestantes} días</span>
        </div>
      </div>
    </section>

    <section class="card puesto">
      <span class="emoji" aria-hidden="true">${puesto.emoji}</span>
      <div><strong>${esc(puesto.titulo)}</strong><span>${esc(puesto.texto)}</span></div>
    </section>

    <section class="podio" aria-label="Podio">${podio}</section>

    <h2 class="titulo">Clasificación</h2>
    <section aria-label="Clasificación completa">${filas}</section>

    <section class="card cronica">
      <h2><span>🎙️ La crónica</span><span class="chip">Demo sin IA</span></h2>
      <p>${esc(cronica(lista))}</p>
    </section>`;
}

function vistaTareas() {
  const lista = estado.tareas.map((t) => `
    <div class="lista-item">
      <span class="lead">${esc(t.icono)}</span>
      <span class="txt">
        <span class="tit">${esc(t.nombre)}</span>
        <span class="det">+${t.puntos} puntos</span>
      </span>
      <button class="btn-tonal pulsable" data-accion="hecho" data-id="${t.id}">Hecho</button>
    </div>`).join('');

  const formulario = miembro(estado.yo).rol === 'admin' ? `
    <h2 class="titulo">Nueva tarea <span class="chip">Solo administradores</span></h2>
    <form class="card form-nueva" id="form-tarea">
      <label class="campo">Nombre de la tarea
        <input name="nombre" maxlength="40" required autocomplete="off">
      </label>
      <label class="campo">Puntos (1-100)
        <input name="puntos" type="number" inputmode="numeric" min="1" max="100" value="10" required>
      </label>
      <button class="btn pulsable" type="submit">Añadir tarea</button>
    </form>` : '';

  return `
    <div>
      <h2>Catálogo de tareas</h2>
      <p class="sub">Pulsa «Hecho» y otro miembro de la familia tendrá que confirmarlo.</p>
    </div>
    <section class="lista" aria-label="Catálogo de tareas">${lista}</section>
    ${formulario}`;
}

let subActividad = 'pendientes';

function vistaActividad() {
  const pendientes = pendientesParaMi();

  const segmentos = `
    <div class="segmentos" role="group" aria-label="Filtro de actividad">
      <button class="seg pulsable" data-accion="subvista" data-valor="pendientes" aria-pressed="${subActividad === 'pendientes'}">Por confirmar${pendientes.length ? ` (${pendientes.length})` : ''}</button>
      <button class="seg pulsable" data-accion="subvista" data-valor="historial" aria-pressed="${subActividad === 'historial'}">Historial</button>
    </div>`;

  if (subActividad === 'historial') {
    const historial = estado.registros
      .filter((r) => r.estado !== 'pendiente')
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 15)
      .map((r) => `
        <div class="lista-item">
          <span class="lead">${esc(r.icono)}</span>
          <span class="txt">
            <span class="tit">${esc(miembro(r.miembroId).nombre)}: ${esc(r.tareaNombre)}</span>
            <span class="det">${cuando(r.fecha)}</span>
          </span>
          ${r.estado === 'confirmada'
            ? `<span class="estado-ok">+${r.puntos}</span>`
            : '<span class="estado-no">rechazada</span>'}
        </div>`).join('');
    return `${segmentos}
      <section class="lista">${historial || '<div class="vacio"><span class="emoji">📭</span>Aún no hay movimientos.</div>'}</section>`;
  }

  const paraMi = pendientes.map((r) => `
    <div class="lista-item">
      <span class="lead">${esc(r.icono)}</span>
      <span class="txt">
        <span class="tit">${esc(miembro(r.miembroId).nombre)}: ${esc(r.tareaNombre)}</span>
        <span class="det">+${r.puntos} pts · ${cuando(r.fecha)}</span>
      </span>
      <span class="acciones">
        <button class="icon-btn ok pulsable" data-accion="confirmar" data-id="${r.id}" aria-label="Confirmar">✓</button>
        <button class="icon-btn no pulsable" data-accion="rechazar" data-id="${r.id}" aria-label="Rechazar">✕</button>
      </span>
    </div>`).join('');

  const mias = estado.registros
    .filter((r) => r.estado === 'pendiente' && r.miembroId === estado.yo)
    .map((r) => `
      <div class="lista-item">
        <span class="lead">${esc(r.icono)}</span>
        <span class="txt">
          <span class="tit">${esc(r.tareaNombre)}</span>
          <span class="det">${cuando(r.fecha)}</span>
        </span>
        <span class="chip">⏳ esperando</span>
      </div>`).join('');

  return `${segmentos}
    <section class="lista">${paraMi || '<div class="vacio"><span class="emoji">🎉</span>Nada pendiente. ¡Todos al día!</div>'}</section>
    ${mias ? `<h2 class="titulo">Tus envíos</h2><section class="lista">${mias}</section>` : ''}`;
}

function vistaPremios() {
  const monedas = monedasDe(estado.yo);
  const lista = estado.premios.map((p) => {
    const falta = p.coste - monedas;
    return `
      <div class="lista-item">
        <span class="lead">${esc(p.icono)}</span>
        <span class="txt">
          <span class="tit">${esc(p.nombre)}</span>
          <span class="det">${p.coste} monedas${falta > 0 ? ` · te faltan ${falta}` : ''}</span>
          ${falta > 0 ? `<span class="barra"><i style="width:${Math.max(4, Math.round((monedas / p.coste) * 100))}%"></i></span>` : ''}
        </span>
        <button class="btn pulsable" data-accion="canjear" data-id="${p.id}" ${falta > 0 ? 'disabled' : ''}>Canjear</button>
      </div>`;
  }).join('');

  const mios = estado.canjes
    .filter((c) => c.miembroId === estado.yo)
    .slice(-5)
    .reverse()
    .map((c) => `
      <div class="lista-item">
        <span class="lead">🎁</span>
        <span class="txt">
          <span class="tit">${esc(c.premioNombre)}</span>
          <span class="det">${cuando(c.fecha)}</span>
        </span>
        <span class="det">−${c.coste}</span>
      </div>`).join('');

  return `
    <section class="card monedero">
      <div>
        <div class="sub" style="color:inherit">Tus monedas</div>
        <div class="num" data-contar="${monedas}">${monedas}</div>
      </div>
      <span class="moneda" aria-hidden="true">🪙</span>
    </section>
    <p class="sub">Tus puntos ganados son tus monedas. Canjear un premio las gasta, pero no te baja en el ranking.</p>
    <section class="lista" aria-label="Premios">${lista}</section>
    ${mios ? `<h2 class="titulo">Tus canjes</h2><section class="lista">${mios}</section>` : ''}`;
}

function medallasDe(id, lider) {
  const n = confirmadasDe(id).length;
  const racha = rachaDe(id);
  const banos = confirmadasDe(id).filter((r) => /baño/i.test(r.tareaNombre)).length;
  const cenas = confirmadasDe(id).filter((r) => /cocinar/i.test(r.tareaNombre)).length;
  return [
    { icono: '🥇', nombre: 'Líder de la liga', pista: 'Ponte primero en el ranking', ok: lider },
    { icono: '🌟', nombre: 'Primera tarea', pista: 'Completa tu primera tarea', ok: n >= 1 },
    { icono: '💪', nombre: 'Imparable', pista: 'Completa 5 tareas', ok: n >= 5 },
    { icono: '🔥', nombre: 'Racha de 3', pista: '3 días seguidos puntuando', ok: racha >= 3 },
    { icono: '🧼', nombre: 'Maestro del baño', pista: 'Limpia el baño 2 veces', ok: banos >= 2 },
    { icono: '🍳', nombre: 'Cocinillas', pista: 'Cocina la cena 2 veces', ok: cenas >= 2 },
  ];
}

// Evento que Chrome en Android lanza cuando la web se puede instalar
let instalador = null;

function tarjetaInstalar() {
  if (esStandalone()) return '';
  return `
    <section class="card instalar">
      <h2>📲 Instálala en tu móvil</h2>
      <p>${instalador
        ? 'Añádela a la pantalla de inicio y ábrela como una app, también sin conexión.'
        : 'En Chrome para Android: menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».'}</p>
      ${instalador ? '<button class="btn pulsable" data-accion="instalar">Instalar app</button>' : ''}
    </section>`;
}

function vistaPerfil() {
  const yo = miembro(estado.yo);
  const lista = ranking();
  const puntos = puntosDe(yo.id);
  const nivel = nivelDe(puntos);
  const esLider = lista[0].id === yo.id && lista[0].puntos > 0;
  const medallas = medallasDe(yo.id, esLider).map((m) => `
    <div class="medalla${m.ok ? '' : ' bloqueada'}">
      <div class="ico">${m.icono}</div>
      <strong>${esc(m.nombre)}</strong>
      <small>${m.ok ? '¡Conseguida!' : esc(m.pista)}</small>
    </div>`).join('');

  return `
    <section class="card perfil">
      <div class="avatar grande">${esc(yo.avatar)}</div>
      <h2>${esc(yo.nombre)}</h2>
      <span class="sub" style="color:inherit">${yo.rol === 'admin' ? 'Administrador del hogar' : 'Miembro del hogar'}</span>
      <div class="nivel">
        <div class="det" style="color:inherit"><strong>Nivel ${nivel.numero}</strong> · ${esc(nivel.titulo)}</div>
        <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${nivel.pct}" aria-label="Progreso de nivel"><i style="width:${nivel.pct}%"></i></div>
        <div class="det" style="color:inherit">${nivel.siguiente ? `${nivel.siguiente - puntos} puntos para el siguiente nivel` : '¡Nivel máximo!'}</div>
      </div>
    </section>

    <section class="stats">
      <div class="card"><strong>${puntos}</strong><span>puntos</span></div>
      <div class="card"><strong>${confirmadasDe(yo.id).length}</strong><span>tareas</span></div>
      <div class="card"><strong>${rachaDe(yo.id)}🔥</strong><span>racha (días)</span></div>
    </section>

    <h2 class="titulo">Medallas</h2>
    <section class="medallas">${medallas}</section>

    ${tarjetaInstalar()}

    <h2 class="titulo">Modo demostración</h2>
    <section class="card" style="display:grid;gap:12px">
      <button class="btn-tonal pulsable" data-accion="jugador">Cambiar de jugador</button>
      <button class="btn-tonal pulsable" data-accion="reiniciar">Reiniciar datos de demo</button>
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

const VISTAS_CON_FAB = ['ranking', 'actividad', 'premios'];
const contenedor = $('#vista');
let actual = 'ranking';

function actualizarMarco() {
  const t = infoTemporada();
  $('#temporada').textContent = `${t.nombre} · quedan ${t.diasRestantes} días`;
  $('#btn-jugador').textContent = miembro(estado.yo).avatar;

  document.querySelectorAll('.nav-item').forEach((a) => {
    if (a.dataset.vista === actual) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  const n = pendientesParaMi().length;
  const badge = $('#badge-actividad');
  badge.textContent = n;
  badge.hidden = n === 0;

  const conFab = VISTAS_CON_FAB.includes(actual);
  $('#fab').hidden = !conFab;
}

function pintar(animar = false) {
  contenedor.innerHTML = VISTAS[actual]();
  contenedor.classList.remove('entra');
  if (animar && !reducirMovimiento) {
    void contenedor.offsetWidth; // reinicia la animación de entrada
    contenedor.classList.add('entra');
  }
  contenedor.querySelectorAll('[data-contar]').forEach(animarNumero);
  actualizarMarco();
}

function ir() {
  const hash = location.hash.slice(1);
  actual = VISTAS[hash] ? hash : 'ranking';
  pintar(true);
  window.scrollTo(0, 0);
  contenedor.focus({ preventScroll: true });
}

// Cambiar de pestaña sin llenar el historial: Atrás sale de la app, como en Android
document.querySelector('.navbar').addEventListener('click', (e) => {
  const a = e.target.closest('.nav-item');
  if (!a) return;
  e.preventDefault();
  vibrar(8);
  const destino = a.getAttribute('href');
  if (location.hash === destino) window.scrollTo({ top: 0, behavior: 'smooth' });
  else location.replace(destino);
});

window.addEventListener('hashchange', ir);

// La barra superior cambia de tono al hacer scroll
window.addEventListener('scroll', () => {
  $('#appbar').classList.toggle('elevada', window.scrollY > 4);
}, { passive: true });

/* ---------- Acciones ---------- */

function refrescar(animar = false) {
  guardar();
  pintar(animar);
}

document.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;
  const id = Number(boton.dataset.id);

  switch (boton.dataset.accion) {
    case 'registrar':
      abrirHoja(htmlHojaRegistrar());
      return;

    case 'jugador':
      abrirHoja(htmlHojaJugador());
      return;

    case 'hecho': {
      const t = estado.tareas.find((x) => x.id === id);
      if (!t) return;
      const reg = {
        id: siguienteId(estado.registros), tareaId: t.id, tareaNombre: t.nombre, icono: t.icono,
        puntos: t.puntos, miembroId: estado.yo, fecha: new Date().toISOString(),
        estado: 'pendiente', confirmadoPor: null,
      };
      estado.registros.push(reg);
      cerrarHoja();
      vibrar(15);
      aviso(`«${t.nombre}» enviada. Falta que otro la confirme.`, () => {
        estado.registros = estado.registros.filter((r) => r.id !== reg.id);
      });
      break;
    }

    case 'confirmar':
    case 'rechazar': {
      const r = estado.registros.find((x) => x.id === id);
      if (!r || r.estado !== 'pendiente' || r.miembroId === estado.yo) return;
      const confirma = boton.dataset.accion === 'confirmar';
      r.estado = confirma ? 'confirmada' : 'rechazada';
      r.confirmadoPor = estado.yo;
      vibrar(confirma ? [10, 40, 10] : 20);
      if (confirma) confeti();
      aviso(
        confirma ? `+${r.puntos} puntos para ${miembro(r.miembroId).nombre}` : 'Tarea rechazada',
        () => { r.estado = 'pendiente'; r.confirmadoPor = null; }
      );
      break;
    }

    case 'canjear': {
      const p = estado.premios.find((x) => x.id === id);
      if (!p || monedasDe(estado.yo) < p.coste) return;
      const canje = {
        id: siguienteId(estado.canjes), premioId: p.id, premioNombre: p.nombre, coste: p.coste,
        miembroId: estado.yo, fecha: new Date().toISOString(),
      };
      estado.canjes.push(canje);
      vibrar([10, 40, 10]);
      confeti();
      aviso(`Canjeado: ${p.nombre}`, () => {
        estado.canjes = estado.canjes.filter((c) => c.id !== canje.id);
      });
      break;
    }

    case 'yo':
      estado.yo = id;
      cerrarHoja();
      aviso(`Ahora juegas como ${miembro(id).nombre}`);
      break;

    case 'subvista':
      subActividad = boton.dataset.valor;
      pintar();
      return;

    case 'deshacer':
      if (accionDeshacer) {
        accionDeshacer();
        accionDeshacer = null;
        $('#snackbar').classList.remove('visible');
        vibrar(10);
        refrescar();
        aviso('Deshecho');
      }
      return;

    case 'instalar':
      if (instalador) {
        instalador.prompt();
        instalador.userChoice.finally(() => { instalador = null; pintar(); });
      }
      return;

    case 'reiniciar':
      if (!window.confirm('¿Reiniciar todos los datos de demostración?')) return;
      estado = crearDatosDemo();
      aviso('Datos de demostración restaurados.');
      break;

    default:
      return;
  }
  refrescar();
});

document.addEventListener('submit', (e) => {
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
  refrescar();
  aviso(`Tarea añadida: ${nombre}`);
});

/* ---------- Instalación como app (PWA) ---------- */

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  instalador = e;
  if (actual === 'perfil') pintar();
});

window.addEventListener('appinstalled', () => {
  instalador = null;
  aviso('¡App instalada!');
  if (actual === 'perfil') pintar();
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo offline */ });
}

ir();
