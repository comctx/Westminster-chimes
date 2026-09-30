const assert=require('node:assert/strict');
const Q=require('../quiet-schedules.js');
const window=(days,start,end)=>({name:'Test',enabled:true,days,start,end});
const at=(day,h,m=0)=>new Date(2024,0,7+day,h,m);
const sleep=window([1,2,3,4,5],'22:00','08:00');
assert(!Q.active(sleep,at(1,7))); // Sunday night excluded.
assert(Q.active(sleep,at(1,22)));
assert(Q.active(sleep,at(6,7,59))); // Friday night extends into Saturday.
assert(!Q.active(sleep,at(6,8)));
assert(!Q.active(sleep,at(0,1)));
const work=window([1,2,3,4,5],'09:15','17:30');
assert(!Q.active(work,at(1,9,14)));
assert(Q.active(work,at(1,9,15)));
assert(!Q.active(work,at(1,17,30)));
assert(!Q.active(work,at(0,12)));
assert(Q.isQuiet([sleep,work],at(2,10)));
const allDay=window([0,6],'00:00','00:00');
assert(Q.active(allDay,at(6,23,59)));assert(!Q.active(allDay,at(1,0)));
assert(!Q.active({...sleep,enabled:false},at(1,23)));
assert(!Q.active({...sleep,days:[]},at(1,23)));
const store={quietEnabled:'true',quietStart:'22',quietEnd:'8'};
const migrated=Q.load({getItem:k=>store[k]??null});
assert.equal(migrated[0].start,'22:00');assert.equal(migrated[0].end,'08:00');assert(migrated[0].enabled);assert(!migrated[1].enabled);
assert.equal(Q.plan([window([0,1,2,3,4,5,6],'22:00','08:00')],[0,15,30,45]).kind,'daily');
const p=Q.plan([sleep,work,allDay],[0,15,30,45],at(1,8));
assert(p.times.length<=64);
if(p.kind==='rolling')for(const d of p.times){assert(d>at(1,8));assert(!Q.isQuiet([sleep,work,allDay],d));}
assert.equal(Q.plan([window([0,1,2,3,4,5,6],'00:00','00:00')],[0]).times.length,0);
// Weekly calendar repeat when fewer than 65 slots remain.
const weekly=Q.plan([window([0,6],'00:00','00:00'),window([1,2,3,4,5],'01:00','23:00')],[0]);
assert.equal(weekly.kind,'weekly');assert.equal(weekly.times.length,10);
console.log('PASS: minute boundaries, overnight start days, weekends, overlaps, all-day, disabled, migration, daily/weekly/rolling plans.');
