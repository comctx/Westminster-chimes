const assert=require('node:assert/strict');
const F=require('../focus-intervals.js'),Q=require('../quiet-schedules.js');
const start=new Date(2026,8,30,14,10).getTime();
assert.equal(new Date(F.nextAt(start,25,start)).getHours(),14);
assert.equal(new Date(F.nextAt(start,25,start)).getMinutes(),35);
assert.equal(F.nextAt(start,25,start+25*60000),start+50*60000);
assert.equal(F.dueAt(start,25,start+25*60000+500),start+25*60000);
assert.equal(F.dueAt(start,25,start+25*60000+1500),null);
assert.equal(F.dueAt(start,25,start+60000),null);
assert.equal(F.nextAt(0,25,start),null);
assert.equal(F.interval('bad'),25);
for(const interval of F.choices){
 const times=F.nextTimes(start,interval,64,()=>false,start);
 assert.equal(times.length,64);
 assert.equal(times[0].getTime(),start+interval*60000);
 for(let i=1;i<times.length;i++)assert.equal(times[i]-times[i-1],interval*60000);
}
const windows=[{name:'Work',enabled:true,days:[0,1,2,3,4,5,6],start:'14:30',end:'15:10'}];
const times=F.nextTimes(start,25,3,d=>Q.isQuiet(windows,d),start);
assert.equal(times[0].getTime(),start+75*60000); // 15:25, phase preserved.
assert(times.every(d=>!Q.isQuiet(windows,d)));
assert.equal(F.nextTimes(start,5,64,()=>true,start).length,0);
console.log('PASS: all six intervals, 2:10→2:35 timing, no missed-alert replay, quiet exclusions preserve timing, max 64 alerts.');
