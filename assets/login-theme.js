/* Visual login adapter only. Existing forms, IDs, listeners and authorization stay intact. */
(()=>{
  'use strict';
  if(window.SSSLoginTheme)return;window.SSSLoginTheme=true;
  const root=document.documentElement;
  const context=()=>{
    const host=location.hostname,path=location.pathname;
    if(host.includes('management')||document.title.includes('Speedship Management'))return 'Management Portal';
    if(host.includes('account')||document.title.includes('Speedship Account'))return 'Employee Account';
    if(document.querySelector('.entry-shell'))return path.includes('management')?'ASN Management':'ASN Customer Portal';
    if(document.querySelector('body[data-login-page]'))return document.body.dataset.loginPage==='management'?'Finance Management':'Finance Employee Portal';
    if(document.querySelector('.auth-shell'))return 'Attendance Management';
    if(document.querySelector('#ptoLoginForm'))return 'Attendance Leave Account';
    return 'FDA Portal';
  };
  function decorate(){
    const frames=[];
    const add=(frame,scene)=>{if(!frame)return;frames.push(frame);frame.classList.add('sss-login-frame');scene?.classList.add('sss-login-scene');
      let brand=frame.querySelector('.login-brand,.entry-brand,.sss-login-brand,.sss-unified-brand');
      if(!brand){brand=document.createElement('div');brand.className='sss-unified-brand';const img=document.createElement('img');img.src='/assets/login-logo.png';img.alt='Speedship Solution';img.width=46;img.height=46;const text=document.createElement('div'),strong=document.createElement('strong'),sub=document.createElement('span');strong.textContent='Speedship Solution';sub.textContent=context();text.append(strong,sub);brand.append(img,text);frame.prepend(brand);}
      brand.classList.add('sss-unified-brand');
      const image=brand.querySelector('img');if(image&&image.getAttribute('src')!=='/assets/login-logo.png')image.src='/assets/login-logo.png';
    };
    const fda=document.querySelector('main.login-page');if(fda)add(fda.querySelector('.login-wrap')||fda.querySelector(':scope>.login-card'),fda);
    const asn=document.querySelector('.entry-shell');if(asn)add(asn.querySelector('.entry-wrap'),asn);
    const attendance=document.querySelector('.auth-shell');if(attendance)add(attendance.querySelector('.auth-card'),attendance);
    const employeeForm=document.querySelector('#ptoLoginForm');if(employeeForm)add(employeeForm.closest('.pto-form'),document.querySelector('.pto-shell'));
    const finance=document.querySelector('body[data-login-page] .auth-card');if(finance)add(finance,document.querySelector('.content'));
    const account=document.querySelector('main.login .login-form');if(account)add(account,document.querySelector('main.login'));
    const active=frames.length>0;document.body.classList.toggle('sss-login-page',active);
    if(active)root.dataset.loginTheme='fda';else delete root.dataset.loginTheme;
  }
  function start(){decorate();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate();});}).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
