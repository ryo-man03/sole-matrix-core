export function AdminTable({ caption, rows, columns }: Readonly<{ caption: string; rows: readonly Record<string, unknown>[]; columns: readonly string[] }>) {
  return <div className="admin-table-wrap"><table className="admin-table"><caption>{caption}</caption><thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>
    {rows.length ? rows.map((row, index) => <tr key={String(row.id ?? `${caption}-${index}`)}>{columns.map((column) => <td key={column}>{display(row[column])}</td>)}</tr>) : <tr><td colSpan={columns.length}>表示できる記録はありません。</td></tr>}
  </tbody></table></div>;
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value.length > 180 ? `${value.slice(0, 177)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const encoded = JSON.stringify(value);
  return encoded.length > 180 ? `${encoded.slice(0, 177)}…` : encoded;
}
