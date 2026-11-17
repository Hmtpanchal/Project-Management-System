import Logo from './Logo';

export function FullPageLoader({ label = 'Loading your workspace' }) {
  return (
    <div className="full-loader" role="status" aria-live="polite">
      <div className="full-loader__brand">
        <Logo />
      </div>
      <span className="spinner spinner--lg" />
      <p>{label}</p>
    </div>
  );
}

export function TableLoader({ columns = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="skeleton-row">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex}>
              <span
                className="skeleton"
                style={{ width: `${columnIndex === 0 ? 65 : 40 + ((rowIndex + columnIndex) % 4) * 12}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
