/* Native project adapter. No service credentials or operational writes are added. */
(()=>{
 'use strict';if(window.parent===window)return;
 const allowed=['https://management.speedshipsolution.com','https://speedship-management.web.app'];
 let ctx;try{ctx=JSON.parse(sessionStorage.getItem('sss_workspace_context')||'null');}catch{return;}
 if(!ctx||!allowed.includes(ctx.parent)||ctx.expires<Date.now())return;
 const {system,nonce,uid}=ctx,send=(type,extra={})=>parent.postMessage({channel:'speedship-workspace-v1',system,nonce,uid,type,...extra},ctx.parent);
 document.documentElement.dataset.managementEmbed='true';document.documentElement.dataset.workspaceSystem=system;
 const model=import('/workspace-model.mjs');const nativeFetch=window.fetch.bind(window);
 let latest=null,ptoRequested=false,ready=false;
 function requestDetails(input,options){try{const u=new URL(typeof input==='string'?input:input.url,location.origin);let body={};if(typeof options?.body==='string'){try{body=JSON.parse(options.body);}catch{}}return {url:u,action:body.action||u.searchParams.get('action')||''};}catch{return {};}}
 async function snapshot(data){const m=await model;latest=m.summarize(system,data);send('summary',{summary:latest});}
 window.fetch=async(input,options)=>{
  const r=await nativeFetch(input,options),{url,action}=requestDetails(input,options);
  const capture=system==='finance'?url?.origin===location.origin&&url.pathname.startsWith('/api/finance')&&action==='snapshot':system==='asn'?url?.origin===location.origin&&url.pathname.startsWith('/api/')&&action==='management':system==='attendance'?url?.origin==='https://attendanceapi-wl5ots23eq-as.a.run.app'&&['getPtoManagement','dashboardData'].includes(action):system==='fda'?url?.origin===location.origin&&url.pathname==='/api/portal'&&!url.searchParams.has('id')&&(!options?.method||options.method==='GET'):false;
  if(capture){if(r.ok){r.clone().json().then(async data=>{if(system==='attendance'&&data.ok===false)return;if(system==='asn'&&data.success!==true)return;await snapshot(data);}).catch(()=>{});}else if([401,403].includes(r.status))send('error',{message:'Your workspace session or permissions changed. Reconnect to continue.'});}
  return r;
 };
 function apply(p){
  if(!p||!['light','dark','system'].includes(p.theme)||!['small','medium','large'].includes(p.size))return;
  const theme=p.theme==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):p.theme;
  document.documentElement.dataset.theme=theme;document.documentElement.dataset.sssTheme=theme;document.documentElement.dataset.sssSize=p.size;document.documentElement.lang=p.lang==='th'?'th':'en';document.documentElement.style.setProperty('--workspace-text-scale',({small:.94,medium:1,large:1.1})[p.size]);
  // Notify the original appearance controller without transferring records or tokens.
  const value=JSON.stringify({theme,size:p.size});localStorage.setItem('sss-appearance-v1',value);dispatchEvent(new StorageEvent('storage',{key:'sss-appearance-v1',newValue:value}));
 }
 async function logout(){
  try{if(system==='attendance')await window.SSSAuth?.logout();else if(system==='asn')await window.ASNCloud?.logout();else if(window.firebase?.auth)await window.firebase.auth().signOut();else if(system==='fda'){const button=[...document.querySelectorAll('button')].find(b=>/^Sign out$/i.test(b.textContent.trim()));if(button)button.click();}}catch{}
  sessionStorage.removeItem('sss_workspace_context');sessionStorage.removeItem('sss_sso_session');send('signed-out');location.replace('/workspace.html');
 }
 function navigate(view,record){
  if(system==='finance'){
   if(record?.kind==='purchase'&&typeof window.openPurchase==='function'){page='purchases';render();window.openPurchase(record.id);}
   else if(record?.kind==='claim'&&typeof window.openClaim==='function'){page='claims';render();window.openClaim(record.id);}
   return;
  }
  if(system==='attendance'){
   if(record){const button=[...document.querySelectorAll('[data-details]')].find(b=>b.dataset.details===record.id);if(button)button.click();else location.replace('/pto.html?view=management');return;}
   const dashboard=ctx.role==='hr'||ctx.role==='super_admin'?'/hr.html':ctx.role==='executive'?'/executive.html':'/admin.html';
   const path=({leave:'/pto.html?view=management',dashboard,shifts:'/shifts.html'})[view];if(path)location.replace(path);return;
  }
  if(system==='asn'&&record&&typeof window.openReview==='function'){const row=typeof records!=='undefined'&&records.find(r=>r.id===record.id);if(row)window.openReview(row,null);return;}
  if(system==='fda'&&record?.kind==='application'&&/^[\w-]{1,128}$/.test(record.id))location.assign('/admin/applications/'+encodeURIComponent(record.id));
 }
 addEventListener('message',async event=>{
  const d=event.data;if(event.source!==parent||event.origin!==ctx.parent||d?.channel!=='speedship-workspace-v1'||d.system!==system||d.nonce!==nonce)return;
  document.getElementById('frame-guard-style')?.remove();
  if(d.type==='preferences')apply(d.preferences);
  if(d.type==='logout')await logout();
  if(d.type==='refresh'){
   if(system==='finance'&&typeof window.refreshFinanceStatus==='function')await window.refreshFinanceStatus();
   else if(system==='asn'&&typeof window.refresh==='function')await window.refresh();
   else if(system==='attendance'&&document.getElementById('ptoRefresh'))document.getElementById('ptoRefresh').click();
   else location.reload();
  }
  if(d.type==='navigate'||d.type==='review')navigate(d.view,d.record);
 });
 function announce(){if(ready)return;ready=true;send('ready');if(latest)send('summary',{summary:latest});}
 addEventListener('DOMContentLoaded',()=>{announce();
  // The dashboard itself has no PTO query. Read through Attendance's own authenticated API.
  if(system==='attendance'&&!location.pathname.endsWith('/pto.html')&&['hr','executive','super_admin'].includes(ctx.role)){
   const timer=setInterval(async()=>{if(ptoRequested||!window.SSSAuth||!window.SSS)return;ptoRequested=true;clearInterval(timer);try{await window.SSSAuth.ready();await window.SSS.request('getPtoManagement',{dashboard:true,query:{year:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric'}).format(new Date())}});}catch(e){send('error',{message:e.message});}},300);setTimeout(()=>clearInterval(timer),20000);
  }
 });
 addEventListener('pageshow',()=>{if(document.readyState!=='loading')announce();});
})();
