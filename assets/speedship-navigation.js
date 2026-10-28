/* Portal routes and menu behavior shared across Speedship sites. */
(()=>{
  const links=[['Home','https://www.speedshipsolution.com/'],['ASN','https://asn.speedshipsolution.com/'],['Attendance','https://attendance.speedshipsolution.com/'],['Finance','https://finance.speedshipsolution.com/'],['FDA','https://fda.speedshipsolution.com/']];
  const header=document.querySelector('.ssp-header,.sss-header');if(!header)return;
  header.querySelectorAll('nav.ssp-links').forEach(nav=>{
    nav.replaceChildren();
    links.forEach(([label,url],index)=>{
      if(index){const dot=document.createElement('span');dot.className='ssp-bullet';dot.setAttribute('aria-hidden','true');dot.textContent='•';nav.append(dot);}
      const link=document.createElement('a');link.href=url;link.textContent=label;
      if(new URL(url).hostname===location.hostname)link.setAttribute('aria-current','page');
      nav.append(link);
    });
  });
  header.querySelectorAll('a[href="https://speedshipsolution.com/"]').forEach(a=>a.href='https://www.speedshipsolution.com/');
  const closeMenus=()=>header.querySelectorAll('details[open]').forEach(menu=>menu.open=false);
  header.addEventListener('click',event=>{if(event.target.closest('a'))closeMenus();});
  document.addEventListener('click',event=>{if(!header.contains(event.target))closeMenus();});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const open=header.querySelector('details[open]');
    if(open){closeMenus();open.querySelector('summary')?.focus();}
  });
})();
