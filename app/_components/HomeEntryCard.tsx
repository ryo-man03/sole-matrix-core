type HomeEntryCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  href: string;
  actionLabel: string;
};

export function HomeEntryCard({
  eyebrow,
  title,
  description,
  items,
  href,
  actionLabel,
}: HomeEntryCardProps) {
  return (
    <article className="home-entry-card">
      <p className="home-entry-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="home-entry-description">{description}</p>
      <ul className="home-entry-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <a className="home-entry-action" href={href}>
        {actionLabel}<span aria-hidden="true">→</span>
      </a>
    </article>
  );
}
