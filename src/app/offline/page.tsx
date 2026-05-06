import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="not-found">
      <span className="brand-mark">VE</span>
      <h1>Offline mode</h1>
      <p>Cached VisionEcho pages are available. New reports will need a connection in this MVP build.</p>
      <Link className="primary-button" href="/">
        Back to cached feed
      </Link>
    </main>
  );
}
