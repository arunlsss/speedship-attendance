export const MODULES={
 finance:{name:'Finance',origin:'https://finance.speedshipsolution.com',roles:['ceo','finance','cfo','hr','hr_finance','manager','officer']},
 attendance:{name:'Attendance',origin:'https://attendance.speedshipsolution.com',roles:['super_admin','admin','hr','executive']},
 asn:{name:'ASN operations',origin:'https://asn.speedshipsolution.com',roles:['super_admin','admin']},
 fda:{name:'FDA workspace',origin:'https://fda.speedshipsolution.com',roles:['superadmin','admin','reviewer']}
};
export const MANAGEMENT_ORIGINS=['https://management.speedshipsolution.com','https://speedship-management.web.app'];
export function available(account){
 const cfg=MODULES[account?.system];
 if(!cfg||account.disabled||!account.emailVerified||!cfg.roles.includes(account.role))return false;
 return account.system==='finance'?!['pending','disabled','rejected','suspended','login_disabled'].includes(account.status):account.status==='active';
}
export function allowedMessage(event,frame,system){
 return !!frame&&event.source===frame.contentWindow&&event.origin===MODULES[system]?.origin&&event.data?.channel==='speedship-workspace-v1'&&event.data?.system===system;
}
const text=(v,max=220)=>String(v??'').slice(0,max);
const numeric=v=>Number.isFinite(Number(v))?Number(v):0;
function base(module,r,kind){return {module,kind,id:text(r.id,128),reference:text(r.reference||r.id,128),name:text(r.employeeName||r.name||r.employeeId),company:text(r.company),department:text(r.department),date:text(r.date||r.createdAt||r.requestedAt||r.updated_at),title:text(r.title||r.reason||r.payload?.productName),amount:numeric(r.amount??r.total),status:text(r.status),stage:''};}
export function summarize(system,payload){
 const data=system==='attendance'?payload.data??payload:payload;
 if(system==='finance'){
  const rows=(data.claims||[]).filter(r=>!r.deletedAt&&['Submitted','Approved'].includes(r.status)).map(r=>({...base(system,r,'claim'),stage:r.status==='Submitted'?'CEO review':r.hrRecordedAt?'CFO payment':'HR record'}));
  for(const r of data.purchases||[]){if(r.deletedAt||!['Submitted','Approved','AwaitingPaymentApproval','ReadyForPayment'].includes(r.status))continue;rows.push({...base(system,r,'purchase'),stage:({Submitted:'CEO review',Approved:'Prepare order',AwaitingPaymentApproval:'CEO payment approval',ReadyForPayment:'CFO payment'})[r.status]});}
  return {rows,limited:false,label:'Current finance snapshot'};
 }
 if(system==='attendance'&&Array.isArray(data.requests))return {rows:data.requests.filter(r=>['pending','approved'].includes(r.status)&&!r.hrRecordedAt).map(r=>({...base(system,r,'leave'),stage:r.status==='pending'?'CEO review':'HR record',period:Array.isArray(r.dates)?text(r.dates.join(' · '),500):'',days:numeric(r.days)})),limited:false,label:'PTO for the selected year'};
 if(system==='attendance')return {rows:[],limited:true,label:'Attendance dashboard loaded; PTO requires HR or C-Level access'};
 if(system==='asn')return {rows:(data.submissions||[]).map(r=>({...base(system,r,'shipment'),reference:text(r.asnId||r.fileName||r.id),name:text(r.customer),company:'',title:text(r.brand),stage:r.status==='failed'?'Needs attention':r.status==='saved'&&(r.reviewStatus||'pending')==='pending'?'Operations review':text(r.status),direction:text(r.direction)})),limited:!!data.next,label:data.next?'Latest 100 shipments; more in ASN':'Loaded shipments'};
 if(system==='fda')return {rows:(data.cases||[]).map(r=>({...base(system,r,'application'),name:'',company:text(r.payload?.company||r.company),stage:text(r.status)})),limited:false,label:'Applications visible to the selected FDA role'};
 return {rows:[],limited:true,label:'No summary available'};
}
export function visibleRows(summaries,{company='',query='',module=''}={}){
 const q=query.toLocaleLowerCase().trim();
 return Object.entries(summaries).flatMap(([system,s])=>Array.isArray(s?.rows)?s.rows.filter(r=>r.module===system):[]).filter(r=>(!module||r.module===module)&&(!company||r.company===company)&&(!q||[r.reference,r.id,r.title,r.name,r.department,r.company,r.stage].join(' ').toLocaleLowerCase().includes(q)));
}
export function overviewMetrics(rows){return {approval:rows.filter(r=>['finance','attendance'].includes(r.module)&&['CEO review','CEO payment approval'].includes(r.stage)).length,payment:rows.filter(r=>r.module==='finance'&&r.stage==='CFO payment').reduce((sum,r)=>sum+r.amount,0),leave:rows.filter(r=>r.module==='attendance').length};}
export function safeCSV(rows){return '\ufeff'+[['Reference','Module','Type','Employee','Company','Amount','Stage'],...rows.map(r=>[r.reference,r.module,r.kind,r.name,r.company,r.amount,r.stage])].map(row=>row.map(v=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
