# MAX Bridge Quick Start

## 5-Minute Overview

Your app now has full MAX Bridge integration. Here's what that means:

### 🎯 What Works Now

1. **Auto-Login with MAX User**
   - When app opens in MAX client, user automatically logs in
   - No login form needed for MAX users
   - Falls back to traditional login for web users

2. **Haptic Feedback**
   - Task completion → device vibrates (success pattern)
   - Task cancellation → device vibrates (light pattern)
   - Context creation → device vibrates (impact → success)
   - All UI interactions feel more responsive

3. **Ready for More**
   - Back button management prepared
   - Sharing functionality prepared
   - Platform detection ready
   - QR code scanning prepared

---

## 🚀 Using the Features

### Trigger Haptic Feedback

```typescript
import { triggerHaptic } from './lib/maxBridge';

// Success feedback
triggerHaptic('success');      // "Task completed!"

// Error feedback
triggerHaptic('error');        // "Something went wrong"

// Warning feedback
triggerHaptic('warning');      // "Are you sure?"

// Light impact
triggerHaptic('impact');       // "Button pressed"

// Selection change
triggerHaptic('selection');    // "Scrolling options"
```

### Get User Data

```typescript
import { getMaxUserData, getMaxInitData } from './lib/maxBridge';

// Get logged-in user info
const user = getMaxUserData();
if (user) {
  console.log(`Hello, ${user.first_name}!`);
  console.log(`User ID: ${user.id}`);
  console.log(`Phone: ${user.photo_url}`);
}

// Get raw init data for backend validation
const initData = getMaxInitData();
if (initData) {
  // Send to backend for signature validation
  fetch('/api/auth/validate-max', {
    method: 'POST',
    body: JSON.stringify(initData)
  });
}
```

### Show/Hide Back Button

```typescript
import { setBackButtonVisible, onBackButtonClick } from './lib/maxBridge';

// Show back button in MAX header
useEffect(() => {
  setBackButtonVisible(true);
  
  // Handle back button press
  const unsubscribe = onBackButtonClick(() => {
    navigate(-1); // or navigate('/');
  });
  
  return () => {
    unsubscribe();
    setBackButtonVisible(false);
  };
}, [navigate]);
```

### Share Content

```typescript
import { shareToMax, openExternalLink } from './lib/maxBridge';

// Share to MAX chats/groups
function handleShare() {
  shareToMax(
    '📚 Check out this context!',
    'https://max.ru/myapp/contexts/42'
  );
}

// Open link in system browser
function handleOpenLink() {
  openExternalLink('https://example.com');
}
```

---

## 📝 Current Usage in Your App

### LoginPage.tsx
- Shows "Войти как пользователь MAX" if MAX user available
- Haptic feedback on login attempt (success/error)

### TodayPage.tsx
- Task checkbox toggle → haptic feedback
  - Complete: success vibration
  - Incomplete: light vibration

### ContextsPage.tsx
- "Создать контекст" button → haptic on creation
  - Start: impact
  - Finish: success

### AuthContext.tsx
- `loginWithMax()` function for MAX user authentication
- `maxUser` state for storing logged-in user
- Auto-login detection on app startup

---

## 🧪 Try It Out

### In Browser (Without MAX)

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:5173
# 3. Login with username/password
# 4. Complete a task
#    - Check console (should say WebApp not available)
#    - No vibration (expected - not in MAX)
# 5. Create a context
#    - Works fine, just no haptic
```

### In Browser Console

```javascript
// Check if MAX available
window.WebApp
// → null in browser
// → object in MAX client

// Try haptic (safe even if not available)
window.WebApp?.HapticFeedback?.impactOccurred('light')

// Check user data
window.WebApp?.initDataUnsafe?.user
```

---

## ⚙️ Configuration

### Environment Variables
Add to `.env.local` if needed:
```
VITE_MAX_SECRET_KEY=your_secret_key  # For backend validation
```

### Platform-Specific Behavior
```typescript
const webApp = getMaxBridge();
if (webApp?.platform === 'ios') {
  // iOS-specific code
} else if (webApp?.platform === 'android') {
  // Android-specific code
} else if (webApp?.platform === 'desktop') {
  // Desktop MAX (Windows/Mac)
}
```

---

## 🔒 Security

### Current State (Development)
- ✅ Auto-login with MAX user data (for development)
- ⚠️ Mock token generation (not production-ready)

### For Production
You **MUST** implement backend validation:

```typescript
// In your backend API
POST /api/auth/validate-max
{
  "initData": "...",  // From getMaxInitData()
  "hash": "..."
}

// Returns
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

Then update `loginWithMax()` in `AuthContext.tsx`:
```typescript
const loginWithMax = async (user: MaxUser) => {
  const initData = getMaxInitData();
  const response = await fetch('/api/auth/validate-max', {
    method: 'POST',
    body: JSON.stringify(initData)
  });
  const { token } = await response.json();
  // Use token instead of mock
  localStorage.setItem('access_token', token);
};
```

---

## 📚 Files Modified

1. **`index.html`** - Added MAX Bridge script
2. **`src/main.tsx`** - Initialize MAX Bridge
3. **`src/lib/maxBridge.ts`** - Main integration (NEW)
4. **`src/contexts/AuthContext.tsx`** - MAX user auth
5. **`src/pages/LoginPage.tsx`** - Dual auth UI
6. **`src/pages/TodayPage.tsx`** - Haptic on tasks
7. **`src/pages/ContextsPage.tsx`** - Haptic on creation

---

## 🆘 Troubleshooting

### Issue: "WebApp is not defined"
**Solution:** Only access `window.WebApp` through `getMaxBridge()` helper
```typescript
// ❌ Don't do this
const webApp = window.WebApp;

// ✅ Do this instead
const webApp = getMaxBridge();
if (webApp) { ... }
```

### Issue: Haptic not working
**Solutions:**
- Ensure running on actual device (not emulator)
- Check device has vibration capability
- Try different haptic type: `triggerHaptic('impact')`
- Check browser/device permissions for vibration

### Issue: Auto-login not working
**Solutions:**
- Verify running in MAX client (not browser)
- Check `window.WebApp.initDataUnsafe.user` exists
- Fall back to traditional login (it works!)

### Issue: Token validation failing
**Solutions:**
- This is expected - backend validation not yet implemented
- See Security section above
- For now, mock token works for development

---

## 🎓 Next Steps

1. **Test in Browser** ← Start here
   ```bash
   npm run dev
   ```

2. **Review Documentation**
   - Read `MAX_BRIDGE_GUIDE.md` for detailed API

3. **Add Backend Validation** ← For production
   - Implement token validation endpoint
   - Return JWT instead of mock token

4. **Test in MAX Client** ← When available
   - Open app from MAX
   - Test auto-login and haptic feedback

5. **Monitor & Iterate**
   - Track user feedback
   - Monitor error rates
   - Refine haptic patterns

---

## 📞 Support

For detailed information, see:
- **`MAX_BRIDGE_GUIDE.md`** - Complete reference
- **`MAX_BRIDGE_INTEGRATION.md`** - Summary & checklist
- **`src/lib/maxBridge.ts`** - Source code & comments
- **`src/contexts/AuthContext.tsx`** - Auth implementation

---

**Status:** Ready to use! 🚀  
**Production Ready:** After backend validation added ⚠️  
**Questions?** Check the guide documents above
