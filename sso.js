import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth,setPersistence,browserSessionPersistence,signInWithCustomToken} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
const HUB='https://speedship-account.web.app',SYSTEM=document.documentElement.dataset.system;
const status=document.getElementById('ssoStatus'),retry=document.getElementById('ssoRetry');
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
async function start(){
 const params=new URLSearchParams(location.search),audience=params.get('audience')||(['finance','attendance'].includes(SYSTEM)?'employee':'customer');
 const verifier=random(),state=random(),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 sessionStorage.setItem('sss_sso_pending',JSON.stringify({state,verifier,audience,createdAt:Date.now()}));
 location.replace(HUB+'/unified.html?'+new URLSearchParams({system:SYSTEM,audience,origin:location.origin,challenge,state}));
}
async function run(){
 const returned=new URLSearchParams(location.hash.slice(1));
 if(!returned.has('code'))return start();
 // Remove the one-time code before loading any other resource or redirecting.
 history.replaceState({},'',location.pathname);
 const pending=JSON.parse(sessionStorage.getItem('sss_sso_pending')||'null');sessionStorage.removeItem('sss_sso_pending');
 if(!pending||pending.state!==returned.get('state')||Date.now()-pending.createdAt>10*60*1000||returned.get('system')!==SYSTEM||returned.get('audience')!==pending.audience)throw Error('This sign-in request expired. Please start again.');
 const r=await fetch(HUB+'/api/identity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'exchange',code:returned.get('code'),verifier:pending.verifier}),credentials:'omit',cache:'no-store'}),result=await r.json();
 if(!r.ok)throw Error(result.error||'Unable to sign in.');
 const allowed=SYSTEM==='finance'?['/employee-login.html','/management-login.html']:SYSTEM==='attendance'?['/pto.html','/management-login.html']:['/customer-login.html','/management-login.html'];
 if(!allowed.includes(result.destination))throw Error('Invalid workspace destination.');
 const config=SYSTEM==='attendance'?{apiKey:'AIzaSyB9-tZ4__3C9Ihc-5x3gxt3b8XyYZN_X68',authDomain:'sss-attendance-prods.firebaseapp.com',projectId:'sss-attendance-prods',appId:'1:458616437535:web:09b342ab01e3e2acae8e2a'}:await(await fetch('/__/firebase/init.json')).json();
 const auth=getAuth(initializeApp(config));await setPersistence(auth,browserSessionPersistence);const signed=await signInWithCustomToken(auth,result.customToken);sessionStorage.setItem('sss_sso_session',JSON.stringify({uid:signed.user.uid,audience:pending.audience}));location.replace(result.destination);
}
retry.onclick=()=>{location.replace('/sso.html'+location.search)};
run().catch(e=>{status.textContent=e.message||'Unable to sign in. Please try again.';retry.hidden=false;});
