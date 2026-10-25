export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  date: string;
  displayDate: string;
  readingTime: number;
  image: string;
  imageAlt: string;
  cta: string;
  sections: ArticleSection[];
  takeaways: string[];
  featured?: boolean;
  keywords?: string[];
  author?: string;
}

export const articles: BlogArticle[] = [
  {
    slug: "business-growth-strategies-smes",
    title: "Business Growth Strategies for SMEs",
    summary: "A practical framework for sustainable SME growth: planning, retention, operations, cash flow, and measurable marketing.",
    description: "Learn how SMEs can grow sustainably with practical planning, customer retention, operational efficiency, cash flow management, and measurable marketing. Qatar & GCC focused.",
    category: "Business Consulting",
    date: "2026-10-17",
    displayDate: "October 17, 2026",
    readingTime: 7,
    image: "/blog/business-growth-strategies-smes.jpg",
    imageAlt: "SME founder reviewing growth chart and cash flow",
    cta: "Need a growth strategy for Qatar/GCC? Book a consultation with TMG.",
    featured: true,
    keywords: ["SME growth", "Qatar business", "business strategy", "cash flow"],
    author: "TMG Consulting",
    sections: [
      { heading: "Introduction", paragraphs: ["Healthy growth is not just larger sales. For SMEs, it means serving more of the right customers while protecting margin, quality, and cash.", "This requires a connected system: clear demand, retained customers, efficient delivery, and responsible funding."] },
      { heading: "Define Sustainable Growth", paragraphs: ["Pick 3-4 metrics that matter: recurring revenue, gross margin, repeat-purchase rate, delivery time. Track trend vs target monthly.", "Decide what kind of growth you want before you chase it."], bullets: ["Set a 12-month measurable objective", "Calculate capacity and investment needed", "Review leading indicators monthly"] },
      { heading: "Retention Over Acquisition", paragraphs: ["Retaining a satisfied customer is cheaper than replacing one. Map enquiry to delivery to follow-up and remove friction.", "Use consistent onboarding, proactive updates, and relevant follow-up segmented by need."] },
      { heading: "Operations & Cash Flow", paragraphs: ["Growth exposes process gaps. Document recurring workflows, assign single owners, remove duplicate approvals.", "Forecast receipts and payments for 8-13 weeks. Invoice promptly, follow overdue accounts, keep a reserve for predictable obligations."] },
      { heading: "Marketing That Pays", paragraphs: ["Start with a defined customer and problem. Explain outcome, evidence, and next step.", "Track qualified enquiries, conversion, CAC, and revenue by channel. Keep what produces profitable customers."] },
      { heading: "Conclusion", paragraphs: ["Sustainable growth is a cycle: focused plan, listen to customers, strengthen delivery, protect cash, measure marketing. Improve one constraint at a time."] },
    ],
    takeaways: ["Define growth by margin, retention, capacity, cash — not revenue alone.", "Systematize retention into onboarding and delivery.", "Simplify and measure before automating.", "Use rolling cash forecast and small marketing experiments."],
  },
  {
    slug: "practical-ai-for-small-business",
    title: "Practical AI for Small Business",
    summary: "How SMEs can use AI safely for productivity, support, marketing, and ops — without risk.",
    description: "A practical guide to using AI in small business: safe implementation, customer service, marketing, operations, and risks. Qatar/GCC compliance aware.",
    category: "AI Solutions",
    date: "2026-10-17",
    displayDate: "October 17, 2026",
    readingTime: 8,
    image: "/blog/practical-ai-for-small-business.jpg",
    imageAlt: "Small team using AI tools for customer support and operations",
    cta: "Explore TMG AI tools for SMEs.",
    featured: true,
    keywords: ["AI for SME", "Qatar AI", "business automation", "AI tools"],
    author: "TMG Consulting",
    sections: [
      { heading: "Introduction", paragraphs: ["AI can draft, summarize, classify, and generate ideas from instructions. It is a useful assistant, but does not understand your business like a trained employee.", "Start with a repetitive, low-risk task with a clear definition of success. AI should support judgement, not make unreviewed decisions."] },
      { heading: "Where SMEs Get Value", paragraphs: ["AI reduces time on first drafts, routine summaries, categorization, and internal search. Benefit is not automatic — compare baseline time/error vs trial including review effort.", "Focus on tasks with volume, clear output, and low sensitivity."] },
      { heading: "Customer Service & Marketing", paragraphs: ["Use AI to draft responses to common enquiries, summarize conversations, retrieve approved answers. Keep human escalation for exceptions, complaints, sensitive data.", "For marketing: brainstorm angles, adapt drafts, summarize feedback. Human review is essential for accuracy, voice, cultural context. Verify claims before publishing."] },
      { heading: "Implementation Roadmap", paragraphs: ["List repetitive tasks, estimate volume, time, error cost, data sensitivity. Choose one narrow use case with measurable baseline.", "Run a limited pilot with approved tools and test data. Measure results before scaling."], bullets: ["Map task and baseline", "Choose bounded low-risk pilot", "Set review, privacy, escalation rules", "Measure before scaling"] },
      { heading: "Risks & Best Practices", paragraphs: ["AI can hallucinate, expose confidential data, or reflect bias. Provider terms may differ from your expectations.", "Use approved tools, strip personal/confidential data unless authorized, restrict access, check retention. Train staff on verification."] },
    ],
    takeaways: ["Start with repetitive, measurable, low-risk pilot.", "Keep humans responsible for verification and sensitive cases.", "Do not submit confidential data without authorization.", "Scale only after measurable value and acceptable quality."],
  },
  {
    slug: "productivity-habits-for-busy-teams",
    title: "Productivity Habits for Busy Teams",
    summary: "How leaders improve focus, meetings, communication, and accountability without burnout.",
    description: "Improve team productivity with focused planning, shorter meetings, clear communication, useful metrics, and shared accountability.",
    category: "Productivity Training",
    date: "2026-10-17",
    displayDate: "October 17, 2026",
    readingTime: 6,
    image: "/blog/productivity-habits-for-busy-teams.jpg",
    imageAlt: "Team planning focused work with clear priorities",
    cta: "Learn how TMG improves team performance in Qatar & GCC.",
    keywords: ["team productivity", "leadership", "meetings", "accountability"],
    author: "TMG Consulting",
    sections: [
      { heading: "Why Productivity Matters", paragraphs: ["Productivity is valuable work completed with quality, not a full calendar. Unclear priorities fragment effort.", "Reduce switching, make ownership explicit, fix recurring blockers."] },
      { heading: "Time & Meetings", paragraphs: ["Translate goals into weekly outcomes with owner, due date, definition of done. Protect focus blocks, batch admin, leave buffer.", "Meetings need purpose: decision, problem, coordination. Share context in advance, end with decisions and owners recorded."] },
      { heading: "Communication & Tracking", paragraphs: ["Agree channels for urgent vs decisions vs reference. Include context, deadline, response needed. Use single source of truth.", "Track outcomes team can influence: cycle time, commitments completed, quality, rework. Investigate causes before changing targets."] },
      { heading: "Accountability Culture", paragraphs: ["Accountability starts with realistic commitments and clear authority. Make it safe to flag risks early.", "Reward useful outcomes, thoughtful collaboration, learning — not constant availability. Fix one friction point per month."] },
    ],
    takeaways: ["Measure useful outcomes and quality, not hours.", "Each priority needs owner, deadline, definition of done.", "Make meetings decision-focused, record actions centrally.", "Treat missed commitments as signal to investigate blockers."],
  },
  {
    slug: "consulting-tips-for-founders-and-leaders",
    title: "Consulting Tips for Founders and Leaders",
    summary: "Leadership, strategy, decision-making, growth, team-building, and risk — practical guidance.",
    description: "Practical leadership guidance for founders: strategy, decisions, managing growth, building teams, reducing risk.",
    category: "Leadership Development",
    date: "2026-10-17",
    displayDate: "October 17, 2026",
    readingTime: 7,
    image: "/blog/consulting-tips-for-founders-and-leaders.jpg",
    imageAlt: "Founder reviewing strategic options for business direction",
    cta: "Book a consultation with TMG Business Consulting.",
    keywords: ["founder leadership", "business strategy", "decision making", "Qatar"],
    author: "TMG Consulting",
    sections: [
      { heading: "Leadership & Strategy", paragraphs: ["Leader's job is direction, clear responsibilities, listening to people close to work, enabling learning.", "Strategy is choices: customers, problem you solve better, capabilities required. Translate into measurable objectives with owners."] },
      { heading: "Decisions & Growth", paragraphs: ["Separate reversible vs hard-to-reverse. Reversible: short deadline, decide, learn. High-impact: criteria, evidence from multiple sources, write assumptions.", "Growth increases coordination. Check sales, delivery, support, finance, compliance can handle volume. Expand in stages, watch cash conversion, retention."], bullets: ["State decision and deadline", "List options and criteria", "Test assumptions and downside", "Record owner and review trigger"] },
      { heading: "Teams & Risk", paragraphs: ["Strong teams need clear roles, right skills, reliable info, permission to raise concerns. Delegate outcomes with context and boundaries.", "Identify what could interrupt service, damage trust, or pressure cash. Prioritize by likelihood/impact, assign owner, prepare simple continuity plan."] },
    ],
    takeaways: ["Strategy is choices about customers, value, capabilities.", "Match decision process to reversibility and impact.", "Scale capacity and controls alongside sales.", "Assign owners to material risks and learn systematically."],
  },
];

export function getArticle(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getFeatured(): BlogArticle[] {
  return articles.filter(a => a.featured);
}