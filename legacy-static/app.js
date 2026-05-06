const categories = [
  {
    name: "Elections",
    icon: "landmark",
    summary: "Polling unit updates, voter access, collation observations, and campaign accountability.",
  },
  {
    name: "Governance",
    icon: "building-2",
    summary: "Public policy, budgets, appointments, service delivery, and official civic notices.",
  },
  {
    name: "Security",
    icon: "shield-alert",
    summary: "Safety alerts, emergency response, public order, and community protection reports.",
  },
  {
    name: "Infrastructure",
    icon: "construction",
    summary: "Roads, power, water, transport, public works, and maintenance tracking.",
  },
  {
    name: "Economy",
    icon: "line-chart",
    summary: "Markets, labour, prices, public revenue, small business, and consumer impact.",
  },
  {
    name: "Community",
    icon: "heart-handshake",
    summary: "Local action, civic meetings, public health, education, and neighbourhood voices.",
  },
];

const reporters = [
  {
    id: "r-ada",
    name: "Ada Nwosu",
    initials: "AN",
    beat: "Elections and governance",
    base: "Abuja FCT",
    verified: 42,
    stories: 118,
    trust: "98%",
  },
  {
    id: "r-tunde",
    name: "Tunde Bakare",
    initials: "TB",
    beat: "Infrastructure and transport",
    base: "Lagos",
    verified: 37,
    stories: 96,
    trust: "96%",
  },
  {
    id: "r-zainab",
    name: "Zainab Musa",
    initials: "ZM",
    beat: "Security and community resilience",
    base: "Kano",
    verified: 29,
    stories: 77,
    trust: "94%",
  },
];

const seedReports = [
  {
    id: "ve-1001",
    title: "Polling unit queue moving after late accreditation device replacement",
    category: "Elections",
    location: "Garki, Abuja FCT",
    body: "Voters say the first accreditation device failed before noon. INEC officials replaced it and voting resumed with party agents present at the unit.",
    author: "Ada Nwosu",
    authorId: "r-ada",
    sourceType: "Reporter",
    status: "verified",
    live: true,
    mediaType: "image",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Area_shot_of_polling_units.jpg/960px-Area_shot_of_polling_units.jpg",
    createdAt: Date.now() - 1000 * 60 * 12,
    evidence: ["Video clip", "Location match", "Official presence"],
    comments: [
      { name: "Chika", text: "Can confirm the queue started moving again.", at: Date.now() - 1000 * 60 * 8 },
    ],
  },
  {
    id: "ve-1002",
    title: "Commuters report flooding near Mile 12 market access road",
    category: "Infrastructure",
    location: "Mile 12, Lagos",
    body: "Eyewitness footage shows traffic slowing around the market corridor after heavy rainfall. Road users are asking LASTMA for diversion support.",
    author: "Tunde Bakare",
    authorId: "r-tunde",
    sourceType: "Reporter",
    status: "review",
    live: true,
    mediaType: "image",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg/960px-Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg",
    createdAt: Date.now() - 1000 * 60 * 24,
    evidence: ["Image", "Two eyewitnesses", "Weather report pending"],
    comments: [],
  },
  {
    id: "ve-1003",
    title: "Market leaders announce new waste collection schedule",
    category: "Governance",
    location: "Idumota, Lagos",
    body: "A traders association notice reviewed by VisionEcho says waste pickup will run before 7am on Mondays, Wednesdays, and Saturdays.",
    author: "Kemi A.",
    authorId: null,
    sourceType: "Eyewitness",
    status: "verified",
    live: false,
    mediaType: "image",
    mediaUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Ever-busy_market.jpg/960px-Ever-busy_market.jpg",
    createdAt: Date.now() - 1000 * 60 * 58,
    evidence: ["Document photo", "Market association contact", "Editor call-back"],
    comments: [
      { name: "Bayo", text: "This will help if enforcement is consistent.", at: Date.now() - 1000 * 60 * 18 },
    ],
  },
  {
    id: "ve-1004",
    title: "Community volunteers reopen evening study centre",
    category: "Community",
    location: "Sabon Gari, Kano",
    body: "Teachers and residents reopened a donated classroom for secondary school exam prep after a two-month closure caused by roof repairs.",
    author: "Zainab Musa",
    authorId: "r-zainab",
    sourceType: "Reporter",
    status: "verified",
    live: false,
    mediaType: "text",
    mediaUrl: "",
    createdAt: Date.now() - 1000 * 60 * 90,
    evidence: ["Reporter visit", "Volunteer interview", "Photo pending"],
    comments: [],
  },
  {
    id: "ve-1005",
    title: "Fuel queue forming around two stations after supply delay",
    category: "Economy",
    location: "Port Harcourt, Rivers",
    body: "Drivers report a growing queue around two filling stations. A station attendant said a tanker delivery is expected later this evening.",
    author: "Eyewitness 204",
    authorId: null,
    sourceType: "Eyewitness",
    status: "review",
    live: true,
    mediaType: "audio",
    mediaUrl: "",
    createdAt: Date.now() - 1000 * 60 * 5,
    evidence: ["Audio note", "Location submitted", "Awaiting second source"],
    comments: [],
  },
];

