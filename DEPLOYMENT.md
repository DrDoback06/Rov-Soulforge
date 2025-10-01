# 🚀 Realm of Valor - Deployment Guide

Complete guide for deploying Realm of Valor to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Ready
- [ ] All features tested locally
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] API keys validated
- [ ] Database populated with initial data

### ✅ Firebase Setup
- [ ] Firestore security rules deployed
- [ ] Firestore indexes created
- [ ] Cloud Functions deployed
- [ ] Authentication methods enabled
- [ ] Storage buckets configured

### ✅ External Services
- [ ] Mapbox token active
- [ ] Strava app approved
- [ ] OpenAI API quota sufficient
- [ ] Domain/SSL configured (if custom)

---

## 1️⃣ Firebase Deployment

### Deploy Firestore Rules & Indexes

```bash
cd packages/firebase
firebase use production  # or your project ID
firebase deploy --only firestore:rules,firestore:indexes
```

Expected output:
```
✔  Deploy complete!
Rules:
  - firestore: realmofvalorapp
Indexes:
  - firestore: 3 indexes deployed
```

### Deploy Cloud Functions

```bash
cd packages/firebase
firebase deploy --only functions
```

This deploys:
- `startQuest` - Quest initiation logic
- `completeQuest` - Quest completion validation
- `processActivity` - Strava activity rewards
- `createBattle` - Battle initialization
- `playCard` - Battle card resolution
- `updateLeaderboard` - Ranking updates
- And more...

Expected time: ~5-10 minutes

---

## 2️⃣ Backend API Deployment

### Option A: Railway

```bash
cd apps/backend

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set FIREBASE_PROJECT_ID=your_project_id
railway variables set FIREBASE_PRIVATE_KEY="$(cat ../../packages/firebase/service-account.json | jq -r .private_key)"
railway variables set OPENAI_API_KEY=your_openai_key
railway variables set STRAVA_CLIENT_ID=your_strava_id
railway variables set STRAVA_CLIENT_SECRET=your_strava_secret

# Deploy
railway up
```

Your API will be available at: `https://realm-of-valor-backend.railway.app`

### Option B: Fly.io

```bash
cd apps/backend

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch --name realm-of-valor-api

# Set secrets
fly secrets set FIREBASE_PROJECT_ID=your_project_id
fly secrets set OPENAI_API_KEY=your_openai_key
# ... set all other secrets

# Deploy
fly deploy
```

### Option C: Docker + Your Host

```bash
cd apps/backend

# Build image
docker build -t realm-of-valor-backend .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name rov-backend \
  realm-of-valor-backend

# Or push to registry
docker tag realm-of-valor-backend your-registry/rov-backend:latest
docker push your-registry/rov-backend:latest
```

---

## 3️⃣ Mobile App Deployment

### Prerequisites

1. **EAS CLI**
```bash
npm install -g eas-cli
eas login
```

2. **Configure EAS**
```bash
cd apps/mobile
eas init
```

Update `.env` with production backend URL:
```env
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

### Build iOS

```bash
cd apps/mobile

# Production build
eas build --platform ios --profile production

# Wait for build to complete (~15-20 min)
# Download IPA when ready
```

**Submit to App Store:**
```bash
eas submit --platform ios
```

You'll need:
- Apple Developer account ($99/year)
- App Store Connect app created
- Screenshots & metadata prepared

### Build Android

```bash
cd apps/mobile

# Production build
eas build --platform android --profile production

# Wait for build to complete (~10-15 min)
# Download AAB when ready
```

**Submit to Play Store:**
```bash
eas submit --platform android
```

You'll need:
- Google Play Developer account ($25 one-time)
- Play Console app created
- Screenshots & metadata prepared

### Over-the-Air Updates

For quick fixes without resubmitting:

```bash
cd apps/mobile

# Publish update
eas update --branch production --message "Bug fixes"
```

Users will get updates on next app launch.

---

## 4️⃣ Admin Dashboard Deployment

### Option A: Vercel

```bash
cd apps/admin

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Your dashboard: `https://rov-admin.vercel.app`

### Option B: Firebase Hosting

```bash
cd apps/admin

# Build
pnpm build

# Deploy
firebase deploy --only hosting
```

Your dashboard: `https://realmofvalorapp.web.app`

---

## 5️⃣ Post-Deployment Tasks

### Populate Database

```bash
cd tools/importer
pnpm run import:production
```

This populates Firestore with:
- All card definitions (~300 cards)
- Quest templates (~30 quests)
- Shop items
- Initial game configuration

### Set Up Monitoring

**Firebase Console:**
1. Enable Crashlytics (mobile)
2. Set up Performance Monitoring
3. Configure alerts for Functions errors

**Backend Monitoring:**
1. Add APM tool (New Relic, Datadog, etc.)
2. Set up error tracking (Sentry)
3. Configure uptime monitoring

