const values = [
  "Clarity over complexity",
  "Practical execution",
  "Growth with purpose",
  "Trust and transparency",
];

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-3xl">
        <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold">About us</p>
        <h1 className="mt-3 text-4xl font-bold">We help businesses think clearly and grow confidently</h1>
        <p className="mt-5 text-slate-600 leading-7">
          TMG Business Consultant is a business growth partner for founders and teams who want to improve operations, build stronger systems, and use AI in a practical way. We combine strategy, training, and digital support to make business decisions easier to act on.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Our mission</h2>
          <p className="mt-4 text-slate-600 leading-7">To help businesses become more structured, more efficient, and more ready for growth through clear advice and useful digital tools.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Our vision</h2>
          <p className="mt-4 text-slate-600 leading-7">To empower ambitious founders and teams across Qatar and beyond with the systems, tools, and strategy they need to scale with confidence.</p>
        </div>
      </div>

      <div className="mt-12 grid md:grid-cols-4 gap-4">
        {values.map((value) => (
          <div key={value} className="rounded-2xl bg-white border border-slate-200 text-slate-900 p-6 text-center font-semibold shadow-sm">{value}</div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-slate-100 p-8">
        <h2 className="text-2xl font-bold">Founder story</h2>
        <p className="mt-4 text-slate-700 leading-7">
          TMG was created to close the gap between great business ideas and practical execution. Too many entrepreneurs have strong ambitions but not enough support, systems, or clarity. We built TMG to provide strategic support, smart tools, and real-world guidance that helps businesses move forward without unnecessary complexity.
        </p>
      </div>
      <PublishedMediaSection location="about" title="About TMG" />
    </div>
  );
}
import PublishedMediaSection from "@/components/published-media-section";