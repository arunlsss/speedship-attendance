const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../assets/dashboard.js','utf8').replace(/^import .*;$/mg,'');
const data={period:{from:'2026-10-01',to:'2026-10-28'},generatedAt:'2026-10-28T03:00:00Z',kpis:{activeEmployees:0,pendingEmployees:0,presentToday:0,punctualityRate:0,completionRate:0,attendanceLogs:0},employees:[],trend:[],branches:[],syncErrors:[]};
async function setup(page='admin',failure=null){
 const nodes=new Map(),calls=[];let fail=failure;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'',hidden:true,classList:{add(){},remove(){},toggle(){}},querySelectorAll:()=>[],setAttribute(){},focus(){}});return nodes.get(id);};
 const SSS={requireDashboard:async()=>({role:'super_admin',email:'example@example.com'}),applyTheme(){},esc:v=>String(v??''),pct:v=>String(v??0),fmtDateTime:v=>v||'',request:async(action)=>{calls.push(action);if(action==='listDashboardUsers'){if(fail)throw Object.assign(Error('Account lookup failed'),{status:fail});return {users:[],audit:[]};}return data;}};
 const document={body:{dataset:{dashboardPage:page},classList:{toggle(){}}},getElementById:node,querySelectorAll:()=>[],addEventListener(){}};
 const context={document,SSS,window:{SSSAuth:{idToken:async()=>''}},location:{},matchMedia:()=>({addEventListener(){}})};
 vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 return {nodes,calls,setFailure(value){fail=value;},content:()=>node('content').innerHTML};
}
test('an account-list failure preserves attendance, workforce, and system health sections',async()=>{
 const app=await setup('admin',500);
 assert.match(app.content(),/Dashboard accounts could not load/);
 assert.match(app.content(),/Employee records/);
 assert.match(app.content(),/Firebase → Google Sheets sync/);
 assert.doesNotMatch(app.content(),/Unable to load dashboard/);
 app.setFailure(null);await app.nodes.get('retryAccounts').onclick();
 assert.doesNotMatch(app.content(),/Dashboard accounts could not load/);
 assert.match(app.content(),/No dashboard accounts yet/);
});
test('HR and C-Level dashboards do not depend on management account listing',async()=>{
 for(const page of ['hr','executive']){
  const app=await setup(page,500);
  assert.equal(app.calls.includes('listDashboardUsers'),false);
  assert.match(app.content(),/Attendance coverage/);
 }
});
test('an expired Firebase session still requires sign-in rather than exposing dashboard content',async()=>{
 const app=await setup('admin',401);
 assert.match(app.content(),/Session expired/);
 assert.doesNotMatch(app.content(),/Employee records/);
});
