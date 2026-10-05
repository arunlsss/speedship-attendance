import { leaveTypes } from './hr-leave.js?v=20261005-leave';

const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const col = number => { let result = ''; for (; number; number = Math.floor((number - 1) / 26)) result = String.fromCharCode(65 + (number - 1) % 26) + result; return result; };
const formula = (text, value) => ({formula:text,value});
const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;
const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
function serial(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? (date.getTime() + 7 * 3600000) / 86400000 + 25569 : null;
}

// Stored ZIP entries require no external script, network request or worker.
function zip(files) {
  const encoder = new TextEncoder(), parts = [], directory = [];
  let offset = 0, directorySize = 0;
  const crc = bytes => { let value = 0xffffffff; for (const byte of bytes) { value ^= byte; for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0); } return (value ^ 0xffffffff) >>> 0; };
  files.forEach(([path, text]) => {
    const name = encoder.encode(path), data = encoder.encode(text), checksum = crc(data);
    const local = new Uint8Array(30), a = new DataView(local.buffer);
    a.setUint32(0,0x04034b50,true); a.setUint16(4,20,true); a.setUint16(10,0,true); a.setUint16(12,33,true);
    a.setUint32(14,checksum,true); a.setUint32(18,data.length,true); a.setUint32(22,data.length,true); a.setUint16(26,name.length,true);
    const central = new Uint8Array(46), b = new DataView(central.buffer);
    b.setUint32(0,0x02014b50,true); b.setUint16(4,20,true); b.setUint16(6,20,true); b.setUint16(14,33,true);
    b.setUint32(16,checksum,true); b.setUint32(20,data.length,true); b.setUint32(24,data.length,true); b.setUint16(28,name.length,true); b.setUint32(42,offset,true);
    parts.push(local,name,data); directory.push(central,name); offset += local.length + name.length + data.length; directorySize += central.length + name.length;
  });
  const end = new Uint8Array(22), view = new DataView(end.buffer);
  view.setUint32(0,0x06054b50,true); view.setUint16(8,files.length,true); view.setUint16(10,files.length,true); view.setUint32(12,directorySize,true); view.setUint32(16,offset,true);
  return new Blob([...parts,...directory,end], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

function worksheet(name, widths = []) {
  const rows = new Map(), merges = [];
  return {name, rows, merges, widths, maxCol:1,
    set(row,column,value,style = 0) { if (!rows.has(row)) rows.set(row,new Map()); rows.get(row).set(column,{value,style}); this.maxCol = Math.max(this.maxCol,column); },
    toXML() {
      const cells = Array.from(rows).sort((a,b) => a[0]-b[0]).map(([r,values]) => '<row r="' + r + '" ht="30" customHeight="1">' + Array.from(values).sort((a,b)=>a[0]-b[0]).map(([c,cell]) => {
        const attr = ' r="' + col(c) + r + '" s="' + cell.style + '"', value = cell.value;
        if (value?.formula !== undefined) return '<c' + attr + (typeof value.value === 'string' ? ' t="str"' : '') + '><f>' + xml(value.formula) + '</f><v>' + xml(value.value ?? '') + '</v></c>';
        if (typeof value === 'number' && Number.isFinite(value)) return '<c' + attr + '><v>' + value + '</v></c>';
        return '<c' + attr + ' t="inlineStr"><is><t xml:space="preserve">' + xml(value) + '</t></is></c>';
      }).join('') + '</row>').join('');
      const columns = Array.from({length:this.maxCol},(_,i)=>'<col min="' + (i+1) + '" max="' + (i+1) + '" width="' + (widths[i] || 18) + '" customWidth="1"/>').join('');
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:' + col(this.maxCol) + Math.max(...rows.keys()) + '"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="30"/><cols>' + columns + '</cols><sheetData>' + cells + '</sheetData>' + (merges.length ? '<mergeCells count="' + merges.length + '">' + merges.map(ref=>'<mergeCell ref="' + ref + '"/>').join('') + '</mergeCells>' : '') + '<pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>';
    }
  };
}

function pack(sheets) {
  const ns = 'http://schemas.openxmlformats.org/', rel = ns + 'officeDocument/2006/relationships/';
  const sheetOverrides = sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet' + (i+1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('');
  const files = [
    ['[Content_Types].xml','<?xml version="1.0"?><Types xmlns="' + ns + 'package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheetOverrides + '</Types>'],
    ['_rels/.rels','<?xml version="1.0"?><Relationships xmlns="' + ns + 'package/2006/relationships"><Relationship Id="rId1" Type="' + rel + 'officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml','<?xml version="1.0"?><workbook xmlns="' + ns + 'spreadsheetml/2006/main" xmlns:r="' + rel.slice(0,-1) + '"><bookViews><workbookView/></bookViews><sheets>' + sheets.map((s,i)=>'<sheet name="' + xml(s.name) + '" sheetId="' + (i+1) + '" r:id="rId' + (i+1) + '"/>').join('') + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0"?><Relationships xmlns="' + ns + 'package/2006/relationships">' + sheets.map((_,i)=>'<Relationship Id="rId' + (i+1) + '" Type="' + rel + 'worksheet" Target="worksheets/sheet' + (i+1) + '.xml"/>').join('') + '<Relationship Id="rId' + (sheets.length+1) + '" Type="' + rel + 'styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml','<?xml version="1.0"?><styleSheet xmlns="' + ns + 'spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="hh:mm:ss"/><numFmt numFmtId="165" formatCode="[h]:mm:ss"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm:ss"/></numFmts><fonts count="2"><font><sz val="12"/><name val="Arial"/></font><font><b/><sz val="12"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFEFEF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD0D0D0"/></left><right style="thin"><color rgb="FFD0D0D0"/></right><top style="thin"><color rgb="FFD0D0D0"/></top><bottom style="thin"><color rgb="FFD0D0D0"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8">' + [[0,0,0,0],[0,1,2,1],[0,0,2,1],[4,0,2,1],[164,0,2,1],[165,0,2,1],[166,0,2,1],[0,0,3,1]].map(([num,font,fill,border])=>'<xf numFmtId="' + num + '" fontId="' + font + '" fillId="' + fill + '" borderId="' + border + '" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>').join('') + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
  ];
  sheets.forEach((sheet,i)=>files.push(['xl/worksheets/sheet' + (i+1) + '.xml',sheet.toXML()]));
  return zip(files);
}

export function buildPayrollWorkbook({employees, dates, getClassification, rules}) {
  const sheets = [], details = worksheet('Attendance detail',[20,32,18,25,25,22,40,16,16,16,40,18]);
  const settings = worksheet('Payroll rules',[42,46]);
  const startParts = rules.otStart.split(':').map(Number), otStart = (startParts[0] * 60 + startParts[1]) / 1440;
  const settingsRows = [
    ['Speedship payroll draft','Review incomplete records and payroll adjustments before payment.'],
    ['Template','Full Time Emp Att'],['Stored salary basis',rules.basis],['Monthly divisor',rules.divisor],['Regular hours per day',rules.hours],
    ['OT start time',otStart],['OT rounding minutes',rules.rounding],['OT rounding method',rules.roundMethod],['OT multiplier',rules.multiplier],
    ['Stored incentive per exported half-period',rules.includeIncentive ? 1 : 0],['Date range',dates[0] + ' to ' + dates.at(-1)],
    ['Worked day','A valid complete IN/OUT pair; no automatic absence or weekend exclusions.'],['Paid HR statuses',leaveTypes.filter(type=>rules.paidTypes.includes(type.value)).map(type=>type.label).join(' | ') || 'None'],
    ['Overlapping attendance and paid leave','Attendance wins; overlap is flagged for HR review.'],['Incentives and adjustments','K = incentive; L:O = signed monetary adjustments entered by HR.'],
    ['Net Pay','Worked + paid leave pay + OT pay + incentive + signed adjustments.'],['Incomplete / overnight records','Review required; payroll totals stay blank until detail review cells are cleared.'],
    ['Source coverage','Only selected dates loaded by the dashboard are exported. All weekdays are retained.'],
    ['Source rule reference','Daily salary / 8; time after 18:00 rounded to nearest 30 minutes in Report_View. HR may change these export rules.']
  ];
  settingsRows.forEach((row,i)=>row.forEach((value,j)=>settings.set(i+1,j+1,value,i===0?1:(j===1&&i>=2&&i<=9?7:0))));
  settings.set(6,2,otStart,4);
  settings.set(20,1,'Paid leave rule: 1 = paid, 0 = unpaid',1);
  leaveTypes.forEach((type,index)=>{ settings.set(21+index,1,type.label,2); settings.set(21+index,2,rules.paidTypes.includes(type.value)?1:0,7); });
  ['Employee ID','Name','Date','First IN','Last OUT','HR status','HR note','Worked day','Paid HR day','OT hours','Review','Review required'].forEach((text,i)=>details.set(1,i+1,text,1));
  let detailRow = 2;
  const groups = new Map();
  dates.forEach(date => { const month = date.slice(0,7); if (!groups.has(month)) groups.set(month,[]); groups.get(month).push(date); });
  groups.forEach((monthDates, month) => {
    const sheet = worksheet(sheets.length ? 'Full Time ' + month : 'Full Time Emp Att',[32,18,18,28,16,18,16,16,18,18,18,18,18,18,18,20,4,24,24,32,18,18,14]);
    let startRow = 3;
    [monthDates.filter(date=>Number(date.slice(-2))<=15),monthDates.filter(date=>Number(date.slice(-2))>15)].filter(group=>group.length).forEach(group => {
      const title = new Date(month + '-01T00:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'}) + ' (' + Number(group[0].slice(-2)) + '–' + Number(group.at(-1).slice(-2)) + ')';
      sheet.set(startRow+2,1,title,1); sheet.merges.push('A' + (startRow+2) + ':P' + (startRow+2));
      sheet.set(startRow,1,'Draft payroll • selected dates • HR review required',7); sheet.merges.push('A' + startRow + ':P' + startRow);
      const headers = ['','Salary(Per Day)','Salary(Per Hour)','เลขบัญชี(SCB)','Worked Days','Paid Time Off/Holiday','OT Hours','OT Units','Worked Days Pay','OT Pay','Incentive','Double Day +3','','','','Net Pay','','สาขา','Emp_Type','ชื่อ-นามสกุล','ชื่อเล่น','Salary(Day)','Log_Type'];
      headers.forEach((text,i)=>sheet.set(startRow+3,i+1,text,1));
      group.forEach((date,i)=>{ const column = 24 + i*2; sheet.set(startRow+1,column,date,1); sheet.merges.push(col(column)+(startRow+1)+':'+col(column+1)+(startRow+1)); sheet.set(startRow+2,column,new Date(date+'T00:00:00Z').toLocaleDateString('th-TH',{weekday:'long',timeZone:'UTC'}),1); sheet.set(startRow+3,column,'MAX ของ Date_Time',1); sheet.set(startRow+3,column+1,'SUM ของ OT Rounded',1); });
      const reviewCol = 24 + group.length*2;
      sheet.set(startRow+3,reviewCol,'Review',1);
      employees.forEach((emp,index)=>{
        const r = startRow+4+index*2, map = new Map((emp.daily||[]).map(day=>[day.dateKey,day]));
        const firstDetail = detailRow;
        let worked = 0, paid = 0, otHours = 0, review = false;
        group.forEach((date,i)=>{
          const day = map.get(date), classification = getClassification(emp.id,date), type = classification?.type || '';
          const a = serial(day?.firstIn), b = serial(day?.lastOut), duration = a !== null && b !== null ? b-a : null;
          const valid = Boolean(day?.complete && duration !== null && duration>=0 && duration<=1.5);
          const overnight = valid && Math.floor(a)!==Math.floor(b);
          const paidStatus = rules.paidTypes.includes(type);
          const issue = (day && !valid ? 'Incomplete IN/OUT' : '') || (overnight ? 'Overnight shift: review OT' : '') || (valid && paidStatus ? 'Attendance overlaps paid leave' : '') || (valid && ['absence','unpaid_leave'].includes(type) ? 'Attendance conflicts with HR status' : '');
          const dr = detailRow++, dc = 24+i*2;
          let rounded = valid && !overnight ? Math.max(0,((b%1)-otStart)*1440) / rules.rounding : 0;
          rounded = Math.round(rounded * 1e8) / 1e8;
          rounded = (rules.roundMethod === 'floor' ? Math.floor(rounded) : rules.roundMethod==='ceil' ? Math.ceil(rounded) : Math.floor(rounded+0.5)) * rules.rounding / 60;
          const wd = valid ? 1 : 0, pd = a === null && b === null && paidStatus ? 1 : 0;
          worked += wd; paid += pd; otHours += rounded; if (issue) review = true;
          [emp.id,emp.name,date,a??'',b??'',leaveTypes.find(item=>item.value===type)?.label||type,classification?.note||''].forEach((value,c)=>details.set(dr,c+1,value,c===3||c===4?6:2));
          details.set(dr,8,formula('IF(AND(ISNUMBER(D'+dr+'),ISNUMBER(E'+dr+')),IF(AND(E'+dr+'>=D'+dr+',E'+dr+'-D'+dr+'<=1.5),1,0),0)',wd),3);
          const tests = leaveTypes.map((type,index)=>'AND(F'+dr+'="'+type.label+'",\'Payroll rules\'!$B$'+(21+index)+'=1)').join(',');
          details.set(dr,9,formula('IF(AND(D'+dr+'="",E'+dr+'="",OR('+tests+')),1,0)',pd),3);
          const raw = 'ROUND(MAX(0,MOD(E'+dr+',1)-\'Payroll rules\'!$B$6)*1440/\'Payroll rules\'!$B$7,8)';
          const roundingFormula = 'IF(\'Payroll rules\'!$B$8="floor",ROUNDDOWN('+raw+',0),IF(\'Payroll rules\'!$B$8="ceil",ROUNDUP('+raw+',0),ROUND('+raw+',0)))';
          details.set(dr,10,formula('IF(H'+dr+'=1,IF(INT(D'+dr+')=INT(E'+dr+'),'+roundingFormula+'*\'Payroll rules\'!$B$7/60,0),0)',rounded),3);
          details.set(dr,11,issue,issue?7:2);
          details.set(dr,12,formula('IF(K'+dr+'="",0,1)',issue?1:0),3);
          sheet.set(r,dc,a??'',4); sheet.set(r+1,dc,b??'',4);
          sheet.set(r,dc+1,'',5); sheet.set(r+1,dc+1,formula("'Attendance detail'!J"+dr+'/24',rounded/24),5);
        });
        const lastDetail = detailRow-1, sum = letter => "SUM('Attendance detail'!"+letter+firstDetail+':'+letter+lastDetail+')';
        const daily = finite(emp.salary), rate = daily===null ? null : rules.basis==='monthly' ? daily/rules.divisor : daily;
        const hourly = rate===null ? null : rate/rules.hours;
        const incentive = rules.includeIncentive ? finite(emp.incentive) || 0 : 0;
        const validPay = rate!==null && !review, base = validPay ? roundMoney((worked+paid)*rate) : '', otPay = validPay ? roundMoney(otHours*hourly*rules.multiplier) : '';
        const salaryFormula = daily===null ? '' : formula("IF('Payroll rules'!$B$3=\"monthly\","+daily+"/'Payroll rules'!$B$4,"+daily+')',rate);
        const guard = 'AND(ISNUMBER(B'+r+'),'+sum('L')+'=0)';
        const values = [emp.name,salaryFormula,rate===null?'':formula('B'+r+'/\'Payroll rules\'!$B$5',hourly),String(emp.bank||''),formula(sum('H'),worked),formula(sum('I'),paid),formula(sum('J')+'/24',otHours/24),formula('G'+r+'*24*\'Payroll rules\'!$B$9',otHours*rules.multiplier),formula('IF('+guard+',ROUND((E'+r+'+F'+r+')*B'+r+',2),"")',base),formula('IF('+guard+',ROUND(H'+r+'*C'+r+',2),"")',otPay),formula("IF('Payroll rules'!$B$10=1,"+(finite(emp.incentive)||0)+',0)',incentive),'','','','',formula('IF(AND(ISNUMBER(I'+r+'),ISNUMBER(J'+r+')),SUM(I'+r+':O'+r+'),"")',validPay?roundMoney(base+otPay+incentive):''),'',(emp.assignedLocs||[]).join(' | '),emp.type,emp.name,emp.nick,rate===null?'':formula('B'+r,rate),'IN'];
        values.forEach((value,c)=>sheet.set(r,c+1,value,c===6?5:[1,2,4,5,7,8,9,10,15,21].includes(c)?3:2));
        for(let c=1;c<=22;c++){ if(c!==17){ sheet.set(r+1,c,'',2); sheet.merges.push(col(c)+r+':'+col(c)+(r+1)); } }
        sheet.set(r+1,23,'OUT',2);
        sheet.set(r,reviewCol,rate===null?'Missing salary':review?'Review attendance detail':'Ready for payroll review',review||rate===null?7:2);
        sheet.merges.push(col(reviewCol)+r+':'+col(reviewCol)+(r+1));
      });
      startRow += 6 + employees.length*2;
    });
    sheets.push(sheet);
  });
  return pack([...sheets,details,settings]);
}

export function openPayrollExport({employees,dates,leave,esc,toast}) {
  if (!employees.length || !dates.length) { toast('No employees or dates to export.','error'); return; }
  if (!leave.ready(dates)) { toast('Wait for HR statuses to load before exporting payroll.','error'); return; }
  const previous = document.activeElement, dialog = document.createElement('dialog');
  dialog.className = 'leave-dialog payroll-export-dialog';
  dialog.innerHTML = '<form><h2>Full Time Emp Att export</h2><p class="leave-help">Confirm the payroll rules for this export.</p><div class="payroll-export-fields">' +
    '<label><span>Stored salary basis</span><select name="basis"><option value="daily">Daily rate</option><option value="monthly">Monthly salary</option></select></label>' +
    '<label id="payrollDivisor" hidden><span>Monthly divisor</span><input name="divisor" type="number" value="30" min="1" max="31" step="1" required></label>' +
    '<label><span>Regular hours per day</span><input name="hours" type="number" value="8" min="1" max="24" step="0.5" required></label>' +
    '<label><span>OT starts at</span><input name="otStart" type="time" value="18:00" required></label>' +
    '<label><span>OT rounding minutes</span><select name="rounding"><option value="30">30</option><option value="15">15</option><option value="60">60</option><option value="1">1</option></select></label>' +
    '<label><span>OT rounding method</span><select name="roundMethod"><option value="nearest">Nearest</option><option value="floor">Round down</option><option value="ceil">Round up</option></select></label>' +
    '<label><span>OT multiplier</span><input name="multiplier" type="number" placeholder="e.g. 1.5" min="1" max="10" step="0.01" required></label></div>' +
    '<fieldset class="payroll-paid-types"><legend>Paid HR statuses</legend>' + leaveTypes.filter(type=>!['absence','unpaid_leave'].includes(type.value)).map(type=>'<label><input type="checkbox" name="paid" value="'+type.value+'"'+(['paid_time_off','public_holiday'].includes(type.value)?' checked':'')+'><span>'+esc(type.label)+'</span></label>').join('') + '</fieldset>' +
    '<label class="payroll-incentive"><input type="checkbox" name="incentive"><span>Include stored incentive in each exported half-period</span></label>' +
    '<p class="leave-help">Incomplete records and overnight shifts need HR review. Incentives and additional adjustments can be edited in Excel.</p><p class="leave-error" role="alert" hidden></p>' +
    '<div class="leave-actions"><button type="button" class="btn btn-soft" data-cancel>Cancel</button><button type="submit" class="btn btn-primary">Download Excel</button></div></form>';
  const form = dialog.querySelector('form');
  form.elements.basis.onchange = () => { dialog.querySelector('#payrollDivisor').hidden = form.elements.basis.value!=='monthly'; };
  dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
  dialog.addEventListener('close',()=>{dialog.remove();previous?.focus();},{once:true});
  form.onsubmit = event => {
    event.preventDefault();
    const data = new FormData(form), button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      const rules = {basis:data.get('basis'),divisor:Number(data.get('divisor')),hours:Number(data.get('hours')),otStart:data.get('otStart'),rounding:Number(data.get('rounding')),roundMethod:data.get('roundMethod'),multiplier:Number(data.get('multiplier')),paidTypes:data.getAll('paid'),includeIncentive:data.has('incentive')};
      const blob = buildPayrollWorkbook({employees,dates,getClassification:leave.get,rules});
      const link = document.createElement('a'), url = URL.createObjectURL(blob);
      link.href = url; link.download = 'speedship-full-time-emp-att-'+dates[0]+'-to-'+dates.at(-1)+'.xlsx'; link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000); dialog.close();
    } catch(error) { console.error('Payroll export failed',error); const message=dialog.querySelector('.leave-error'); message.textContent='Unable to export payroll. Please try again.'; message.hidden=false; button.disabled=false; }
  };
  document.body.append(dialog); dialog.showModal();
}
