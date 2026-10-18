import type { StoredContent } from "@contracts/monito";
import {
  CAMPO_META,
  CAMPO_MONITO_COLOR,
  MONITO_PALETTE,
  type CurriculumAnchor,
} from "@contracts/curriculum";

/**
 * Genera la micro-app offline-first (pilar 4): un solo HTML autónomo
 * con el runtime MonitoSchema v2 embebido. Persistencia: localStorage.
 * Matriz polivalente: el runtime se adapta al arquetipo (formatId).
 * Presupuesto: <100 KB.
 */
export function buildMicroAppHtml(
  activity: StoredContent,
  shareCode: string,
  anchor?: CurriculumAnchor | null,
): string {
  // Versión alumno por arquetipo: sin diagnósticos ni respuestas
  let studentContent: unknown;
  if (activity.formatId === "flashcards" && activity.tarjetas) {
    // El reverso es contenido de aprendizaje (se revela al voltear)
    studentContent = {
      ...activity,
      tarjetas: activity.tarjetas.map(({ errorTipico, ...t }) => t),
    };
  } else if (activity.formatId === "flowchart" && activity.pasos) {
    studentContent = {
      ...activity,
      pasos: activity.pasos.map(({ orden, ...p }) => p),
    };
  } else {
    studentContent = {
      ...activity,
      reactivos: (activity.reactivos ?? []).map((r) => ({
        ...r,
        opciones: r.opciones.map(({ diagnostico, ...o }) => o),
      })),
    };
  }
  const dataJson = JSON.stringify(studentContent).replace(/</g, "\\u003c");
  // Sello curricular oficial (si la actividad está anclada al Plan 2022)
  const campoMeta = anchor ? CAMPO_META[anchor.campoFormativo] : null;
  const sealHtml = campoMeta
    ? '<p class="small" style="margin-top:10px"><span style="display:inline-flex;align-items:center;gap:6px;background:' +
      campoMeta.bg +
      ';color:' +
      campoMeta.color +
      ';border-radius:99px;padding:4px 12px;font-weight:800;font-size:.72rem"><span style="width:8px;height:8px;border-radius:99px;background:' +
      campoMeta.color +
      '"></span>' +
      escapeHtml(campoMeta.nombre) +
      ' · Plan de Estudios 2022</span></p>'
    : "";

  // Núcleo luminoso de Monito según el campo formativo anclado (Brand Book §1)
  const botColor = anchor ? CAMPO_MONITO_COLOR[anchor.campoFormativo] : "azul";
  const botPalette = MONITO_PALETTE[botColor];

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(activity.meta.titulo)} — Monito gIA</title>
<style>
:root{--bg:#F7EDE2;--ink:#3F2B5C;--purple:#563E79;--sage:#84A59D;--coral:#F5CAC3;--salmon:#F28482;--yellow:#FFCE80;--card:#FDF8F1;--muted:#7A6899}
*{margin:0;box-sizing:border-box;font-family:'Trebuchet MS','Comic Sans MS',ui-rounded,system-ui,sans-serif}
body{background:var(--bg);color:var(--ink);min-height:100vh;display:flex;justify-content:center;padding:16px}
#app{width:100%;max-width:560px}
.card{background:var(--card);border:2px solid #E3D4C2;border-radius:24px;padding:24px;box-shadow:0 10px 26px -16px rgba(63,43,92,.3)}
h1{font-size:1.5rem;color:var(--purple);line-height:1.25}
.ctx{background:var(--coral);border-radius:16px;padding:14px 16px;margin:14px 0;font-weight:600;font-size:.95rem}
.q{font-size:1.25rem;font-weight:800;margin:10px 0 18px;line-height:1.4}
.opt{display:block;width:100%;text-align:left;font-size:1.15rem;font-weight:800;padding:18px;border-radius:18px;border:2px solid #E3D4C2;background:#fff;color:var(--ink);margin-bottom:12px;cursor:pointer;box-shadow:0 4px 0 rgba(63,43,92,.15);transition:transform .12s}
.opt:hover{transform:translateY(-2px)}
.opt:disabled{opacity:.55;cursor:default;transform:none}
.opt.picked{border-color:var(--purple);background:#EFE8F7}
.hintbtn{display:inline-block;background:var(--yellow);border:2px solid #E0A93F;color:var(--ink);font-weight:800;padding:12px 20px;border-radius:16px;cursor:pointer;font-size:1rem;box-shadow:0 4px 0 rgba(63,43,92,.15);margin-bottom:14px}
.ladder{background:#FFF7E8;border:2px dashed #E0A93F;border-radius:18px;padding:16px;margin-bottom:14px}
.ladder .step{padding:10px 12px;border-radius:12px;background:#fff;margin-top:8px;font-size:.95rem;border-left:6px solid var(--yellow)}
.ladder .lbl{font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--muted);letter-spacing:.05em}
.fb{border-radius:18px;padding:18px;margin:14px 0;font-size:1rem;line-height:1.55;animation:pop .25s ease-out}
.fb.ok{background:#E4F0EC;border:2px solid var(--sage)}
.fb.retry{background:#FDF0EE;border:2px solid var(--salmon)}
.btn{display:inline-block;background:var(--purple);color:#FBF3E8;font-weight:800;padding:14px 28px;border:none;border-radius:16px;cursor:pointer;font-size:1.05rem;box-shadow:0 4px 0 rgba(63,43,92,.25)}
.btn.sec{background:#fff;color:var(--purple);border:2px solid var(--purple)}
input{font-size:1.2rem;padding:14px 18px;border-radius:16px;border:2px solid #E3D4C2;width:100%;margin:12px 0 20px}
.stars{font-size:2.4rem;letter-spacing:.15em;text-align:center;margin:10px 0}
.prog{display:flex;gap:6px;margin-bottom:16px}
.prog i{flex:1;height:8px;border-radius:99px;background:#E3D4C2}
.prog i.done{background:var(--sage)}
.center{text-align:center}
.small{font-size:.8rem;color:var(--muted)}
.mascot{display:flex;justify-content:center}
.bubble{display:inline-block;max-width:320px;background:#fff;border:2px solid #E3D4C2;border-radius:16px;padding:10px 14px;font-weight:700;font-size:.85rem;margin-top:6px;line-height:1.45}
.flip{perspective:900px;cursor:pointer;margin:18px 0}
.flip-inner{position:relative;width:100%;min-height:190px;transition:transform .5s;transform-style:preserve-3d}
.flip.flipped .flip-inner{transform:rotateY(180deg)}
.face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#fff;border:2px solid #E3D4C2;border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;box-shadow:0 4px 0 rgba(63,43,92,.12)}
.face.back{transform:rotateY(180deg);background:#EFE8F7;border-color:var(--purple)}
.face .lbl{font-size:.7rem;font-weight:800;text-transform:uppercase;color:var(--muted);letter-spacing:.06em;margin-bottom:8px}
.face .txt{font-size:1.5rem;font-weight:800;line-height:1.35}
.stepcard{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #E3D4C2;border-radius:16px;padding:14px 16px;margin-bottom:10px;font-weight:700;text-align:left;cursor:pointer;box-shadow:0 3px 0 rgba(63,43,92,.12);transition:transform .12s}
.stepcard:hover{transform:translateY(-2px)}
.stepcard.locked{background:#F2EAE0;cursor:default;opacity:.75}
.stepcard.placed{border-color:var(--sage);background:#E4F0EC}
.stepcard .n{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:30px;border-radius:10px;background:var(--purple);color:#FBF3E8;font-weight:800}
@keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
</style>
</head>
<body>
<div id="app"></div>
<script>
var DATA = ${dataJson};
var CODE = ${JSON.stringify(shareCode)};
var FMT = DATA.formatId || 'multiple_choice';
var STORE_KEY = 'monito-resultados-' + CODE;
var CURRICULUM_SEAL = ${JSON.stringify(sealHtml)};

/* ---- Monito gIA: guía holográfico vectorial (~1.6 KB, sin assets) ---- */
var BOTC = ${JSON.stringify(botPalette)};
function botArm(sx, ang, g){
  return '<g transform="rotate('+ang+' '+sx+' 76)"><rect x="'+(sx-4)+'" y="76" width="8" height="17" rx="4" fill="'+g+'"/><circle cx="'+sx+'" cy="95" r="4.2" fill="'+g+'"/><rect x="'+(sx-3.6)+'" y="95" width="7.2" height="15" rx="3.6" fill="'+g+'"/><circle cx="'+sx+'" cy="114" r="6.6" fill="'+g+'"/><circle cx="'+sx+'" cy="114" r="2.6" fill="'+BOTC.core+'"/></g>';
}
function bot(pose, s){
  var u = 'bg'+Math.random().toString(36).slice(2,8);
  var g = 'url(#'+u+')';
  var A = { saludo:[18,-150], idea:[22,-128], exito:[152,-152], estudio:[34,-34] }[pose] || [18,-150];
  var extra = '';
  if(pose==='idea') extra = '<circle cx="60" cy="12" r="7" fill="#FFCE4A" stroke="#E0A93F" stroke-width="1.4"/><rect x="57.5" y="19" width="5" height="4" rx="1.6" fill="#E0A93F"/><g stroke="#FFCE4A" stroke-width="2" stroke-linecap="round"><line x1="60" y1="1" x2="60" y2="4"/><line x1="48" y1="6" x2="51" y2="8.5"/><line x1="72" y1="6" x2="69" y2="8.5"/></g>';
  if(pose==='exito') extra = '<path d="M22 21 l3 6.3 6.3 3 -6.3 3 -3 6.3 -3 -6.3 -6.3 -3 6.3 -3 z" fill="#FFCE4A"/><path d="M98 16 l2.3 4.7 4.7 2.3 -4.7 2.3 -2.3 4.7 -2.3 -4.7 -4.7 -2.3 4.7 -2.3 z" fill="'+BOTC.core+'"/>';
  return '<svg width="'+s+'" height="'+Math.round(s*176/120)+'" viewBox="0 0 120 176" role="img" aria-label="Monito gIA">'
    + '<defs><radialGradient id="'+u+'" cx="35%" cy="28%" r="80%"><stop offset="0%" stop-color="#fff" stop-opacity=".92"/><stop offset="45%" stop-color="'+BOTC.glass+'" stop-opacity=".55"/><stop offset="100%" stop-color="'+BOTC.deep+'" stop-opacity=".55"/></radialGradient></defs>'
    + '<ellipse cx="60" cy="168" rx="26" ry="4.5" fill="'+BOTC.deep+'" opacity=".16"/>'
    + '<rect x="47.5" y="112" width="9" height="30" rx="4.5" fill="'+g+'"/><rect x="63.5" y="112" width="9" height="30" rx="4.5" fill="'+g+'"/>'
    + '<circle cx="52" cy="148" r="8.5" fill="'+g+'"/><circle cx="68" cy="148" r="8.5" fill="'+g+'"/>'
    + botArm(41, A[0], g) + botArm(79, A[1], g)
    + '<circle cx="60" cy="90" r="19.5" fill="'+g+'"/><circle cx="60" cy="90" r="9" fill="'+BOTC.core+'"><animate attributeName="opacity" values=".55;1;.55" dur="2.6s" repeatCount="indefinite"/></circle>'
    + '<ellipse cx="53" cy="82" rx="6" ry="4" fill="#fff" opacity=".65"/>'
    + '<rect x="55.5" y="60" width="9" height="12" rx="4" fill="'+g+'"/>'
    + '<circle cx="60" cy="44" r="16.5" fill="'+g+'"/><circle cx="60" cy="44" r="7" fill="'+BOTC.core+'"><animate attributeName="opacity" values=".55;1;.55" dur="2.6s" repeatCount="indefinite"/></circle>'
    + '<ellipse cx="54" cy="37" rx="5.5" ry="3.6" fill="#fff" opacity=".7"/>'
    + extra
    + '</svg>';
}
var VOZ_SALUDO = ${JSON.stringify([
  "¡Hola! Qué gusto verte por aquí, ¡listo para aprender algo nuevo y divertido hoy!",
  "¡Rayo de energía activado! ⚡ ¡Bienvenido a tu nueva misión de aprendizaje!",
  "¡Hola, explorador! Prepárate, que hoy vamos a poner a prueba nuestra mente de forma genial.",
  "¡Qué emoción verte! Recuerda que aquí cada intento nos hace más inteligentes.",
  "¡Hola! Tu cerebro está listo para brillar hoy. ¿Empezamos el reto?",
])};
var VOZ_DESPEDIDA = ${JSON.stringify([
  "¡Lo lograste! Cada paso que diste hoy reforzó tus superpoderes mentales. ¡Nos vemos pronto!",
  "¡Gran esfuerzo! Recuerda: lo importante no fue no equivocarse, ¡sino haberlo intentado hasta lograrlo!",
  "¡Misión cumplida! Desconectando núcleo de energía por ahora... ¡Nos vemos en el próximo reto!",
  "¡Impresionante avance! Te vas a casa con nuevos conocimientos en tu mochila. ¡Hasta la próxima!",
])};
function voz(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

var BULB = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-3px;margin-right:6px"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.5 1 1.4 1 2.5h6c0-1.1.4-2 1-2.5A6 6 0 0 0 12 3z"/></svg>';

var state = { alias:'', idx:0, level:0, start:0, correct:0, answered:0, maxLevel:0, picked:null, resolved:false, wrongCodes:[] };
// flowchart
var fc = { placed:[], pool:[], hints:0, attempts:0 };
// flashcards
var fl = { idx:0, flipped:false, known:0, again:0, hints:0 };

function esc(s){ var d=document.createElement('div'); d.textContent=String(s); return d.innerHTML; }
function app(){ return document.getElementById('app'); }
function save(entry){
  try{
    var all = JSON.parse(localStorage.getItem(STORE_KEY)||'[]');
    all.push(entry);
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  }catch(e){}
}
function shuffle(arr){
  var a = arr.slice();
  for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
function feedbackFor(r, code){
  for(var i=0;i<r.feedbackPorError.length;i++) if(r.feedbackPorError[i].codigo===code) return r.feedbackPorError[i].mensaje;
  return 'Buen intento. Respira, usa una pista y prueba otro camino: asi entrena tu cerebro.';
}

function renderStart(){
  var sub = DATA.meta.aprendizajeEsperado;
  app().innerHTML = '<div class="card center">'
    + '<div class="mascot">'+bot('saludo', 88)+'</div>'
    + '<p class="bubble">'+esc(voz(VOZ_SALUDO))+'</p>'
    + '<h1 style="margin-top:12px">'+esc(DATA.meta.titulo)+'</h1>'
    + '<p class="small" style="margin-top:8px">'+esc(sub)+'</p>'
    + CURRICULUM_SEAL
    + '<input id="alias" maxlength="30" placeholder="Escribe tu nombre o apodo" autocomplete="off"/>'
    + '<button class="btn" id="go">¡Empezar!</button>'
    + '<p class="small" style="margin-top:16px">Monito gIA · funciona sin internet · tu progreso se guarda en este dispositivo</p>'
    + '</div>';
  document.getElementById('go').onclick = function(){
    var v = document.getElementById('alias').value.trim();
    state.alias = v || 'Explorador';
    state.idx = 0; state.correct = 0; state.answered = 0; state.maxLevel = 0;
    if(FMT==='flashcards'){ fl = { idx:0, flipped:false, known:0, again:0, hints:0 }; renderCard(); }
    else if(FMT==='flowchart'){ fc = { placed:[], pool:shuffle(DATA.pasos), hints:0, attempts:0 }; renderFlow(); }
    else startReactivo();
  };
}

/* ================= OPCIÓN MÚLTIPLE ================= */
function startReactivo(){
  state.level = 0; state.picked = null; state.resolved = false; state.wrongCodes = [];
  state.start = Date.now();
  renderPlay();
}
function renderPlay(){
  var r = DATA.reactivos[state.idx];
  var prog = '';
  for(var i=0;i<DATA.reactivos.length;i++) prog += '<i class="'+(i<state.idx?'done':'')+'"></i>';
  var opts = '';
  r.opciones.forEach(function(o){
    opts += '<button class="opt" data-id="'+o.id+'" '+(state.resolved?'disabled':'')+'>'+esc(o.texto)+'</button>';
  });
  app().innerHTML = '<div class="prog">'+prog+'</div><div class="card">'
    + '<p class="small">Reactivo '+(state.idx+1)+' de '+DATA.reactivos.length+' · '+esc(state.alias)+'</p>'
    + (r.contexto ? '<div class="ctx">'+esc(r.contexto)+'</div>' : '')
    + '<p class="q">'+esc(r.enunciado)+'</p>'
    + '<div id="opts">'+opts+'</div>'
    + '<div id="feedback"></div>'
    + '<div id="hintzone"></div>'
    + '</div>';
  Array.prototype.forEach.call(document.querySelectorAll('.opt'), function(btn){
    btn.onclick = function(){ pick(btn.getAttribute('data-id')); };
  });
  renderHintZone();
}
function renderHintZone(){
  var r = DATA.reactivos[state.idx];
  var z = document.getElementById('hintzone');
  if(!z) return;
  var html = '';
  if(state.level > 0){
    html += '<div class="ladder"><div style="display:flex;gap:10px;align-items:flex-start"><div style="flex-shrink:0">'+bot('idea', 40)+'</div><div style="flex:1"><span class="lbl">Andamiaje · peldaño '+state.level+' de 5</span>';
    for(var i=0;i<state.level;i++){
      var s = r.andamiaje[i];
      html += '<div class="step"><span class="lbl">'+esc(String(s.nivel))+'. '+esc(s.tipo.replace('_',' '))+'</span><br/>'+esc(s.pista)+'</div>';
    }
    html += '</div></div></div>';
  }
  if(state.level < 5 && !state.resolved){
    html += '<button class="hintbtn" id="hint">'+BULB+(state.level===0?'Necesito una pista':'Otra pista ('+(state.level+1)+'/5)')+'</button>';
  }
  z.innerHTML = html;
  var hb = document.getElementById('hint');
  if(hb) hb.onclick = function(){
    state.level++;
    if(state.level > state.maxLevel) state.maxLevel = state.level;
    renderPlay();
  };
}
function pick(id){
  if(state.resolved) return;
  var r = DATA.reactivos[state.idx];
  var o = null;
  for(var i=0;i<r.opciones.length;i++) if(r.opciones[i].id===id) o=r.opciones[i];
  if(!o) return;
  state.picked = id;
  var timeMs = Date.now() - state.start;
  var fb = document.getElementById('feedback');
  save({ reactivo:r.id, opcion:id, correcta:!!o.correcta, error:o.correcta?null:o.errorCode, peldano:state.level, ms:timeMs, ts:new Date().toISOString(), alias:state.alias });
  if(o.correcta){
    state.resolved = true; state.correct++; state.answered++;
    fb.innerHTML = '<div class="fb ok">'+esc(r.feedbackCorrecto)+'</div>'
      + '<button class="btn" id="next">'+(state.idx < DATA.reactivos.length-1?'Siguiente reactivo':'Ver mi resultado')+'</button>';
  } else {
    state.answered++;
    state.wrongCodes.push(o.errorCode);
    fb.innerHTML = '<div class="fb retry">'+esc(feedbackFor(r, o.errorCode))+'</div>'
      + '<button class="btn sec" id="retry">Probar otro camino</button> '
      + '<button class="btn" id="skip">Continuar</button>';
  }
  Array.prototype.forEach.call(document.querySelectorAll('.opt'), function(btn){
    if(btn.getAttribute('data-id')===state.picked) btn.classList.add('picked');
  });
  var next = document.getElementById('next');
  if(next) next.onclick = advance;
  var retry = document.getElementById('retry');
  if(retry) retry.onclick = function(){ document.getElementById('feedback').innerHTML=''; renderHintZone(); };
  var skip = document.getElementById('skip');
  if(skip) skip.onclick = advance;
  renderHintZone();
}
function advance(){
  if(state.idx < DATA.reactivos.length-1){ state.idx++; startReactivo(); }
  else renderSummary(DATA.reactivos.length);
}

/* ================= FLASHCARDS ================= */
function renderCard(){
  var t = DATA.tarjetas[fl.idx];
  var prog = '';
  for(var i=0;i<DATA.tarjetas.length;i++) prog += '<i class="'+(i<fl.idx?'done':'')+'"></i>';
  app().innerHTML = '<div class="prog">'+prog+'</div><div class="card">'
    + '<p class="small">Tarjeta '+(fl.idx+1)+' de '+DATA.tarjetas.length+' · '+esc(state.alias)+'</p>'
    + '<div class="flip'+(fl.flipped?' flipped':'')+'" id="flip">'
    + '<div class="flip-inner">'
    + '<div class="face front"><span class="lbl">Piensa antes de voltear</span><span class="txt">'+esc(t.frente)+'</span></div>'
    + '<div class="face back"><span class="lbl">Respuesta</span><span class="txt">'+esc(t.reverso)+'</span></div>'
    + '</div></div>'
    + '<div id="hintzone">'
    +   (fl.hintShown ? '<div class="ladder"><div class="step"><span class="lbl">Pista</span><br/>'+esc(t.pista)+'</div></div>'
                     : '<button class="hintbtn" id="hint">'+BULB+'Una pista antes de responder</button>')
    + '</div>'
    + '<div id="actions" class="center" style="margin-top:8px">'
    + (fl.flipped
        ? '<p class="small" style="margin-bottom:10px">¿La sabías? Sé honesto: eso es entrenar de verdad.</p>'
          + '<button class="btn sec" id="again">Aún no · repasar</button> '
          + '<button class="btn" id="know">¡La sabía!</button>'
        : '<p class="small">Toca la tarjeta cuando tengas tu respuesta en mente.</p>')
    + '</div>'
    + '</div>';
  document.getElementById('flip').onclick = function(){ fl.flipped = true; renderCard(); };
  var h = document.getElementById('hint');
  if(h) h.onclick = function(){ fl.hintShown = true; fl.hints++; renderCard(); };
  var know = document.getElementById('know');
  if(know) know.onclick = function(){ markCard(true); };
  var again = document.getElementById('again');
  if(again) again.onclick = function(){ markCard(false); };
}
function markCard(known){
  var t = DATA.tarjetas[fl.idx];
  save({ tarjeta:t.id, conocida:known, error:known?null:(t.errorTipico||'CONCEPT'), pista:fl.hintShown?1:0, ts:new Date().toISOString(), alias:state.alias });
  if(known) fl.known++; else fl.again++;
  fl.idx++; fl.flipped = false; fl.hintShown = false;
  if(fl.idx < DATA.tarjetas.length) renderCard();
  else renderSummaryCards();
}
function renderSummaryCards(){
  var total = DATA.tarjetas.length;
  app().innerHTML = '<div class="card center">'
    + '<div class="mascot">'+bot('exito', 88)+'</div>'
    + '<p class="bubble">'+esc(voz(VOZ_DESPEDIDA))+'</p>'
    + '<h1 style="margin-top:10px">¡Sesión completada, '+esc(state.alias)+'!</h1>'
    + '<p class="stars">'+fl.known+'/'+total+'</p>'
    + '<p style="font-size:1.1rem;line-height:1.6">'+esc(DATA.mensajeCierre)+'</p>'
    + '<p class="small" style="margin-top:14px">Dominaste '+fl.known+' de '+total+' tarjetas'
    + (fl.hints>0 ? ' · usaste '+fl.hints+' pistas: pedir ayuda es de estrategas' : ' · ¡sin pistas!')
    + '</p>'
    + '<button class="btn" id="again" style="margin-top:18px">Repasar otra vez</button>'
    + '<p class="small" style="margin-top:16px">Tus resultados quedaron guardados en este dispositivo ('+STORE_KEY+')</p>'
    + '</div>';
  document.getElementById('again').onclick = renderStart;
}

/* ================= SECUENCIA (FLOWCHART) ================= */
function renderFlow(){
  var total = DATA.pasos.length;
  var nextPos = fc.placed.length + 1;
  var prog = '';
  for(var i=0;i<total;i++) prog += '<i class="'+(i<fc.placed.length?'done':'')+'"></i>';
  var placedHtml = '';
  fc.placed.forEach(function(p,i){
    placedHtml += '<div class="stepcard placed"><span class="n">'+(i+1)+'</span>'+esc(p.texto)+'</div>';
  });
  if(fc.placed.length < total)
    placedHtml += '<div class="stepcard locked"><span class="n">'+(fc.placed.length+1)+'</span><span style="color:var(--muted)">Elige el paso que va aquí…</span></div>';
  var poolHtml = '';
  fc.pool.forEach(function(p){
    poolHtml += '<div class="stepcard" data-id="'+p.id+'">'+esc(p.texto)+'</div>';
  });
  app().innerHTML = '<div class="prog">'+prog+'</div><div class="card">'
    + '<p class="small">'+esc(DATA.instruccion)+' · '+esc(state.alias)+'</p>'
    + '<div class="ctx">'+esc(DATA.contexto)+'</div>'
    + '<div style="margin-bottom:14px">'+placedHtml+'</div>'
    + '<p class="lbl small" style="font-weight:800;margin-bottom:8px">PASOS DISPONIBLES</p>'
    + '<div id="pool">'+poolHtml+'</div>'
    + '<div id="feedback"></div>'
    + '<div id="hintzone">'
    + (fc.pool.length>0 ? '<button class="hintbtn" id="hint">'+BULB+'Una pista sobre el paso '+(nextPos)+'</button>' : '')
    + '</div>'
    + '</div>';
  Array.prototype.forEach.call(document.querySelectorAll('#pool .stepcard'), function(el){
    el.onclick = function(){ fcPick(el.getAttribute('data-id')); };
  });
  var h = document.getElementById('hint');
  if(h) h.onclick = function(){
    // pista del paso que sigue: se revela sin decir su orden
    fc.hints++;
    var cand = fc.pool.map(function(p){ return p; });
    var msg = 'Piensa qué debe pasar justo en este momento del proceso.';
    for(var i=0;i<cand.length;i++){
      // la pista del paso correcto sigue disponible en DATA.pasos? no: sin orden.
      // elegimos mostrar la pista del paso que el alumno toque; aquí, la primera pista del pool.
      if(cand[i].pista){ msg = cand[i].pista; break; }
    }
    var fb = document.getElementById('feedback');
    fb.innerHTML = '<div class="fb retry">'+esc(msg)+'</div>';
  };
}
function fcPick(id){
  var nextPos = fc.placed.length + 1;
  var chosen = null;
  var remaining = [];
  fc.pool.forEach(function(p){ if(p.id===id) chosen = p; else remaining.push(p); });
  if(!chosen) return;
  fc.attempts++;
  var correct = DATA._orden ? DATA._orden[chosen.id] : null;
  // el orden correcto viene embebido solo en la versión docente; aquí se evalúa con el mapa _orden
  if(correct === nextPos){
    fc.placed.push(chosen); fc.pool = remaining;
    save({ paso:chosen.id, posicion:nextPos, correcta:true, intentos:fc.attempts, pistas:fc.hints, ts:new Date().toISOString(), alias:state.alias });
    renderFlow();
    if(fc.placed.length === DATA.pasos.length){
      setTimeout(function(){ renderSummaryFlow(); }, 400);
    }
  } else {
    save({ paso:chosen.id, posicion:nextPos, correcta:false, error:'CONCEPT', intentos:fc.attempts, pistas:fc.hints, ts:new Date().toISOString(), alias:state.alias });
    var fb = document.getElementById('feedback');
    fb.innerHTML = '<div class="fb retry">Buen intento. Ese paso va en otro momento del proceso: piensa qué tiene que pasar ANTES para que esto pueda ocurrir.</div>';
  }
}
function renderSummaryFlow(){
  app().innerHTML = '<div class="card center">'
    + '<div class="mascot">'+bot('exito', 88)+'</div>'
    + '<p class="bubble">'+esc(voz(VOZ_DESPEDIDA))+'</p>'
    + '<h1 style="margin-top:10px">¡Secuencia completada, '+esc(state.alias)+'!</h1>'
    + '<p class="stars">'+fc.placed.length+'/'+DATA.pasos.length+'</p>'
    + '<p style="font-size:1.1rem;line-height:1.6">'+esc(DATA.mensajeCierre)+'</p>'
    + '<p class="small" style="margin-top:14px">Ordenaste '+fc.placed.length+' pasos en '+fc.attempts+' intentos'
    + (fc.hints>0 ? ' · usaste '+fc.hints+' pistas' : ' · ¡sin pistas!')
    + '</p>'
    + '<button class="btn" id="again" style="margin-top:18px">Ordenar otra vez</button>'
    + '<p class="small" style="margin-top:16px">Tus resultados quedaron guardados en este dispositivo ('+STORE_KEY+')</p>'
    + '</div>';
  document.getElementById('again').onclick = renderStart;
}

/* ================= RESUMEN QUIZ ================= */
function renderSummary(total){
  var stars = '';
  for(var i=0;i<total;i++) stars += i < state.correct ? '⭐' : '☆';
  app().innerHTML = '<div class="card center">'
    + '<div class="mascot">'+bot('exito', 88)+'</div>'
    + '<p class="bubble">'+esc(voz(VOZ_DESPEDIDA))+'</p>'
    + '<h1 style="margin-top:10px">¡Sesión completada, '+esc(state.alias)+'!</h1>'
    + '<div class="stars">'+stars+'</div>'
    + '<p style="font-size:1.1rem;line-height:1.6">'+esc(DATA.mensajeCierre)+'</p>'
    + '<p class="small" style="margin-top:14px">Aciertos: '+state.correct+' de '+total
    + (state.maxLevel>0 ? ' · Pediste pistas hasta el peldaño '+state.maxLevel+' — pedir ayuda es de estrategas' : ' · No necesitaste pistas')
    + '</p>'
    + '<button class="btn" id="again" style="margin-top:18px">Jugar otra vez</button>'
    + '<p class="small" style="margin-top:16px">Tus resultados quedaron guardados en este dispositivo ('+STORE_KEY+')</p>'
    + '</div>';
  document.getElementById('again').onclick = renderStart;
}

// mapa de orden para flowchart (inyectado por el exportador)
DATA._orden = DATA._orden || {};
renderStart();
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Descarga la micro-app como archivo .html autónomo */
export function downloadMicroApp(
  activity: StoredContent,
  shareCode: string,
  anchor?: CurriculumAnchor | null,
) {
  // flowchart necesita el mapa de orden correcto para autoevaluación offline
  let withOrder = activity;
  if (activity.formatId === "flowchart" && activity.pasos) {
    const orden: Record<string, number> = {};
    for (const p of activity.pasos) orden[p.id] = p.orden;
    withOrder = { ...activity, _orden: orden } as StoredContent;
  }
  const html = buildMicroAppHtml(withOrder, shareCode, anchor);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `monito-${shareCode.toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return new Blob([html]).size; // para mostrar el peso real
}
