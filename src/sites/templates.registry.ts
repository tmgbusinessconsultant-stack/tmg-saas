export interface PuckComponentNode { type: string; props: { id: string; [key: string]: any }; }
export interface PuckRootSchema { props: { siteName: string; headerBg: string; headerColor: string; footerBg: string; footerColor: string; bg: string; [key: string]: any; }; }
export interface TemplateStructure { content: PuckComponentNode[]; root: PuckRootSchema; seoTitle: string; seoDesc: string; }
export const TONE_PALETTES: Record<string, { primary: string; secondary: string; dark: string; light: string; accent: string }> = {
  Professional: { primary: '#0F172A', secondary: '#1E293B', dark: '#020617', light: '#F8FAFC', accent: '#2563EB' },
  Luxury: { primary: '#1C1917', secondary: '#44403C', dark: '#0C0A09', light: '#FAFAF9', accent: '#D97706' },
  Bold: { primary: '#4C1D95', secondary: '#6D28D9', dark: '#0F0728', light: '#FAF5FF', accent: '#F43F5E' },
  Friendly: { primary: '#064E3B', secondary: '#047857', dark: '#022C22', light: '#F0FDF4', accent: '#10B981' }
};
export class TemplateRegistry {
  static getIndustryTemplate(industry: string, tone: string, companyName: string): TemplateStructure {
    const palette = TONE_PALETTES[tone] || TONE_PALETTES.Professional;
    const sanitizedName = companyName.trim();
    const rootConfig: PuckRootSchema = { props: { siteName: sanitizedName, headerBg: palette.light, headerColor: palette.primary, footerBg: palette.dark, footerColor: palette.light, bg: palette.light } };
    switch (industry) {
      case 'Corporate Consulting':
        return { root: rootConfig, seoTitle: `Premium Advisory & Strategy | ${sanitizedName}`, seoDesc: `Helping enterprise groups scale safely in Qatar and global trade networks through practical optimization execution maps.`, content: [{ type: "Hero", props: { id: "hero-corp", title: `Transforming Risk Into Strategic Scale`, subtitle: `We orchestrate operational engineering parameters and market entry frameworks for leading ventures in Doha.`, ctaText: "Request Briefing", ctaLink: "#contact", bg: palette.primary, textColor: palette.light } }, { type: "DynamicCards", props: { id: "services-grid", sectionTitle: "Advisory Capabilities", cardCount: "3", itemsJson: JSON.stringify([{ title: "Market Feasibility", desc: "Deep regulatory auditing within local compliance verticals.", icon: "📊" }, { title: "Digital Automation", desc: "Integrating custom enterprise AI logic models into existing pipelines.", icon: "⚙️" }, { title: "Corporate Structuring", desc: "End-to-end foreign investment setups and target clearing routes.", icon: "🏢" }]) } }, { type: "StatsBar", props: { id: "metrics-corp", itemsJson: JSON.stringify([{ label: "Capital Facilitated", val: "QR 450M+" }, { label: "Active Deployments", val: "140+ Nodes" }, { label: "SLA Retention Metric", val: "99.4%" }]) } }] };
      case 'Construction':
        return { root: rootConfig, seoTitle: `Industrial Contracting & Engineering | ${sanitizedName}`, seoDesc: `Delivering large-scale infrastructural assets and technical engineering marvels across Qatari commercial corridors.`, content: [{ type: "Hero", props: { id: "hero-const", title: `Engineering Structural Milestones`, subtitle: `Precision construction contracting, grade-A material pipelines, and robust logistics infrastructure management.`, ctaText: "Review Master Plan", ctaLink: "#portfolio", bg: palette.dark, textColor: palette.light } }, { type: "DynamicCards", props: { id: "capabilities-grid", sectionTitle: "Core Disciplines", cardCount: "3", itemsJson: JSON.stringify([{ title: "Civil Contracting", desc: "Executing smart-grid mega complexes and grade-A structural builds.", icon: "🏗️" }, { title: "MEP Frameworks", desc: "High-voltage routing vectors and specialized thermal air controls.", icon: "⚡" }, { title: "Project Management", desc: "Algorithmic lifecycle critical path schedules under zero-accident mandates.", icon: "📋" }]) } }, { type: "StatsBar", props: { id: "stats-const", itemsJson: JSON.stringify([{ label: "Projects Delivered", val: "85+" }, { label: "Safety Rating", val: "100%" }, { label: "On-Time", val: "98.2%" }]) } }] };
      case 'Technology':
        return { root: rootConfig, seoTitle: `Next-Gen Software Architectures | ${sanitizedName}`, seoDesc: `Building hyper-scalable software cloud matrices and secure edge data models for forward-thinking technology firms.`, content: [{ type: "Hero", props: { id: "hero-tech", title: `The Compute Layer for Modern SaaS Platforms`, subtitle: `Deploy custom, decoupled web builder engines and native AI pipelines globally with zero infrastructure overhead.`, ctaText: "Initialize Instance", ctaLink: "#pricing", bg: palette.accent, textColor: palette.light } }, { type: "FeaturesMatrix", props: { id: "tech-features", sectionTitle: "Infrastructure Layer Specs", itemsJson: JSON.stringify([{ title: "Global CDN Rewrites", desc: "Dynamic route rewriting targeting distributed local servers at edge speeds.", icon: "🌐" }, { title: "Type-Safe Layouts", desc: "No schema degradation via unified JSON data compilation frameworks.", icon: "💎" }, { title: "Native Telemetry", desc: "Real-time query monitor auditing active database connection nodes.", icon: "📈" }]) } }, { type: "StatsBar", props: { id: "stats-tech", itemsJson: JSON.stringify([{ label: "Uptime SLA", val: "99.99%" }, { label: "Edge Nodes", val: "320+" }, { label: "Latency", val: "<45ms" }]) } }] };
      case 'Real Estate':
        return {
          root: rootConfig,
          seoTitle: `Luxury Properties & Residential Developments | ${sanitizedName}`,
          seoDesc: `Discover premium real estate investment portfolios, ultra-luxury residential towers, and commercial developments across The Pearl, Lusail, and West Bay.`,
          content: [
            { type: "Hero", props: { id: "hero-realestate", title: `Redefining Skyline Luxury in Qatar`, subtitle: `Exclusive penthouses, state-of-the-art waterfront commercial developments, and high-yield real estate investments in Lusail and The Pearl.`, ctaText: "Explore Portfolio", ctaLink: "#developments", bg: palette.dark, textColor: palette.light } },
            { type: "DynamicCards", props: { id: "property-grid", sectionTitle: "Premier Portfolios", cardCount: "3", itemsJson: JSON.stringify([{ title: "Lusail Marina Towers", desc: "Smart residential infrastructure featuring state-of-the-art architectural nodes.", icon: "🏙️" }, { title: "The Pearl Residences", desc: "Ultra-luxury private waterfront villas with private mooring rights.", icon: "🏝️" }, { title: "West Bay Commercial", desc: "Premium Grade-A executive office suites built for enterprise scaling.", icon: "🏢" }]) } },
            { type: "StatsBar", props: { id: "metrics-realestate", itemsJson: JSON.stringify([{ label: "Occupancy Rate", val: "94.8%" }, { label: "Delivered Units", val: "1,200+" }, { label: "Average ROI", val: "8.4% Annually" }]) } }
          ]
        };
      case 'Logistics':
        return {
          root: rootConfig,
          seoTitle: `Supply Chain Systems & Logistics Hubs | ${sanitizedName}`,
          seoDesc: `Streamlining multi-modal supply chains, micro-fulfillment warehousing, and automated inventory logistics inside Hamad Port and Doha industrial zones.`,
          content: [
            { type: "Hero", props: { id: "hero-logistics", title: `The Connectivity Layer for Regional Logistics`, subtitle: `Next-generation supply chain networks spanning air freight infrastructure, cold-chain operations, and micro-fulfillment centers in Doha.`, ctaText: "Optimize Supply Chain", ctaLink: "#networks", bg: palette.primary, textColor: palette.light } },
            { type: "FeaturesMatrix", props: { id: "logistics-matrix", sectionTitle: "Fulfillment Matrix Capabilities", itemsJson: JSON.stringify([{ title: "Hamad Port Access", desc: "Direct, fast-track custom clearing corridors minimizing container delay.", icon: "⚓" }, { title: "Automated Cold Storage", desc: "Thermal sensor-monitored hubs operating with strict compliance rules.", icon: "❄️" }, { title: "Last-Mile Distribution", desc: "Algorithmic routing structures optimizing localized parcel dispatches.", icon: "🚛" }]) } },
            { type: "StatsBar", props: { id: "metrics-logistics", itemsJson: JSON.stringify([{ label: "Daily Throughput", val: "15,000 Tons" }, { label: "Transit Accuracy", val: "99.92%" }, { label: "Doha Storage Area", val: "250K m²" }]) } }
          ]
        };
      default:
        return { root: rootConfig, seoTitle: `${sanitizedName} | Growth & Operational Systems`, seoDesc: `Discover professional solutions built by ${sanitizedName}.`, content: [{ type: "Hero", props: { id: "hero-default", title: `Welcome to ${sanitizedName}`, subtitle: `Providing elite professional operations tailored to modern development standards.`, ctaText: "Get Started", ctaLink: "#services", bg: palette.primary, textColor: palette.light } }] };
    }
  }
}
