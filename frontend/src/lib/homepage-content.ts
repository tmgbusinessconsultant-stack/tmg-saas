export type MediaImage = { url: string; alt?: string; uploadId?: string; };
export type StatItem = { label: string; value: string; icon?: string };
export type ServiceCard = { title: string; description: string; icon?: string; href?: string; badge?: string };
export type TestimonialItem = { id: string; quote: string; clientName: string; company: string; photoUrl: string; rating: number; approved: boolean; createdAt?: string; };
export type FaqItem = { question: string; answer: string };
export type CaseStudyItem = { title: string; description: string; imageUrl?: string; href?: string };
export type HomepageContent = {
  version: number; updatedAt?: string;
  meta: { title: string; description: string; keywords: string[]; };
  hero: { kicker: string; title: string; highlight: string; description: string; primaryText: string; primaryHref: string; secondaryText: string; secondaryHref: string; imageUrl: string; imageAlt?: string; };
  quickCard: { title: string; description: string; buttonText: string; buttonHref: string; enabled?: boolean; };
  services: { heading: string; subheading?: string; cards: ServiceCard[]; };
  about: { title: string; description: string; reasons: string[]; asideTitle: string; asideItems: string[]; imageUrl?: string; };
  statistics: StatItem[];
  testimonials: { heading: string; subheading?: string; items: TestimonialItem[]; };
  caseStudies: CaseStudyItem[];
  faq: FaqItem[];
  cta: { heading: string; description: string; primaryText: string; primaryHref: string; secondaryText: string; secondaryHref: string; };
};

