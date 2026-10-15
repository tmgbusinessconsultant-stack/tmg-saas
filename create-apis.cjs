const fs = require('fs');
fs.mkdirSync('app/api/plans/[id]', { recursive: true });
fs.mkdirSync('app/api/members', { recursive: true });
fs.mkdirSync('app/api/gym', { recursive: true });

fs.writeFileSync('app/api/plans/route.ts', \import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
const prisma = new PrismaClient()
export async function GET() {
  const gym = await prisma.gym.findFirst()
  if (!gym) return NextResponse.json([])
  const plans = await prisma.membershipPlan.findMany({ where: { gymId: gym.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(plans)
}
export async function POST(req: Request) {
  const body = await req.json()
  const gym = await prisma.gym.findFirst()
  const plan = await prisma.membershipPlan.create({
    data: { name: body.name, description: body.description || null, type: body.type || 'MONTHLY', price: parseFloat(body.price), currency: 'QAR', duration: parseInt(body.duration), sessions: body.sessions ? parseInt(body.sessions) : null, isActive: body.isActive ?? true, gymId: gym.id }
  })
  return NextResponse.json(plan)
}
\);

fs.writeFileSync('app/api/plans/[id]/route.ts', \import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
const prisma = new PrismaClient()
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updated = await prisma.membershipPlan.update({ where: { id: params.id }, data: { name: body.name, description: body.description, type: body.type, price: body.price ? parseFloat(body.price) : undefined, duration: body.duration ? parseInt(body.duration) : undefined, sessions: body.sessions !== undefined ? (body.sessions ? parseInt(body.sessions) : null) : undefined, isActive: body.isActive } })
  return NextResponse.json(updated)
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.membershipPlan.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
\);

fs.writeFileSync('app/api/members/route.ts', \import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
const prisma = new PrismaClient()
export async function GET() {
  const gym = await prisma.gym.findFirst()
  const members = await prisma.member.findMany({ where: { gymId: gym?.id }, include: { subscriptions: { include: { plan: true } } }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(members)
}
export async function POST(req: Request) {
  const body = await req.json()
  const gym = await prisma.gym.findFirst()
  const member = await prisma.member.create({ data: { name: body.name, phone: body.phone, email: body.email || null, qatarId: body.qatarId || null, status: body.status || 'ACTIVE', notes: body.notes || null, gymId: gym.id } })
  return NextResponse.json(member)
}
\);

fs.writeFileSync('app/api/gym/route.ts', \import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
const prisma = new PrismaClient()
export async function GET() { const gym = await prisma.gym.findFirst(); return NextResponse.json(gym) }
export async function PUT(req: Request) {
  const body = await req.json()
  const gym = await prisma.gym.findFirst()
  const updated = await prisma.gym.update({ where: { id: gym.id }, data: { name: body.name, phone: body.phone, email: body.email, address: body.address } })
  return NextResponse.json(updated)
}
\);

console.log('API files created');
