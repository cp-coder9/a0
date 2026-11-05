import styles from './PhoneNumber.module.css';
/** Label only: the caller owns the single tel anchor. */
export function PhoneNumber({call=false,arrow=false}:{call?:boolean;arrow?:boolean}){return <span className={`phone-number ${styles.label}`}><span className={styles.lines}><span>{call?'Call ':''}0820SITRAK</span><span className={`phone-number-digits ${styles.digits}`}> (082 074 8725)</span></span>{arrow&&<span className={`phone-number-arrow ${styles.arrow}`} aria-hidden="true">→</span>}</span>}
