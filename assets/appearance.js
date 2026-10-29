/* Shared Speedship appearance controls. Preferences and sessions stay on this site. */
(()=>{
  'use strict';
  if(window.SSSAppearance)return;
  const key='sss-appearance-v1',root=document.documentElement;
  const allowed={theme:['system','light','dark'],size:['small','medium','large']};
  const defaults={theme:'dark',size:'medium'};
  let prefs={...defaults},dialog,returnFocus;
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const k in allowed)if(allowed[k].includes(saved[k]))prefs[k]=saved[k];}catch{}
  const media=matchMedia('(prefers-color-scheme: dark)');
  function apply(){
    const theme=prefs.theme==='system'?(media.matches?'dark':'light'):prefs.theme;
    root.dataset.sssTheme=theme;root.dataset.sssSize=prefs.size;root.dataset.theme=theme;
    root.dataset.themePreference=prefs.theme==='system'?'auto':prefs.theme;
    root.style.setProperty('--sss-zoom',({small:0.94,medium:1,large:1.1})[prefs.size]);
    try{
      localStorage.setItem('sss_theme',prefs.theme==='system'?'auto':prefs.theme);
      const finance=JSON.parse(localStorage.getItem('speedship-finance-display')||'{}');
      localStorage.setItem('speedship-finance-display',JSON.stringify({...finance,theme,size:'medium'}));
    }catch{}
    if(typeof window.displayPreferences==='object'){window.displayPreferences.theme=theme;window.displayPreferences.size='medium';}
    document.querySelectorAll('[data-theme-label]').forEach(el=>el.textContent=prefs.theme==='system'?'System':theme==='dark'?'Dark':'Light');
    dialog?.querySelectorAll('select').forEach(el=>{el.value=prefs[el.name];});
  }
  function save(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}apply();}
  const thai=()=>/^th\b/i.test(navigator.language);
  function open(){returnFocus=document.activeElement;apply();dialog.showModal();dialog.querySelector('select').focus();}
  function init(){
    const th=thai();
    const button=document.createElement('button');button.id='sss-appearance-open';button.type='button';button.className='sss-appearance-open';button.title=th?'การแสดงผล':'Appearance';button.setAttribute('aria-label',button.title);button.setAttribute('aria-haspopup','dialog');
    button.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg><span>'+(th?'การแสดงผล':'Appearance')+'</span>';
    dialog=document.createElement('dialog');dialog.id='sss-appearance-dialog';dialog.className='sss-appearance-dialog';dialog.setAttribute('aria-labelledby','sss-appearance-title');
    dialog.innerHTML=`<form method="dialog"><header><div><small>SPEEDSHIP</small><h2 id="sss-appearance-title">${th?'การแสดงผล':'Appearance'}</h2></div><button class="sss-appearance-close" aria-label="${th?'ปิด':'Close'}" value="close">×</button></header><p>${th?'ปรับการแสดงผลให้เหมาะกับคุณ':'Make this workspace comfortable for you.'}</p><label>${th?'ธีม':'Theme'}<select name="theme" aria-label="${th?'ธีม':'Theme'}"><option value="system">${th?'ตามระบบ':'System'}</option><option value="light">${th?'สว่าง':'Light'}</option><option value="dark">${th?'มืด':'Dark'}</option></select></label><label>${th?'ขนาดการแสดงผล':'Display size'}<select name="size" aria-label="${th?'ขนาดการแสดงผล':'Display size'}"><option value="small">${th?'เล็ก':'Small'}</option><option value="medium">${th?'มาตรฐาน':'Standard'}</option><option value="large">${th?'ใหญ่':'Large'}</option></select></label><div class="sss-appearance-preview"><strong>Aa กข</strong><span>${th?'ตัวอย่างการแสดงผล':'A little more room to focus.'}</span></div><p class="sss-appearance-note">${th?'บันทึกอัตโนมัติบนเบราว์เซอร์นี้สำหรับเว็บไซต์นี้':'Saved automatically in this browser for this site.'}</p><footer><button type="button" id="sss-appearance-reset">${th?'คืนค่าเริ่มต้น':'Reset'}</button><button value="done" class="sss-appearance-done">${th?'เสร็จสิ้น':'Done'}</button></footer></form>`;
    document.body.append(button,dialog);button.onclick=open;
    dialog.querySelectorAll('select').forEach(el=>el.onchange=()=>{if(allowed[el.name].includes(el.value)){prefs[el.name]=el.value;save();}});
    dialog.querySelector('#sss-appearance-reset').onclick=()=>{prefs={...defaults};save();};
    dialog.addEventListener('close',()=>returnFocus?.focus());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    apply();
  }
  window.SSSAppearance={open,apply};apply();
  media.addEventListener?.('change',()=>{if(prefs.theme==='system')apply();});
  window.addEventListener('storage',e=>{if(e.key===key){try{const value=JSON.parse(e.newValue||'{}');for(const k in allowed)if(allowed[k].includes(value[k]))prefs[k]=value[k];apply();}catch{}}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
