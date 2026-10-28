import test from 'node:test';
import assert from 'node:assert/strict';
import {expandDateRange, validDate, requestStage, workflowSteps, requestRange} from '../assets/pto-model.js';
const options={year:2026,today:'2026-10-28'};
test('same-day leave counts once',()=>{
  assert.deepEqual(expandDateRange('2026-11-02','2026-11-02',options),{dates:['2026-11-02'],excludedDates:[],days:1});
});
test('both endpoints included across a month boundary',()=>{
  assert.deepEqual(expandDateRange('2026-10-31','2026-11-02',options).dates,['2026-10-31','2026-11-01','2026-11-02']);
});
test('exclude only dates explicitly recorded as nonworking, never all weekends',()=>{
  const result=expandDateRange('2026-10-31','2026-11-02',{...options,nonWorkingDates:['2026-11-01']});
  assert.equal(result.days,2);assert.deepEqual(result.dates,['2026-10-31','2026-11-02']);assert.deepEqual(result.excludedDates,['2026-11-01']);
  assert.equal(expandDateRange('2026-10-31','2026-11-01',options).days,2);
});
test('reject missing, reversed, past and wrong-year dates',()=>{
  for(const [start,end] of [['','2026-11-01'],['2026-11-01',''],['2026-11-02','2026-11-01'],['2026-10-27','2026-10-28'],['2026-12-31','2027-01-01']])assert.throws(()=>expandDateRange(start,end,options));
});
test('validate leap dates without local-time rollover',()=>{
  assert.equal(validDate('2026-02-29'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('2026-11-31'),false);
  assert.deepEqual(expandDateRange('2028-02-28','2028-03-01').dates,['2028-02-28','2028-02-29','2028-03-01']);
});
test('31-day limit applies to charged days and empty working ranges are rejected',()=>{
  assert.equal(expandDateRange('2026-11-01','2026-12-01',options).days,31);
  assert.throws(()=>expandDateRange('2026-11-01','2026-12-02',options));
  assert.equal(expandDateRange('2026-11-01','2026-12-02',{...options,nonWorkingDates:['2026-11-01']}).days,31);
  assert.throws(()=>expandDateRange('2026-11-01','2026-11-01',{...options,nonWorkingDates:['2026-11-01']}));
});
test('HR recorded is a separate display stage and preserves completion history',()=>{
  const r={status:'approved',createdAt:'2026-10-26T00:00:00Z',employeeName:'Example Employee',ceoApprovedAt:'2026-10-27T00:00:00Z',ceoApprovedByName:'Example CEO',hrRecordedAt:'2026-10-28T00:00:00Z',hrRecordedByName:'Example HR'};
  assert.equal(requestStage(r),'hr_recorded');assert.deepEqual(workflowSteps(r).map(s=>s.complete),[true,true,true]);
  assert.equal(workflowSteps(r)[2].by,'Example HR');assert.equal(workflowSteps(r)[2].current,true);
  assert.deepEqual(workflowSteps({status:'pending'}).map(s=>s.complete),[true,false,false]);
  assert.equal(workflowSteps({status:'approved'})[1].at,undefined);
});
test('rejected and cancelled histories do not invent approval or remove real completed stages',()=>{
  assert.deepEqual(workflowSteps({status:'rejected'}).map(s=>s.complete),[true,false,false]);
  const steps=workflowSteps({status:'cancelled',ceoApprovedAt:'2026-10-27T00:00:00Z'});
  assert.deepEqual(steps.map(s=>s.complete),[true,true,false]);assert.equal(steps.some(s=>s.current),false);
});
test('legacy nonconsecutive dates stay explicit; range boundaries include excluded holidays',()=>{
  assert.equal(requestRange({dates:['2026-11-01','2026-11-03']}).continuous,false);
  assert.equal(requestRange({dates:['2026-11-02','2026-11-01']}).continuous,true);
  const range=requestRange({startDate:'2026-11-01',endDate:'2026-11-03',dates:['2026-11-02']});
  assert.equal(range.start,'2026-11-01');assert.equal(range.end,'2026-11-03');assert.equal(range.continuous,true);
});
