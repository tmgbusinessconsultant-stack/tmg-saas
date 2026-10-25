// src/lib/homepage-content.ts - ADVANCED, ADMIN-READY

export type MediaImage = {
  url: string;
  alt?: string;
  uploadId?: string;
};

export type StatItem = { label: string; value: string; icon?: string };
export type ServiceCard = { title: string; description: string; icon?: string; href?: string };
export type TestimonialItem = {
  id: string;
  quote: string;
  clientName: string;
  company: string;
  photoUrl: string;
  rating: number; // 1-5
  approved: boolean;
  createdAt?: string;
};
export type FaqItem = { question: string; answer: string };
export type CaseStudyItem = { title: string; description: string; imageUrl?: string; href?: string };

export type HomepageContent = {
  version: number;
  updatedAt?: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  hero: {
    kicker: string;
    title: string;
    highlight: string;
    description: string;
    primaryText: string;
    primaryHref: string;
    secondaryText: string;
    secondaryHref: string;
    imageUrl: string;
    imageAlt?: string;
  };
  quickCard: {
    title: string;
    description: string;
    buttonText: string;
    buttonHref: string;
    enabled?: boolean;
  };
  services: {
    heading: string;
    subheading?: string;
    cards: ServiceCard[];
  };
  about: {
    title: string;
    description: string;
    reasons: string[];
    asideTitle: string;
    asideItems: string[];
    imageUrl?: string;
  };
  statistics: StatItem[];
  testimonials: {
    heading: string;
    subheading?: string;
    items: TestimonialItem[];
  };
  caseStudies: CaseStudyItem[];
  faq: FaqItem[];
  cta: {
    heading: string;
    description: string;
    primaryText: string;
    primaryHref: string;
    secondaryText: string;
    secondaryHref: string;
  };
};

// --- Default content used as fallback + for new installs ---
export const defaultHomepageContent: HomepageContent = {
  version: 2,
  updatedAt: new Date().toISOString(),
  meta: {
    title: "TMG Business Consulting | AI Consulting, Strategy & Growth",
    description: "TMG helps SMEs in Qatar and globally with strategy, AI tools, productivity training, and business growth.",
    keywords: ["Qatar business consulting", "AI consulting", "business strategy"],
  },
  hero: {
    kicker: "AI-Powered Business Consulting · Qatar & Global",
    title: "Grow smarter with",
    highlight: "strategy, AI, and execution",
    description: "TMG Business Consulting helps founders, SMEs, and growing teams turn ideas into systems, offers, and scalable businesses.",
    primaryText: "Get Quote",
    primaryHref: "/quote",
    secondaryText: "Try AI Assistant",
    secondaryHref: "/ai-tools/business-assistant",
    imageUrl: "",
    imageAlt: "TMG Business Consulting hero",
  },
  quickCard: {
    title: "Start in 60 seconds",
    description: "Tell us your business challenge and get a tailored next step.",
    buttonText: "Launch AI Assistant →",
    buttonHref: "/ai-tools/business-assistant",
    enabled: true,
  },
  services: {
    heading: "Everything your business needs to move faster",
    subheading: "From AI to execution, we cover your growth stack",
    cards: [
      { title: "AI Consulting", description: "AI strategy, automation design, and digital transformation.", icon: "🤖", href: "/services/ai-consulting" },
      { title: "Business Consulting", description: "Strategy, operations, and growth planning for founders.", icon: "📈", href: "/services/business-consulting" },
      { title: "Productivity Training", description: "Workshops to improve systems, processes, and team efficiency.", icon: "⚡", href: "/services/training" },
      { title: "Digital Products", description: "Turn ideas into templates, tools, and revenue-generating offers.", icon: "📦", href: "/services/digital-products" },
    ],
  },
  about: {
    title: "Built for founders, teams, and businesses ready to grow",
    description: "We combine strategic consulting, AI tools, and practical operational guidance to help businesses move from idea to implementation with clarity.",
    reasons: [
      "Practical advice grounded in real execution",
      "AI-powered support that saves time",
      "Fast turnaround for SOPs, proposals, and plans",
      "Local expertise for Qatar and global markets",
    ],
    asideTitle: "Why choose TMG",
    asideItems: [
      "Clear strategy and execution support",
      "AI-powered workflows and document generation",
      "Training for teams who want to work smarter",
      "Documents designed to create trust",
    ],
  },
  statistics: [
    { label: "Projects Delivered", value: "500+", icon: "✅" },
    { label: "Clients in Qatar", value: "120+", icon: "🇶🇦" },
    { label: "Avg. Time Saved", value: "30%", icon: "⏱️" },
    { label: "Satisfaction", value: "98%", icon: "⭐" },
  ],
  testimonials: {
    heading: "What our clients say",
    subheading: "Trusted by founders and SMEs",
    items: [],
  },
  caseStudies: [
    { title: "SOP Automation for Retail SME", description: "Reduced onboarding time by 60% with AI SOP generator.", href: "/case-studies" },
  ],
  faq: [
    { question: "Do you work with businesses outside Qatar?", answer: "Yes, we work with clients globally via online consulting and AI tools." },
    { question: "How fast is delivery?", answer: "Most documents and strategies are delivered within 24-48 hours." },
  ],
  cta: {
    heading: "Let’s build your next business move",
    description: "From AI-powered offers to consulting and growth planning, we move with clarity.",
    primaryText: "Get Quote",
    primaryHref: "/quote",
    secondaryText: "Contact Us",
    secondaryHref: "/contact",
  },
};

// --- ADVANCED: Safe merge + validation helpers ---
export function mergeHomepageContent(partial: Partial<HomepageContent> | null): HomepageContent {
  if (!partial) return defaultHomepageContent;
  return {
    ...defaultHomepageContent,
    ...partial,
    version: partial.version ?? defaultHomepageContent.version,
    meta: { ...defaultHomepageContent.meta, ...partial.meta },
    hero: { ...defaultHomepageContent.hero, ...partial.hero },
    quickCard: { ...defaultHomepageContent.quickCard, ...partial.quickCard },
    services: { ...defaultHomepageContent.services, ...partial.services, cards: partial.services?.cards ?? defaultHomepageContent.services.cards },
    about: { ...defaultHomepageContent.about, ...partial.about },
    statistics: partial.statistics ?? defaultHomepageContent.statistics,
    testimonials: { ...defaultHomepageContent.testimonials, ...partial.testimonials, items: partial.testimonials?.items ?? [] },
    caseStudies: partial.caseStudies ?? defaultHomepageContent.caseStudies,
    faq: partial.faq ?? defaultHomepageContent.faq,
    cta: { ...defaultHomepageContent.cta, ...partial.cta },
  };
}

export function isHomepageContentValid(data: any): data is HomepageContent {
  return !!(data && typeof data.hero?.title === "string" && Array.isArray(data.services?.cards));
}