import Icon from './Icon';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination) return null;

  const { page, pages, total, limit } = pagination;
  const firstRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <p className="pagination__summary">
        Showing <strong>{firstRecord}</strong>–<strong>{lastRecord}</strong> of{' '}
        <strong>{total}</strong>
      </p>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <Icon name="chevron-left" size={17} />
        </button>
        <span className="pagination__page">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className="pagination__button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <Icon name="chevron-right" size={17} />
        </button>
      </div>
    </div>
  );
}