const state = {
  reports: loadReports(),
  activeCategory: "All",
  activeStatus: "All",
  search: "",
  uploadPreview: null,
  uploadType: null,
};

const feedList = document.querySelector("#feedList");
const categoryList = document.querySelector("#categoryList");
const statusList = document.querySelector("#statusList");
const categoryPage = document.querySelector("#categoryPage");
const queueList = document.querySelector("#queueList");
const profileList = document.querySelector("#profileList");
const searchInput = document.querySelector("#searchInput");
const reportForm = document.querySelector("#reportForm");
const mediaPreview = document.querySelector("#mediaPreview");
const themeToggle = document.querySelector("#themeToggle");

function loadReports() {
  try {
    const saved = localStorage.getItem("visionecho-reports");
    if (!saved) return seedReports;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : seedReports;
  } catch {
    return seedReports;
  }
}

function persistReports() {
  const serializable = state.reports.map((report) => {
    if (report.mediaUrl?.startsWith("blob:")) {
      return { ...report, mediaUrl: "", mediaType: "text" };
    }
    return report;
  });
  localStorage.setItem("visionecho-reports", JSON.stringify(serializable));
}

function formatTime(timestamp) {
  const diff = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (diff < 60) return `${diff} min ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

function visibleReports() {
  return state.reports
    .filter((report) => report.status !== "rejected")
    .filter((report) => state.activeCategory === "All" || report.category === state.activeCategory)
    .filter((report) => {
      if (state.activeStatus === "All") return true;
      if (state.activeStatus === "Live") return report.live;
      return report.status === state.activeStatus.toLowerCase();
    })
    .filter((report) => {
      const text = `${report.title} ${report.body} ${report.location} ${report.author} ${report.category}`.toLowerCase();
      return text.includes(state.search.toLowerCase());
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getStatusIcon(report) {
  if (report.status === "verified") return "badge-check";
  if (report.status === "review") return "timer";
  return "circle-alert";
}

function getStatusText(report) {
  if (report.status === "verified") return "Verified";
  if (report.status === "review") return "In review";
  return "Needs review";
}

function createPill(text, icon, variant = "") {
  const pill = document.createElement("span");
  pill.className = `pill ${variant}`.trim();
  const i = document.createElement("i");
  i.dataset.lucide = icon;
  pill.append(i, document.createTextNode(text));
  return pill;
}

function renderMedia(report, shell) {
  shell.innerHTML = "";

  if (report.mediaType === "image" && report.mediaUrl) {
    const img = document.createElement("img");
    img.src = report.mediaUrl;
    img.alt = report.title;
    shell.append(img);
  } else if (report.mediaType === "video" && report.mediaUrl) {
    const video = document.createElement("video");
    video.src = report.mediaUrl;
    video.controls = true;
    video.playsInline = true;
    shell.append(video);
  } else if (report.mediaType === "audio" && report.mediaUrl) {
    const fallback = document.createElement("div");
    fallback.className = "media-fallback";
    fallback.textContent = "Audio field note";
    const audio = document.createElement("audio");
    audio.src = report.mediaUrl;
    audio.controls = true;
    shell.append(fallback, audio);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "media-fallback";
    fallback.textContent = `${report.category} report`;
    shell.append(fallback);
  }

  if (report.live) {
    const live = document.createElement("span");
    live.className = "live-ribbon";
    live.textContent = "LIVE";
    shell.append(live);
  }
}

function renderReport(report) {
  const template = document.querySelector("#reportTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  node.id = report.id;

  renderMedia(report, node.querySelector(".media-shell"));

  const meta = node.querySelector(".report-meta");
  meta.append(
    createPill(report.category, categories.find((cat) => cat.name === report.category)?.icon || "newspaper"),
    createPill(report.location, "map-pin"),
    createPill(report.sourceType, report.sourceType === "Reporter" ? "mic-2" : "eye"),
    document.createTextNode(formatTime(report.createdAt)),
  );

  node.querySelector("h3").textContent = report.title;
  node.querySelector(".report-body").textContent = report.body;

  const evidence = node.querySelector(".evidence-row");
  evidence.append(
    createPill(getStatusText(report), getStatusIcon(report), report.status === "verified" ? "verified" : "review"),
    createPill(report.mediaType === "text" ? "Text" : report.mediaType, "paperclip"),
  );
  report.evidence.forEach((item) => evidence.append(createPill(item, "check-circle-2")));

  const actions = node.querySelector(".action-row");
  actions.append(
    makeActionButton("message-circle", `${report.comments.length} comments`, () => {
      node.querySelector(".comment-form input")?.focus();
    }),
    makeActionButton("share-2", "Share", () => shareReport(report)),
    makeActionButton("user-round", report.author, () => {
      filterByReporter(report.author);
    }),
  );

  renderComments(report, node.querySelector(".comments"));
  return node;
}

function makeActionButton(icon, text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  const i = document.createElement("i");
  i.dataset.lucide = icon;
  button.append(i, document.createTextNode(text));
  button.addEventListener("click", onClick);
  return button;
}

function renderComments(report, container) {
  container.innerHTML = "";
  report.comments.slice(-2).forEach((comment) => {
    const item = document.createElement("div");
    item.className = "comment";

    const meta = document.createElement("div");
    meta.className = "comment-meta";
    const name = document.createElement("span");
    name.textContent = comment.name;
    const time = document.createElement("span");
    time.textContent = formatTime(comment.at);
    meta.append(name, time);

    const text = document.createElement("p");
    text.textContent = comment.text;
    item.append(meta, text);
    container.append(item);
  });

  const form = document.createElement("form");
  form.className = "comment-form";
  const input = document.createElement("input");
  input.placeholder = "Add a comment";
  input.required = true;
  input.maxLength = 140;
  const button = document.createElement("button");
  button.type = "submit";
  const icon = document.createElement("i");
  icon.dataset.lucide = "send";
  button.append(icon, document.createTextNode("Post"));
  form.append(input, button);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    report.comments.push({ name: "Reader", text: input.value.trim(), at: Date.now() });
    persistReports();
    render();
    toast("Comment added");
  });
  container.append(form);
}

function renderCategories() {
  categoryList.innerHTML = "";
  const allCount = state.reports.filter((report) => report.status !== "rejected").length;
  categoryList.append(makeFilterChip("All", allCount, state.activeCategory === "All", () => {
    state.activeCategory = "All";
    render();
  }));

  categories.forEach((category) => {
    const count = state.reports.filter((report) => report.status !== "rejected" && report.category === category.name).length;
    categoryList.append(makeFilterChip(category.name, count, state.activeCategory === category.name, () => {
      state.activeCategory = category.name;
      render();
    }));
  });
}

function renderStatuses() {
  statusList.innerHTML = "";
  const statuses = [
    ["All", state.reports.filter((report) => report.status !== "rejected").length],
    ["Live", state.reports.filter((report) => report.status !== "rejected" && report.live).length],
    ["Verified", state.reports.filter((report) => report.status === "verified").length],
    ["Review", state.reports.filter((report) => report.status === "review").length],
  ];
  statuses.forEach(([label, count]) => {
    statusList.append(makeFilterChip(label, count, state.activeStatus === label, () => {
      state.activeStatus = label;
      render();
    }));
  });
}

function makeFilterChip(label, count, active, onClick) {
  const button = document.createElement("button");
  button.className = `filter-chip ${active ? "active" : ""}`.trim();
  button.type = "button";
  button.textContent = label;
  const badge = document.createElement("span");
  badge.textContent = count;
  button.append(badge);
  button.addEventListener("click", onClick);
  return button;
}

function renderCategoryPage() {
  const selected = categories.find((category) => category.name === state.activeCategory);
  const reports = visibleReports();
  categoryPage.innerHTML = "";

  const copy = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = selected ? `${selected.name} Page` : "All Categories";
  const body = document.createElement("p");
  body.textContent = selected
    ? selected.summary
    : "Scan live and verified civic signals across elections, governance, security, infrastructure, economy, and community life.";
  copy.append(heading, body);

  const score = document.createElement("div");
  score.className = "category-score";
  const strong = document.createElement("strong");
  strong.textContent = reports.length;
  const small = document.createElement("small");
  small.textContent = "matching";
  score.append(strong, small);
  categoryPage.append(copy, score);
}

function renderFeed() {
  feedList.innerHTML = "";
  const reports = visibleReports();
  if (!reports.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No reports match the current filters.";
    feedList.append(empty);
    return;
  }
  reports.forEach((report) => feedList.append(renderReport(report)));
}

function renderQueue() {
  queueList.innerHTML = "";
  const queue = state.reports.filter((report) => report.status === "review").sort((a, b) => b.createdAt - a.createdAt);
  if (!queue.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No stories waiting for review.";
    queueList.append(empty);
    return;
  }

  queue.forEach((report) => {
    const item = document.createElement("article");
    item.className = "queue-item";
    const title = document.createElement("h3");
    title.textContent = report.title;
    const body = document.createElement("p");
    body.textContent = `${report.location} by ${report.author}`;
    const actions = document.createElement("div");
    actions.className = "queue-actions";
    actions.append(
      makeQueueButton("Approve", "approve", () => {
        report.status = "verified";
        report.evidence = Array.from(new Set([...report.evidence, "Editor approved"]));
        persistReports();
        render();
        toast("Story marked verified");
      }),
      makeQueueButton("Reject", "reject", () => {
        report.status = "rejected";
        persistReports();
        render();
        toast("Story removed from live review");
      }),
    );
    item.append(title, body, actions);
    queueList.append(item);
  });
}

function makeQueueButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function renderProfiles() {
  profileList.innerHTML = "";
  reporters.forEach((reporter) => {
    const card = document.createElement("article");
    card.className = "profile-card";

    const top = document.createElement("div");
    top.className = "profile-topline";
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = reporter.initials;
    const details = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = reporter.name;
    const beat = document.createElement("p");
    beat.textContent = `${reporter.beat} - ${reporter.base}`;
    details.append(name, beat);
    top.append(avatar, details);

    const stats = document.createElement("div");
    stats.className = "profile-stats";
    stats.innerHTML = `<span>${reporter.verified} verified</span><span>${reporter.stories} stories</span><span>${reporter.trust} trust</span>`;

    const button = makeActionButton("list-filter", "View stories", () => filterByReporter(reporter.name));
    card.append(top, stats, button);
    profileList.append(card);
  });
}

function filterByReporter(name) {
  state.search = name;
  searchInput.value = name;
  document.querySelector("#feed").scrollIntoView({ behavior: "smooth", block: "start" });
  render();
}

async function shareReport(report) {
  const url = `${location.href.split("#")[0]}#${report.id}`;
  const shareData = { title: report.title, text: `${report.title} - ${report.location}`, url };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("Report link copied");
  } catch {
    toast("Share cancelled");
  }
}

