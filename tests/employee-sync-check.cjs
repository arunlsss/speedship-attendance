'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/../assets/hr-employee-sync.js','utf8').replace("import './auth.js';",'');
let current={status:'complete',finishedAt:'2026-10-08T05:00:00Z',statusUpdated:0},refreshes=0,interval;
const element=()=>({dataset:{},append(){},replaceChildren(){}}),status=element(),details={querySelector:()=>({})};
const box={querySelector:selector=>selector==='details'?details:selector==='.employee-sync-status'?status:{}};
const document={hidden:false,documentElement:{lang:'en'},createElement:element,createTextNode:text=>text,
 getElementById:id=>id==='refreshBtn'?{click:()=>refreshes++}:id==='employeeSync'?box:null};
const context={document,SSS:{esc:String,requireDashboard:async()=>({role:'hr'}),request:async action=>action==='health'?{capabilities:{employeeSheetImport:true,employeeStatusSync:true}}:current},MutationObserver:class{observe(){}},setInterval:fn=>interval=fn};
const tick=async()=>{interval();await new Promise(resolve=>setImmediate(resolve));};
(async()=>{
 await vm.runInNewContext(code,context);await tick();assert.equal(refreshes,0);
 current={...current,finishedAt:'2026-10-09T05:00:00Z',statusUpdated:3};await tick();assert.equal(refreshes,1);
 await tick();assert.equal(refreshes,1);
 document.hidden=true;current={...current,finishedAt:'2026-10-10T05:00:00Z'};await tick();assert.equal(refreshes,1);
 document.hidden=false;await tick();assert.equal(refreshes,2);
 console.log('PASS: dashboard refreshes once per new completed sync and skips hidden-tab polling.');
})().catch(error=>{console.error(error);process.exitCode=1;});