export const defaultHomepageContent: HomepageContent = {
  version: 3,
  updatedAt: new Date().toISOString(),
  meta: {
    title: "TMG | Global Business Services - Power BI, Excel, M365, AI | Powered from Doha",
    description: "Global business services powered from Doha: Power BI dashboards, Advanced Excel automation, Microsoft 365 productivity, AI workflows, company formation - 100% online delivery worldwide.",
    keywords: ["Power BI consulting","Advanced Excel","Microsoft 365","AI automation","global business services","company formation"],
  },
  hero: {
    kicker: "Global Delivery • Powered from Doha, Qatar",
    title: "Global Business Services,",
    highlight: "Delivered Online",
    description: "Power BI dashboards, Advanced Excel automation, Microsoft 365 productivity, AI workflows & company formation - for founders worldwide. 100% online, no in-person required.",
    primaryText: "Get Proposal →",
    primaryHref: "/booking",
    secondaryText: "Explore Services",
    secondaryHref: "/services",
    imageUrl: "",
    imageAlt: "Power BI Dashboard + Excel + M365",
  },
  quickCard: {
    title: "Power BI • Excel • M365 • AI",
    description: "Select your service and get a proposal within 2 hours. Global delivery, operated from Doha.",
    buttonText: "See Live Dashboards →",
    buttonHref: "/services",
    enabled: true,
  },
  services: {
    heading: "One hub for Power BI, Excel, M365 & Growth",
    subheading: "From data to delivery - everything online",
    cards: [
      { title: "🔍 SecureFind - Verified Suppliers", description: "Find verified, trusted suppliers in Qatar & worldwide in 2 minutes. No more bad suppliers.", icon: "🔍", href: "/securefind/start", badge: "NEW • Try Free" },
      { title: "Business Intelligence & Analytics", description: "Power BI dashboards, Advanced Excel modeling, KPI tracking - turn data into decisions.", icon: "📊", href: "/booking?service=bi-analytics", badge: "Power BI • Excel" },
      { title: "Microsoft 365 Digital Workplace", description: "Teams, SharePoint, Outlook, documentation systems - work smarter with M365.", icon: "📧", href: "/booking?service=m365-productivity", badge: "M365 Suite" },
      { title: "AI Consulting & Automation", description: "AI opportunity mapping, process automation, workflow design - delivered online.", icon: "🤖", href: "/booking?service=ai-automation", badge: "Online" },
      { title: "Company Formation - Global", description: "US LLC, UK LTD, UAE, Qatar hub - documents, bank, compliance handled online.", icon: "🌍", href: "/booking?service=company-formation", badge: "Global" },
      { title: "PRO & Document Clearing - Remote", description: "Administrative requirements handled via secure portal - no visit needed.", icon: "📄", href: "/booking?service=pro-services", badge: "Remote" },
      { title: "Website & Digital Growth", description: "Audit, messaging, conversion - stronger digital presence.", icon: "🚀", href: "/booking?service=website-growth", badge: "Growth" },
    ],
  },
  about: {
    title: "Why global teams choose TMG",
    description: "We combine Power BI, Excel mastery, M365 productivity and AI automation with practical execution - operated from Doha, serving worldwide.",
    reasons: [
      "01 — Discover: Map your Power BI, Excel & process gaps",
      "02 — Build: Dashboards, automations & M365 systems online",
      "03 — Scale: Handover, training & ongoing support",
      "Operated from Doha, serving US, UK, UAE & beyond - 100% online delivery",
    ],
    asideTitle: "How we deliver online",
    asideItems: [
      "Power BI & Excel files via secure portal",
      "M365 Teams / SharePoint setup live",
      "Loom videos + documentation",
      "2h response time, no in-person required",
    ],
  },
  statistics: [
    { label: "Projects Delivered", value: "500+", icon: "✅" },
    { label: "Global Clients", value: "200+", icon: "🌍" },
    { label: "Avg. Response", value: "2h", icon: "⚡" },
    { label: "Online Delivery", value: "100%", icon: "💻" },
  ],
  testimonials: { heading: "Trusted by founders worldwide", subheading: "From Doha to global", items: [] },
  caseStudies: [{ title: "Power BI Sales Dashboard for Retail", description: "Excel automation reduced reporting from 6h to 15min.", href: "/case-studies" }],
  faq: [
    { question: "Is delivery 100% online?", answer: "Yes. All services are delivered online via Teams, portal & Loom. No need to visit Qatar." },
    { question: "Do you handle Power BI & Advanced Excel?", answer: "Yes - Power BI dashboards, DAX, Power Query, advanced Excel modeling & automation are core services." },
  ],
  cta: { heading: "Ready to build your next system?", description: "Power BI, Excel, M365, AI & company setup - one proposal, global delivery.", primaryText: "Get Proposal", primaryHref: "/booking", secondaryText: "Contact", secondaryHref: "/contact" },
};

export function mergeHomepageContent(partial: Partial<HomepageContent> | null): HomepageContent {
  if (!partial) return defaultHomepageContent;
  return { ...defaultHomepageContent, ...partial, version: partial.version ?? defaultHomepageContent.version, meta: { ...defaultHomepageContent.meta, ...partial.meta }, hero: { ...defaultHomepageContent.hero, ...partial.hero }, quickCard: { ...defaultHomepageContent.quickCard, ...partial.quickCard }, services: { ...defaultHomepageContent.services, ...partial.services, cards: partial.services?.cards ?? defaultHomepageContent.services.cards }, about: { ...defaultHomepageContent.about, ...partial.about }, statistics: partial.statistics ?? defaultHomepageContent.statistics, testimonials: { ...defaultHomepageContent.testimonials, ...partial.testimonials, items: partial.testimonials?.items ?? [] }, caseStudies: partial.caseStudies ?? defaultHomepageContent.caseStudies, faq: partial.faq ?? defaultHomepageContent.faq, cta: { ...defaultHomepageContent.cta, ...partial.cta }, };
}
export function isHomepageContentValid(data: unknown): data is HomepageContent {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  const hero = record.hero; const services = record.services;
  return typeof hero === "object" && hero !== null && !Array.isArray(hero) && typeof (hero as Record<string, unknown>).title === "string" && typeof services === "object" && services !== null && !Array.isArray(services) && Array.isArray((services as Record<string, unknown>).cards);
}
