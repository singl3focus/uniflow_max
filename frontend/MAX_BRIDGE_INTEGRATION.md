# MAX Bridge Integration Summary

## What Was Integrated

I've fully integrated the **MAX Bridge** library into your task management application. This enables seamless integration with the MAX client platform and device features.

## Files Created/Modified

### New Files
1. **`src/lib/maxBridge.ts`** - MAX Bridge API wrapper
   - Type-safe interfaces for MAX Bridge objects
   - Helper functions for safe API access
   - Graceful fallbacks for non-MAX environments
   - ~280 lines of well-documented code

2. **`MAX_BRIDGE_GUIDE.md`** - Comprehensive integration guide
   - Architecture overview
   - Usage examples
   - Security considerations
   - Troubleshooting guide

### Updated Files
1. **`index.html`** - Added MAX Bridge script tag
   - `<script src="https://st.max.ru/js/max-web-app.js"></script>`

2. **`src/main.tsx`** - Initialize MAX Bridge on app startup
   - Calls `initMaxBridge()` before rendering components
   - Sets up ready signal to MAX client

3. **`src/contexts/AuthContext.tsx`** - MAX user authentication
   - Added `MaxUser` interface for type safety
   - New `loginWithMax()` function for AUTO-LOGIN with MAX user data
   - New `maxUser` state to track logged-in MAX user
   - Auto-detection of MAX user data on app startup
   - Haptic feedback on login (success/error)
   - localStorage persistence of MAX user data

4. **`src/pages/LoginPage.tsx`** - Dual authentication UI
   - Traditional username/password login (unchanged)
   - NEW: "Войти как пользователь MAX" button
   - Shows only if MAX user data available (smart conditional rendering)
   - Haptic feedback on authentication attempts

5. **`src/pages/TodayPage.tsx`** - Haptic feedback on task actions
   - Task marked complete → success vibration pattern
   - Task unmarked → light impact vibration
   - Better UX with tactile feedback

6. **`src/pages/ContextsPage.tsx`** - Haptic feedback on context creation
   - Context creation start → impact vibration
   - Context creation success → success vibration pattern
   - UX enhancement for user interactions

## Key Features

### ✅ User Authentication
- **Auto-login with MAX user data** - If running in MAX client, users auto-authenticate
- **Traditional fallback** - Regular username/password login still available
- **Secure token exchange ready** - Structure in place for backend validation

### ✅ Haptic Feedback
- Task completion (success vibration)
- Task cancellation (light vibration)
- Context creation (impact → success)
- Login actions (impact/success/error patterns)
- Gracefully disabled on unsupported devices

### ✅ Platform Support
- iOS, Android, desktop, web detection
- Version info available (e.g., "25.9.16")
- Responsive to platform capabilities

### ✅ Environment Handling
- Works in MAX client, web browser, CI/CD
- All features gracefully degrade when MAX not available
- Proper error logging and warnings

## How MAX Bridge Works in Your App

### 1. App Startup Flow
```
App launches
    ↓
initMaxBridge() called
    ↓
MAX client signals readiness
    ↓
AuthContext checks for MAX user data
    ↓
Auto-login if MAX user available, else show login form
```

### 2. Task Completion Flow
```
User clicks task checkbox
    ↓
triggerHaptic('success') sent to MAX
    ↓
Device vibrates with success pattern
    ↓
Task status updated in background
```

### 3. Context Creation Flow
```
User opens context creation modal
    ↓
User fills form & clicks "Создать"
    ↓
triggerHaptic('impact') - start
    ↓
Context saved to localStorage
    ↓
triggerHaptic('success') - completion
    ↓
Modal closes, list refreshes with new context
```

## Security Notes ⚠️

### Current State (Development)
- Uses `initDataUnsafe` for quick user access
- Creates mock token based on MAX user ID
- Safe for development and testing

### For Production ⚠️
**You MUST add backend validation:**

