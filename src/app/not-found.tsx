import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="brand-mark">VE</span>
      <h1>Signal not found</h1>
      <p>That report or page is not available.</p>
      <Link className="primary-button" href="/">
        Back to live feed
      </Link>
    </main>
  );
}
