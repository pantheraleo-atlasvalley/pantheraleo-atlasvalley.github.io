const STORE_KEY='atlas-valley-yield-lab-v0.2';
const labels={deposit:'Deposito simulato',withdraw:'Prelievo simulato',stake:'Allocazione simulata',unstake:'Rientro simulato'};
const symbols={deposit:'↓',withdraw:'↑',stake:'◈',unstake:'↙',genesis:'·'};
const canonicalFields=['sequence','created_at','kind','amount','fee','note','previous_hash'];
let events=[];

function safe(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function units(value){return Number(value).toLocaleString('it-IT',{maximumFractionDigits:0});}
function shortHash(value){return `${value.slice(0,10)}…${value.slice(-8)}`;}
function canonical(event){const object={};for(const key of canonicalFields)object[key]=event[key];return JSON.stringify(Object.fromEntries(Object.entries(object).sort(([a],[b])=>a<b?-1:a>b?1:0)));}
async function hashEvent(event){const data=new TextEncoder().encode(canonical(event));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(events));}
function makeGenesis(){return{sequence:1,created_at:new Date().toISOString(),kind:'genesis',amount:0,fee:0,note:'Registro demo locale inizializzato; nessun asset reale.',previous_hash:'0'.repeat(64),event_hash:''};}
async function verify(){let previous='0'.repeat(64);for(let i=0;i<events.length;i++){const event=events[i];if(event.sequence!==i+1||event.previous_hash!==previous||await hashEvent(event)!==event.event_hash)return false;previous=event.event_hash;}return events.length>0;}
function balances(){return events.reduce((state,event)=>{const {kind,amount,fee}=event;if(kind==='deposit')state.available+=amount-fee;else if(kind==='withdraw')state.available-=amount;else if(kind==='stake'){state.available-=amount;state.staked+=amount;}else if(kind==='unstake'){state.staked-=amount;state.available+=amount;}return state;},{available:0,staked:0});}
function time(value){return new Intl.DateTimeFormat('it-IT',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));}

async function refresh(){
  const valid=await verify();const balance=balances();
  document.querySelector('#available').textContent=units(balance.available);document.querySelector('#staked').textContent=units(balance.staked);
  document.querySelector('#eventCount').textContent=`${events.length} eventi`;
  const badge=document.querySelector('#verified');badge.classList.toggle('invalid',!valid);badge.innerHTML=`<span></span>${valid?'Registro verificato':'Verifica non riuscita'}`;
  const formButton=document.querySelector('#submitButton');formButton.disabled=!valid;
  const rows=[...events].reverse().map(event=>`<tr><td><div class="event-type"><span class="event-icon ${safe(event.kind)}">${symbols[event.kind]||'·'}</span><span>${safe(labels[event.kind]||'Inizio registro')}</span></div></td><td class="timestamp">${time(event.created_at)}</td><td>${units(event.amount)} DEMO</td><td>${units(event.fee)} DEMO</td><td class="event-hash" title="${safe(event.event_hash)}">${shortHash(event.event_hash)}</td></tr>`).join('');
  document.querySelector('#ledger').innerHTML=rows||'<tr><td colspan="5" class="empty">Nessun evento nel registro.</td></tr>';
}
function currentAction(){return document.querySelector('.tab.active').dataset.action;}
function updateAction(){const action=currentAction();const balance=balances();document.querySelector('#submitButton').innerHTML=`${labels[action].replace(' simulata','').replace(' simulato','')} <span>→</span>`;document.querySelector('#maxButton').hidden=!['withdraw','stake','unstake'].includes(action);document.querySelector('#amount').max=action==='unstake'?balance.staked:['withdraw','stake'].includes(action)?balance.available:1000000000;document.querySelector('#formMessage').textContent='';}
async function appendEvent(kind,amount){const previous=events.at(-1)?.event_hash||'0'.repeat(64);const event={sequence:events.length+1,created_at:new Date().toISOString(),kind,amount,fee:0,note:{deposit:'Deposito simulato: DEMO aggiunti solo nel registro locale.',withdraw:'Prelievo simulato: nessuna criptovaluta trasferita.',stake:'Allocazione simulata; nessun validator o protocollo esterno coinvolto.',unstake:'Rientro simulato dall’allocazione.'}[kind],previous_hash:previous,event_hash:''};event.event_hash=await hashEvent(event);events.push(event);save();}

document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(item=>{item.classList.remove('active');item.setAttribute('aria-selected','false');});tab.classList.add('active');tab.setAttribute('aria-selected','true');updateAction();}));
document.querySelector('#maxButton').addEventListener('click',()=>{const balance=balances();document.querySelector('#amount').value=currentAction()==='unstake'?balance.staked:balance.available;});
document.querySelector('#actionForm').addEventListener('submit',async event=>{event.preventDefault();const button=document.querySelector('#submitButton');const message=document.querySelector('#formMessage');const amount=Number(document.querySelector('#amount').value);const kind=currentAction();const balance=balances();const funds=kind==='unstake'?balance.staked:balance.available;button.disabled=true;message.className='form-message';if(!Number.isSafeInteger(amount)||amount<1||amount>1000000000){message.textContent='Inserisci un importo intero valido.';message.classList.add('error');button.disabled=false;return;}if(kind!=='deposit'&&amount>funds){message.textContent=`Saldo insufficiente: ${units(funds)} DEMO.`;message.classList.add('error');button.disabled=false;return;}try{message.textContent='Aggiornamento del registro…';await appendEvent(kind,amount);document.querySelector('#amount').value='';await refresh();updateAction();message.textContent='Evento registrato nel browser.';}catch(error){message.textContent=`Operazione non riuscita: ${error.message}`;message.classList.add('error');}finally{button.disabled=false;}});

(async()=>{try{const saved=localStorage.getItem(STORE_KEY);events=saved?JSON.parse(saved):[];if(!Array.isArray(events))throw new Error('Formato registro non valido.');if(events.length===0){const genesis=makeGenesis();genesis.event_hash=await hashEvent(genesis);events=[genesis];save();}await refresh();updateAction();}catch(error){const badge=document.querySelector('#verified');badge.classList.add('invalid');badge.innerHTML='<span></span>Registro non verificabile';document.querySelector('#ledger').innerHTML=`<tr><td colspan="5" class="empty">${safe(error.message)}</td></tr>`;document.querySelector('#submitButton').disabled=true;}})();