function renderStats() {
  const active = state.reports.filter((report) => report.status !== "rejected");
  document.querySelector("#liveCount").textContent = active.filter((report) => report.live).length;
  document.querySelector("#verifiedCount").textContent = active.filter((report) => report.status === "verified").length;
  document.querySelector("#queueCount").textContent = active.filter((report) => report.status === "review").length;
}

function toast(message) {
  const existing = document.querySelector(".toast");
  existing?.remove();
  const note = document.createElement("div");
  note.className = "toast";
  note.textContent = message;
  Object.assign(note.style, {
    position: "fixed",
    right: "1rem",
    bottom: "1rem",
    zIndex: "50",
    padding: "0.75rem 0.9rem",
    borderRadius: "8px",
    background: "var(--ink)",
    color: "var(--surface)",
    fontWeight: "800",
    boxShadow: "var(--shadow)",
  });
  document.body.append(note);
  setTimeout(() => note.remove(), 2200);
}

function hydrateForm() {
  const select = reportForm.elements.category;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    select.append(option);
  });

  reportForm.elements.media.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      state.uploadPreview = null;
      state.uploadType = null;
      mediaPreview.textContent = "No media selected";
      return;
    }

    state.uploadPreview = URL.createObjectURL(file);
    state.uploadType = file.type.split("/")[0];
    mediaPreview.innerHTML = "";
    if (state.uploadType === "image") {
      const img = document.createElement("img");
      img.src = state.uploadPreview;
      img.alt = "Selected report media";
      mediaPreview.append(img);
    } else if (state.uploadType === "video") {
      const video = document.createElement("video");
      video.src = state.uploadPreview;
      video.controls = true;
      mediaPreview.append(video);
    } else if (state.uploadType === "audio") {
      const audio = document.createElement("audio");
      audio.src = state.uploadPreview;
      audio.controls = true;
      mediaPreview.append(audio);
    } else {
      mediaPreview.textContent = file.name;
    }
  });

  reportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(reportForm);
    const asReporter = form.get("asReporter") === "on";
    const reporter = asReporter ? reporters[0] : null;
    const report = {
      id: `ve-${Date.now()}`,
      title: form.get("title").toString().trim(),
      category: form.get("category").toString(),
      location: form.get("location").toString().trim(),
      body: form.get("body").toString().trim(),
      author: reporter?.name || "Eyewitness",
      authorId: reporter?.id || null,
      sourceType: asReporter ? "Reporter" : "Eyewitness",
      status: "review",
      live: true,
      mediaType: state.uploadType || "text",
      mediaUrl: state.uploadPreview || "",
      createdAt: Date.now(),
      evidence: [state.uploadType ? `${state.uploadType} uploaded` : "Text report", "Location submitted"],
      comments: [],
    };
    state.reports.unshift(report);
    state.activeStatus = "All";
    state.activeCategory = "All";
    state.search = "";
    searchInput.value = "";
    persistReports();
    reportForm.reset();
    mediaPreview.textContent = "No media selected";
    state.uploadPreview = null;
    state.uploadType = null;
    render();
    toast("Report submitted to editor queue");
    document.querySelector("#feed").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function wireControls() {
  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  document.querySelector("#clearFilters").addEventListener("click", () => {
    state.activeCategory = "All";
    state.activeStatus = "All";
    state.search = "";
    searchInput.value = "";
    render();
  });

  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(`#${button.dataset.scrollTarget}`).scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelector("#locationButton").addEventListener("click", () => {
    const input = reportForm.elements.location;
    if (!navigator.geolocation) {
      input.value = "Location unavailable";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        input.value = `Current location (${lat}, ${lng})`;
      },
      () => {
        input.value = "Location permission not granted";
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const icon = themeToggle.querySelector("i");
    icon.dataset.lucide = document.body.classList.contains("dark") ? "sun" : "moon";
    lucide.createIcons();
  });
}

function render() {
  renderStats();
  renderCategories();
  renderStatuses();
  renderCategoryPage();
  renderFeed();
  renderQueue();
  renderProfiles();
  lucide.createIcons();
}

hydrateForm();
wireControls();
render();
