import { z } from "zod";

export const reportInputSchema = z.object({
  title: z.string().min(8).max(120),
  body: z.string().min(20).max(4000),
  categorySlug: z.string().min(2),
  locationName: z.string().min(2).max(140),
  state: z.string().min(2).max(80),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  sourceType: z.enum(["Eyewitness", "Reporter"]),
  authorId: z.string().optional(),
  authorName: z.string().min(2).max(100),
  reporterId: z.string().optional(),
  live: z.boolean().default(true),
  priority: z.enum(["normal", "high", "breaking"]).default("normal"),
  media: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["text", "image", "video", "audio", "document"]),
        url: z.string(),
        name: z.string().optional(),
        status: z.enum(["uploaded", "approved", "rejected", "quarantined"]),
      }),
    )
    .default([]),
  evidence: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["media", "location", "source", "document", "editor"]),
        confidence: z.number().min(0).max(100),
      }),
    )
    .default([]),
  status: z.enum(["submitted", "in_review", "needs_more_info", "verified", "rejected", "archived", "flagged"]).default("in_review"),
});

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(180),
  password: z.string().min(8).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const roleUpdateSchema = z.object({
  role: z.enum(["user", "reporter", "editor", "admin"]),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

export const roleApplicationSchema = z.object({
  note: z.string().min(20).max(1200),
});

export const roleApplicationReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewerNote: z.string().max(500).optional(),
});

export const kycInputSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(40),
  location: z.string().min(2).max(120),
  beat: z.string().min(2).max(120),
  experience: z.string().min(20).max(1500),
  idType: z.string().min(2).max(80),
  idNumber: z.string().min(3).max(120),
});

export const kycReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewerNote: z.string().max(500).optional(),
});

export const commentInputSchema = z.object({
  name: z.string().min(2).max(80).default("Reader"),
  text: z.string().min(2).max(280),
});

export const reviewInputSchema = z.object({
  reason: z.string().max(500).optional(),
});
