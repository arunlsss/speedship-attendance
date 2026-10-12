const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, {value:'',disabled:false,textContent:'',innerHTML:'',className:'',classList:{add:x=>classes.add(x),contains:x=>classes.has(x)}});
  }
  return nodes.get(id);
}
const submitted = [];
const context = {
  window:{},navigator:{},Intl,Date,Uint8Array,crypto:require('node:crypto').webcrypto,
  matchMedia:()=>({addEventListener(){}}),
  document:{getElementById:node},
  fetch:async(_url,options)=>{submitted.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true,data:{isDup:true}})};},
  console
};
vm.createContext(context);
const source = fs.readFileSync(path.join(__dirname,'../assets/attendance.js'),'utf8');
vm.runInContext(source.replace(/\s+init\(\);\s*$/, '\nthis.test={state,updateSubmitButton,submitAttendance};'),context);
(async()=>{
  const {state,updateSubmitButton,submitAttendance}=context.test;
  assert.equal(context.window.SSSAttendanceDevice,undefined);
  state.selectedLocation={id:'WH1',name:'Warehouse'};
  state.selectedEmployee={id:'EMP1',name:'Fixture Employee'};
  updateSubmitButton();assert.equal(node('submitButton').disabled,true);
  await submitAttendance();assert.equal(submitted.length,0);
  state.photoDataUrl='data:image/jpeg;base64,/9j/';
  updateSubmitButton();assert.equal(node('submitButton').disabled,false);
  await submitAttendance();assert.equal(submitted.length,1);
  assert.equal(submitted[0].action,'appendLog');assert.equal(submitted[0].deviceKey,undefined);
  assert.match(submitted[0].writeToken,/^[a-f0-9]{64}$/);
  assert.equal(submitted[0].empId,'EMP1');assert.equal(submitted[0].locId,'WH1');
  assert.equal(node('duplicateModal').classList.contains('open'),true);
  console.log('PASS: clock-in readiness and request without registered device; photo requirement, per-log token and duplicate confirmation preserved.');
})().catch(error=>{console.error(error);process.exitCode=1;});
