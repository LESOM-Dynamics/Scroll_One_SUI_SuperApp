# Implement ERC-7715-Inspired Permissions System

## 🎯 Overview

Implement a fine-grained permissions system that allows mini-apps to request permissions for reduced approval prompts, similar to ERC-7715 standard. This will significantly improve UX for trusted mini-apps while maintaining security through limits and user control.

## 📋 Motivation

### Current State
- Every transaction from mini-apps requires user approval via modal
- Poor UX for high-frequency interactions (e.g., DEX swaps, gaming)
- Users must approve each individual transaction
- No way for users to grant trusted apps limited permissions

### Benefits
- ✅ **Better UX**: Reduced approval prompts for trusted apps
- ✅ **Enhanced Security**: Fine-grained limits prevent abuse
- ✅ **User Control**: Full visibility and control over permissions
- ✅ **Backward Compatible**: Existing apps continue to work
- ✅ **Future-Proof**: Foundation for advanced permission features

### Use Cases
- **DeFi Apps**: Allow DEX to swap tokens within daily limits
- **Gaming Apps**: Permit small transaction batches for in-game purchases
- **Social Apps**: Enable micro-transactions for tipping/content
- **Automated Strategies**: Grant permission for recurring small transactions

## 🔍 Requirements

### Core Features

#### 1. Permission Request System
- Mini-apps can request permissions with fine-grained constraints
- Permission request UI modal with clear visualization of requested permissions
- Users can modify constraints before approving
- Support for multiple permission types: TRANSACTION, MESSAGE, TYPED_DATA

#### 2. Permission Constraints
- **Amount Limits**: Max per transaction, per day, per week, per month
- **Rate Limits**: Max transactions per day/week
- **Token Restrictions**: Allow/deny specific token addresses
- **Contract Restrictions**: Allow/deny specific contract addresses
- **Time Restrictions**: Allow transactions only during specific hours/days
- **Expiration**: Optional expiration timestamp

#### 3. Permission Validation
- Validate transactions against permission constraints before execution
- Check amount limits (per transaction and time-based)
- Enforce contract/token allowlists/denylists
- Verify permission expiration
- Enforce rate limits

#### 4. Usage Tracking
- Track usage per permission (amount used, transaction count)
- Daily/weekly/monthly usage aggregation
- Retain usage history for 90 days
- Usage statistics display for users

#### 5. Permission Management
- View all granted permissions
- View permissions by app
- Revoke individual permissions
- Revoke all permissions for an app
- Permission details view with usage statistics

#### 6. Automatic Execution
- Execute transactions automatically if within permission constraints
- Fall back to approval modal if constraints not met or permission expired
- Track usage after successful execution
- Update permission metadata (usage count, last used timestamp)

## 🏗️ Technical Specification

### Architecture

```
┌─────────────────┐
│  Mini-App       │
│  (WebView)      │
└────────┬────────┘
         │
         │ 1. GRANT_PERMISSIONS
         ▼
┌─────────────────┐
│  Bridge Handler │
│  (Native)       │
└────────┬────────┘
         │
         │ 2. Permission Request UI
         ▼
┌─────────────────┐
│  Permission     │
│  Store          │
└────────┬────────┘
         │
         │ 3. Store Permission
         ▼
┌─────────────────┐
│  Transaction    │
│  Validation     │
└────────┬────────┘
         │
         │ 4. Validate & Execute
         ▼
┌─────────────────┐
│  Usage Tracking │
└─────────────────┘
```

### Components to Create

#### 1. Core Services (`services/permissions/`)
- **`permissionStore.ts`**: Secure storage layer (SecureStore)
- **`permissionValidator.ts`**: Permission validation logic
- **`permissionService.ts`**: High-level permission operations
- **`usageTracker.ts`**: Usage tracking and rate limiting

#### 2. Bridge Integration (`services/bridge/`)
- Update `handlers.ts` to add:
  - `createGrantPermissionsHandler()`
  - `createGetPermissionsHandler()`
  - `createRevokePermissionsHandler()`
  - Update `createSignTransactionHandler()` to check permissions

#### 3. SDK Updates (`scrollone-sdk/`)
- Add new bridge methods to `core/constants.ts`:
  - `GRANT_PERMISSIONS`
  - `REVOKE_PERMISSIONS`
  - `CHECK_PERMISSIONS`
  - `GET_PERMISSIONS`
