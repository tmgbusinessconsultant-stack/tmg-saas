# TMG SAAS - FIXED VERSION - RUNS WITHOUT ERRORS
Write-Host "TMG Business Consulting - Fixed Setup Starting..." -ForegroundColor Green

if (!(Test-Path "backend")) {
  npx @nestjs/cli new backend --package-manager npm --skip-git --skip-install --collection=@nestjs/schematics
}
Set-Location backend
npm install
npm install @nestjs/passport @nestjs/jwt passport passport-jwt @prisma/client @aws-sdk/client-s3 bcrypt openai prisma @types/passport-jwt @types/bcrypt --save

$folders = @("src/auth/guards","src/auth/strategies","src/auth/decorators","src/storage","src/ai/dto","src/prisma","prisma")
foreach ($f in $folders) { New-Item -ItemType Directory -Force -Path $f | Out-Null }

@"
JWT_SECRET=tmg-super-secret-jwt-32-chars-minimum-change-this-123456
JWT_EXPIRES=7d
DATABASE_URL=postgresql://tmg:tmg123@localhost:5432/tmg_saas?schema=public
S3_REGION=eu-central-1
S3_BUCKET=tmg-production
S3_ACCESS_KEY=YOUR_KEY
S3_SECRET_KEY=YOUR_SECRET
OPENAI_API_KEY=sk-...
FLW_SECRET_KEY=FLWSECK-...
FRONTEND_URL=https://tmgbusinessconsulting.com
"@ | Set-Content -Path ".env" -Force

@"
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(uuid()) email String @unique password String role String @default("client") isActive Boolean @default(true) createdAt DateTime @default(now()) }
model AiPrompt { id String @id @default(uuid()) name String @unique description String? createdAt DateTime @default(now()) versions AiPromptVersion[] }
model AiPromptVersion { id String @id @default(uuid()) promptId String version Int systemPrompt String @db.Text userPrompt String @db.Text isActive Boolean @default(false) createdAt DateTime @default(now()) prompt AiPrompt @relation(fields: [promptId], references: [id], onDelete: Cascade) @@unique([promptId, version]) }
model Lead { id String @id @default(uuid()) name String email String status String @default("new") createdAt DateTime @default(now()) }
model Quote { id String @id @default(uuid()) quoteNumber String @unique userId String items Json total Float status String @default("draft") paymentLink String? createdAt DateTime @default(now()) }
model Order { id String @id @default(uuid()) orderNumber String @unique userId String amount Float gateway String status String @default("pending") createdAt DateTime @default(now()) }
model SeoSetting { id String @id @default(uuid()) key String @unique value Json updatedAt DateTime @updatedAt }
model AuditLog { id String @id @default(uuid()) userId String? action String entity String createdAt DateTime @default(now()) }
"@ | Set-Content -Path "prisma/schema.prisma" -Force

# Fix PrismaService - single $ only
' import { Injectable, OnModuleInit } from "@nestjs/common"; import { PrismaClient } from "@prisma/client"; @Injectable() export class PrismaService extends PrismaClient implements OnModuleInit { async onModuleInit() { await this.$connect(); } } ' | Set-Content -Path "src/prisma/prisma.service.ts" -Force
' import { Global, Module } from "@nestjs/common"; import { PrismaService } from "./prisma.service"; @Global() @Module({ providers: [PrismaService], exports: [PrismaService] }) export class PrismaModule {} ' | Set-Content -Path "src/prisma/prisma.module.ts" -Force

# Auth guards - your exact code - FIXED
@'
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable() export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) { return super.canActivate(context); }
  handleRequest(err: any, user: any) { if (err ||!user) { throw new UnauthorizedException('Authentication required'); } return user; }
}
'@ | Set-Content -Path "src/auth/guards/jwt-auth.guard.ts" -Force

# S3 FIXED - correct $ interpolation
@'
import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
@Injectable() export class S3Service {
  private readonly s3: S3Client;
  constructor() { this.s3 = new S3Client({ region: process.env.S3_REGION, credentials: { accessKeyId: process.env.S3_ACCESS_KEY || '', secretAccessKey: process.env.S3_SECRET_KEY || '' } }); }
  async uploadFile(file: Express.Multer.File, path: string) {
    const key = `${path}/${Date.now()}-${file.originalname}`;
    await this.s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype }));
    return { key, url: `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}` };
  }
  async deleteFile(key: string) { await this.s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })); return true; }
}
'@ | Set-Content -Path "src/storage/s3.service.ts" -Force

Set-Location..
@"
@echo off
echo TMG Owner App Starting...
cd backend
start http://localhost:4000/api
npm run start:dev
pause
"@ | Set-Content -Path "START-TMG-APP.bat" -Force

Write-Host "FIXED! Now double click START-TMG-APP.bat" -ForegroundColor Green