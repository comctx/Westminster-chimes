/* Local-time quiet windows; overnight days refer to the day the window starts. */
(function(root){
  'use strict';
  const allDays=[0,1,2,3,4,5,6];
  const minutes=s=>{const m=/^(\d{2}):(\d{2})$/.exec(s||'');return m&&+m[1]<24&&+m[2]<60?+m[1]*60 + +m[2]:null;};
  function valid(s){return s&&typeof s.name==='string'&&typeof s.enabled==='boolean'&&minutes(s.start)!==null&&minutes(s.end)!==null&&Array.isArray(s.days)&&s.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6);}
  function active(s,date){
    if(!valid(s)||!s.enabled)return false;
    const start=minutes(s.start),end=minutes(s.end),now=date.getHours()*60+date.getMinutes(),day=date.getDay();
    if(start===end)return s.days.includes(day); // All day on selected days.
    if(start<end)return s.days.includes(day)&&now>=start&&now<end;
    return (now>=start&&s.days.includes(day))||(now<end&&s.days.includes((day+6)%7));
  }
  const isQuiet=(schedules,date)=>schedules.some(s=>active(s,date));
  function load(storage){
    try{const saved=JSON.parse(storage.getItem('quietSchedulesV1'));if(Array.isArray(saved)&&saved.every(valid))return saved;}catch(e){}
    const legacyHour=(key,fallback)=>{const v=storage.getItem(key);return v!==null&&/^\d{1,2}$/.test(v)&&+v<24?String(+v).padStart(2,'0')+':00':fallback;};
    return [
      {name:'Sleep',enabled:storage.getItem('quietEnabled')==='true',start:legacyHour('quietStart','22:00'),end:legacyHour('quietEnd','07:00'),days:[...allDays]},
      {name:'Work',enabled:false,start:'09:00',end:'17:00',days:[1,2,3,4,5]},
      {name:'Weekend',enabled:false,start:'00:00',end:'10:00',days:[0,6]}
    ];
  }
  function nextTimes(schedules,allowedMinutes,count,now=new Date()){
    const result=[],cursor=new Date(now);cursor.setSeconds(0,0);cursor.setMinutes(cursor.getMinutes()+1);
    const end=new Date(cursor);end.setDate(end.getDate()+15);
    while(cursor<end&&result.length<count){
      if(allowedMinutes.includes(cursor.getMinutes())&&!isQuiet(schedules,cursor))result.push(new Date(cursor));
      cursor.setMinutes(cursor.getMinutes()+1);
    }
    return result;
  }
  function plan(schedules,allowedMinutes,now=new Date()){
    // Use calendar repeats if the full daily/weekly pattern fits iOS's 64 limit.
    const week=Array.from({length:7},()=>[]);
    for(let day=0;day<7;day++)for(let hour=0;hour<24;hour++)for(const minute of allowedMinutes){
      const date=new Date(2024,0,7+day,hour,minute);
      if(!isQuiet(schedules,date))week[day].push({hour,minute});
    }
    const same=week.every(d=>JSON.stringify(d)===JSON.stringify(week[0]));
    if(same&&week[0].length<=64)return {kind:'daily',times:week[0]};
    const times=week.flatMap((slots,day)=>slots.map(t=>({...t,weekday:day+1})));
    if(times.length<=64)return {kind:'weekly',times};
    return {kind:'rolling',times:nextTimes(schedules,allowedMinutes,64,now)};
  }
  const api={minutes,valid,active,isQuiet,load,nextTimes,plan};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.QuietSchedules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
