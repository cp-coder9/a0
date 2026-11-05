/** Optional synthesized metal strike. Never starts audio without a user gesture. */
export function createMetalAudio(){
 let context,master,enabled=false;
 async function setEnabled(value){
  if(!value){enabled=false;if(master)master.gain.value=0;return false}
  try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;
   context??=new Audio();if(!master){master=context.createGain();master.connect(context.destination)}master.gain.value=.4;await context.resume();enabled=context.state==='running';return enabled;
  }catch{return false}
 }
 function play(){
  if(!enabled||!context||context.state!=='running')return;
  const now=context.currentTime;
  function tone(frequency,volume,duration,type='sine',end){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now);if(end)oscillator.frequency.exponentialRampToValueAtTime(end,now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.003);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);oscillator.connect(gain);gain.connect(master);oscillator.start(now);oscillator.stop(now+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}}
  tone(170,.85,.28,'sine',42);
  for(const [index,frequency] of [540,925,1470,2110,3160].entries())tone(frequency,.11/(index+1),.95-index*.09,'sine');
  const buffer=context.createBuffer(1,Math.round(context.sampleRate*.12),context.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,3);
  const noise=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();noise.buffer=buffer;filter.type='highpass';filter.frequency.value=1900;gain.gain.value=.22;noise.connect(filter);filter.connect(gain);gain.connect(master);noise.start(now);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect()};
 }
 return {setEnabled,play,dispose(){enabled=false;context?.close().catch(()=>{})}};
}
