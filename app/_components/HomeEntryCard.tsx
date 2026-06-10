type HomeEntryCardProps = {
  title: string;
  description: string;
  helper: string;
};

export function HomeEntryCard({
  title,
  description,
  helper,
}: HomeEntryCardProps) {
  return (
    <article className="home-entry-card">
      <h2>{title}</h2>
      <p className="home-entry-description">{description}</p>
      <p className="home-entry-helper">{helper}</p>
    </article>
  );
}
