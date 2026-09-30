/* Focus intervals follow elapsed time from Start, not wall-clock quarter hours. */
(function(root){
  'use strict';
  const choices=[5,10,15,25,30,60];
  const interval=value=>choices.includes(Number(value))?Number(value):25;
  function nextAt(anchor,value,now=Date.now()){
    if(!Number.isFinite(anchor)||anchor<=0)return null;
    const period=interval(value)*60000;
    return anchor+Math.max(1,Math.floor((now-anchor)/period)+1)*period;
  }
  function dueAt(anchor,value,now=Date.now()){
    if(!Number.isFinite(anchor)||anchor<=0)return null;
    const period=interval(value)*60000,n=Math.floor((now-anchor)/period);
    if(n<1)return null;
    const due=anchor+n*period;
    return now-due<1500?due:null; // Never replay missed intervals on reopening.
  }
  function nextTimes(anchor,value,count,isQuiet,now=Date.now()){
    const result=[],period=interval(value)*60000,end=now+15*24*60*60000;
    let t=nextAt(anchor,value,now);
    if(t===null)return result;
    for(;t<end&&result.length<count;t+=period){
      const date=new Date(t);if(!isQuiet(date))result.push(date);
    }
    return result;
  }
  const api={choices,interval,nextAt,dueAt,nextTimes};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FocusIntervals=api;
})(typeof globalThis!=='undefined'?globalThis:this);
