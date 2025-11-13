# MAX Bridge Integration

This application is integrated with the **MAX Bridge** library for seamless interaction with the MAX client and device features.

## Overview

The MAX Bridge integration enables:
- **User authentication** via MAX user data (auto-login)
- **Haptic feedback** on user interactions (task completion, context creation)
- **Back button management** in MAX client header
- **Platform detection** (iOS, Android, desktop, web)
- **Sharing functionality** within MAX ecosystem
- **QR code scanning** via device camera

## Architecture

### Core Integration Points

1. **`src/lib/maxBridge.ts`** - Typed wrapper around `window.WebApp`
   - Safe accessor for MAX Bridge API
   - Type-safe helpers for common operations
   - Error handling and fallbacks for non-MAX environments

2. **`src/contexts/AuthContext.tsx`** - Authentication integration
   - `loginWithMax()` - Auto-login with MAX user data
   - `maxUser` - Stores logged-in MAX user info
   - Haptic feedback on login success/error

3. **`src/pages/LoginPage.tsx`** - Dual authentication
   - Traditional username/password login
   - MAX user quick-login button (if MAX data available)

4. **`src/pages/TodayPage.tsx`** - Task interactions
   - Haptic feedback when task is marked complete (success)
   - Haptic feedback when task is unmarked (impact)

5. **`src/pages/ContextsPage.tsx`** - Context management
   - Haptic feedback on context creation (impact → success)

## Usage

### Getting User Data

```typescript
import { getMaxUserData, getMaxInitData } from '../lib/maxBridge';

const user = getMaxUserData(); // WebAppData['user'] | null
const initData = getMaxInitData(); // Full init data for backend validation
```

### Triggering Haptic Feedback

```typescript
import { triggerHaptic } from '../lib/maxBridge';

// Task completion
triggerHaptic('success'); // Vibrates with success pattern

// Task uncompleted
triggerHaptic('impact'); // Light vibration

// Selection change
triggerHaptic('selection');

// Error
triggerHaptic('error');
```

### Managing Back Button

```typescript
import { setBackButtonVisible, onBackButtonClick } from '../lib/maxBridge';

// Show back button
setBackButtonVisible(true);

// Listen for back button press
const unsubscribe = onBackButtonClick(() => {
  console.log('Back button pressed!');
  // Handle navigation, cleanup, etc.
});

// Cleanup
unsubscribe();
```

### Sharing Content

```typescript
import { shareToMax, openExternalLink } from '../lib/maxBridge';

// Share within MAX (to chats/groups)
shareToMax('Check this out!', 'https://example.com');

// Open link in external browser
openExternalLink('https://example.com');
```

## Environment Handling

The integration gracefully handles non-MAX environments:
- All MAX Bridge functions check for `window.WebApp` availability
- They log warnings and continue safely if MAX client is not available
- Allows testing in browsers and CI/CD pipelines

### Development & Testing

When testing locally without MAX client:
- User auto-login will skip (MAX user data unavailable)
- Haptic feedback calls will be silently ignored
- Back button management will be skipped
- Normal login form remains functional

## Security Considerations

### initDataUnsafe

The current implementation uses `initDataUnsafe` for quick user info access. **In production:**
1. Always validate the `hash` field on your backend
2. Send `initData` string to your backend for verification
3. Exchange validated user data for a secure auth token
4. Never trust `initDataUnsafe` alone for sensitive operations

### Example Backend Validation (pseudocode)

```python
def validate_max_init_data(init_data_raw, hash_str):
    # Validate hash to ensure data hasn't been tampered with
    computed_hash = hmac.new(
        key=MAX_SECRET_KEY,
        msg=init_data_raw,
        digestmod=hashlib.sha256
    ).hexdigest()
    return computed_hash == hash_str
```

## Platform Detection

```typescript
import { getMaxBridge } from '../lib/maxBridge';

const webApp = getMaxBridge();
if (webApp) {
  console.log('Platform:', webApp.platform); // 'ios', 'android', 'desktop', 'web'
  console.log('Version:', webApp.version);   // e.g. '25.9.16'
}
```

## API Reference

See `src/lib/maxBridge.ts` for full TypeScript interfaces and function signatures.

### Key Objects

- **WebApp** - Main MAX Bridge object
- **WebAppData** - User & session info from MAX
- **BackButton** - Controls header back button
- **HapticFeedback** - Vibration patterns
- **ScreenCapture** - Screenshot/recording control
- **DeviceStorage** - User-specific key-value storage (not yet integrated)
- **SecureStorage** - Encrypted storage (not yet integrated)
- **BiometricManager** - Fingerprint/Face ID (not yet integrated)

## Future Enhancements

- [ ] Device storage for offline sync
- [ ] Secure biometric authentication
- [ ] QR code scanning for context creation
- [ ] Advanced sharing with MAX contacts
- [ ] Screenshot protection for sensitive pages
- [ ] Backend hash validation of init data
- [ ] Real API token exchange for MAX users

## Troubleshooting

**haptic feedback not working?**
- Check if device supports haptic feedback (most modern phones do)
- Some Android devices may require vibration permission
- Verify `disableVibrationFallback` parameter if needed

**Back button not showing?**
- Must explicitly call `setBackButtonVisible(true)` for your route
- Only available when running inside MAX client

**MAX user data not available?**
- You're likely running outside MAX client context
- Fallback to traditional login form (already available)

## Related Files

- `index.html` - Includes MAX Bridge script tag
- `src/main.tsx` - Initializes MAX Bridge on app startup
- `src/contexts/AuthContext.tsx` - Auth state with MAX support
- `src/pages/LoginPage.tsx` - Dual auth UI

---

**Last Updated:** 13 November 2025  
**Status:** Ready for production (with backend validation)
