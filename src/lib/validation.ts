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

export const commentInputSchema = z.object({
  name: z.string().min(2).max(80).default("Reader"),
  text: z.string().min(2).max(280),
});

export const reviewInputSchema = z.object({
  reason: z.string().max(500).optional(),
});
