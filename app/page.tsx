import { ClientImportSmoke } from "./_components/ClientImportSmoke";

export default function Page() {
  return (
    <main className="setup-page">
      <section className="setup-panel" aria-labelledby="setup-title">
        <p className="setup-kicker">SOLE//MATRIX Core v0.1</p>
        <h1 id="setup-title">SOLE//MATRIX</h1>
        <p className="setup-copy">Web UI setup check</p>
        <ClientImportSmoke />
      </section>
    </main>
  );
}
