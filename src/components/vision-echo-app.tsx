"use client";

import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Construction,
  Eye,
  HeartHandshake,
  Landmark,
  LineChart,
  ListFilter,
  MapPin,
  MessageCircle,
  Mic2,
  Moon,
  Newspaper,
  Paperclip,
  Radio,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  StopCircle,
  Sun,
  Timer,
  UploadCloud,
  UserRound,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Category, KycSubmission, MediaType, PublicUser, Report, ReporterProfile, ReportStatus, UserRole } from "@/lib/types";

type AppProps = {
  initialCategories: Category[];
  initialReporters: ReporterProfile[];
  initialReports: Report[];
  initialCategory?: string;
};

type StatusFilter = "all" | "live" | ReportStatus;

const iconMap = {
  Landmark,
  Building2,
  ShieldAlert,
  Construction,
  LineChart,
  HeartHandshake,
  Newspaper,
};

const statusLabels: Record<ReportStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  needs_more_info: "Needs info",
  verified: "Verified",
  rejected: "Rejected",
  archived: "Archived",
  flagged: "Flagged",
};

function formatTime(value: string) {
  const diff = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (diff < 60) return `${diff} min ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

export function VisionEchoApp({ initialCategories, initialReporters, initialReports, initialCategory = "all" }: AppProps) {
  const [reports, setReports] = useState(initialReports);
  const [categories] = useState(initialCategories);
  const [reporters, setReporters] = useState(initialReporters);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([]);
  const [myKyc, setMyKyc] = useState<KycSubmission | null>(null);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("");
  const [mediaPreview, setMediaPreview] = useState<{ type: MediaType; url: string; name?: string } | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const visibleReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports
      .filter((report) => report.status !== "rejected" && report.status !== "archived")
      .filter((report) => activeCategory === "all" || report.categorySlug === activeCategory)
      .filter((report) => {
        if (activeStatus === "all") return true;
        if (activeStatus === "live") return report.live;
        return report.status === activeStatus;
      })
      .filter((report) => {
        if (!q) return true;
        return `${report.title} ${report.body} ${report.locationName} ${report.authorName} ${report.state}`.toLowerCase().includes(q);
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [activeCategory, activeStatus, reports, search]);

  const selectedCategory = categories.find((category) => category.slug === activeCategory);
  const liveCount = reports.filter((report) => report.live && report.status !== "rejected").length;
  const verifiedCount = reports.filter((report) => report.status === "verified").length;
  const queueCount = reports.filter((report) => report.status === "in_review").length;
  const stateCount = new Set(reports.filter((report) => report.status !== "rejected").map((report) => report.state)).size;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    refreshSession();
  }, []);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2300);
  }

  async function refreshReports() {
    const response = await fetch("/api/reports", { cache: "no-store" });
    const data = (await response.json()) as { reports: Report[] };
    setReports(data.reports);
  }

  async function refreshSession() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = (await response.json()) as {
      user: PublicUser | null;
      users: PublicUser[];
      kycSubmissions: KycSubmission[];
      myKyc: KycSubmission | null;
    };
    setCurrentUser(data.user);
    setUsers(data.users);
    setKycSubmissions(data.kycSubmissions);
    setMyKyc(data.myKyc);

    const reporterResponse = await fetch("/api/reporters", { cache: "no-store" });
    const reporterData = (await reporterResponse.json()) as { reporters: ReporterProfile[] };
    setReporters(reporterData.reporters);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setUsers([]);
    setKycSubmissions([]);
    setMyKyc(null);
    flash("Signed out");
  }

  async function submitKyc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/kyc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) {
      flash("KYC needs more detail");
      return;
    }
    event.currentTarget.reset();
    await refreshSession();
    flash("Reporter KYC submitted");
  }

  async function updateRole(userId: string, role: UserRole) {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      flash("Could not update role");
      return;
    }
    await refreshSession();
    flash("Role updated");
  }

  async function reviewKyc(submissionId: string, status: "approved" | "rejected") {
    const response = await fetch(`/api/admin/kyc/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewerNote: status === "approved" ? "Approved by admin" : "Rejected by admin" }),
    });
    if (!response.ok) {
      flash("Could not review KYC");
      return;
    }
    await refreshSession();
    flash(status === "approved" ? "Reporter verified" : "KYC rejected");
  }

  async function toDataUrl(file: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function openLiveCamera() {
    if (!currentUser) {
      flash("Create an account or log in first");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      flash("Camera recording is not supported on this device");
      return;
    }
    setLiveOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
  }

  function closeLiveCamera() {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecording(false);
    setLiveOpen(false);
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setMediaPreview({ type: "video", url: await toDataUrl(blob), name: `live-report-${Date.now()}.webm` });
      closeLiveCamera();
      document.querySelector("#submit")?.scrollIntoView({ behavior: "smooth" });
      flash("Live recording attached");
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) {
      flash("Login required to submit reports");
      return;
    }
    const form = new FormData(event.currentTarget);
    const isVerifiedReporter = currentUser.role === "reporter" && currentUser.reporterVerified;
    const media = mediaPreview
      ? [
          {
            id: `m-${Date.now()}`,
            type: mediaPreview.type,
            url: mediaPreview.url,
            name: mediaPreview.name,
            status: "uploaded" as const,
          },
        ]
      : [];

    const body = {
      title: String(form.get("title") ?? ""),
      body: String(form.get("body") ?? ""),
      categorySlug: String(form.get("categorySlug") ?? "governance"),
      locationName: String(form.get("locationName") ?? ""),
      state: String(form.get("state") ?? "Unknown"),
      sourceType: isVerifiedReporter ? "Reporter" : "Eyewitness",
      authorId: currentUser.id,
      authorName: currentUser.name,
      reporterId: isVerifiedReporter ? currentUser.id : undefined,
      live: true,
      priority: form.get("priority") === "breaking" ? "breaking" : "normal",
      status: "in_review",
      media,
      evidence: [
        {
          id: `e-${Date.now()}-a`,
          label: mediaPreview ? `${mediaPreview.type} uploaded` : "Text report",
          type: mediaPreview ? ("media" as const) : ("document" as const),
          confidence: 58,
        },
        { id: `e-${Date.now()}-b`, label: "Location submitted", type: "location" as const, confidence: 72 },
      ],
    };

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      flash("Report needs more detail");
      return;
    }

    event.currentTarget.reset();
    setMediaPreview(null);
    await refreshReports();
    setActiveCategory("all");
    setActiveStatus("all");
    flash("Report submitted to editor queue");
    document.querySelector("#feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function addComment(report: Report, text: string) {
    if (!currentUser) {
      flash("Login required to comment");
      return;
    }
    const response = await fetch(`/api/reports/${report.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Reader", text }),
    });

    if (!response.ok) {
      flash("Could not add comment");
      return;
    }

    await refreshReports();
    flash("Comment added");
  }

  async function reviewReport(report: Report, decision: "approve" | "reject") {
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "editor")) {
      flash("Editor access required");
      return;
    }
    const response = await fetch(`/api/editor/reports/${report.id}/${decision}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: decision === "approve" ? "Checks passed in MVP editor desk." : "Rejected by editor desk." }),
    });

    if (!response.ok) {
      flash("Editor action failed");
      return;
    }

    await refreshReports();
    flash(decision === "approve" ? "Story marked verified" : "Story rejected");
  }

  async function shareReport(report: Report) {
    const url = `${window.location.origin}/report/${report.slug}`;
    const shareData = { title: report.title, text: `${report.title} - ${report.locationName}`, url };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard.writeText(url);
    flash("Report link copied");
  }

  function setReporterSearch(name: string) {
    setSearch(name);
    document.querySelector("#feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={`app-shell ${dark ? "dark" : ""}`}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="VisionEcho Live home">
          <span className="brand-mark">VE</span>
          <span>
            <strong>VisionEcho</strong>
            <small>Live</small>
          </span>
        </a>

        <nav className="topnav" aria-label="Primary">
          <a href="#feed">Live Feed</a>
          <a href="#submit">Submit</a>
          <a href="#editor">Editor Desk</a>
          <a href="#profiles">Profiles</a>
          <a href="/">Story</a>
        </nav>

        <div className="top-actions">
          <button className="icon-button" type="button" aria-label="Toggle theme" title="Toggle theme" onClick={() => setDark((value) => !value)}>
            {dark ? <Sun /> : <Moon />}
          </button>
          <button className="primary-button" type="button" onClick={openLiveCamera}>
            <Radio />
            Go Live
          </button>
        </div>
      </header>

      <main>
        <section className="command-band" aria-labelledby="dashboardTitle">
          <div className="command-copy">
            <p className="eyebrow">Civic signal room</p>
            <h1 id="dashboardTitle">VisionEcho Live</h1>
            <p>Field reports, reporter stories, and editor-verified civic updates moving across Nigeria in real time.</p>
            <button className="primary-button hero-live-button" type="button" onClick={openLiveCamera}>
              <Radio />
              Go Live
            </button>
          </div>

          <div className="signal-grid" aria-label="Live newsroom status">
            <StatusMetric value={liveCount} label="Live reports" />
            <StatusMetric value={verifiedCount} label="Verified" />
            <StatusMetric value={queueCount} label="In review" />
            <StatusMetric value={stateCount} label="States covered" />
          </div>
        </section>

        <section className="workspace-grid">
          <aside className="sidebar" aria-label="News controls">
            <Panel compact title="Categories" action={<button className="ghost-button tiny" onClick={() => setActiveCategory("all")} type="button">Clear</button>}>
              <div className="category-list">
                <FilterChip label="All" count={reports.length} active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
                {categories.map((category) => (
                  <FilterChip
                    key={category.id}
                    label={category.name}
                    count={reports.filter((report) => report.categorySlug === category.slug && report.status !== "rejected").length}
                    active={activeCategory === category.slug}
                    onClick={() => setActiveCategory(category.slug)}
                  />
                ))}
              </div>
            </Panel>

            <Panel compact title="Verification">
              <div className="status-list">
                <FilterChip label="All" count={reports.length} active={activeStatus === "all"} onClick={() => setActiveStatus("all")} />
                <FilterChip label="Live" count={liveCount} active={activeStatus === "live"} onClick={() => setActiveStatus("live")} />
                <FilterChip label="Verified" count={verifiedCount} active={activeStatus === "verified"} onClick={() => setActiveStatus("verified")} />
                <FilterChip label="Review" count={queueCount} active={activeStatus === "in_review"} onClick={() => setActiveStatus("in_review")} />
              </div>
            </Panel>

            <Panel compact title="Field Map">
              <div className="mini-map" aria-label="Nigeria field report map">
                <span className="map-pin lagos" title="Lagos" />
                <span className="map-pin abuja" title="Abuja" />
                <span className="map-pin kano" title="Kano" />
                <span className="map-pin rivers" title="Rivers" />
              </div>
              <div className="map-legend">
                <span><b /> Eyewitness</span>
                <span><b /> Reporter</span>
              </div>
            </Panel>
          </aside>

          <section className="feed-column" id="feed" aria-labelledby="feedTitle">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Now tracking</p>
                <h2 id="feedTitle">Live Feed</h2>
              </div>
              <label className="search-box">
                <Search />
                <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search reports, places, reporters" />
              </label>
            </div>

            <div className="category-page">
              <div>
                <h3>{selectedCategory ? `${selectedCategory.name} Page` : "All Categories"}</h3>
                <p>
                  {selectedCategory?.summary ??
                    "Scan live and verified civic signals across elections, governance, security, infrastructure, economy, and community life."}
                </p>
              </div>
              <div className="category-score">
                <strong>{visibleReports.length}</strong>
                <small>matching</small>
              </div>
            </div>

            <div className="feed-list">
              {visibleReports.length ? (
                visibleReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    category={categories.find((category) => category.slug === report.categorySlug)}
                    onShare={() => shareReport(report)}
                    onReporter={() => setReporterSearch(report.authorName)}
                    onComment={(text) => addComment(report, text)}
                  />
                ))
              ) : (
                <div className="empty-state">No live civic reports yet. Sign in and submit the first verified signal from the field.</div>
              )}
            </div>
          </section>

          <aside className="right-rail">
            <Panel eyebrow="Session" title={currentUser ? "Your Access" : "Access Required"} icon={<UserRound />}>
              {currentUser ? (
                <div className="account-summary">
                  <div>
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="evidence-row">
                    <Pill icon={<UserRound />} text={currentUser.role} variant={currentUser.role === "admin" || currentUser.role === "editor" ? "verified" : "review"} />
                    <Pill icon={<BadgeCheck />} text={`KYC: ${currentUser.kycStatus}`} variant={currentUser.reporterVerified ? "verified" : "review"} />
                  </div>
                  <button className="ghost-button" type="button" onClick={logout}>Sign out</button>
                </div>
              ) : (
                <div className="empty-state">
                  Login from the landing page to submit reports, complete KYC, comment, or use the editor desk.
                  <a className="primary-button wide inline-dashboard-link" href="/#access">Login or create account</a>
                </div>
              )}
            </Panel>

            <Panel id="submit" eyebrow="Eyewitness desk" title="Post Report" icon={<UploadCloud />}>
              <form className="report-form" onSubmit={submitReport}>
                <label>
                  Title
                  <input name="title" required maxLength={120} placeholder="What is happening?" />
                </label>
                <label>
                  Category
                  <select name="categorySlug" required defaultValue={categories[0]?.slug}>
                    {categories.map((category) => (
                      <option value={category.slug} key={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Location
                  <div className="location-row">
                    <input name="locationName" required placeholder="City, state" />
                    <button
                      className="icon-button"
                      type="button"
                      aria-label="Use current location"
                      title="Use current location"
                      onClick={() => {
                        navigator.geolocation?.getCurrentPosition(
                          (position) => flash(`Location captured: ${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`),
                          () => flash("Location permission not granted"),
                        );
                      }}
                    >
                      <MapPin />
                    </button>
                  </div>
                </label>
                <label>
                  State
                  <input name="state" required placeholder="Lagos, Kano, Rivers..." />
                </label>
                <label>
                  Report
                  <textarea name="body" required rows={4} placeholder="Add what you saw, who was present, and what can be verified." />
                </label>
                <label>
                  Priority
                  <select name="priority" defaultValue="normal">
                    <option value="normal">Normal</option>
                    <option value="breaking">Breaking</option>
                  </select>
                </label>
                <label>
                  Media
                  <input
                    name="media"
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (!file) {
                        setMediaPreview(null);
                        return;
                      }
                      const type = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";
                      toDataUrl(file).then((url) => setMediaPreview({ type, url, name: file.name })).catch(() => flash("Could not read media"));
                    }}
                  />
                </label>
                <MediaPreview preview={mediaPreview} />
                {currentUser?.role === "reporter" && currentUser.reporterVerified ? (
                  <p className="form-note">This will be submitted as a verified reporter story and sent to editors for approval.</p>
                ) : (
                  <p className="form-note">This will be submitted as an eyewitness report. Complete reporter KYC to submit reporter stories.</p>
                )}
                <button className="primary-button wide" type="submit">
                  <Send />
                  Submit for Review
                </button>
              </form>
            </Panel>

            <Panel id="kyc" eyebrow="Reporter verification" title="Reporter KYC" icon={<BadgeCheck />}>
              {currentUser ? (
                currentUser.reporterVerified ? (
                  <div className="empty-state">Your reporter profile is verified. Submitted stories will carry reporter status.</div>
                ) : myKyc?.status === "pending" ? (
                  <div className="empty-state">Your KYC is pending admin review.</div>
                ) : (
                  <form className="report-form" onSubmit={submitKyc}>
                    <label>Full legal name<input name="fullName" required /></label>
                    <label>Phone<input name="phone" required /></label>
                    <label>Base location<input name="location" required placeholder="City, state" /></label>
                    <label>Reporting beat<input name="beat" required placeholder="Elections, security, governance..." /></label>
                    <label>Experience<textarea name="experience" required rows={3} placeholder="Tell editors about your reporting background and civic coverage experience." /></label>
                    <label>ID type<input name="idType" required placeholder="NIN, passport, press ID..." /></label>
                    <label>ID/reference number<input name="idNumber" required /></label>
                    <button className="primary-button wide" type="submit">Submit KYC</button>
                  </form>
                )
              ) : (
                <div className="empty-state">Login to submit reporter KYC.</div>
              )}
            </Panel>

            <Panel id="editor" eyebrow="Verification desk" title="Editor Queue" icon={<ShieldCheck />}>
              <div className="queue-list">
                {currentUser?.role !== "admin" && currentUser?.role !== "editor" ? (
                  <div className="empty-state">Editor access required. Admins can assign editor roles.</div>
                ) : reports.filter((report) => report.status === "in_review").length ? (
                  reports
                    .filter((report) => report.status === "in_review")
                    .map((report) => (
                      <article className="queue-item" key={report.id}>
                        <h3>{report.title}</h3>
                        <p>{report.locationName} by {report.authorName}</p>
                        <div className="queue-actions">
                          <button className="approve" type="button" onClick={() => reviewReport(report, "approve")}>
                            Approve
                          </button>
                          <button className="reject" type="button" onClick={() => reviewReport(report, "reject")}>
                            Reject
                          </button>
                        </div>
                      </article>
                    ))
                ) : (
                  <div className="empty-state">No stories waiting for review.</div>
                )}
              </div>
            </Panel>

            <Panel id="profiles" eyebrow="Network" title="Reporter Profiles" icon={<Users />}>
              <div className="profile-list">
                {reporters.length ? reporters.map((reporter) => (
                  <article className="profile-card" key={reporter.id}>
                    <div className="profile-topline">
                      <span className="avatar">{reporter.initials}</span>
                      <div>
                        <h3>{reporter.name}</h3>
                        <p>{reporter.beat} - {reporter.base}</p>
                      </div>
                    </div>
                    <div className="profile-stats">
                      <span>{reporter.verifiedStories} verified</span>
                      <span>{reporter.totalStories} stories</span>
                      <span>{reporter.trustScore}% trust</span>
                    </div>
                    <button type="button" className="profile-action" onClick={() => setReporterSearch(reporter.name)}>
                      <ListFilter />
                      View stories
                    </button>
                  </article>
                )) : <div className="empty-state">No verified reporters yet. Admin-approved KYC profiles will appear here.</div>}
              </div>
            </Panel>

            {currentUser?.role === "admin" ? (
              <Panel id="admin" eyebrow="Admin desk" title="Roles & KYC" icon={<ShieldCheck />}>
                <div className="queue-list">
                  {users.map((user) => (
                    <article className="queue-item" key={user.id}>
                      <h3>{user.name}</h3>
                      <p>{user.email} - {user.role} - KYC {user.kycStatus}</p>
                      <div className="queue-actions">
                        {(["user", "reporter", "editor", "admin"] as UserRole[]).map((role) => (
                          <button type="button" key={role} onClick={() => updateRole(user.id, role)}>{role}</button>
                        ))}
                      </div>
                    </article>
                  ))}
                  {kycSubmissions.map((submission) => (
                    <article className="queue-item" key={submission.id}>
                      <h3>{submission.fullName}</h3>
                      <p>{submission.beat} - {submission.location} - {submission.status}</p>
                      <div className="queue-actions">
                        <button className="approve" type="button" onClick={() => reviewKyc(submission.id, "approved")}>Approve KYC</button>
                        <button className="reject" type="button" onClick={() => reviewKyc(submission.id, "rejected")}>Reject</button>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            ) : null}
          </aside>
        </section>
      </main>

      <footer className="footer">
        <span>VisionEcho Live product build</span>
        <span>PWA-ready civic newsroom</span>
      </footer>

      <nav className="mobile-dock" aria-label="Mobile quick actions">
        <a href="#feed"><Radio /> Feed</a>
        <a href="#submit"><UploadCloud /> Submit</a>
        <a href="#editor"><ShieldCheck /> Verify</a>
        <a href="#profiles"><Users /> Profiles</a>
      </nav>

      {toast ? <div className="toast">{toast}</div> : null}
      {liveOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Live camera recorder">
          <div className="live-modal">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Go live</p>
                <h2>Record field evidence</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeLiveCamera} aria-label="Close recorder">×</button>
            </div>
            <video ref={videoRef} autoPlay muted playsInline className="live-preview" />
            <div className="queue-actions">
              {!recording ? (
                <button className="primary-button" type="button" onClick={startRecording}><Camera /> Start recording</button>
              ) : (
                <button className="primary-button" type="button" onClick={() => recorderRef.current?.stop()}><StopCircle /> Stop and attach</button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusMetric({ value, label }: { value: number; label: string }) {
  return (
    <article>
      <span>{value}</span>
      <small>{label}</small>
    </article>
  );
}

function Panel({
  children,
  compact,
  eyebrow,
  title,
  icon,
  action,
  id,
}: {
  children: React.ReactNode;
  compact?: boolean;
  eyebrow?: string;
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <section className={`panel ${compact ? "compact" : ""}`} id={id} aria-labelledby={id ? `${id}Title` : undefined}>
      <div className="panel-title-row">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 id={id ? `${id}Title` : undefined}>{title}</h2>
        </div>
        {action ?? icon}
      </div>
      {children}
    </section>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button className={`filter-chip ${active ? "active" : ""}`} type="button" onClick={onClick}>
      {label}
      <span>{count}</span>
    </button>
  );
}

function ReportCard({
  report,
  category,
  onShare,
  onReporter,
  onComment,
}: {
  report: Report;
  category?: Category;
  onShare: () => void;
  onReporter: () => void;
  onComment: (text: string) => void;
}) {
  const [comment, setComment] = useState("");
  const CategoryIcon = category ? iconMap[category.icon as keyof typeof iconMap] ?? Newspaper : Newspaper;

  return (
    <article className="report-card" id={report.id}>
      <div className="media-shell">
        <ReportMedia report={report} />
        {report.live ? <span className="live-ribbon">LIVE</span> : null}
      </div>
      <div className="report-content">
        <div className="report-meta">
          <Pill icon={<CategoryIcon />} text={category?.name ?? "Report"} />
          <Pill icon={<MapPin />} text={report.locationName} />
          <Pill icon={report.sourceType === "Reporter" ? <Mic2 /> : <Eye />} text={report.sourceType} />
          <span>{formatTime(report.createdAt)}</span>
        </div>
        <h3>{report.title}</h3>
        <p className="report-body">{report.body}</p>
        <div className="evidence-row">
          <Pill
            icon={report.status === "verified" ? <BadgeCheck /> : <Timer />}
            text={statusLabels[report.status]}
            variant={report.status === "verified" ? "verified" : "review"}
          />
          <Pill icon={<Paperclip />} text={report.media[0]?.type ?? "Text"} />
          {report.evidence.slice(0, 3).map((evidence) => (
            <Pill key={evidence.id} icon={<CheckCircle2 />} text={evidence.label} />
          ))}
        </div>
        <div className="action-row">
          <button type="button" onClick={() => document.querySelector<HTMLInputElement>(`#comment-${report.id}`)?.focus()}>
            <MessageCircle />
            {report.comments.length} comments
          </button>
          <button type="button" onClick={onShare}>
            <Share2 />
            Share
          </button>
          <button type="button" onClick={onReporter}>
            <UserRound />
            {report.authorName}
          </button>
        </div>
        <div className="comments">
          {report.comments.slice(-2).map((item) => (
            <div className="comment" key={item.id}>
              <div className="comment-meta">
                <span>{item.name}</span>
                <span>{formatTime(item.createdAt)}</span>
              </div>
              <p>{item.text}</p>
            </div>
          ))}
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!comment.trim()) return;
              onComment(comment.trim());
              setComment("");
            }}
          >
            <input id={`comment-${report.id}`} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" />
            <button type="submit">
              <Send />
              Post
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function ReportMedia({ report }: { report: Report }) {
  const media = report.media[0];
  if (media?.type === "image" && media.url) return <img src={media.url} alt={report.title} />;
  if (media?.type === "video" && media.url) return <video src={media.url} controls playsInline />;
  if (media?.type === "audio") {
    return (
      <>
        <div className="media-fallback">Audio field note</div>
        {media.url ? <audio src={media.url} controls /> : null}
      </>
    );
  }
  return <div className="media-fallback">{report.categorySlug} report</div>;
}

function MediaPreview({ preview }: { preview: { type: MediaType; url: string; name?: string } | null }) {
  if (!preview) return <div className="media-preview">No media selected</div>;
  if (preview.type === "image") return <div className="media-preview"><img src={preview.url} alt="Selected media" /></div>;
  if (preview.type === "video") return <div className="media-preview"><video src={preview.url} controls /></div>;
  if (preview.type === "audio") return <div className="media-preview"><audio src={preview.url} controls /></div>;
  return <div className="media-preview">{preview.name ?? "Selected file"}</div>;
}

function Pill({ icon, text, variant = "" }: { icon: React.ReactNode; text: string; variant?: string }) {
  return (
    <span className={`pill ${variant}`}>
      {icon}
      {text}
    </span>
  );
}
