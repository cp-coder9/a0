// Verified against https://linktr.ee/trukafrik and the research inventory.
// Destinations only; no remote page instructions or runtime scraping.
export const officialSocialLinks={
 facebook:'https://www.facebook.com/trukafrik',
 instagram:'https://www.instagram.com/trukafrik',
 tiktok:'https://www.tiktok.com/@truk.afrik',
 whatsapp:'https://wa.me/27609412357',
} as const;
// Two official WhatsApp destinations (user instruction 2026-10-29: "add both number on the whatsapp").
// Numbers and their provenance now live in the dated contact register, not inline here.
// International form for South African numbers: drop the leading 0 and prefix 27.
export {whatsAppContacts as officialWhatsAppContacts} from './contact-register';
export const officialCompanyLinks={
 profile:'https://trukafrik.com/wp-content/uploads/2025/07/Truk-Afrik.pdf',
 website:'https://www.trukafrik.com/',
} as const;
