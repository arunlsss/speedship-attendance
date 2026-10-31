import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth,setPersistence,browserSessionPersistence,signInWithCustomToken} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {MODULES,MANAGEMENT_ORIGINS} from './workspace-model.mjs';
import {configs} from './workspace-config.js';
const args=new URLSearchParams(location.hash.slice(1)),system=args.get('system'),parentOrigin=args.get('parent'),nonce=args.get('nonce'),uid=args.get('uid'),role=args.get('role');
history.replaceState({},'',location.pathname);
const status=document.getElementById('workspaceStatus');
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
const send=(type,extra={})=>parent.postMessage({channel:'speedship-workspace-v1',system,nonce,type,...extra},parentOrigin);
async function start(){
 if(parent===window||!MANAGEMENT_ORIGINS.includes(parentOrigin)||MODULES[system]?.origin!==location.origin||!/^[-\w]{20,128}$/.test(nonce||'')||!/^[-\w:]{1,128}$/.test(uid||''))throw Error('Open this workspace from Speedship Management.');
 const verifier=random(),state=random(),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)),challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 let consumed=false;const timer=setTimeout(()=>{status.textContent='Connection expired. Reload the workspace to try again.';},60000);
 addEventListener('message',async event=>{
  const d=event.data;if(event.source!==parent||event.origin!==parentOrigin||d?.channel!=='speedship-workspace-v1'||d.system!==system||d.nonce!==nonce)return;
  if(d.type==='error'){status.textContent=d.message;return;}if(d.type!=='authorize'||consumed)return;consumed=true;clearTimeout(timer);
  try{
   const callback=new URL(d.callback);if(callback.origin!==location.origin||callback.pathname!=='/sso.html')throw Error('Invalid sign-in handoff.');const returned=new URLSearchParams(callback.hash.slice(1));
   if(d.uid!==uid||returned.get('state')!==state||returned.get('system')!==system||returned.get('audience')!=='management')throw Error('This account handoff does not match the workspace.');
   const r=await fetch('https://speedship-account.web.app/api/identity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'exchange',code:returned.get('code'),verifier}),credentials:'omit',cache:'no-store'}),result=await r.json();
   if(!r.ok)throw Error(result.error||'Unable to connect.');
   const auth=getAuth(initializeApp(configs[system]));await setPersistence(auth,browserSessionPersistence);const signed=await signInWithCustomToken(auth,result.customToken);
   if(signed.user.uid!==uid)throw Error('The signed-in account changed. Reconnect from Management.');
   sessionStorage.setItem('sss_sso_session',JSON.stringify({uid,audience:'management'}));sessionStorage.setItem('sss_workspace_context',JSON.stringify({system,parent:parentOrigin,nonce,uid,role,expires:Date.now()+8*60*60*1000}));
   const destination=system==='finance'?'/management/':system==='asn'?'/management.html':system==='fda'?'/admin':role==='admin'?'/admin.html':'/pto.html?view=management';
   location.replace(destination);
  }catch(e){status.textContent=e.message;send('error',{message:e.message});}
 });
 send('challenge',{state,challenge});
}
start().catch(e=>{status.textContent=e.message;});