1. Send `initData` string to your backend
2. Validate `hash` using MAX_SECRET_KEY
3. Exchange for secure JWT/OAuth token
4. Return token to frontend for authenticated API calls

Example in `src/contexts/AuthContext.tsx` `loginWithMax()`:
```typescript
// Current mock implementation
const mockToken = `max_${user.id}_${Date.now()}`;

// Should be replaced with:
// 1. Send initData to backend
// 2. Backend validates hash
// 3. Backend returns JWT token
// 4. Use JWT for all API calls
```

## Available MAX Bridge Functions

Import from `src/lib/maxBridge.ts`:

```typescript
// Get user data
getMaxUserData()                    // Returns MAX user info
getMaxInitData()                    // Returns full init data for backend validation
getMaxBridge()                      // Raw WebApp object (null if not in MAX)

// Haptic feedback
triggerHaptic('success'|'error'|'warning'|'impact'|'selection')

// Back button
setBackButtonVisible(boolean)
onBackButtonClick(callback)         // Returns unsubscribe function

// Sharing
shareToMax(text, link)              // Share to MAX chats/groups
openExternalLink(url)               // Open in external browser

// Initialization
initMaxBridge()                     // Signal readiness to MAX
```

## Testing in Browser (Without MAX)

When you run locally or in a browser without MAX client:
- ✅ Login form works normally
- ✅ Haptic calls are silently ignored (safe)
- ✅ Back button management is skipped
- ✅ All other features work fine
- ⚠️ MAX user auto-login won't happen (no MAX data)

## Next Steps (Optional Enhancements)

1. **Add backend hash validation** (RECOMMENDED for production)
   - Implement in your Python/Node backend
   - Validate `initData` and exchange for JWT

2. **Implement device storage** (for offline features)
   - Uses `window.WebApp.DeviceStorage`
   - Persist task/context data per user

3. **Add QR code scanning** (for context setup)
   - Use `window.WebApp.openCodeReader()`
   - Parse codes for context quick-add

4. **Enable biometric auth** (for sensitive operations)
   - Use `window.WebApp.BiometricManager`
   - Fingerprint/Face ID for password reset

5. **Screenshot protection** (for sensitive pages)
   - `window.WebApp.ScreenCapture.disableScreenCapture()`
   - Useful for financial/personal pages

## Verification Checklist

- ✅ MAX Bridge script tag added to `index.html`
- ✅ `initMaxBridge()` called at app startup
- ✅ User data auto-detection in `AuthContext`
- ✅ Dual login UI (traditional + MAX)
- ✅ Haptic feedback on user interactions
- ✅ Type-safe wrapper with error handling
- ✅ Works in non-MAX environments
- ✅ Documentation included

## Testing the Integration

### 1. Test in Browser (Without MAX)
```bash
npm run dev
# Navigate to login - traditional form should work
# Haptic calls will be silently ignored
```

### 2. Test with MAX Client (When Available)
- Open app from MAX client (botName)
- Should auto-login if MAX user data available
- Task completion should vibrate device
- Context creation should have haptic feedback

### 3. Verify MAX Data
In browser console:
```javascript
window.WebApp?.initDataUnsafe
// Should return user data if in MAX, null if in browser
```

## File Structure
```
src/
├── lib/
│   └── maxBridge.ts              ← Core integration
├── contexts/
│   └── AuthContext.tsx            ← Auth with MAX support
├── pages/
│   ├── LoginPage.tsx              ← Dual auth UI
│   ├── TodayPage.tsx              ← Haptic on tasks
│   └── ContextsPage.tsx           ← Haptic on creation
├── main.tsx                       ← Initializes MAX Bridge
└── ...
index.html                         ← MAX Bridge script tag
MAX_BRIDGE_GUIDE.md               ← This guide
```

---

**Status:** ✅ Ready for development and testing  
**Production Ready:** ⚠️ After adding backend hash validation  
**Last Updated:** 13 November 2025
