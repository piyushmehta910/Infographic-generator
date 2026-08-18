# GitHub Setup Instructions

## Step 1: Create a New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `infographic-generator`
3. Description: `AI-powered infographic generator built with Next.js 15, TypeScript, and Tailwind CSS`
4. Choose: **Public** (or Private if you prefer)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

## Step 2: Link and Push to GitHub

Run these commands in your terminal:

```bash
cd C:\Users\piyus\infographic-generator

# Add the GitHub remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/infographic-generator.git

# Rename branch to main (GitHub standard)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Authenticate

When prompted:

- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)
  - Generate one at: https://github.com/settings/tokens
  - Select scope: `repo`
  - Copy the token and use it as the password

## Step 4: Deploy on Vercel

After pushing to GitHub:

1. Go to https://vercel.com/new
2. Import your `infographic-generator` repository
3. Vercel auto-detects Next.js
4. Click **Deploy**
5. Your app will be live at: `https://infographic-generator.vercel.app`

## Alternative: Deploy Directly with Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to link your Git repo and deploy.

## Current Git Status

- **Branch**: `master` (will be renamed to `main`)
- **Commit**: `195d88a` - Initial commit with 29 files
- **Files**: All source code, configs, and documentation

## What's Included in the Repo

- Next.js 15 app with TypeScript
- 9 built-in templates (Modern, Business, Timeline, etc.)
- 3 AI providers (OpenRouter, NVIDIA NIM, Groq)
- Full editor dashboard
- Landing page
- API routes
- Vercel deployment config
- Complete documentation
