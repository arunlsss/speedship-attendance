(()=>{
'use strict';
const script=document.currentScript;
const portal=script?.dataset.portal||'attendance';
const placement=script?.dataset.managementPlacement||'header';
const management=script?.dataset.managementUrl||'/login.html';
if(document.querySelector('header.ssp-header'))return;
const links=[['Home','https://speedshipsolution.com/'],['ASN','https://asn.speedshipsolution.com/'],['Attendance','https://attendance.speedshipsolution.com/'],['FDA','https://fda.speedshipsolution.com/']];
const nav=()=>'<nav class="ssp-links" aria-label="Speedship portals">'+links.map(([label,url],i)=>(i?'<span class="ssp-bullet" aria-hidden="true">•</span>':'')+'<a href="'+url+'">'+label+'</a>').join('')+'</nav>';
const header=document.createElement('header');header.className='ssp-header';header.setAttribute('aria-label','Speedship navigation');
header.innerHTML='<div class="ssp-highlight"></div><div class="ssp-nav-inner">'+nav()+'<details class="ssp-menu"><summary aria-label="Open portal menu">Menu <span aria-hidden="true">☰</span></summary><div class="ssp-menu-panel">'+nav()+'</div></details><a class="ssp-logo-link" href="https://speedshipsolution.com/" aria-label="Speedship homepage"><img src="/assets/speedship-nav-logo.png" alt="Speedship Solution" width="60" height="43"></a></div>';
if(placement==='header'){const action=document.createElement('a');action.className='ssp-management';action.href=management;action.textContent='Management';header.querySelector('.ssp-nav-inner').appendChild(action)}
document.body.classList.add('ssp-has-nav');document.body.dataset.sspPortal=portal;document.body.prepend(header);
})();