- Add permission types to `types/permissions.ts`
- Update `web/webBridge.ts` to expose permission methods

#### 4. UI Components (`components/permissions/`)
- **`PermissionRequestModal.tsx`**: UI for requesting permissions
- **`PermissionManagement.tsx`**: View/manage permissions screen
- **`PermissionIndicator.tsx`**: Show permission status in mini-app
- **`UsageStatistics.tsx`**: Display usage statistics

#### 5. Store (`store/`)
- **`permissionStore.ts`**: Zustand store for permission UI state

### Data Structures

```typescript
interface Permission {
  id: string;
  appId: string;
  origin: string;
  appName?: string;
  type: 'TRANSACTION' | 'MESSAGE' | 'TYPED_DATA';
  constraints: PermissionConstraints;
  grantedAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
}

interface PermissionConstraints {
  maxAmount?: string;              // Max per transaction (wei)
  maxPerDay?: string;              // Max per day (wei)
  maxPerWeek?: string;             // Max per week (wei)
  maxPerMonth?: string;            // Max per month (wei)
  maxTransactionsPerDay?: number;
  maxTransactionsPerWeek?: number;
  allowedTokens?: string[];        // Token addresses
  deniedTokens?: string[];         // Blocked tokens
  allowedContracts?: string[];     // Contract addresses
  deniedContracts?: string[];      // Blocked contracts
  allowedMethods?: string[];       // Function selectors
  allowedHours?: number[];         // Hours of day (0-23)
  allowedDays?: number[];          // Days of week (0-6)
  expiresAt?: number;              // Unix timestamp
}

interface PermissionUsage {
  permissionId: string;
  date: string;                    // YYYY-MM-DD
  amountUsed: string;              // Total amount (wei)
  transactionCount: number;
  lastTransactionAt: number;
}
```

### Storage

- **Permissions**: Stored in SecureStore with key `scroll_permissions`
- **Usage**: Stored per permission with key `scroll_permission_usage_{permissionId}`
- **Format**: JSON stringified arrays
- **Retention**: Usage data retained for 90 days

### Bridge Methods

#### `GRANT_PERMISSIONS`
Request permission from user.

**Request:**
```typescript
{
  type: BridgeMethod.GRANT_PERMISSIONS,
  payload: {
    permissions: Array<{
      type: 'TRANSACTION' | 'MESSAGE' | 'TYPED_DATA';
      constraints: PermissionConstraints;
    }>;
  };
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    permissions: Array<{
      permissionId: string;
      granted: boolean;
    }>;
  };
}
```

#### `GET_PERMISSIONS`
Get all permissions or permissions for specific app.

**Request:**
```typescript
{
  type: BridgeMethod.GET_PERMISSIONS,
  payload?: {
    appId?: string;
  };
}
```

#### `REVOKE_PERMISSIONS`
Revoke permission(s).

**Request:**
```typescript
{
  type: BridgeMethod.REVOKE_PERMISSIONS,
  payload: {
    permissionId?: string;
    appId?: string;
  };
}
```

## 📅 Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Create `services/permissions/permissionStore.ts`
  - [ ] Implement `getAllPermissions()`
  - [ ] Implement `getPermissionsByApp()`
  - [ ] Implement `getPermissionById()`
  - [ ] Implement `savePermission()`
  - [ ] Implement `deletePermission()`
  - [ ] Implement `trackUsage()`
  - [ ] Implement `getUsage()` and `getUsageRange()`
- [ ] Create `services/permissions/permissionValidator.ts`
  - [ ] Implement `validateTransaction()`
  - [ ] Implement `validateAgainstPermission()` with all constraint checks
  - [ ] Add expiration validation
  - [ ] Add amount limit validation
  - [ ] Add contract/token restriction validation
  - [ ] Add rate limit validation
  - [ ] Add time restriction validation
- [ ] Create `services/permissions/permissionService.ts`
  - [ ] Implement `requestPermission()`
  - [ ] Implement `checkTransactionPermission()`
  - [ ] Implement `executeWithPermission()`
  - [ ] Implement `revokePermission()`
  - [ ] Implement `getAllPermissions()`
  - [ ] Implement `getPermissionStats()`
