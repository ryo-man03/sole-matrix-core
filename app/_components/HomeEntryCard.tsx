type HomeEntryCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
};

export function HomeEntryCard({
  eyebrow,
  title,
  description,
  items,
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
    </article>
  );
}
