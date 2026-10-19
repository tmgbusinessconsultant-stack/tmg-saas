export type HomepageContent = {
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
  };
  quickCard: { title: string; description: string; buttonText: string; buttonHref: string };
  services: { heading: string; cards: Array<{ title: string; description: string }> };
  about: { title: string; description: string; reasons: string[]; asideTitle: string; asideItems: string[] };
  testimonials: {
    heading: string;
    items: Array<{
      id: string;
      quote: string;
      clientName: string;
      company: string;
      photoUrl: string;
      rating: number;
      approved: boolean;
    }>;
  };
  statistics: Array<{ label: string; value: string }>;
  caseStudies: Array<{ title: string; description: string }>;
  faq: Array<{ question: string; answer: string }>;
  cta: { heading: string; description: string; primaryText: string; primaryHref: string; secondaryText: string; secondaryHref: string };
};

export const defaultHomepageContent: HomepageContent = {
  hero: {
    kicker: "AI-Powered Business Consulting · Qatar & Global",
    title: "Grow smarter with",
    highlight: "strategy, AI, and execution",
    description: "TMG Business Consulting helps founders, SMEs, and growing teams turn ideas into systems, offers, and scalable businesses.",
    primaryText: "Get Quote",
    primaryHref: "/booking",
    secondaryText: "Start Now",
    secondaryHref: "/ai-tools/business-assistant",
    imageUrl: "",
  },
  quickCard: {
    title: "Start in 60 seconds",
    description: "Tell us your business challenge and get a tailored next step.",
    buttonText: "Launch AI Assistant →",
    buttonHref: "/ai-tools/business-assistant",
  },
  services: {
    heading: "Everything your business needs to move faster",
    cards: [
      { title: "AI Consulting", description: "AI strategy, automation design, and digital transformation for teams ready to scale." },
      { title: "Business Consulting", description: "Strategy, operations, and growth planning for founders and established businesses." },
      { title: "Productivity Training", description: "Workshops and coaching to improve systems, processes, and team efficiency." },
      { title: "Digital Products", description: "Turn your ideas into templates, tools, and packaged offers that generate revenue." },
    ],
  },
  about: {
    title: "Built for founders, teams, and businesses ready to grow",
    description: "TMG Business Consultant exists to simplify business growth. We combine strategic consulting, AI tools, and practical operational guidance to help businesses move from idea to implementation with clarity.",
    reasons: [
      "Practical business advice grounded in real execution",
      "AI-powered support that saves time and improves decision-making",
      "Fast turnaround for documents, proposals, SOPs, and growth plans",
      "Local expertise for businesses operating in Qatar and beyond",
    ],
    asideTitle: "Why choose us",
    asideItems: [
      "Clear strategy and execution support",
      "AI-powered workflows and document generation",
      "Training for teams who want to work smarter",
      "Business documents designed to create trust and clarity",
    ],
  },
  testimonials: {
    heading: "What our clients say",
    items: [],
  },
  statistics: [],
  caseStudies: [],
  faq: [],
  cta: {
    heading: "Let’s build your next business move",
    description: "From AI-powered offers to business consulting and growth planning, we help you move with clarity.",
    primaryText: "Get Quote",
    primaryHref: "/booking",
    secondaryText: "Contact Us",
    secondaryHref: "/contact",
  },
};
