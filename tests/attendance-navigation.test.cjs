const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {runInNewContext} = require('node:vm');

const source = readFileSync(__dirname + '/../assets/attendance-navigation.js', 'utf8');

function setup(pathname, search = '') {
 const makeNode = () => {
  const children = new Map();
  return {
   innerHTML:'', attributes:{}, handlers:{}, classList:{add(){},toggle(){}},
   setAttribute(key,value){ this.attributes[key] = value; },
   querySelector(selector){ if(!children.has(selector))children.set(selector,makeNode());return children.get(selector); },
   addEventListener(event,handler){ this.handlers[event] = handler; },
   append(){}, prepend(){}, before(){}
  };
 };
 const document = {documentElement:{lang:'en'},body:makeNode(),querySelector:()=>null,createElement:makeNode};
 const window = {SSS:{routeForRole:role=>({hr:'hr.html',admin:'admin.html',super_admin:'admin.html',executive:'executive.html'})[role]}};
 window.top = window;
 const nodes = [];
 document.createElement = () => {const node = makeNode(); nodes.push(node); return node;};
 const observers = [];
 runInNewContext(source,{document,window,location:{pathname,search},URLSearchParams,
  matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:()=>null},
  MutationObserver:class{constructor(callback){observers.push(callback);} observe(){}}
 });
 return {document,window,root:nodes[0],nav:nodes[1].querySelector('nav'),observers};
}

test('embedded Attendance creates no standalone chrome', () => {
 const window = {top:{}};
 runInNewContext(source,{window});
 assert.equal(window.SSSAttendanceNavigation,undefined);
});

test('HR, Admin, Executive and public links follow existing role gates', () => {
 const app = setup('/hr.html');
 assert.match(app.nav.innerHTML,/href="index.html"/);
 assert.match(app.nav.innerHTML,/href="pto.html"/);
 assert.doesNotMatch(app.nav.innerHTML,/href="hr.html"/);
 app.window.SSSAttendanceNavigation.setViewer({role:'hr'});
 assert.match(app.nav.innerHTML,/href="hr.html"[^>]+aria-current="page"/);
 assert.match(app.nav.innerHTML,/href="shifts.html"/);
 assert.match(app.nav.innerHTML,/href="pto.html\?view=management"/);
 assert.doesNotMatch(app.nav.innerHTML,/href="(?:admin|executive|management-login).html"/);
 app.window.SSSAttendanceNavigation.setViewer({role:'admin'});
 assert.match(app.nav.innerHTML,/href="admin.html"/);
 assert.doesNotMatch(app.nav.innerHTML,/href="pto.html\?view=management"/);
 app.window.SSSAttendanceNavigation.setViewer({role:'executive'});
 assert.match(app.nav.innerHTML,/href="executive.html"/);
 assert.doesNotMatch(app.nav.innerHTML,/href="shifts.html"/);
});

test('PTO management has its own active link, and only a language change rerenders', () => {
 const app = setup('/pto.html','?view=management');
 app.window.SSSAttendanceNavigation.setViewer({role:'super_admin'});
 assert.match(app.nav.innerHTML,/href="pto.html\?view=management"[^>]+aria-current="page"/);
 app.nav.innerHTML = 'unchanged';
 app.observers[0]();
 assert.equal(app.nav.innerHTML,'unchanged');
 app.document.documentElement.lang = 'th';
 app.observers[0]();
 assert.match(app.nav.innerHTML,/คำขอลาและสิทธิ์วันลา/);
});
