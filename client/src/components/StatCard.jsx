import Icon from './ui/Icon';

export default function StatCard({ label, value, detail, icon = 'activity', tone = 'indigo', loading = false }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon">
          <Icon name={icon} size={21} />
        </span>
        {detail && !loading && <span className="stat-card__detail">{detail}</span>}
      </div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        {loading ? (
          <span className="skeleton skeleton--value" />
        ) : (
          <span className="stat-card__value">{Number(value || 0).toLocaleString()}</span>
        )}
      </div>
    </article>
  );
}
