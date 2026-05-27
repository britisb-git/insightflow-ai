# Deploy InsightFlow AI to Vercel (100% FREE)

## Prerequisites
- Git installed
- GitHub account (free)
- Vercel account (free) - sign up at https://vercel.com
- MongoDB Atlas account (free) - sign up at https://www.mongodb.com/cloud/atlas/register

---

## Step 1: Setup MongoDB Atlas (5 minutes)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up (it's free, no credit card needed)

2. **Create Free Cluster**
   - Click "Build a Database"
   - Choose **FREE** M0 tier
   - Select region closest to your users
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `insightflow`
   - Password: Generate a strong password (save it!)
   - User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Allow Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://insightflow:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password

---

## Step 2: Push to GitHub (2 minutes)

```bash
# Navigate to your app
cd /app

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - InsightFlow AI"

# Create a new repository on GitHub (https://github.com/new)
# Name it: insightflow-ai
# Don't initialize with README (we already have files)

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/insightflow-ai.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel (3 minutes)

### Option A: Via Vercel Website (Easiest)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Sign Up" (use GitHub to sign in)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `insightflow-ai`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `yarn build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   MONGO_URL = mongodb+srv://insightflow:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net
   DB_NAME = insightflow_ai
   JWT_SECRET = your-random-secret-key-minimum-32-characters
   OPENAI_API_KEY = sk-your-openai-key (optional)
   OPENAI_BASE_URL = https://api.emergent.sh/v1 (optional)
   CORS_ORIGINS = *
   ```

   **Generate JWT Secret:**
   ```bash
   # Run this to generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done! 🎉

6. **Your Live URL**
   - Vercel gives you: `https://insightflow-ai.vercel.app`
   - You can add custom domain later (free!)

---

### Option B: Via Vercel CLI (For Developers)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd /app
vercel

# Follow prompts:
# - Setup and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? insightflow-ai
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add MONGO_URL
# Paste your MongoDB connection string

vercel env add DB_NAME
# Enter: insightflow_ai

vercel env add JWT_SECRET
# Enter: your-generated-secret

# Deploy to production
vercel --prod
```

---

## Step 4: Verify Deployment (1 minute)

1. **Visit your live URL**
   - Open: `https://insightflow-ai.vercel.app` (or your custom domain)
   - You should see the landing page

2. **Test Signup**
   - Click "Get Started"
   - Create an account
   - Login and test file upload

3. **Check Database**
   - Go to MongoDB Atlas
   - Click "Browse Collections"
   - You should see `insightflow_ai` database with `users` collection

---

## Step 5: Custom Domain (Optional - FREE)

1. **Buy domain** (optional) or use free subdomain
   - Vercel provides: `your-app.vercel.app` for free
   - Or buy from Namecheap, GoDaddy, etc.

2. **Add to Vercel**
   - Go to Project Settings → Domains
   - Add your domain
   - Follow DNS setup instructions

3. **Automatic HTTPS**
   - Vercel automatically adds SSL certificate
   - No configuration needed!

---

## 🎉 You're Live!

**Your app is now:**
- ✅ Deployed globally on Vercel's CDN
- ✅ Automatically scales with traffic
- ✅ Has HTTPS enabled
- ✅ Auto-deploys when you push to GitHub
- ✅ Backed up by MongoDB Atlas
- ✅ 100% FREE (forever on free tier)

**Free Tier Limits:**
- Vercel: 100GB bandwidth/month, unlimited deployments
- MongoDB Atlas: 512MB storage (enough for thousands of datasets)
- No time limit - free forever!

---

## 📈 Auto-Deploy on Git Push

Every time you push to GitHub:
```bash
git add .
git commit -m "New feature"
git push
```

Vercel automatically:
1. Detects the push
2. Builds your app
3. Deploys to production
4. Sends you notification

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel dashboard
# Common fix: Clear node_modules and rebuild
vercel --force
```

### MongoDB Connection Error
- Check connection string has correct password
- Verify IP whitelist (should be 0.0.0.0/0)
- Test connection in MongoDB Atlas

### Environment Variables Not Working
- Go to Vercel dashboard → Settings → Environment Variables
- Make sure they're set for "Production"
- Redeploy after adding variables

---

## 🚀 What's Included FREE

**Vercel Free Tier:**
- Unlimited projects
- 100GB bandwidth per month
- Automatic HTTPS
- Global CDN (fast worldwide)
- Git integration
- Custom domains
- Preview deployments

**MongoDB Atlas Free Tier:**
- 512MB storage
- Shared CPU
- Shared RAM
- Enough for 100,000+ records
- Automatic backups
- Security features

---

## 💰 Cost: $0/month (FREE)

**When to upgrade:**
- Vercel: When you exceed 100GB bandwidth/month
- MongoDB: When you exceed 512MB storage

For most small to medium apps, **free tier is enough!**

---

## 🎯 Next Steps

1. Share your live URL: `https://your-app.vercel.app`
2. Test all features with real users
3. Collect feedback
4. Push updates to GitHub (auto-deploys)
5. Monitor usage in Vercel dashboard

---

## 📞 Support

**Vercel Docs:** https://vercel.com/docs  
**MongoDB Atlas Docs:** https://docs.atlas.mongodb.com  
**Next.js Docs:** https://nextjs.org/docs

---

**Congratulations! Your app is live and costs $0! 🎊**
