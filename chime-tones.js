/* Original synthesized sound designs, shared by Web Audio and the iOS WAV build. */
(function(root){
  'use strict';
  // frequency, duration, partial frequency ratios, relative amplitudes, attack
  const presets={
    tibetan:{name:'Tibetan singing bowl',f:220,d:7,r:[1,2.71,5.4],a:[1,.35,.12],attack:.025,beat:1.1},
    woodblock:{name:'Wooden block',f:720,d:.32,r:[1,1.52,2.18],a:[1,.55,.2],attack:.002},
    digital:{name:'Digital beep',f:880,d:.24,r:[1],a:[1],attack:.012,hold:true},
    ping:{name:'Gentle ping',f:1046.5,d:1.8,r:[1,2],a:[1,.09],attack:.012},
    wind:{name:'Wind chime',f:1318.5,d:3.5,r:[1,2.76,5.4],a:[1,.2,.06],attack:.008},
    deskbell:{name:'Soft desk bell',f:1568,d:1.5,r:[1,2.4,4.1],a:[1,.3,.1],attack:.005},
    cathedral:{name:'Cathedral bell',f:130.81,d:7,r:[.5,1,1.49,2,2.72],a:[.5,1,.5,.3,.15],attack:.035},
    mantle:{name:'Antique mantle clock',f:659.25,d:2.2,r:[1,2.01,3.95],a:[1,.3,.12],attack:.008},
    school:{name:'School bell (gentle)',f:740,d:1.3,r:[1,1.48,2.05,3.1],a:[1,.4,.25,.1],attack:.015},
    hourstrike:{name:'Hour-strike bell',f:196,d:3.4,r:[.5,1,1.5,2.7],a:[.3,1,.3,.12],attack:.02},
    ship:{name:'Ship’s bell (watch bell)',f:880,d:1.6,r:[1,2.1,3.3],a:[1,.35,.13],attack:.004},
    carillon:{name:'Carillon tone',f:523.25,d:3.2,r:[.5,1,2,2.76],a:[.2,1,.25,.12],attack:.01},
    crystal:{name:'Crystal bowl',f:432,d:7,r:[1,2.001,3.98],a:[1,.15,.06],attack:.1,beat:.6},
    water:{name:'Water drop',f:1100,d:.65,r:[1,2],a:[1,.13],attack:.006,sweep:-650},
    bamboo:{name:'Bamboo tap',f:440,d:.48,r:[1,2.8,4.7],a:[1,.45,.15],attack:.003},
    gong:{name:'Deep gong',f:82.41,d:8,r:[1,1.41,1.93,2.73,4.07],a:[1,.55,.4,.2,.1],attack:.09,beat:2},
    zen:{name:'Zen bell',f:1174.66,d:4,r:[1,2.32,4.6],a:[1,.22,.07],attack:.015},
    ocean:{name:'Ocean wave ping',f:783.99,d:4.5,r:[1,2],a:[1,.09],attack:.08,noise:.16},
    harp:{name:'Soft harp',f:261.63,d:2.2,r:[1,2,3,4],a:[1,.3,.13,.04],attack:.004}
  };
  function events(style,minute,hour){
    const p=presets[style];
    if(!p)throw new Error('Unknown tone: '+style);
    let notes=[[0,1]];
    if(style==='wind')notes=[[0,1],[.43,1.25],[1.12,1.5],[1.85,2]];
    if(style==='harp')notes=[[0,1],[.18,1.25],[.36,1.5],[.54,2]];
    if(style==='mantle')notes=[[0,1],[.6,.8]];
    if(style==='carillon')notes=[[0,1],[.55,1.25],[1.1,1.5]];
    if(style==='school')notes=[[0,1],[.22,1],[.44,1]];
    if(style==='hourstrike' && minute===0)notes=Array.from({length:hour%12||12},(_,i)=>[i*1.8,1]);
    // Traditional watch count at hour/half-hour; quarter-hours use one gentle bell.
    if(style==='ship'){
      const count=minute===0||minute===30?((hour%4)*2+(minute===30?1:0)||8):1;
      notes=Array.from({length:count},(_,i)=>[Math.floor(i/2)*1.65+(i%2)*.42,1]);
    }
    return notes.map(([t,pitch])=>({t,pitch}));
  }
  function render(style,minute=0,hour=1,rate=22050){
    const p=presets[style],list=events(style,minute,hour);
    const duration=Math.max(...list.map(e=>e.t+p.d))+.05;
    const out=new Float32Array(Math.ceil(duration*rate));
    let seed=123456789,lowNoise=0;
    for(const e of list){
      const start=Math.round(e.t*rate);
      for(let i=0;i<Math.floor(p.d*rate);i++){
        const t=i/rate,release=Math.min(1,(p.d-t)/.04);
        const env=Math.min(1,t/p.attack)*release*(p.hold?1:Math.exp(-7*t/p.d));
        let s=0;
        p.r.forEach((ratio,j)=>{
          const phase=2*Math.PI*ratio*e.pitch*(p.f*t+(p.sweep||0)*t*t/(2*p.d));
          s+=p.a[j]*Math.sin(phase)*(p.beat?.8+.2*Math.cos(2*Math.PI*p.beat*t):1);
        });
        if(p.noise){
          seed=(1664525*seed+1013904223)>>>0;
          lowNoise=.96*lowNoise+.04*(seed/2147483648-1);
          s+=p.noise*lowNoise*12*Math.sin(Math.PI*t/p.d);
        }
        out[start+i]+=s*env;
      }
    }
    let peak=0;
    for(const s of out)peak=Math.max(peak,Math.abs(s));
    for(let i=0;i<out.length;i++)out[i]=out[i]/(peak||1)*.65;
    return out;
  }
  const api={presets,events,render};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.ChimeTones=api;
})(typeof globalThis!=='undefined'?globalThis:this);
