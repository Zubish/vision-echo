export type UserRole = "user" | "reporter" | "editor" | "admin";
export type UserStatus = "pending_role" | "active" | "suspended";
export type KycStatus = "not_started" | "pending" | "approved" | "rejected";

export type ReportStatus =
  | "submitted"
  | "in_review"
  | "needs_more_info"
  | "verified"
  | "rejected"
  | "archived"
  | "flagged";

export type MediaType = "text" | "image" | "video" | "audio" | "document";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  summary: string;
  active: boolean;
};

export type ReporterProfile = {
  id: string;
  name: string;
  initials: string;
  beat: string;
  base: string;
  bio: string;
  verifiedStories: number;
  totalStories: number;
  trustScore: number;
  status: "verified" | "pending" | "revoked";
};

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KycStatus;
  reporterVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Omit<User, "passwordHash">;

export type KycSubmission = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  location: string;
  beat: string;
  experience: string;
  idType: string;
  idNumber: string;
  status: KycStatus;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  reportId: string;
  name: string;
  text: string;
  status: "visible" | "pending" | "hidden" | "flagged";
  createdAt: string;
};

export type EvidenceItem = {
  id: string;
  label: string;
  type: "media" | "location" | "source" | "document" | "editor";
  confidence: number;
};

export type MediaAsset = {
  id: string;
  type: MediaType;
  url: string;
  name?: string;
  status: "uploaded" | "approved" | "rejected" | "quarantined";
};

export type ReviewDecision = {
  id: string;
  reportId: string;
  editorName: string;
  decision: "approved" | "rejected" | "needs_more_info";
  reason?: string;
  createdAt: string;
};

export type Report = {
  id: string;
  title: string;
  slug: string;
  body: string;
  categorySlug: string;
  locationName: string;
  state: string;
  latitude?: number;
  longitude?: number;
  sourceType: "Eyewitness" | "Reporter";
  authorId?: string;
  authorName: string;
  reporterId?: string;
  status: ReportStatus;
  live: boolean;
  priority: "normal" | "high" | "breaking";
  media: MediaAsset[];
  evidence: EvidenceItem[];
  comments: Comment[];
  reviewTrail: ReviewDecision[];
  createdAt: string;
  updatedAt: string;
};

export type VisionEchoDb = {
  categories: Category[];
  reporters: ReporterProfile[];
  reports: Report[];
  users: User[];
  kycSubmissions: KycSubmission[];
};