### Configure Scaling

**Cloud Functions:**
```bash
# functions/index.ts
export const processActivity = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
    maxInstances: 10
  })
  .https.onRequest(...)
```

**Backend API:**
- Railway: Auto-scales
- Fly.io: Configure autoscaling
- Docker: Set up load balancer

---

## 6️⃣ Domain & SSL

### Custom Domain Setup

**Backend:**
1. Point DNS A record to your server IP
2. Configure SSL (Let's Encrypt recommended)
3. Update CORS settings in backend

**Admin Dashboard:**
1. Add custom domain in hosting provider
2. Configure DNS CNAME
3. SSL auto-configured

**Mobile App:**
Update `EXPO_PUBLIC_API_URL` and rebuild.

---

## 7️⃣ Testing Production

### Smoke Tests

1. **Authentication:**
   - Sign up new account ✅
   - Login existing account ✅
   - Anonymous login ✅

2. **Core Features:**
   - Create character ✅
   - View map with quests ✅
   - Start quest ✅
   - Complete quest ✅
   - Buy from shop ✅
   - Build deck ✅

3. **Integrations:**
   - Strava OAuth ✅
   - AI Companion responses ✅
   - Leaderboard updates ✅

4. **Performance:**
   - Map loads < 2s ✅
   - Quest completion < 1s ✅
   - Battle actions < 500ms ✅

---

## 8️⃣ Rollback Procedure

### Firebase Functions

```bash
# List deployments
firebase functions:log

# Rollback
firebase rollback functions:startQuest
```

### Backend API

**Railway:**
```bash
railway rollback
```

**Fly.io:**
```bash
fly releases
fly releases rollback v42
```

### Mobile App

```bash
# Revert OTA update
eas update --branch production --message "Rollback"

# Or
eas channel:rollback production
```

---

## 9️⃣ Monitoring & Alerts

### Set Up Alerts

**Firebase:**
- Functions error rate > 5%
- Firestore read/write spikes
- Auth failures

**Backend:**
- API response time > 2s
- Error rate > 1%
- CPU/Memory > 80%

**Mobile:**
- Crash rate > 0.5%
- ANR rate > 0.1%
- Slow network requests

---

## 🔟 Cost Estimation

### Firebase (per month)
- **Free tier**: Up to 50K reads/day
- **Blaze plan**: $0.06 per 100K reads
- **Functions**: $0.40 per million invocations
- **Estimated**: $10-50/month (1K users)

### Backend Hosting
- **Railway**: $5-20/month
- **Fly.io**: $0-10/month (free tier available)
- **Heroku**: $7-25/month

### External APIs
- **Mapbox**: Free up to 50K requests/month
- **OpenAI**: ~$5-20/month (GPT-4o-mini)
- **Strava**: Free

### Mobile App Stores
- **Apple**: $99/year
- **Google**: $25 one-time

### Total: ~$30-100/month for 1K active users

---

## 📊 Scaling Guidelines

| Users | Firebase | Backend | Functions | Cost/Month |
|-------|----------|---------|-----------|------------|
| 100 | Free tier | $5 | Free tier | ~$10 |
| 1K | $10-20 | $10-20 | $5-10 | ~$50 |
| 10K | $50-100 | $50-100 | $20-50 | ~$200 |
| 100K | $500-1K | $200-500 | $100-200 | ~$1-2K |

---

## 🐛 Common Issues

### "Functions deployment failed"
**Solution**: Check Node version (need 18+)
```bash
firebase functions:config:get
node --version  # Should be 18+
```

### "EAS build stuck"
**Solution**: Clear cache and retry
```bash
eas build:clear-cache
eas build --clear-cache --platform all
```

### "Firestore permission denied"
**Solution**: Redeploy security rules
```bash
firebase deploy --only firestore:rules
```

---

## ✅ Production Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance optimized
- [ ] Error tracking configured
- [ ] Backups automated
- [ ] Documentation complete

### Launch Day
- [ ] Deploy Firebase infrastructure
- [ ] Deploy backend API
- [ ] Build & submit mobile apps
- [ ] Deploy admin dashboard
- [ ] Populate initial data
- [ ] Test all critical flows
- [ ] Monitor error rates
- [ ] Announce launch! 🎉

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately
- [ ] Plan feature roadmap
- [ ] Schedule regular backups

---

## 🎊 You're Live!

Congratulations! Realm of Valor is now in production.

**Next Steps:**
1. Monitor user feedback
2. Track key metrics (DAU, retention, revenue)
3. Iterate based on data
4. Plan next feature release

---

**Need help?** Check logs:
- Firebase: `firebase functions:log`
- Backend: Railway/Fly.io dashboard
- Mobile: Crashlytics in Firebase Console

**🚀 Happy Deploying!**
