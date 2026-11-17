import logoUrl from '../../assets/logo.svg';

export default function Logo({ light = false, compact = false, subtitle = null }) {
  return (
    <span className={`brand ${light ? 'brand--light' : ''}`}>
      <img className="brand__mark" src={logoUrl} alt="" width="38" height="38" />
      {!compact && (
        <span className="brand__text">
          <span className="brand__name">Orbit</span>
          {subtitle && <span className="brand__subtitle">{subtitle}</span>}
        </span>
      )}
    </span>
  );
}
