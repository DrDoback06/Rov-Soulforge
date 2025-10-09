# Fix Mapbox for EAS Builds

The Mapbox build failed because it requires authentication to download the Android SDK during build.

## Step 1: Get Mapbox Secret Token

1. Go to https://account.mapbox.com/access-tokens/
2. Click "Create a token"
3. Give it a name like "EAS Build Downloads"
4. Under **Secret scopes**, check `DOWNLOADS:READ`
5. Click "Create token"
6. **Copy the secret token** (starts with `sk.`)

## Step 2: Add Token to EAS

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
eas secret:create --scope project --name MAPBOX_DOWNLOADS_TOKEN --value YOUR_SECRET_TOKEN_HERE
```

Replace `YOUR_SECRET_TOKEN_HERE` with the `sk.` token you copied.

## Step 3: Update App Config

The token needs to be passed to the Mapbox plugin during build. This is already configured in `app.json`.

## Step 4: Rebuild

```bash
eas build --profile development --platform android
```

This time Mapbox will authenticate and download successfully!

---

## Alternative: Use Environment Variable Locally

For local development, set the token:

**Windows (PowerShell):**
```powershell
$env:MAPBOX_DOWNLOADS_TOKEN="YOUR_SECRET_TOKEN"
```

**Mac/Linux:**
```bash
export MAPBOX_DOWNLOADS_TOKEN="YOUR_SECRET_TOKEN"
```

Then run:
```bash
pnpm start
```

---

## Why This is Needed

Mapbox requires authentication for:
- Downloading Android/iOS SDKs during native builds
- This is separate from the public access token used at runtime

The public token (`pk.`) is for map tiles at runtime.
The secret token (`sk.`) is for downloading SDKs during build.

---

## Once Working

After the build succeeds with Mapbox:
- Interactive map will work on Android
- GPS quest markers will appear
- Route polylines will render
- All location-based features will be functional

The map is central to the adventure experience! 🗺️