- [ ] Add permission types to `scrollone-sdk/types/permissions.ts`
- [ ] Write unit tests for core services

**Deliverables:**
- ✅ Permission storage layer with SecureStore
- ✅ Permission validation engine
- ✅ Permission service with all CRUD operations
- ✅ Unit tests (80%+ coverage)

### Phase 2: Bridge Integration (Week 3)

- [ ] Add bridge methods to `scrollone-sdk/core/constants.ts`
  - [ ] `GRANT_PERMISSIONS`
  - [ ] `REVOKE_PERMISSIONS`
  - [ ] `CHECK_PERMISSIONS`
  - [ ] `GET_PERMISSIONS`
- [ ] Update `services/bridge/handlers.ts`
  - [ ] Create `createGrantPermissionsHandler()`
  - [ ] Create `createGetPermissionsHandler()`
  - [ ] Create `createRevokePermissionsHandler()`
  - [ ] Create `createCheckPermissionsHandler()`
  - [ ] Update `createSignTransactionHandler()` to check permissions
  - [ ] Update `executeTransaction()` to track usage
- [ ] Register new handlers in `services/bridge/bridgeService.ts`
- [ ] Update `scrollone-sdk/web/webBridge.ts`
  - [ ] Add `grantPermissions()` method
  - [ ] Add `getPermissions()` method
  - [ ] Add `revokePermissions()` method
  - [ ] Add `checkPermissions()` method
- [ ] Update injected script to include permission methods
- [ ] Write integration tests for bridge methods

**Deliverables:**
- ✅ Bridge methods implemented and registered
- ✅ Web SDK exposes permission methods
- ✅ Transaction handler checks permissions
- ✅ Integration tests passing

### Phase 3: UI Components (Week 4)

- [ ] Create `components/permissions/PermissionRequestModal.tsx`
  - [ ] Display requested permissions with constraints
  - [ ] Show app information (name, icon)
  - [ ] Allow user to modify constraints (future enhancement)
  - [ ] Approve/Reject buttons
  - [ ] Responsive design
- [ ] Create `components/permissions/PermissionManagement.tsx`
  - [ ] List all granted permissions
  - [ ] Filter by app
  - [ ] Display permission details
  - [ ] Revoke button for each permission
  - [ ] "Revoke all" for app option
  - [ ] Empty state
- [ ] Create `components/permissions/PermissionIndicator.tsx`
  - [ ] Show permission status badge
  - [ ] Display remaining limits
  - [ ] Visual indicator in mini-app view
- [ ] Create `components/permissions/UsageStatistics.tsx`
  - [ ] Display usage charts/graphs
  - [ ] Show daily/weekly/monthly stats
  - [ ] Transaction count display
  - [ ] Amount used display
- [ ] Create `store/permissionStore.ts` (Zustand)
  - [ ] State for permission UI
  - [ ] Actions for permission operations
- [ ] Add permission management screen to Identity tab
- [ ] Update WebViewContainer to show permission indicator

**Deliverables:**
- ✅ Permission request modal
- ✅ Permission management screen
- ✅ Permission indicator component
- ✅ Usage statistics display
- ✅ Integrated into app navigation

### Phase 4: Testing & Security (Week 5)

- [ ] Write end-to-end tests
  - [ ] Permission request flow
  - [ ] Permission approval/rejection
  - [ ] Transaction execution with permission
  - [ ] Permission validation edge cases
  - [ ] Usage tracking accuracy
  - [ ] Permission revocation
- [ ] Security audit
  - [ ] Review permission validation logic
  - [ ] Test constraint bypass attempts
  - [ ] Review storage security
  - [ ] Test rate limit enforcement
  - [ ] Test expiration handling
  - [ ] Test edge cases (negative amounts, invalid addresses, etc.)
- [ ] Performance testing
  - [ ] Permission lookup performance
  - [ ] Usage tracking performance
  - [ ] Storage read/write performance
- [ ] Accessibility testing
  - [ ] Screen reader support
  - [ ] Keyboard navigation
  - [ ] Color contrast
- [ ] Error handling
  - [ ] Invalid permission requests
  - [ ] Storage errors
  - [ ] Validation errors
  - [ ] Network errors

