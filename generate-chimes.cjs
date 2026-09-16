const fs = require('node:fs');
const path = require('node:path');

const rate = 22050;
const output = path.resolve(process.argv[2] || 'www/sounds');
fs.mkdirSync(output, { recursive: true });

const music = {
  westminster: {
    notes: [0,246.94,329.63,369.99,415.30],
    strike:164.81,
    groups: {
      15:[[4,3,2,1]],
      30:[[2,4,3,1],[2,3,4,2]],
      45:[[4,2,3,1],[1,3,4,2],[4,3,2,1]],
      0:[[2,4,3,1],[2,3,4,2],[4,2,3,1],[1,3,4,2]]
    }
  },
  whittington: {
    notes:[0,293.66,329.63,369.99,392,440,493.88,554.37,587.33],
    strike:146.83,
    groups:{
      15:[[8,7,6,5,4,3,2,1]],
      30:[
        [8,2,7,3,6,4,5,1],
        [8,6,4,2,7,5,3,1]
      ],
      45:[
        [8,7,4,3,6,5,2,1],
        [2,4,6,8,5,2,3,1],
        [8,7,6,5,4,3,2,1]
      ],
      0:[
        [8,2,7,3,6,4,5,1],
        [8,6,4,2,7,5,3,1],
        [8,7,4,3,6,5,2,1],
        [2,4,6,8,5,2,3,1]
      ]
    }
  },
  stmichael: {
    notes:[0,349.23,392,440,466.16,523.25,587.33,659.25,698.46],
    strike:174.61,
    groups:{
      15:[[8,7,6,5,4,3,2,1]],
      30:[
        [8,2,3,4,7,5,6,1],
        [5,4,3,6,2,7,8,1]
      ],
      45:[
        [7,8,3,4,2,5,6,1],
        [5,7,3,8,4,2,6,1],
        [8,7,6,5,4,3,2,1]
      ],
      0:[
        [8,2,3,4,7,5,6,1],
        [5,4,3,6,2,7,8,1],
        [7,8,3,4,2,5,6,1],
        [5,7,3,8,4,2,6,1]
      ]
    }
  },
  canterbury: {
    notes:[0,293.66,329.63,369.99,392,440,493.88],
    strike:146.83,
    groups:{
      15:[[6,4,2,5,3,1]],
      30:[
        [2,4,6,3,1,5],
        [4,6,2,5,1,3]
      ],
      45:[
        [1,6,4,2,3,5],
        [4,6,2,5,1,3],
        [6,4,2,3,5,1]
      ],
      0:[
        [3,1,6,4,2,5],
        [4,6,2,5,1,3],
        [3,1,6,4,2,5],
        [4,6,5,3,2,1]
      ]
    }
  }
};

function events(style, minute, hour) {
  const list=[];

  if(style==='cuckoo') {
    const count=minute===0?hour:1;

    for(let i=0;i<count;i++) {
      list.push({
        f:659.25,t:i*1.45,d:.34,whistle:true
      });
      list.push({
        f:523.25,t:i*1.45+.39,d:.62,whistle:true
      });
    }

    return list;
  }

  const base=style==='bigben'?'westminster':style;
  const data=music[base];
  const spacing=base==='westminster'?.82:.56;
  const gap=base==='westminster'?3.65:5.05;

  data.groups[minute].forEach((group,g)=>{
    group.forEach((note,n)=>{
      list.push({
        f:data.notes[note]*(style==='bigben'?.88:1),
        t:g*gap+n*spacing,
        d:style==='bigben'?6.2:4.8
      });
    });
  });

  if(minute===0) {
    const start=list[list.length-1].t+2.4;

    for(let i=0;i<hour;i++) {
      list.push({
        f:data.strike*(style==='bigben'?.79:1),
        t:start+i*(style==='bigben'?3.8:3.15),
        d:style==='bigben'?8.2:6.8
      });
    }
  }

  return list;
}

function render(style, minute, hour, filename) {
  const list=events(style,minute,hour);
  const original=Math.max(...list.map(e=>e.t+e.d));
  const speed=Math.min(1,28/original);
  const length=Math.ceil((original*speed+.1)*rate);
  const samples=new Float64Array(length);

  const harmonics=[
    [.5,.29,1],
    [1,.49,1],
    [1.49,.19,.78],
    [2,.14,.61],
    [2.72,.09,.46],
    [3.68,.05,.33]
  ];

  for(const e of list) {
    const start=Math.round(e.t*speed*rate);
    const duration=e.d*speed;
    const count=Math.floor(duration*rate);

    const partials=e.whistle
      ?[[1,.65,1],[2,.08,1]]
      :harmonics;

    for(const [ratio,amplitude,fade] of partials) {
      for(let i=0;i<count && start+i<length;i++) {
        const t=i/rate;
        const attack=Math.min(1,t/.025);
        const release=Math.min(1,(duration-t)/.04);

        const envelope=e.whistle
          ?attack*release
          :attack*release*Math.exp(-9*t/(duration*fade));

        samples[start+i]+=
          amplitude*envelope*
          Math.sin(2*Math.PI*e.f*ratio*t);
      }
    }
  }

  let peak=0;
  for(const sample of samples) {
    peak=Math.max(peak,Math.abs(sample));
  }

  if(!peak || length/rate>=30) {
    throw new Error('Invalid sound: '+filename);
  }

  const wav=Buffer.alloc(44+length*2);

  wav.write('RIFF',0);
  wav.writeUInt32LE(36+length*2,4);
  wav.write('WAVE',8);
  wav.write('fmt ',12);
  wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);
  wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(rate,24);
  wav.writeUInt32LE(rate*2,28);
  wav.writeUInt16LE(2,32);
  wav.writeUInt16LE(16,34);
  wav.write('data',36);
  wav.writeUInt32LE(length*2,40);

  for(let i=0;i<length;i++) {
    wav.writeInt16LE(
      Math.round(samples[i]/peak*.85*32767),
      44+i*2
    );
  }

  fs.writeFileSync(path.join(output,filename),wav);
}

let total=0;

for(const style of [
  'westminster',
  'bigben',
  'whittington',
  'stmichael',
  'canterbury',
  'cuckoo'
]) {
  for(let hour=1;hour<=12;hour++) {
    render(style,0,hour,`${style}-h${hour}.wav`);
    total++;
  }

  for(const minute of style==='cuckoo'?[30]:[15,30,45]) {
    render(style,minute,1,`${style}-m${minute}.wav`);
    total++;
  }
}

console.log(`Created ${total} chime recordings in ${output}`);
