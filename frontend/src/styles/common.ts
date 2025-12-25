import type { CSSProperties } from "react";

// Note: Responsive styles are handled via CSS media queries in App.css

export const commonStyles: Record<string, CSSProperties> = {
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "1.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
    width: "100%",
  },
  heading: {
    marginBottom: "1rem",
  },
  subheading: {
    marginBottom: "0.75rem",
  },
  smallHeading: {
    marginBottom: "0.5rem",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: "0.75rem",
    overflow: "hidden", // Prevent content overflow
  },
  section: {
    marginTop: "1.25rem",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.75rem",
    alignItems: "end",
    marginBottom: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  label: {
    fontSize: "0.95rem",
    color: "#374151",
  },
  select: {
    padding: "0.75rem 0.5rem", // Larger padding for mobile
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    backgroundColor: "#fff",
    fontSize: "16px", // Prevent zoom on iOS
    fontFamily: "inherit",
    minHeight: "44px", // Touch target size
  },
  input: {
    width: "100%",
    padding: "0.75rem 0.5rem", // Larger padding for mobile
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "16px", // Prevent zoom on iOS
    minHeight: "44px", // Touch target size
  },
  textarea: {
    width: "100%",
    padding: "0.75rem 0.5rem", // Larger padding for mobile
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    resize: "vertical",
    fontSize: "16px", // Prevent zoom on iOS
    minHeight: "80px", // Better for mobile
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  checkboxLabel: {
    fontSize: "0.95rem",
  },
  button: {
    padding: "0.55rem 0.9rem",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    justifySelf: "start",
    minHeight: "44px", // Touch target size
    fontSize: "1rem", // Prevent zoom on iOS
    touchAction: "manipulation", // Improve touch responsiveness
  },
  error: {
    color: "#b91c1c",
    marginBottom: "0.75rem",
  },
  success: {
    color: "#065f46",
    marginBottom: "0.75rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    padding: "0.5rem 0.25rem",
  },
  td: {
    padding: "0.5rem 0.25rem",
    borderBottom: "1px solid #f3f4f6",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    padding: 0,
    textDecoration: "none",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  teamsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
  },
  scoreRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
    marginBottom: "0.75rem",
    alignItems: "end",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.35rem 0",
    borderBottom: "1px solid #f3f4f6",
  },
  muted: {
    color: "#6b7280",
    fontSize: "0.9rem",
  },
};

