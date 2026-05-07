"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, BadgeCheck, Camera, Eye, Landmark, LogIn, Radio, ShieldCheck, Users } from "lucide-react";

export function LandingPage() {
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [message, setMessage] = useState("");

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const body =
      authMode === "signup"
        ? { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") }
        : { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };

    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) {
      setMessage(authMode === "signup" ? "We could not create that account yet." : "Login failed. Check your details.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <a className="brand" href="/" aria-label="VisionEcho Live home">
          <span className="brand-mark">VE</span>
          <span>
            <strong>VisionEcho</strong>
            <small>Live</small>
          </span>
        </a>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="eyebrow">Independent civic newsroom</p>
            <h1>When the street sees it, the nation should hear it.</h1>
            <p>
              VisionEcho Live gives ordinary Nigerians a trusted way to document public life, while reporters and editors turn raw
              eyewitness signals into verified civic news.
            </p>
            <div className="landing-actions">
              <a className="primary-button" href="#access">
                Tell Your Story
                <ArrowRight />
              </a>
            </div>
          </div>
          <div className="landing-signal" aria-label="VisionEcho civic signal stack">
            <article>
              <Radio />
              <strong>Live evidence</strong>
              <span>Video, audio, image, location, and text from the field.</span>
            </article>
            <article>
              <ShieldCheck />
              <strong>Editor verification</strong>
              <span>Stories are reviewed before they carry the verified label.</span>
            </article>
            <article>
              <Users />
              <strong>People-powered news</strong>
              <span>Citizens, reporters, and editors working in one civic loop.</span>
            </article>
          </div>
        </section>

        <section className="story-band" id="why">
          <div>
            <p className="eyebrow">Our reason</p>
            <h2>Free press should not only speak from a desk.</h2>
          </div>
          <div className="story-copy">
            <p>
              Across Nigeria, public truth often begins quietly: a phone raised during a tense roadside stop, a market woman explaining
              what a new levy really means, a student recording the moment a peaceful crowd is met with force, a community asking why a
              promised road disappears after campaign season.
            </p>
            <p>
              We built VisionEcho for those moments. Not to replace journalism, but to widen its ears. The people closest to an event
              deserve a safe, structured way to show what happened, and the public deserves editors who can verify before amplifying.
            </p>
          </div>
        </section>

        <section className="mission-grid">
          <article>
            <Eye />
            <h3>Witnesses keep the first record.</h3>
            <p>Eyewitnesses can submit what they saw with media, location, and context instead of watching their experience disappear.</p>
          </article>
          <article>
            <BadgeCheck />
            <h3>Reporters earn trust.</h3>
            <p>Reporter accounts go through KYC, then submit stories that editors can verify and publish with confidence.</p>
          </article>
          <article>
            <Landmark />
            <h3>Power gets documented.</h3>
            <p>From everyday service failures to public officials avoiding accountability, civic memory becomes harder to erase.</p>
          </article>
          <article>
            <Camera />
            <h3>The field comes live.</h3>
            <p>Go Live lets users open the camera, record what is happening, and attach evidence to a report from the dashboard.</p>
          </article>
        </section>

        <section className="how-band" id="how">
          <p className="eyebrow">How it works</p>
          <div className="how-steps">
            <span>1. Create an account</span>
            <span>2. Submit eyewitness reports</span>
            <span>3. Apply for reporter KYC</span>
            <span>4. Editors verify stories</span>
            <span>5. The public sees trusted civic updates</span>
          </div>
        </section>

        <section className="access-grid" id="access">
          <div>
            <p className="eyebrow">Access newsroom</p>
            <h2>{authMode === "signup" ? "Create your VisionEcho account" : "Login to VisionEcho"}</h2>
            <p>
              Everyone starts as a civic user. Admins decide who becomes an editor, and reporters complete KYC before publishing as verified field reporters.
            </p>
          </div>
          <form className="landing-auth" onSubmit={submitAuth}>
            {authMode === "signup" ? (
              <label>
                Full name
                <input name="name" required placeholder="Your name" />
              </label>
            ) : null}
            <label>
              Email
              <input name="email" type="email" required placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input name="password" type="password" required minLength={8} placeholder="Minimum 8 characters" />
            </label>
            <button className="primary-button wide" type="submit">
              {authMode === "signup" ? "Create account" : "Login"}
              <LogIn />
            </button>
            <button className="ghost-button" type="button" onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}>
              {authMode === "signup" ? "I already have an account" : "Create a new account"}
            </button>
            {message ? <p className="auth-message">{message}</p> : null}
          </form>
        </section>
      </main>
    </div>
  );
}
