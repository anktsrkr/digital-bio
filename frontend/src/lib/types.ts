/**
 * TypeScript definitions mirroring CV Builder backend domain models and API DTOs.
 */

export interface CvPersonal {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
}

export interface CvClientEngagement {
  clientName: string;
  roleContext: string;
  achievements: string[];
}

export interface CvEmployer {
  name: string;
  role: string;
  dates: string;
  location: string;
  summary: string;
  engagements: CvClientEngagement[];
  bullets: string[];
}

export interface CvEducationItem {
  institution: string;
  qualification: string;
  location: string;
  start: string;
  end: string;
  details: string;
}

export interface CvSkillItem {
  name: string;
  category?: string | null;
}

export interface CvCertificationItem {
  name: string;
  issuer: string;
  date: string;
  url?: string | null;
}

export interface CvCustomSection {
  id: string;
  title: string;
  items: string[];
}

export interface CvPayload {
  personal: CvPersonal;
  summary: string;
  keyAchievements: string[];
  workExperience: CvEmployer[];
  education: CvEducationItem[];
  skills: CvSkillItem[];
  certifications: CvCertificationItem[];
  customSections: CvCustomSection[];
  sectionOrder: string[];
}

export type TemplateKey = "classic" | "navy" | "teal";

export interface CvListItemDto {
  id: string;
  userId: string;
  title: string;
  templateKey: TemplateKey | string;
  createdAt: string;
  updatedAt: string;
  isBase: boolean;
  candidateName?: string | null;
  summary?: string | null;
  payload?: CvPayload | null;
}

export interface CvDetailDto {
  id: string;
  userId: string;
  title: string;
  templateKey: TemplateKey | string;
  payload: CvPayload;
  createdAt: string;
  updatedAt: string;
  isBase: boolean;
}

export interface CreateCvRequest {
  userId?: string | null;
  title?: string | null;
  templateKey?: string | null;
  payload?: Partial<CvPayload> | null;
}

export interface UpdateCvRequest {
  title: string;
  templateKey: string;
  payload: CvPayload;
}

export interface ImproveSectionRequest {
  section: "summary" | "achievements" | "work" | string;
  employerIndex?: number | null;
  engagementIndex?: number | null;
  targetIndex?: number | null;
}

export interface ImproveSectionResponse {
  original: string;
  improved: string;
  content: string;
  section: string;
  employerIndex?: number | null;
  engagementIndex?: number | null;
}

export interface UserProfileDto {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  preferences: string[];
  coverLetterHighlights: string[];
}

export interface UpdateProfileRequest {
  name?: string | null;
  email?: string | null;
  preferences?: string[] | null;
  coverLetterHighlights?: string[] | null;
}

export interface AgentSettingDto {
  agentName: string;
  endpoint: string;
  model: string;
  hasApiKey: boolean;
  isCustom: boolean;
}

export interface UpdateAgentSettingRequest {
  endpoint: string;
  model: string;
  apiKey?: string | null;
}

export const BUILTIN_SECTIONS = [
  "summary",
  "achievements",
  "skills",
  "work",
  "certifications",
  "education",
] as const;

export type BuiltinSectionKey = (typeof BUILTIN_SECTIONS)[number];

export const SECTION_LABEL: Record<string, string> = {
  summary: "Professional Summary",
  achievements: "Key Achievements",
  skills: "Core Skills",
  work: "Professional Experience",
  certifications: "Certifications",
  education: "Education",
};

export const TEMPLATE_ACCENT: Record<TemplateKey, string> = {
  classic: "#000000",
  navy: "#1F3A5F",
  teal: "#0F766E",
};

export function normalizeSectionOrder(payload?: Partial<CvPayload> | null): string[] {
  if (!payload) return [...BUILTIN_SECTIONS];
  const seen = new Set<string>();
  const ordered: string[] = [];

  const customIds = (payload.customSections ?? [])
    .filter((c) => (c.id ?? "").trim().length > 0)
    .map((c) => `custom:${c.id}`);
  const customIdSet = new Set(customIds);
  const isValid = (slot: string): boolean =>
    (BUILTIN_SECTIONS as readonly string[]).includes(slot) || customIdSet.has(slot);

  for (const slot of payload.sectionOrder ?? []) {
    const normalizedSlot =
      slot === "keyAchievements" ? "achievements" : slot === "workExperience" ? "work" : slot;
    if (normalizedSlot && isValid(normalizedSlot) && !seen.has(normalizedSlot)) {
      seen.add(normalizedSlot);
      ordered.push(normalizedSlot);
    }
  }

  for (const slot of BUILTIN_SECTIONS) {
    if (!seen.has(slot)) {
      seen.add(slot);
      ordered.push(slot);
    }
  }

  for (const slot of customIds) {
    if (!seen.has(slot)) {
      seen.add(slot);
      ordered.push(slot);
    }
  }

  return ordered;
}

/**
 * Standard default payload factory for new CV drafts
 */
export function createDefaultCvPayload(candidateName: string = ""): CvPayload {
  return {
    personal: {
      fullName: candidateName,
      headline: "Senior Software Engineer",
      email: "",
      phone: "",
      location: "London, UK",
      links: [],
    },
    summary:
      "Results-oriented professional with comprehensive experience in delivering resilient digital products. Proven track record in collaborating with cross-functional teams to solve complex problems and exceed organizational benchmarks.",
    keyAchievements: [
      "Led full-lifecycle delivery of mission-critical systems, reducing operational overhead by 30%.",
      "Championed automated code quality and CI/CD pipelines, accelerating delivery velocity across 4 teams.",
    ],
    workExperience: [
      {
        name: "Acme Enterprise Solutions",
        role: "Senior Engineer / Consultant",
        dates: "2022 – Present",
        location: "London, UK",
        summary:
          "Responsible for technical architecture, mentoring engineers, and executing digital transformation initiatives.",
        engagements: [
          {
            clientName: "Global Retail Corporation",
            roleContext: "Lead Backend Architect",
            achievements: [
              "Engineered high-throughput cloud microservices serving 1.5M daily active users.",
              "Optimized data querying layers, slashing 99th percentile response latency by 45%.",
            ],
          },
        ],
        bullets: [],
      },
    ],
    education: [
      {
        institution: "University of London",
        qualification: "BSc (Hons) Computer Science",
        location: "London, UK",
        start: "2016",
        end: "2020",
        details: "First Class Honours (1st)",
      },
    ],
    skills: [
      { name: "TypeScript", category: "Languages" },
      { name: "C# / .NET", category: "Languages" },
      { name: "Next.js", category: "Frameworks" },
      { name: "MongoDB", category: "Databases" },
      { name: "Cloud Architecture", category: "DevOps & Cloud" },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2023",
        url: "",
      },
    ],
    customSections: [],
    sectionOrder: [
      "summary",
      "achievements",
      "skills",
      "work",
      "certifications",
      "education",
    ],
  };
}
