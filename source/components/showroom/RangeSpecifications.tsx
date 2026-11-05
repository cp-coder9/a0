import {
  rangeBulletin,
  rangeCategories,
  rangeModelById,
  rangeModelsByCategory,
  rangeSpecificationSource,
  type RangeModel,
  type RangeSpecGroup,
} from '../../lib/truck-range';
import {EnquiryButton} from '../Enquiry';
import './showroom.css';
import './range-specifications.css';

// How closely the SINOTRUK dealer site supports each attached dealer-bulletin row.
const MATCH_LABEL: Record<RangeModel['match'], {label: string; hint: string}> = {
  exact: {
    label: 'Published specification',
    hint: 'Published on the SINOTRUK dealer website for this model and configuration.',
  },
  closest: {
    label: 'Closest published configuration',
    hint: 'The dealer site publishes a different configuration for this model number. The figures shown are that published unit’s, not this bulletin row’s.',
  },
  'not-published': {
    label: 'Specification not published',
    hint: 'The dealer site does not publish this configuration, so no specification is shown.',
  },
};

const CATEGORY_LEAD: Record<(typeof rangeCategories)[number], string> = {
  'Long haul': '6×4 highway tractors for distance work: the SITRAK G7S and G7H family and the HOWO MAX.',
  Construction: '6×4 and 8×4 tippers, water bowsers and mixers from the HOWO TX range.',
};

const categoryAnchor = (category: (typeof rangeCategories)[number]) =>
  category.toLowerCase().replace(' ', '-');

function SummaryChip({label, value}: {label: string; value: string | null}) {
  if (!value) return null;
  return (
    <div className="range-specs-chip">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SpecGroupTable({model, group}: {model: RangeModel; group: RangeSpecGroup}) {
  return (
    <div className="range-specs-group">
      <h4>{group.title}</h4>
      <table className="range-specs-table">
        <caption className="sr-only">
          {model.name} — {group.title}
        </caption>
        <tbody>
          {group.rows.map(row => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnpublishedModel({model}: {model: RangeModel}) {
  const target = model.closest ? rangeModelById(model.closest.id) : undefined;
  return (
    <div className="range-specs-unpublished">
      <p>
        The SINOTRUK dealer website does not publish this configuration, so there is no
        specification to show for it. Nothing has been copied across from a different truck.
      </p>
      {model.closest && (
        <p>
          <a href={`#model-${model.closest.id}`}>
            {target
              ? `Compare the published ${target.name} — ${target.variant} configuration →`
              : `Compare the closest published configuration →`}
          </a>
        </p>
      )}
    </div>
  );
}

function ModelCard({model}: {model: RangeModel}) {
  const match = MATCH_LABEL[model.match];
  return (
    <article className={`range-specs-card range-specs-card--${model.match}`} id={`model-${model.id}`}>
      <figure className="range-specs-figure">
        <img
          src={model.image}
          alt={`${model.name} — ${model.variant}`}
          width={640}
          height={640}
          loading="lazy"
        />
        <figcaption>
          <span className="range-specs-row">Row {String(model.row).padStart(2, '0')}</span>
          <span className={`range-specs-match range-specs-match--${model.match}`} title={match.hint}>
            {match.label}
          </span>
        </figcaption>
      </figure>

      <div className="range-specs-copy">
        <p className="eyebrow sky">
          {model.brand} · {model.category}
        </p>
        <h3>{model.name}</h3>
        <p className="range-specs-variant">{model.variant}</p>
        <p className="range-specs-sheet">Dealer bulletin: {model.sheetName}</p>
        {model.imageNote && <p className="range-specs-imagenote">{model.imageNote}</p>}

        {model.match === 'not-published' ? (
          <UnpublishedModel model={model} />
        ) : (
          <>
            <dl className="range-specs-summary">
              <SummaryChip label="Rated power" value={model.summary.power} />
              <SummaryChip label="Emission" value={model.summary.euro} />
              <SummaryChip label="Transmission" value={model.summary.transmission} />
              <SummaryChip label="Drive" value={model.summary.drive} />
            </dl>

            <p className="range-specs-note">{model.matchNote}</p>

            <details className="range-specs-details">
              <summary>
                Full specifications &amp; engine
                <span aria-hidden="true">+</span>
              </summary>
              <div className="range-specs-details-body">
                {model.match === 'closest' && model.source?.publishedApplication && (
                  <p className="range-specs-warning">
                    <strong>Different published configuration.</strong> The figures below are
                    published by SINOTRUK dealer for “{model.source.publishedApplication}”, not
                    for the {model.sheetName}. Treat them as the closest published reference only.
                  </p>
                )}
                {model.groups.map(group => (
                  <SpecGroupTable key={group.id} model={model} group={group} />
                ))}
                {model.caveats.length > 0 && (
                  <div className="range-specs-caveats">
                    <h4>Notes and caveats</h4>
                    <ul>
                      {model.caveats.map(caveat => (
                        <li key={caveat}>{caveat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </>
        )}

        {model.source && (
          <p className="range-specs-source">
            Source:{' '}
            <a href={model.source.url} target="_blank" rel="noopener noreferrer">
              SINOTRUK dealer — {model.source.publishedApplication ?? model.name}
            </a>{' '}
            <span>· captured {model.source.fetched}</span>
          </p>
        )}
      </div>
    </article>
  );
}

export function RangeSpecifications() {
  const totalModels = rangeCategories.reduce((total, category) => total + rangeModelsByCategory(category).length, 0);
  return (
    <div className="range-specifications">
      <section className="range-specs-intro" aria-labelledby="range-specs-title">
        <p className="eyebrow gold">Truk Afrik / The range</p>
        <h1 id="range-specs-title">
          Every truck.
          <br />
          Fully specified.
        </h1>
        <div className="range-specs-intro-copy">
          <p>
            The {totalModels} models on the current SINOTRUK South Africa dealer bulletin, with the
            engine, driveline and specification detail published by the SINOTRUK dealer
            website. Where that site publishes no matching configuration, the row says so rather
            than borrowing another truck’s figures.
          </p>
          <p className="range-specs-source-note">
            Specification source:{' '}
            <a href={rangeSpecificationSource.site} target="_blank" rel="noopener noreferrer">
              SINOTRUK dealer
            </a>{' '}
            (captured {rangeSpecificationSource.captured}). Model list: {rangeBulletin.issuer}{' '}
            dealer bulletin SALES-2026/02, effective 1 September 2026. No pricing is published on
            this site.
          </p>
          <EnquiryButton className="button primary">Enquire about the range</EnquiryButton>
        </div>
      </section>

      <nav className="range-specs-jump" aria-label="Range categories">
        {rangeCategories.map(category => (
          <a key={category} href={`#${categoryAnchor(category)}`}>
            {category}
            <span>{rangeModelsByCategory(category).length} models</span>
          </a>
        ))}
      </nav>

      {rangeCategories.map(category => (
        <section
          className="range-specs-category"
          key={category}
          id={categoryAnchor(category)}
          aria-labelledby={`${categoryAnchor(category)}-title`}
        >
          <header className="range-specs-category-heading">
            <p className="eyebrow gold">{category}</p>
            <h2 id={`${categoryAnchor(category)}-title`}>{category} range</h2>
            <p>{CATEGORY_LEAD[category]}</p>
          </header>
          <div className="range-specs-grid">
            {rangeModelsByCategory(category).map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </section>
      ))}

    </div>
  );
}
