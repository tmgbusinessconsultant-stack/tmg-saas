const fs = require('fs');

// SUBSCRIPTIONS API
fs.mkdirSync('app/api/subscriptions', { recursive: true });
fs.writeFileSync('app/api/subscriptions/route.ts', \
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
const prisma = new PrismaClient()
export async function GET() {
  const subs = await prisma.subscription.findMany({ include: { member: true, plan: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(subs)
}
export async function POST(req: Request) {
  const body = await req.json()
  const plan = await prisma.membershipPlan.findUnique({ where: { id: body.planId } })
  if(!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  const start = new Date(body.startDate || new Date())
  const end = new Date(start)
  end.setDate(end.getDate() + plan.duration)
  const sub = await prisma.subscription.create({
    data: {
      memberId: body.memberId,
      planId: body.planId,
      startDate: start,
      endDate: end,
      status: 'ACTIVE',
      paymentStatus: body.paymentStatus || 'PAID',
      paymentMethod: body.paymentMethod || 'CASH',
      amountPaid: body.amountPaid ? parseFloat(body.amountPaid) : plan.price,
      remainingSessions: plan.sessions || null
    }
  })
  await prisma.member.update({ where: { id: body.memberId }, data: { status: 'ACTIVE' } })
  return NextResponse.json(sub)
}
\);

// STATS API
fs.mkdirSync('app/api/stats', { recursive: true });
fs.writeFileSync('app/api/stats/route.ts', \
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
const prisma = new PrismaClient()
export async function GET() {
  const gym = await prisma.gym.findFirst()
  if(!gym) return NextResponse.json({ members: 0, active: 0, revenue: 0, plans: 0 })
  const members = await prisma.member.count({ where: { gymId: gym.id } })
  const active = await prisma.subscription.count({ where: { status: 'ACTIVE' } })
  const plans = await prisma.membershipPlan.count({ where: { gymId: gym.id } })
  const revenueAgg = await prisma.subscription.aggregate({ _sum: { amountPaid: true }, where: { paymentStatus: 'PAID' } })
  return NextResponse.json({ members, active, plans, revenue: revenueAgg._sum.amountPaid || 0 })
}
\);

// SUBSCRIPTIONS UI PAGE
fs.mkdirSync('app/subscriptions', { recursive: true });
fs.writeFileSync('app/subscriptions/page.tsx', \
'use client';
import { useEffect, useState } from 'react';
export default function SubsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({ memberId: '', planId: '', paymentMethod: 'CASH' });
  const load = async () => {
    setSubs(await fetch('/api/subscriptions').then(r => r.json()));
    setMembers(await fetch('/api/members').then(r => r.json()));
    setPlans(await fetch('/api/plans').then(r => r.json()));
  };
  useEffect(() => { load(); }, []);
  const submit = async (e: any) => {
    e.preventDefault();
    await fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ memberId: '', planId: '', paymentMethod: 'CASH' });
    load();
  };
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Subscriptions - Assign Plan to Member</h1>
      <form onSubmit={submit} className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded mb-6">
        <select className="border p-2 rounded" value={form.memberId} onChange={e => setForm({...form, memberId: e.target.value})} required>
          <option value="">Select Member</option>
          {members.map((m: any) => <option key={m.id} value={m.id}>{m.name} - {m.phone}</option>)}
        </select>
        <select className="border p-2 rounded" value={form.planId} onChange={e => setForm({...form, planId: e.target.value})} required>
          <option value="">Select Plan/Service</option>
          {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} - {p.price} QAR ({p.type})</option>)}
        </select>
        <select className="border p-2 rounded" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
          <option>CASH</option><option>CARD</option><option>TRANSFER</option>
        </select>
        <button className="bg-black text-white px-4 rounded">Activate Subscription</button>
      </form>
      <table className="w-full border text-sm"><thead><tr className="bg-gray-100"><th className="p-2 text-left">Member</th><th>Plan</th><th>QAR</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
      <tbody>{subs.map((s: any) => <tr key={s.id} className="border-t"><td className="p-2">{s.member?.name}</td><td>{s.plan?.name}</td><td>{s.amountPaid} QAR</td><td>{new Date(s.startDate).toLocaleDateString()}</td><td>{new Date(s.endDate).toLocaleDateString()}</td><td><span className={\px-2 py-1 rounded text-xs \\}>{s.status}</span></td></tr>)}</tbody></table>
    </div>
  );
}
\);

// DASHBOARD PAGE UPGRADE
fs.writeFileSync('app/page.tsx', \
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function Dashboard() {
  const [stats, setStats] = useState({ members: 0, active: 0, plans: 0, revenue: 0 });
  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(setStats); }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">TMG SaaS - Gym Management</h1>
      <p className="text-gray-500 mb-6">Business Consulting | Doha, Qatar | QAR Currency</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded p-4"><div className="text-gray-500 text-sm">Total Members</div><div className="text-2xl font-bold">{stats.members}</div></div>
        <div className="border rounded p-4"><div className="text-gray-500 text-sm">Active Subs</div><div className="text-2xl font-bold text-green-600">{stats.active}</div></div>
        <div className="border rounded p-4"><div className="text-gray-500 text-sm">Plans / Services</div><div className="text-2xl font-bold">{stats.plans}</div></div>
        <div className="border rounded p-4"><div className="text-gray-500 text-sm">Revenue</div><div className="text-2xl font-bold">{stats.revenue} QAR</div></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/members" className="border rounded p-6 hover:bg-gray-50 text-center"><div className="font-bold">Members</div><div className="text-sm text-gray-500">Manage Members</div></Link>
        <Link href="/plans" className="border rounded p-6 hover:bg-gray-50 text-center"><div className="font-bold">Plans</div><div className="text-sm text-gray-500">Monthly/PT/Services - Editable Anytime</div></Link>
        <Link href="/subscriptions" className="border rounded p-6 hover:bg-gray-50 text-center"><div className="font-bold">Subscriptions</div><div className="text-sm text-gray-500">Assign Plans</div></Link>
        <Link href="/settings" className="border rounded p-6 hover:bg-gray-50 text-center"><div className="font-bold">Settings</div><div className="text-sm text-gray-500">Edit Gym Profile</div></Link>
      </div>
    </div>
  );
}
\);

console.log('Done');
