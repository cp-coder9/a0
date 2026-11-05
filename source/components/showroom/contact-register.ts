// Dated contact/destination register.
// Single source for published contact destinations and the date each was added.
// South African numbers: national form is 10 digits with a leading 0;
// international/WhatsApp form drops the leading 0 and prefixes 27.
export type ContactChannel = 'whatsapp' | 'phone';
export type ContactRow = {
  id: string;
  channel: ContactChannel;
  /** Visible label shown to the user. */
  display: string;
  /** International digits for messaging links (no +, no leading 0). */
  international?: string;
  /** Resolved href actually published. */
  href: string;
  /** Accessible name used for the link. */
  label: string;
  /** ISO date this row entered the register. */
  addedOn: string;
  /** Provenance of the number itself, not a rights clearance. */
  source: string;
};
export const CONTACT_REGISTER_ADDED_ON = '2026-10-29';
export const contactRegister: readonly ContactRow[] = [
  {
    id: 'whatsapp-0609412357',
    channel: 'whatsapp',
    display: '060 941 2357',
    international: '27609412357',
    href: 'https://wa.me/27609412357',
    label: 'Chat on WhatsApp 060 941 2357',
    addedOn: CONTACT_REGISTER_ADDED_ON,
    source: 'Linktree/company profile; user-confirmed official WhatsApp',
  },
  {
    id: 'whatsapp-0820748725',
    channel: 'whatsapp',
    display: '082 074 8725',
    international: '27820748725',
    href: 'https://wa.me/27820748725',
    label: 'Chat on WhatsApp 082 074 8725',
    addedOn: CONTACT_REGISTER_ADDED_ON,
    source: 'User instruction 2026-10-29 ("add both number on the whatsapp")',
  },
  {
    id: 'tel-0820748725',
    channel: 'phone',
    display: '082 074 8725',
    href: 'tel:0820748725',
    label: 'Call the dealership 082 074 8725',
    addedOn: CONTACT_REGISTER_ADDED_ON,
    source: 'Existing dealership number already published site-wide; kept as telephone, not converted to WhatsApp',
  },
] as const;
export const whatsAppContacts = contactRegister.filter(row => row.channel === 'whatsapp');
/** Derive the international form; exported so tests assert the rule, not a literal. */
export function toInternational(national: string): string {
  return '27' + national.replace(/^0+/, '');
}
