'use client';
// The footer "Replay intro" control. The previous implementation dispatched a
// `trukafrik:intro-replay` event and left re-arming to the splash; Tess measured it as silently
// doing nothing on the served build (splash never returned, sessionStorage key stayed "1").
// This version does the only thing that is deterministic by construction: clear BOTH intro flags,
// then reload, so the intro decision runs from a clean state on a fresh document. Key names come
// from components/intro/IntroSplash.tsx.
const SESSION_KEY='truk-afrik:intro:v1';
const FIRST_VISIT_KEY='truk-afrik:intro:v1:seen';
export function IntroReplay(){return <button type="button" className="intro-replay showroom-replay" onClick={()=>{try{window.sessionStorage.removeItem(SESSION_KEY);window.localStorage.removeItem(FIRST_VISIT_KEY)}catch{}window.location.reload()}}>Replay intro ↺</button>;}
