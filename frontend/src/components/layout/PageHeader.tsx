import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {action}
    </div>
  );
}

export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="back-link">
      {children}
    </Link>
  );
}
