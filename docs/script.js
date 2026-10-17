(() => {
 const search=document.getElementById('docSearch');
 const results=document.getElementById('searchResults');
 const sections=[...document.querySelectorAll('.doc-section')].map(s=>({id:s.id,title:s.dataset.title||s.querySelector('h2,h1')?.textContent||s.id,text:s.innerText.replace(/\s+/g,' ')}));
 const sidebar=document.getElementById('sidebar'); const menu=document.getElementById('mobileMenu');
 function runSearch(){const q=search.value.trim().toLowerCase(); if(!q){results.hidden=true;results.innerHTML='';return;}const found=sections.filter(s=>(s.title+' '+s.text).toLowerCase().includes(q)).slice(0,8);results.innerHTML=found.length?found.map(s=>`<a href="#${s.id}" data-result="${s.id}">${escapeHtml(s.title)}<small>${escapeHtml(s.text.slice(0,105))}…</small></a>`).join(''):'<div class="empty">No matching pages found. Try another keyword.</div>';results.hidden=false;}
 function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 search.addEventListener('input',runSearch); search.addEventListener('focus',()=>{if(search.value.trim())runSearch()});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search.focus();search.select();}if(e.key==='Escape'){results.hidden=true;search.blur();}});
 results.addEventListener('click',e=>{if(e.target.closest('a')){results.hidden=true;search.value='';sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}});
 document.addEventListener('click',e=>{if(!results.contains(e.target)&&!e.target.closest('.searchbox'))results.hidden=true;});
 menu.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close documentation menu':'Open documentation menu');});
 document.querySelectorAll('.sidebar a').forEach(a=>a.addEventListener('click',()=>{sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}));
 const tracked=[...document.querySelectorAll('.doc-section[id]')];
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.side-link,.toc a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}})},{rootMargin:'-20% 0px -65% 0px'});tracked.forEach(s=>observer.observe(s));}
})();
