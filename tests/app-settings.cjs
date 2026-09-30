const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
function boot(saved={}){
 const els={},store={...saved},plans=[];let pending=[];
 function el(){return {value:'',checked:false,style:{},children:[],listeners:{},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]},querySelector(){return this},addEventListener(k,cb){this.listeners[k]=cb}};}
 const LN={async getPending(){return {notifications:pending}},async cancel(){pending=[]},async checkPermissions(){return {display:'granted'}},async schedule(x){await new Promise(r=>setTimeout(r,2));pending=x.notifications;plans.push(pending)}};
 const ctx=vm.createContext({console,ChimeTones:require('../chime-tones.js'),QuietSchedules:require('../quiet-schedules.js'),Date,setInterval(){},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},document:{getElementById:id=>els[id]||(els[id]=el()),createElement:el,createTextNode:s=>s,addEventListener(){}},window:{addEventListener(){},Capacitor:{Plugins:{LocalNotifications:LN}}}});
 vm.runInContext(script,ctx);return {ctx,els,store,plans,pending:()=>pending,run:s=>vm.runInContext(s,ctx)};
}
(async()=>{
 const app=boot({quietEnabled:'true',quietStart:'22',quietEnd:'8'});
 assert.equal(app.els.quietSchedules.children.length,3);
 assert.equal(app.run('quietSchedules[0].end'),'08:00');
 assert.equal(app.els.soundChoice.value,'westminster');
 assert.equal(app.els.soundChoice.children.length,19);
 app.run('quietSchedules[0].start="00:00";quietSchedules[0].end="00:00";enabled=true;');
 await app.run('saveQuietSettings()');
 assert(app.els.testButton.disabled);assert.equal(app.pending().length,0);
 const reloaded=boot(app.store);assert(reloaded.els.testButton.disabled);
 app.run('quietSchedules[0].enabled=false;');await app.run('saveQuietSettings()');
 assert(!app.els.testButton.disabled);assert.equal(app.pending().length,64);
 for(const n of app.pending())assert(n.sound.startsWith('westminster-'));
 // Pending rebuilds must finish with the latest stopped state, not reschedule later.
 const a=app.run('syncLockedPhoneChimes()');
 await app.els.stopButton.listeners.click();await a;await app.run('scheduleQueue');
 assert.equal(app.pending().length,0);
 app.els.addQuietSchedule.listeners.click();assert.equal(app.els.quietSchedules.children.length,4);
 const card=app.els.quietSchedules.children.at(-1).children[1];
 card.children.at(-1).listeners.click();assert.equal(app.els.quietSchedules.children.length,3);
 await app.run('scheduleQueue');
 assert(!html.includes('outputMode'));assert(!html.includes('Haptics'));
 console.log('PASS: app initialization, migration, saved settings, quiet preview blocking, 64 native alerts, stop/rebuild serialization, add/remove, original default, no vibration.');
})();
