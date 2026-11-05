import {officialCompanyLinks} from './official-links';
import './official-company-links.css';
export function OfficialCompanyLinks(){return <div className="official-company-links" role="group" aria-label="Company information"><p className="eyebrow gold">Company information</p><a href={officialCompanyLinks.profile} target="_blank" rel="noopener noreferrer">Company profile (PDF)<span aria-hidden="true">↗</span></a><a href={officialCompanyLinks.website} target="_blank" rel="noopener noreferrer">Company website<span aria-hidden="true">↗</span></a></div>}
