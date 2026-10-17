"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Member = {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
};

type Plan = {
  id: string;
  name: string;
};

type DashboardStats = {
  revenue: number;
  currency: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "/api")
).replace(/\/+$/, "");

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }
  return response.json() as Promise<T>;
}

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshDashboard = useCallback(async () => {
    try {
      const [memberData, planData, stats] = await Promise.all([
        fetchApi<Member[]>("/members"),
        fetchApi<Plan[]>("/plans"),
        fetchApi<DashboardStats>("/stats"),
      ]);
      setMembers(memberData);
      setPlans(planData);
      setRevenue(stats.revenue);
      setCurrency(stats.currency);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshDashboard);
  }, [refreshDashboard]);

  const addMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await fetchApi<Member>("/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() }),
      });
      setName("");
      setEmail("");
      setPhone("");
      await refreshDashboard();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add member");
      setLoading(false);
    }
  };

  const status = loading ? "CONNECTING" : error ? "OFFLINE" : "LIVE";

  return (
    <div style={{ padding: 40, background: "#f9f9f9", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 36, fontWeight: 900 }}>TMG BUSINESS CONSULTING</h1>
      <p>TMG Business Consulting</p>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginTop: 30 }}>
        <div style={{ background: "white", padding: 20, borderRadius: 15, border: "1px solid #eee" }}>
          <div style={{ color: "#666", fontWeight: 700, fontSize: 14 }}>MEMBERS</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 10 }}>{members.length}</div>
        </div>
        <div style={{ background: "white", padding: 20, borderRadius: 15, border: "1px solid #eee" }}>
          <div style={{ color: "#000", fontWeight: 700, fontSize: 14 }}>PLANS</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 10 }}>{plans.length}</div>
        </div>
        <div style={{ background: "white", padding: 20, borderRadius: 15, border: "1px solid #eee" }}>
          <div style={{ color: "#666", fontWeight: 700, fontSize: 14 }}>REVENUE</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 10 }}>
            {new Intl.NumberFormat(undefined, { style: "currency", currency }).format(revenue)}
          </div>
        </div>
        <div style={{ background: "black", color: "white", padding: 20, borderRadius: 15 }}>
          <div style={{ color: "#aaa", fontWeight: 700, fontSize: 14 }}>API STATUS</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10 }}>{status}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 30 }}>
        <div style={{ background: "white", padding: 20, borderRadius: 15, border: "1px solid #eee" }}>
          <h3 style={{ fontWeight: 900 }}>ADD MEMBER</h3>
          <form onSubmit={addMember}>
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full Name" style={{ width: "100%", padding: 12, marginTop: 15, borderRadius: 10, border: "1px solid #ddd" }} />
            <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" style={{ width: "100%", padding: 12, marginTop: 10, borderRadius: 10, border: "1px solid #ddd" }} />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email (optional)" style={{ width: "100%", padding: 12, marginTop: 10, borderRadius: 10, border: "1px solid #ddd" }} />
            <button type="submit" disabled={loading} style={{ width: "100%", background: "black", color: "white", padding: 14, borderRadius: 10, marginTop: 10, fontWeight: 700 }}>+ Add Member</button>
          </form>
          <div style={{ marginTop: 15, fontWeight: 700 }}>Members ({members.length})</div>
          {members.slice(0, 5).map((member) => (
            <div key={member.id} style={{ marginTop: 8 }}>{member.name}</div>
          ))}
        </div>
        <div style={{ background: "white", padding: 20, borderRadius: 15, border: "1px solid #eee" }}>
          <h3 style={{ fontWeight: 900 }}>SYSTEM</h3>
          <div style={{ background: "black", color: "white", padding: 10, borderRadius: 10, marginTop: 10, fontSize: 12 }}>API: {API_BASE_URL}</div>
          <div style={{ border: "1px solid #333", padding: 10, borderRadius: 10, marginTop: 10, fontSize: 12 }}>Frontend: preview / production deployment</div>
          <div style={{ marginTop: 20 }}>
            <strong>Plans</strong>
            {plans.map((plan) => (
              <div key={plan.id} style={{ marginTop: 10, borderBottom: "1px solid #ddd", paddingBottom: 8 }}>{plan.name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