**Deliverables:**
- ✅ Comprehensive test suite (unit, integration, E2E)
- ✅ Security audit report
- ✅ Performance benchmarks
- ✅ Accessibility compliance
- ✅ Error handling coverage

### Phase 5: Documentation & Polish (Week 6)

- [ ] Update documentation
  - [ ] Update `WEBVIEW_BRIDGE_GUIDE.md` with permission examples
  - [ ] Update `scrollone-sdk/README.md` with permission API
  - [ ] Create developer guide for mini-apps
  - [ ] Update API reference
  - [ ] Add code examples
- [ ] UX improvements
  - [ ] Improve permission request modal UX
  - [ ] Add helpful tooltips
  - [ ] Improve permission management UI
  - [ ] Add loading states
  - [ ] Add error states
- [ ] Performance optimization
  - [ ] Optimize permission lookup
  - [ ] Cache frequently accessed permissions
  - [ ] Optimize usage aggregation
- [ ] Beta testing
  - [ ] Test with select mini-apps
  - [ ] Gather user feedback
  - [ ] Fix bugs and issues
  - [ ] Iterate based on feedback
- [ ] Migration guide
  - [ ] Document backward compatibility
  - [ ] Create migration guide for existing mini-apps
  - [ ] Provide code examples

**Deliverables:**
- ✅ Updated documentation
- ✅ Improved UX based on testing
- ✅ Performance optimizations
- ✅ Beta testing complete
- ✅ Migration guide

## ✅ Acceptance Criteria

### Functional Requirements

- [ ] Mini-apps can request permissions via `window.scrollOne.grantPermissions()`
- [ ] Permission request modal displays requested permissions clearly
- [ ] Users can approve or reject permission requests
- [ ] Approved permissions are stored securely in SecureStore
- [ ] Transactions within permission constraints execute automatically
- [ ] Transactions outside constraints require approval modal
- [ ] Expired permissions are automatically rejected
- [ ] Usage is tracked accurately (amount, count, dates)
- [ ] Rate limits are enforced (daily/weekly/monthly)
- [ ] Amount limits are enforced (per transaction and time-based)
- [ ] Contract/token restrictions are enforced
- [ ] Time restrictions are enforced
- [ ] Users can view all granted permissions
- [ ] Users can revoke individual permissions
- [ ] Users can revoke all permissions for an app
- [ ] Usage statistics are displayed accurately
- [ ] Permission management screen is accessible from Identity tab

### Non-Functional Requirements

- [ ] **Performance**: Permission lookup < 10ms
- [ ] **Performance**: Usage tracking < 5ms
- [ ] **Storage**: Usage data retained for 90 days only
- [ ] **Security**: All permissions stored in SecureStore
- [ ] **Security**: Validation logic prevents constraint bypass
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Backward Compatibility**: Existing apps continue to work
- [ ] **Error Handling**: Graceful handling of all error cases
- [ ] **Test Coverage**: 80%+ unit test coverage
- [ ] **Documentation**: Complete API reference and examples

### Edge Cases

- [ ] Handle expired permissions gracefully
- [ ] Handle corrupted storage data
- [ ] Handle concurrent permission requests
- [ ] Handle permission revocation during transaction
- [ ] Handle network failures during permission request
- [ ] Handle invalid constraint values (negative, too large, etc.)
- [ ] Handle malformed permission requests
- [ ] Handle storage quota exceeded
- [ ] Handle timezone changes affecting usage tracking

## 🧪 Testing Requirements

### Unit Tests

- [ ] PermissionStore: All CRUD operations
- [ ] PermissionValidator: All constraint validations
- [ ] PermissionService: All business logic
- [ ] UsageTracker: Usage tracking and aggregation

### Integration Tests

- [ ] Bridge handlers: All permission methods
- [ ] Transaction handler: Permission checking
- [ ] Web SDK: Permission methods
- [ ] Storage: Permission persistence

### End-to-End Tests

- [ ] Complete permission request flow
- [ ] Transaction execution with permission
- [ ] Permission revocation flow
- [ ] Usage tracking over time
- [ ] Edge cases and error scenarios

### Manual Testing

- [ ] Test with real mini-apps
- [ ] Test on iOS and Android
- [ ] Test with various permission configurations
- [ ] Test permission management UI
- [ ] Test usage statistics display

