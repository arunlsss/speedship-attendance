import './auth.js';
(async()=>{
  const viewer=await SSS.requireDashboard(['hr','admin','super_admin']);if(!viewer)return;
  const logout=document.getElementById('shiftLogout');
  logout.hidden=false;
  logout.onclick=async()=>{
    logout.disabled=true;
    try{await SSS.logoutDashboard();location.replace('management-login.html');}
    catch(error){SSS.toast(error.message,'error');logout.disabled=false;}
  };
  const dashboardLink=document.getElementById('shiftDashboardLink');
  if(dashboardLink)dashboardLink.href=SSS.routeForRole(viewer.role);
  const managementLink=document.querySelector('.ssp-management');
  if(managementLink)managementLink.href=SSS.routeForRole(viewer.role);
  const root=document.getElementById('shiftList'),error=document.getElementById('shiftError'),refresh=document.getElementById('refreshShifts');
  const esc=SSS.esc;let busy=false;
  async function load(){
    if(busy)return;busy=true;refresh.disabled=true;error.hidden=true;
    try{
      const branches=await SSS.request('getBranchShifts',{dashboard:true});
      root.innerHTML=branches.map((b,i)=>'<form class="branch-shift-form" data-index="'+i+'"><strong>'+esc(b.name)+'</strong><label for="shiftStart'+i+'">เริ่มกะ / Start<input id="shiftStart'+i+'" name="startTime" type="time" required value="'+esc(b.shift.startTime||'')+'"></label><label for="shiftEnd'+i+'">จบกะ / End<input id="shiftEnd'+i+'" name="endTime" type="time" required value="'+esc(b.shift.endTime||'')+'"></label><button class="btn btn-primary" type="submit">บันทึก / Save</button><p class="shift-result" role="status">ไม่มีเวลาผ่อนผันสาย / Zero late grace</p></form>').join('')||'<p>ไม่พบสาขาที่เปิดใช้งาน / No active branches</p>';
      root.querySelectorAll('form').forEach(form=>form.onsubmit=async event=>{
        event.preventDefault();if(busy)return;
        const branch=branches[Number(form.dataset.index)],fields=new FormData(form),startTime=fields.get('startTime'),endTime=fields.get('endTime');
        const result=form.querySelector('.shift-result');
        if(endTime<=startTime){result.textContent='เวลาจบกะต้องอยู่หลังเวลาเริ่มในวันเดียวกัน / End must be later than start on the same day.';return;}
        busy=true;refresh.disabled=true;form.querySelectorAll('input,button').forEach(e=>e.disabled=true);
        try{
          const shift=await SSS.request('setBranchShift',{dashboard:true,method:'POST',body:{locationId:branch.id,startTime,endTime,expectedVersion:branch.shift.version}});
          branch.shift=shift;result.textContent='บันทึกแล้ว / Saved · '+startTime+'–'+endTime+' · ไม่มีเวลาผ่อนผันสาย';
        }catch(e){result.textContent=e.message+' · กดรีเฟรชก่อนลองใหม่ / Refresh before retrying.';}
        finally{busy=false;refresh.disabled=false;form.querySelectorAll('input,button').forEach(e=>e.disabled=false);}
      });
    }catch(e){error.textContent='ไม่สามารถโหลดกะได้ / Unable to load shifts: '+e.message;error.hidden=false;root.innerHTML='';}
    finally{busy=false;refresh.disabled=false;}
  }
  refresh.onclick=load;load();
})();

