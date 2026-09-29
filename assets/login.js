import "./auth.js";
const $ = id => document.getElementById(id);
const forms = $("authForms");
const state = $("authState");

$("themeBtn").onclick = () => SSS.cycleTheme();
document.querySelectorAll(".auth-tab").forEach(btn => btn.onclick = () => {
  document.querySelectorAll(".auth-tab").forEach(x => x.classList.toggle("active", x === btn));
  document.querySelectorAll(".auth-form").forEach(x => x.classList.toggle("active", x.id === `${btn.dataset.tab}Form`));
});

function roleLabel(role){ return ({hr:"HR",admin:"Admin",executive:"C-Level",super_admin:"Super Admin"})[role] || role || "Pending"; }

function showState(me){
  if (!me) { state.innerHTML=""; forms.hidden=false; return; }

  if (!me.emailVerified) {
    forms.hidden=true;
    state.innerHTML=`<div class="access-state"><div class="state-icon">@</div><h3>Verify your work email</h3><p>We sent a verification link to <strong>${SSS.esc(me.email)}</strong>. Verify it before dashboard access can be approved.</p><div class="state-actions"><button class="btn btn-primary" id="resendVerify">Resend verification</button><button class="btn btn-ghost" id="stateLogout">Sign out</button></div></div>`;
    $("resendVerify").onclick=async()=>{try{await window.SSSAuth.resendVerification();SSS.toast("Verification email sent","success");}catch(e){SSS.toast(e.message,"error");}};
    $("stateLogout").onclick=async()=>{await window.SSSAuth.logout();location.reload();};
    return;
  }

  if (me.status === "unregistered") { forms.hidden=false; return; }

  if (me.status !== "active" || !me.role) {
    forms.hidden=true;
    state.innerHTML=`<div class="access-state"><div class="state-icon pending">…</div><h3>Access request pending</h3><p><strong>${SSS.esc(me.email)}</strong> is registered, but no dashboard role has been approved yet.</p><div class="approval-path"><span>Registered</span><i></i><span class="current">Super Admin review</span><i></i><span>Role assigned</span></div><div class="state-actions"><button class="btn btn-soft" id="checkAgain">Check again</button><button class="btn btn-ghost" id="stateLogout">Sign out</button></div></div>`;
    $("checkAgain").onclick=()=>location.reload();
    $("stateLogout").onclick=async()=>{await window.SSSAuth.logout();location.reload();};
    return;
  }

  forms.hidden=true;
  state.innerHTML=`<div class="access-state success"><div class="state-icon ok">✓</div><h3>${SSS.esc(roleLabel(me.role))} access approved</h3><p>Signed in as <strong>${SSS.esc(me.email)}</strong>.</p><button class="btn btn-primary auth-main-btn" id="continueBtn">Open dashboard</button></div>`;
  $("continueBtn").onclick=()=>location.href=SSS.routeForRole(me.role);
  const qs=new URLSearchParams(location.search);
  const requested=qs.get("next");
  const allowedNext=new Set(["hr.html","admin.html","executive.html"]);
  const next=allowedNext.has(requested)?requested:SSS.routeForRole(me.role);
  setTimeout(()=>{location.href=next;},400);
}

async function refreshState(){
  const user=await window.SSSAuth.ready();
  if(!user){showState(null);return;}
  try{showState(await SSS.request("dashboardMe",{method:"POST",dashboard:true,body:{}}));}
  catch(e){SSS.toast(e.message,"error");showState(null);}
}

$("signinForm").onsubmit=async e=>{
  e.preventDefault();
  const btn=$("loginBtn");
  btn.disabled=true;
  btn.textContent="Signing in…";
  try{
    await window.SSSAuth.login($("loginEmail").value.trim(),$("loginPassword").value);
    await refreshState();
  } catch(err) {
    SSS.toast(String(err.message||err).replace(/^Firebase:\s*/i,""),"error");
  } finally {
    btn.disabled=false;
    btn.textContent="Sign in";
  }
};

$("registerForm").onsubmit=async e=>{
  e.preventDefault();
  const email=$("regEmail").value.trim().toLowerCase();
  const pass=$("regPassword").value;
  const confirm=$("regConfirm").value;
  if(!email.endsWith("@speedshipsolution.com")){SSS.toast("Use your @speedshipsolution.com work email","error");return;}
  if(pass!==confirm){SSS.toast("Passwords do not match","error");return;}
  const btn=$("registerBtn");
  btn.disabled=true;
  btn.textContent="Creating request…";
  try{
    await window.SSSAuth.register({email,password:pass,displayName:$("regName").value.trim()});
    await SSS.request("registerDashboardAccount",{method:"POST",dashboard:true,body:{
      displayName:$("regName").value.trim(),
      jobTitle:$("regJobTitle").value.trim(),
      employeeId:$("regEmployeeId").value.trim()
    }});
    SSS.toast("Access request created. Verify your email next.","success");
    await refreshState();
  } catch(err) {
    SSS.toast(String(err.message||err).replace(/^Firebase:\s*/i,""),"error");
  } finally {
    btn.disabled=false;
    btn.textContent="Create access request";
  }
};

$("forgotBtn").onclick=async()=>{
  const email=$("loginEmail").value.trim();
  if(!email){SSS.toast("Enter your work email first","error");return;}
  try{
    await window.SSSAuth.resetPassword(email);
    SSS.toast("Password reset email sent","success");
  } catch(e) {
    SSS.toast(e.message,"error");
  }
};

$("setupToggle").onclick=async()=>{
  const user=await window.SSSAuth.ready();
  if(!user){SSS.toast("Sign in with your verified work account first","error");return;}
  if(!user.emailVerified){SSS.toast("Verify your work email first","error");return;}
  $("setupBox").hidden=!$("setupBox").hidden;
};

$("bootstrapBtn").onclick=async()=>{
  const key=$("bootstrapKey").value.trim();
  if(!key){SSS.toast("Enter the bootstrap key","error");return;}
  try{
    const r=await SSS.request("bootstrapSuperAdmin",{method:"POST",dashboard:true,body:{bootstrapKey:key}});
    SSS.toast("Super Admin initialized","success");
    location.href=SSS.routeForRole(r.role);
  } catch(e) {
    SSS.toast(e.message,"error");
  }
};

await refreshState();
