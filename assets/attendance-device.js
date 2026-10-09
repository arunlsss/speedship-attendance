(() => {
  const storeKey='sss-approved-attendance-device-v1';
  let key='',ready=false,info=null,busy=false;
  const $=id=>document.getElementById(id);
  const text=(th,en)=>document.documentElement.lang==='en'?en:th;
  function changed(){document.dispatchEvent(new Event('attendance-device-state'));}
  async function call(action,body={}){
    const r=await fetch('https://attendanceapi-wl5ots23eq-as.a.run.app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,deviceKey:key,...body})});
    const p=await r.json();if(!r.ok||p.ok!==true)throw new Error(p.error||'Device check failed');return p.data;
  }
  function newKey(){
    const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
    key=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem(storeKey,key);
  }
  function render(){
    const box=$('deviceApproval');if(!box)return;box.hidden=false;
    const approved=info?.device?.status==='approved';
    $('deviceProtectionStatus').textContent=!ready?text('กำลังตรวจสอบอุปกรณ์…','Checking device…'):approved?text('อุปกรณ์ได้รับอนุมัติแล้ว ไม่ต้องเข้าสู่ระบบ','Device approved. No employee sign-in needed.'):info?.enforced?text('อุปกรณ์นี้ต้องได้รับอนุมัติจากฝ่ายจัดการก่อนลงเวลา','Management must approve this device before clock-in.'):text('เตรียมอนุมัติอุปกรณ์ — ยังลงเวลาได้ตามปกติระหว่างตั้งค่า','Device approval setup — clock-in remains available during preparation.');
    const d=info?.device;$('deviceApprovalCode').textContent=d?text('รหัสอุปกรณ์: ','Device code: ')+d.code+' · '+d.status:'';
    $('deviceApprovalForm').hidden=approved||d?.status==='pending';
    $('requestDeviceApproval').disabled=busy||!ready;
    $('resetDeviceApproval').hidden=!d||['approved','pending'].includes(d.status);
  }
  async function refresh(){
    if(!key)return;
    try{info=await call('attendanceDeviceStatus');ready=true;render();changed();}
    catch{ready=false;render();$('deviceProtectionStatus').textContent=text('ตรวจสอบอุปกรณ์ไม่สำเร็จ กรุณาลองใหม่','Unable to verify device. Please retry.');changed();}
  }
  async function init(){
    try{key=localStorage.getItem(storeKey)||'';if(!/^[a-f0-9]{64}$/.test(key))newKey();}
    catch{$('deviceApproval').hidden=false;$('deviceProtectionStatus').textContent=text('กรุณาอนุญาตการจัดเก็บข้อมูลของเว็บไซต์เพื่อใช้อุปกรณ์นี้','Allow website storage to use this device.');return;}
    $('requestDeviceApproval').onclick=async()=>{
      if(busy)return;busy=true;render();
      try{
        await call('requestAttendanceDevice',{label:$('deviceLabel').value,mode:$('deviceKind').value,locationId:$('locationSelect').value,employeeId:window.SSSAttendanceSelection?.().employeeId||''});
        await refresh();
      }catch(e){$('deviceProtectionStatus').textContent=e.message;}
      finally{busy=false;$('requestDeviceApproval').disabled=!ready;}
    };
    $('resetDeviceApproval').onclick=()=>{try{newKey();info=null;ready=false;refresh();}catch{$('deviceProtectionStatus').textContent=text('จัดเก็บข้อมูลไม่ได้','Website storage is unavailable.');}};
    await refresh();setInterval(()=>{if(!document.hidden&&!busy)refresh();},30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    window.addEventListener('storage',e=>{if(e.key===storeKey){key=e.newValue||'';ready=false;info=null;refresh();changed();}});
  }
  window.SSSAttendanceDevice={canSubmit:()=>{const s=window.SSSAttendanceSelection?.();const d=info?.device;return ready&&(!info?.enforced||(d?.status==='approved'&&d.locationId===s?.locationId&&(d.mode==='shared'||d.employeeId===s?.employeeId)));},key:()=>key,refresh};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
