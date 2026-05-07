import type { Category, VisionEchoDb } from "./types";

export const categories: Category[] = [
  {
    id: "cat-elections",
    name: "Elections",
    slug: "elections",
    icon: "Landmark",
    active: true,
    summary: "Polling unit updates, voter access, collation observations, and campaign accountability.",
  },
  {
    id: "cat-governance",
    name: "Governance",
    slug: "governance",
    icon: "Building2",
    active: true,
    summary: "Public policy, budgets, appointments, service delivery, and official civic notices.",
  },
  {
    id: "cat-security",
    name: "Security",
    slug: "security",
    icon: "ShieldAlert",
    active: true,
    summary: "Safety alerts, emergency response, public order, and community protection reports.",
  },
  {
    id: "cat-infrastructure",
    name: "Infrastructure",
    slug: "infrastructure",
    icon: "Construction",
    active: true,
    summary: "Roads, power, water, transport, public works, and maintenance tracking.",
  },
  {
    id: "cat-economy",
    name: "Economy",
    slug: "economy",
    icon: "LineChart",
    active: true,
    summary: "Markets, labour, prices, public revenue, small business, and consumer impact.",
  },
  {
    id: "cat-community",
    name: "Community",
    slug: "community",
    icon: "HeartHandshake",
    active: true,
    summary: "Local action, civic meetings, public health, education, and neighbourhood voices.",
  },
];

export const seedDb: VisionEchoDb = {
  categories,
  reporters: [],
  reports: [],
  users: [],
  kycSubmissions: [],
  roleApplications: [],
};
