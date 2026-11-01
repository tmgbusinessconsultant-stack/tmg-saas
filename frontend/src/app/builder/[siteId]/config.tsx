import { Config } from "@measured/puck";

export interface RootProps {
  siteName: string;
  headerBg: string;
  headerColor: string;
  footerBg: string;
  footerColor: string;
  bg: string;
}

export interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bg: string;
  textColor: string;
}

export interface DynamicCardsProps {
  sectionTitle: string;
  cardCount: string;
  itemsJson: string;
}

export interface StatsBarProps {
  itemsJson: string;
}

export interface FeaturesMatrixProps {
  sectionTitle: string;
  itemsJson: string;
}

interface DynamicCardItem {
  title: string;
  desc: string;
  icon: string;
}

interface StatsItem {
  label: string;
  val: string;
}

interface FeatureItem {
  title: string;
  desc: string;
  icon: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseItems<T>(json: string, isItem: (value: unknown) => value is T): { items: T[]; error: string | null } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch (error: unknown) {
    return { items: [], error: error instanceof Error ? error.message : "Invalid JSON." };
  }
  if (!Array.isArray(parsed)) return { items: [], error: "Expected a JSON array." };
  if (!parsed.every(isItem)) return { items: [], error: "One or more items have an invalid format." };
  return { items: parsed, error: null };
}

function isDynamicCardItem(value: unknown): value is DynamicCardItem {
  return isRecord(value)
    && typeof value.title === "string"
    && typeof value.desc === "string"
    && typeof value.icon === "string";
}

function isStatsItem(value: unknown): value is StatsItem {
  return isRecord(value) && typeof value.label === "string" && typeof value.val === "string";
}

function isFeatureItem(value: unknown): value is FeatureItem {
  return isRecord(value)
    && typeof value.title === "string"
    && typeof value.desc === "string"
    && typeof value.icon === "string";
}

function safeHref(href: string): string {
  const trimmedHref = href.trim();
  return trimmedHref.startsWith("/")
    || trimmedHref.startsWith("#")
    || /^https?:\/\//i.test(trimmedHref)
    ? trimmedHref
    : "#";
}

export const config: Config<{
  Hero: HeroProps;
  DynamicCards: DynamicCardsProps;
  StatsBar: StatsBarProps;
  FeaturesMatrix: FeaturesMatrixProps;
}, RootProps> = {
  root: {
    render: ({ children, bg }) => (
      <div style={{ backgroundColor: bg || '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        {children}
      </div>
    ),
  },
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        ctaText: { type: "text" },
        ctaLink: { type: "text" },
        bg: { type: "text" },
        textColor: { type: "text" },
      },
      defaultProps: {
        title: "Heading Title",
        subtitle: "Subheading detail block configuration placeholder.",
        ctaText: "Action Link",
        ctaLink: "#",
        bg: "#0F172A",
        textColor: "#FFFFFF",
      },
      render: ({ title, subtitle, ctaText, ctaLink, bg, textColor }) => (
        <section className="py-20 px-8 text-center" style={{ backgroundColor: bg, color: textColor }}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{title}</h1>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">{subtitle}</p>
            <a href={safeHref(ctaLink)} className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg text-sm transition text-white shadow-md">
              {ctaText}
            </a>
          </div>
        </section>
      ),
    },
    DynamicCards: {
      fields: {
        sectionTitle: { type: "text" },
        cardCount: { type: "select", options: [{ label: "3 Cards", value: "3" }, { label: "4 Cards", value: "4" }] },
        itemsJson: { type: "textarea" },
      },
      defaultProps: {
        sectionTitle: "Features Spectrum",
        cardCount: "3",
        itemsJson: `[{"title":"Feature Node","desc":"Description text block detail mapping parameter.","icon":"💎"}]`,
      },
      render: ({ sectionTitle, itemsJson }) => {
        const { items, error } = parseItems(itemsJson, isDynamicCardItem);
        return (
          <section className="py-16 px-8 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-zinc-900 mb-10">{sectionTitle}</h2>
            {error && <p role="alert" className="text-center text-red-700">{`Unable to render cards: ${error}`}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {items.map(item => (
                <div key={`${item.title}-${item.desc}`} className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-base text-zinc-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        );
      },
    },
    StatsBar: {
      fields: {
        itemsJson: { type: "textarea" },
      },
      defaultProps: {
        itemsJson: `[{"label":"Metric Label","val":"100%"}]`,
      },
      render: ({ itemsJson }) => {
        const { items, error } = parseItems(itemsJson, isStatsItem);
        return (
          <section className="bg-zinc-900 text-zinc-100 py-10 px-8 border-y border-zinc-800">
            {error && <p role="alert" className="text-center text-red-300">{`Unable to render statistics: ${error}`}</p>}
            <div className="max-w-7xl mx-auto flex flex-wrap justify-around items-center gap-6 text-center">
              {items.map(item => (
                <div key={`${item.label}-${item.val}`} className="min-w-[150px]">
                  <div className="text-3xl font-black text-blue-500 mb-1 font-mono tracking-tight">{item.val}</div>
                  <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </section>
        );
      },
    },
    FeaturesMatrix: {
      fields: {
        sectionTitle: { type: "text" },
        itemsJson: { type: "textarea" },
      },
      defaultProps: {
        sectionTitle: "Performance Framework",
        itemsJson: `[{"title":"Metric Node","desc":"System parameter logs tracking detail fields.","icon":"🌐"}]`,
      },
      render: ({ sectionTitle, itemsJson }) => {
        const { items, error } = parseItems(itemsJson, isFeatureItem);
        return (
          <section className="py-16 px-8 max-w-7xl mx-auto">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mb-8 border-l-4 border-blue-600 pl-3">{sectionTitle}</h2>
            {error && <p role="alert" className="text-red-700">{`Unable to render features: ${error}`}</p>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {items.map(item => (
                <div key={`${item.title}-${item.desc}`} className="flex gap-4 items-start p-4 hover:bg-zinc-50 rounded-xl transition">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 mb-0.5">{item.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      },
    },
  },
};
