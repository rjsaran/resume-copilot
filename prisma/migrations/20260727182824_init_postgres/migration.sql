-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('ANALYZED', 'APPLIED', 'RECRUITER_CALL', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ResumeVersionType" AS ENUM ('MASTER', 'TAILORED');

-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('GEMINI', 'CLAUDE', 'OPENAI');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobUrl" TEXT NOT NULL,
    "jobHash" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'ANALYZED',
    "overallScore" INTEGER NOT NULL,
    "atsScore" INTEGER NOT NULL,
    "interviewProbability" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "jdMarkdown" TEXT NOT NULL,
    "analysisJson" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResumeVersionType" NOT NULL,
    "resumeJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeProvider" "LlmProvider" NOT NULL DEFAULT 'GEMINI',
    "encryptedGeminiKey" TEXT,
    "encryptedClaudeKey" TEXT,
    "encryptedOpenAiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_jobHash_key" ON "Application"("userId", "jobHash");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_applicationId_key" ON "Analysis"("applicationId");

-- CreateIndex
CREATE INDEX "ResumeVersion_applicationId_idx" ON "ResumeVersion"("applicationId");

-- CreateIndex
CREATE INDEX "Outcome_applicationId_idx" ON "Outcome"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_userId_key" ON "KnowledgeBase"("userId");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
