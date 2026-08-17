import type { ReactNode } from "react";
import { useIsMobile } from "../../hooks/useMediaQuery";

export interface ResponsiveColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  getRowKey,
  actions,
  emptyMessage,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  const mobileColumns = columns.filter((column) => !column.hideOnMobile);

  if (data.length === 0 && emptyMessage) {
    return <p>{emptyMessage}</p>;
  }

  if (isMobile) {
    return (
      <div className="data-list">
        {data.map((row) => (
          <article key={getRowKey(row)} className="data-card">
            {mobileColumns.map((column) => (
              <div key={column.key} className="data-card-row">
                <span className="data-card-label">{column.header}</span>
                <span className="data-card-value">{column.render(row)}</span>
              </div>
            ))}
            {actions && <div className="data-card-actions">{actions(row)}</div>}
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
            {actions && <th>{/* actions */}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
              {actions && <td className="table-actions">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
