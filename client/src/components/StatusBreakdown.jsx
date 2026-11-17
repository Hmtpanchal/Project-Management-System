import { PROJECT_STATUS_OPTIONS } from '../utils/constants';

const tones = {
  planning: 'neutral',
  'in-progress': 'info',
  completed: 'success',
};

export default function StatusBreakdown({ counts = {}, total = 0, footer = null }) {
  return (
    <div className="status-breakdown">
      <div className="status-breakdown__list">
        {PROJECT_STATUS_OPTIONS.map((option) => {
          const count = counts[option.value] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={option.value} className="status-breakdown__item">
              <div className="status-breakdown__meta">
                <span className="status-breakdown__label">
                  <span className={`status-dot status-dot--${tones[option.value]}`} />
                  {option.label}
                </span>
                <span className="status-breakdown__count">
                  {count} <span>{percentage}%</span>
                </span>
              </div>
              <div className="progress">
                <span
                  className={`progress__bar progress__bar--${tones[option.value]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {total === 0 && <p className="status-breakdown__empty">No project activity yet.</p>}
      {footer && <div className="status-breakdown__footer">{footer}</div>}
    </div>
  );
}