## 📦 Dependencies

### New Dependencies
- None required (using existing SecureStore)

### Updated Dependencies
- None required

### Internal Dependencies
- `services/bridge/bridgeService.ts`
- `services/scroll/wallet.ts`
- `store/walletStore.ts`
- `scrollone-sdk/` (core, web, types)

## 🔐 Security Considerations

### Storage Security
- Permissions stored in SecureStore (device keychain/keystore)
- Usage data stored in SecureStore
- No sensitive data in AsyncStorage

### Validation Security
- All constraints validated on native side (not trust WebView)
- Amount limits enforced with BigInt precision
- Rate limits enforced per permission, per day
- Contract/token allowlists/denylists strictly enforced
- Expiration checked on every validation

### User Privacy
- Permissions stored locally (not synced)
- Usage data only stored locally
- No permission data sent to external servers
- Permissions are per-device (not cross-device)

### Attack Prevention
- Prevent constraint bypass attempts
- Prevent integer overflow in amount calculations
- Prevent storage quota exhaustion
- Rate limit permission requests
- Validate all input data

## 📚 Documentation Requirements

- [ ] Update `WEBVIEW_BRIDGE_GUIDE.md` with permission examples
- [ ] Update `scrollone-sdk/README.md` with permission API
- [ ] Update `PERMISSIONS_SYSTEM_IMPLEMENTATION.md` with implementation status
- [ ] Create mini-app developer guide
- [ ] Add code examples to all documentation
- [ ] Update API reference
- [ ] Create migration guide for existing mini-apps

## 🔗 Related Documentation

- **[PERMISSIONS_SYSTEM_IMPLEMENTATION.md](../Technical_Docs/PERMISSIONS_SYSTEM_IMPLEMENTATION.md)** - Complete implementation guide
- **[WEBVIEW_BRIDGE_GUIDE.md](../WEBVIEW_BRIDGE_GUIDE.md)** - Bridge integration guide
- **[scrollone-sdk/README.md](../scrollone-sdk/README.md)** - SDK documentation

## 🏷️ Labels

- `enhancement`
- `feature`
- `permissions`
- `bridge`
- `ux-improvement`
- `security`

## 📊 Success Metrics

### User Experience
- 50%+ reduction in approval prompts for apps with permissions
- Positive user feedback on permission management UI
- Increased usage of apps with permissions

### Technical
- 0 security vulnerabilities in audit
- < 10ms permission lookup performance
- 80%+ test coverage
- Zero regression in existing functionality

### Adoption
- 3+ mini-apps using permissions system within 1 month
- Positive developer feedback on API
- Clear documentation enabling easy adoption

## 🚀 Rollout Plan

### Phase 1: Internal Testing (Week 6)
- Deploy to internal test build
- Test with internal team
- Fix critical bugs

### Phase 2: Beta Testing (Week 7)
- Deploy to beta testers
- Test with select mini-apps
- Gather feedback

### Phase 3: Public Release (Week 8)
- Deploy to production
- Monitor usage and errors
- Support mini-app developers

## 📝 Notes

- This feature is **backward compatible** - existing mini-apps continue to work with per-transaction approval
- Permissions are **opt-in** - mini-apps must explicitly request permissions
- Users have **full control** - can view, modify (future), and revoke permissions at any time
- All permissions are **stored locally** - no cloud sync for security/privacy
- Implementation follows **ERC-7715 concepts** but adapted for native mobile bridge architecture

## 🎯 Priority

**Priority: High**

This feature significantly improves UX for trusted mini-apps and is a competitive advantage. Implementation should be prioritized after core blockchain functionality is complete.

## 👥 Assignees

- **Backend/Native**: [TBD]
- **Frontend/UI**: [TBD]
- **SDK**: [TBD]
- **QA**: [TBD]
- **Documentation**: [TBD]

## 📅 Timeline

- **Start Date**: TBD
- **Estimated Completion**: 6 weeks from start
- **Target Release**: v1.1.0

---

**Status**: 🟡 **Planned**

For questions or clarifications, refer to the [PERMISSIONS_SYSTEM_IMPLEMENTATION.md](../Technical_Docs/PERMISSIONS_SYSTEM_IMPLEMENTATION.md) documentation.
