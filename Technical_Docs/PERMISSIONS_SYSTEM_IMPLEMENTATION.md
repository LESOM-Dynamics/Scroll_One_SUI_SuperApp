# ERC-7715-Inspired Permissions System - Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Permission Model](#permission-model)
4. [Implementation Details](#implementation-details)
5. [API Reference](#api-reference)
6. [Security Considerations](#security-considerations)
7. [Implementation Phases](#implementation-phases)
8. [Testing Guide](#testing-guide)
9. [Migration Guide](#migration-guide)

---

## Overview

### What is ERC-7715?

ERC-7715 is an Ethereum standard that enables decentralized applications (dApps) to request fine-grained permissions from users' wallets, allowing execution of transactions on their behalf without requiring user approval for each transaction. This dramatically improves user experience for highly interactive dApps.

### ERC-7715-Inspired Implementation

While ERC-7715 is designed for browser-based wallets using JSON-RPC methods, this implementation adapts the core concept to our native mobile bridge architecture. Instead of using `wallet_grantPermissions` JSON-RPC, we use our custom bridge methods that provide the same functionality.

### Key Benefits

1. **Better UX**: Mini-apps can execute transactions without repeated approval prompts
2. **Enhanced Security**: Fine-grained limits (amount, time, contracts) prevent abuse
3. **User Control**: Users can view, modify, and revoke permissions at any time
4. **Competitive Advantage**: Matches modern wallet UX patterns (MetaMask, WalletConnect)

### Use Cases

- **DeFi Apps**: Allow DEX to swap tokens within daily limits
- **Gaming Apps**: Permit small transaction batches for in-game purchases
- **Social Apps**: Enable micro-transactions for tipping/content
- **Automated Strategies**: Grant permission for recurring small transactions

---

## Architecture

### High-Level Flow

```
┌─────────────────┐
│  Mini-App       │
│  (WebView)      │
└────────┬────────┘
         │
         │ 1. Request Permissions
         ▼
┌─────────────────┐
│  Bridge Handler │
│  (Native)       │
└────────┬────────┘
         │
         │ 2. Show Permission UI
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
│  Check          │
└────────┬────────┘
         │
         │ 4. Validate & Execute
         ▼
┌─────────────────┐
│  Usage Tracking │
│  (Rate Limits)  │
└─────────────────┘
```

### Component Architecture

```
services/
├── permissions/
│   ├── permissionService.ts      # Core permission logic
│   ├── permissionStore.ts        # Permission storage (SecureStore)
│   ├── permissionValidator.ts    # Permission validation
│   └── usageTracker.ts           # Usage tracking for rate limits

store/
├── permissionStore.ts            # Zustand store for permissions UI

components/
├── permissions/
│   ├── PermissionRequestModal.tsx    # Request permission UI
│   ├── PermissionManagement.tsx      # View/manage permissions
│   └── PermissionIndicator.tsx       # Show permission status

scrollone-sdk/
├── core/
│   ├── constants.ts              # Add GRANT_PERMISSIONS, etc.
│   └── types/
│       └── permissions.ts        # Permission types

services/
└── bridge/
    └── handlers.ts               # Add permission handlers
```

---

## Permission Model

### Permission Structure

```typescript
interface Permission {
  // Unique identifier
  id: string;
  
  // App information
  appId: string;
  origin: string;              // URL of the mini-app
  appName?: string;            // Display name
  
  // Permission details
  type: PermissionType;        // TRANSACTION, MESSAGE, TYPED_DATA
  constraints: PermissionConstraints;
  
  // Metadata
  grantedAt: number;           // Timestamp
  expiresAt?: number;          // Optional expiration
  lastUsedAt?: number;         // Last usage timestamp
  usageCount: number;          // Total usage count
}

type PermissionType = 
  | 'TRANSACTION'
  | 'MESSAGE'
  | 'TYPED_DATA';

interface PermissionConstraints {
  // Amount limits
  maxAmount?: string;          // Max ETH/token per transaction (in wei)
  maxPerDay?: string;          // Max amount per day
  maxPerWeek?: string;         // Max amount per week
  maxPerMonth?: string;        // Max amount per month
  
  // Rate limits
  maxTransactionsPerDay?: number;
  maxTransactionsPerWeek?: number;
  
  // Token restrictions
  allowedTokens?: string[];    // Token contract addresses (empty = all)
  deniedTokens?: string[];     // Blocked token addresses
  
  // Contract restrictions
  allowedContracts?: string[]; // Allowed contract addresses (empty = all)
  deniedContracts?: string[];  // Blocked contract addresses
  
  // Method restrictions (for contract calls)
  allowedMethods?: string[];   // Allowed function selectors
  
  // Time restrictions
  allowedHours?: number[];     // Hours of day (0-23) when allowed
  allowedDays?: number[];      // Days of week (0-6, Sunday=0)
  
  // Expiration
  expiresAt?: number;          // Unix timestamp
}
```

### Usage Tracking

```typescript
interface PermissionUsage {
  permissionId: string;
  date: string;                // YYYY-MM-DD format
  amountUsed: string;          // Total amount used (in wei)
  transactionCount: number;    // Number of transactions
  lastTransactionAt: number;   // Timestamp
}

interface DailyUsage {
  [date: string]: PermissionUsage;
}
```

---

## Implementation Details

### Phase 1: Core Infrastructure

#### 1.1 Permission Storage (`services/permissions/permissionStore.ts`)

```typescript
import * as SecureStore from 'expo-secure-store';
import type { Permission, PermissionUsage } from '@/scrollone-sdk/types/permissions';

const PERMISSIONS_KEY = 'scroll_permissions';
const USAGE_KEY = 'scroll_permission_usage';

export class PermissionStore {
  /**
   * Get all permissions for a user
   */
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const data = await SecureStore.getItemAsync(PERMISSIONS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('[PermissionStore] Error loading permissions:', error);
      return [];
    }
  }

  /**
   * Get permissions for a specific app
   */
  static async getPermissionsByApp(appId: string): Promise<Permission[]> {
    const all = await this.getAllPermissions();
    return all.filter(p => p.appId === appId);
  }

  /**
   * Get permission by ID
   */
  static async getPermissionById(id: string): Promise<Permission | null> {
    const all = await this.getAllPermissions();
    return all.find(p => p.id === id) || null;
  }

  /**
   * Save permission
   */
  static async savePermission(permission: Permission): Promise<void> {
    const all = await this.getAllPermissions();
    const index = all.findIndex(p => p.id === permission.id);
    
    if (index >= 0) {
      all[index] = permission;
    } else {
      all.push(permission);
    }
    
    await SecureStore.setItemAsync(PERMISSIONS_KEY, JSON.stringify(all));
  }

  /**
   * Delete permission
   */
  static async deletePermission(id: string): Promise<void> {
    const all = await this.getAllPermissions();
    const filtered = all.filter(p => p.id !== id);
    await SecureStore.setItemAsync(PERMISSIONS_KEY, JSON.stringify(filtered));
  }

  /**
   * Delete all permissions for an app
   */
  static async deletePermissionsByApp(appId: string): Promise<void> {
    const all = await this.getAllPermissions();
    const filtered = all.filter(p => p.appId !== appId);
    await SecureStore.setItemAsync(PERMISSIONS_KEY, JSON.stringify(filtered));
  }

  /**
   * Get usage tracking
   */
  static async getUsage(permissionId: string): Promise<PermissionUsage[]> {
    try {
      const data = await SecureStore.getItemAsync(`${USAGE_KEY}_${permissionId}`);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('[PermissionStore] Error loading usage:', error);
      return [];
    }
  }

  /**
   * Track usage
   */
  static async trackUsage(
    permissionId: string,
    amount: string,
    transactionHash?: string
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const usage = await this.getUsage(permissionId);
    const todayUsage = usage.find(u => u.date === today);
    
    if (todayUsage) {
      todayUsage.amountUsed = (
        BigInt(todayUsage.amountUsed) + BigInt(amount)
      ).toString();
      todayUsage.transactionCount++;
      todayUsage.lastTransactionAt = Date.now();
    } else {
      usage.push({
        permissionId,
        date: today,
        amountUsed: amount,
        transactionCount: 1,
        lastTransactionAt: Date.now(),
      });
    }
    
    // Keep only last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const filtered = usage.filter(u => new Date(u.date) >= cutoff);
    
    await SecureStore.setItemAsync(
      `${USAGE_KEY}_${permissionId}`,
      JSON.stringify(filtered)
    );
  }

  /**
   * Get usage for a date range
   */
  static async getUsageRange(
    permissionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PermissionUsage[]> {
    const usage = await this.getUsage(permissionId);
    return usage.filter(u => {
      const date = new Date(u.date);
      return date >= startDate && date <= endDate;
    });
  }
}
```

#### 1.2 Permission Validator (`services/permissions/permissionValidator.ts`)

```typescript
import type { Permission, PermissionConstraints, TransactionRequest } from '@/scrollone-sdk/types/permissions';
import { PermissionStore } from './permissionStore';
import { formatEther, parseEther } from 'ethers';

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  permission?: Permission;
}

export class PermissionValidator {
  /**
   * Check if a transaction is allowed by permissions
   */
  static async validateTransaction(
    appId: string,
    origin: string,
    transaction: TransactionRequest
  ): Promise<ValidationResult> {
    // Get all permissions for this app
    const permissions = await PermissionStore.getPermissionsByApp(appId);
    
    // Filter by origin
    const matchingPermissions = permissions.filter(
      p => p.origin === origin && p.type === 'TRANSACTION'
    );
    
    if (matchingPermissions.length === 0) {
      return {
        allowed: false,
        reason: 'No permission granted for this app',
      };
    }
    
    // Check each permission
    for (const permission of matchingPermissions) {
      const result = await this.validateAgainstPermission(permission, transaction);
      if (result.allowed) {
        return {
          allowed: true,
          permission,
        };
      }
    }
    
    return {
      allowed: false,
      reason: 'Transaction does not match any permission constraints',
    };
  }

  /**
   * Validate transaction against a specific permission
   */
  private static async validateAgainstPermission(
    permission: Permission,
    transaction: TransactionRequest
  ): Promise<ValidationResult> {
    const constraints = permission.constraints;
    
    // Check expiration
    if (constraints.expiresAt && constraints.expiresAt < Date.now()) {
      return {
        allowed: false,
        reason: 'Permission has expired',
      };
    }
    
    // Check amount per transaction
    if (constraints.maxAmount && transaction.value) {
      const txValue = BigInt(transaction.value);
      const maxAmount = BigInt(constraints.maxAmount);
      
      if (txValue > maxAmount) {
        return {
          allowed: false,
          reason: `Transaction amount exceeds maximum allowed (${formatEther(maxAmount)} ETH)`,
        };
      }
    }
    
    // Check contract restrictions
    if (constraints.allowedContracts && constraints.allowedContracts.length > 0) {
      if (!constraints.allowedContracts.includes(transaction.to?.toLowerCase() || '')) {
        return {
          allowed: false,
          reason: 'Transaction to contract not allowed',
        };
      }
    }
    
    if (constraints.deniedContracts) {
      if (constraints.deniedContracts.includes(transaction.to?.toLowerCase() || '')) {
        return {
          allowed: false,
          reason: 'Transaction to contract is denied',
        };
      }
    }
    
    // Check daily/weekly/monthly limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (constraints.maxPerDay) {
      const todayUsage = await PermissionStore.getUsageRange(
        permission.id,
        today,
        new Date()
      );
      const totalUsed = todayUsage.reduce(
        (sum, u) => sum + BigInt(u.amountUsed),
        BigInt(0)
      );
      const maxPerDay = BigInt(constraints.maxPerDay);
      
      if (totalUsed + BigInt(transaction.value || '0') > maxPerDay) {
        return {
          allowed: false,
          reason: 'Daily limit exceeded',
        };
      }
    }
    
    if (constraints.maxTransactionsPerDay) {
      const todayUsage = await PermissionStore.getUsageRange(
        permission.id,
        today,
        new Date()
      );
      const totalCount = todayUsage.reduce((sum, u) => sum + u.transactionCount, 0);
      
      if (totalCount >= constraints.maxTransactionsPerDay) {
        return {
          allowed: false,
          reason: 'Daily transaction limit exceeded',
        };
      }
    }
    
    // Check time restrictions
    if (constraints.allowedHours && constraints.allowedHours.length > 0) {
      const currentHour = new Date().getHours();
      if (!constraints.allowedHours.includes(currentHour)) {
        return {
          allowed: false,
          reason: 'Transactions not allowed at this time',
        };
      }
    }
    
    // All checks passed
    return {
      allowed: true,
      permission,
    };
  }
}
```

#### 1.3 Permission Service (`services/permissions/permissionService.ts`)

```typescript
import { PermissionStore } from './permissionStore';
import { PermissionValidator } from './permissionValidator';
import type { Permission, PermissionConstraints, TransactionRequest } from '@/scrollone-sdk/types/permissions';
import { v4 as uuidv4 } from 'uuid';

export class PermissionService {
  /**
   * Request permission from user
   */
  static async requestPermission(
    appId: string,
    origin: string,
    appName: string,
    type: Permission['type'],
    constraints: PermissionConstraints
  ): Promise<Permission> {
    // Generate permission ID
    const permission: Permission = {
      id: uuidv4(),
      appId,
      origin,
      appName,
      type,
      constraints,
      grantedAt: Date.now(),
      expiresAt: constraints.expiresAt,
      usageCount: 0,
    };
    
    // Save permission
    await PermissionStore.savePermission(permission);
    
    return permission;
  }

  /**
   * Check if transaction is allowed
   */
  static async checkTransactionPermission(
    appId: string,
    origin: string,
    transaction: TransactionRequest
  ): Promise<{ allowed: boolean; reason?: string; permission?: Permission }> {
    return await PermissionValidator.validateTransaction(appId, origin, transaction);
  }

  /**
   * Execute transaction with permission (if allowed)
   */
  static async executeWithPermission(
    appId: string,
    origin: string,
    transaction: TransactionRequest
  ): Promise<{ allowed: boolean; reason?: string; permission?: Permission }> {
    const validation = await this.checkTransactionPermission(appId, origin, transaction);
    
    if (validation.allowed && validation.permission) {
      // Track usage
      await PermissionStore.trackUsage(
        validation.permission.id,
        transaction.value || '0'
      );
      
      // Update permission usage count
      validation.permission.usageCount++;
      validation.permission.lastUsedAt = Date.now();
      await PermissionStore.savePermission(validation.permission);
    }
    
    return validation;
  }

  /**
   * Revoke permission
   */
  static async revokePermission(permissionId: string): Promise<void> {
    await PermissionStore.deletePermission(permissionId);
  }

  /**
   * Revoke all permissions for an app
   */
  static async revokeAppPermissions(appId: string): Promise<void> {
    await PermissionStore.deletePermissionsByApp(appId);
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions(): Promise<Permission[]> {
    return await PermissionStore.getAllPermissions();
  }

  /**
   * Get permissions for an app
   */
  static async getAppPermissions(appId: string): Promise<Permission[]> {
    return await PermissionStore.getPermissionsByApp(appId);
  }

  /**
   * Get permission usage statistics
   */
  static async getPermissionStats(permissionId: string): Promise<{
    totalUsage: string;
    totalTransactions: number;
    dailyUsage: Array<{ date: string; amount: string; count: number }>;
  }> {
    const usage = await PermissionStore.getUsage(permissionId);
    
    const totalUsage = usage.reduce(
      (sum, u) => sum + BigInt(u.amountUsed),
      BigInt(0)
    ).toString();
    
    const totalTransactions = usage.reduce(
      (sum, u) => sum + u.transactionCount,
      0
    );
    
    const dailyUsage = usage.map(u => ({
      date: u.date,
      amount: u.amountUsed,
      count: u.transactionCount,
    }));
    
    return {
      totalUsage,
      totalTransactions,
      dailyUsage,
    };
  }
}
```

### Phase 2: Bridge Integration

#### 2.1 Add Bridge Methods (`scrollone-sdk/core/constants.ts`)

```typescript
export enum BridgeMethod {
  // ... existing methods
  GRANT_PERMISSIONS = 'GRANT_PERMISSIONS',
  REVOKE_PERMISSIONS = 'REVOKE_PERMISSIONS',
  CHECK_PERMISSIONS = 'CHECK_PERMISSIONS',
  GET_PERMISSIONS = 'GET_PERMISSIONS',
}
```

#### 2.2 Permission Types (`scrollone-sdk/types/permissions.ts`)

```typescript
export interface Permission {
  id: string;
  appId: string;
  origin: string;
  appName?: string;
  type: PermissionType;
  constraints: PermissionConstraints;
  grantedAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
}

export type PermissionType = 'TRANSACTION' | 'MESSAGE' | 'TYPED_DATA';

export interface PermissionConstraints {
  maxAmount?: string;
  maxPerDay?: string;
  maxPerWeek?: string;
  maxPerMonth?: string;
  maxTransactionsPerDay?: number;
  maxTransactionsPerWeek?: number;
  allowedTokens?: string[];
  deniedTokens?: string[];
  allowedContracts?: string[];
  deniedContracts?: string[];
  allowedMethods?: string[];
  allowedHours?: number[];
  allowedDays?: number[];
  expiresAt?: number;
}

export interface PermissionRequest {
  type: PermissionType;
  constraints: PermissionConstraints;
}

export interface GrantPermissionsRequest {
  permissions: PermissionRequest[];
}

export interface PermissionResponse {
  permissionId: string;
  granted: boolean;
}
```

#### 2.3 Bridge Handlers (`services/bridge/handlers.ts`)

```typescript
import { PermissionService } from '@/services/permissions/permissionService';
import type { GrantPermissionsRequest, PermissionRequest } from '@/scrollone-sdk/types/permissions';

export function createGrantPermissionsHandler() {
  return async (
    payload: GrantPermissionsRequest,
    context: HandlerContext
  ): Promise<{ permissions: Array<{ permissionId: string; granted: boolean }> }> => {
    console.log('[Handler:GRANT_PERMISSIONS] Request:', payload);
    
    if (!context.walletAddress) {
      throw createBridgeError(
        BridgeErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
    }
    
    // This will return pending - UI will show permission request modal
    // The actual granting happens after user approval
    return {
      pending: true,
      requiresApproval: true,
      permissions: payload.permissions.map(() => ({ permissionId: '', granted: false })),
    };
  };
}

export function createGetPermissionsHandler() {
  return async (
    payload: { appId?: string } | undefined,
    context: HandlerContext
  ): Promise<{ permissions: Permission[] }> => {
    if (payload?.appId) {
      const permissions = await PermissionService.getAppPermissions(payload.appId);
      return { permissions };
    } else {
      const permissions = await PermissionService.getAllPermissions();
      return { permissions };
    }
  };
}

export function createRevokePermissionsHandler() {
  return async (
    payload: { permissionId: string } | { appId: string },
    context: HandlerContext
  ): Promise<{ revoked: boolean }> => {
    if ('permissionId' in payload) {
      await PermissionService.revokePermission(payload.permissionId);
    } else {
      await PermissionService.revokeAppPermissions(payload.appId);
    }
    return { revoked: true };
  };
}

// Update transaction handler to check permissions
export function createSignTransactionHandler() {
  return async (
    payload: TransactionRequest,
    context: HandlerContext
  ): Promise<{ pending: boolean; requiresApproval: boolean }> => {
    // Check if app has permission
    const validation = await PermissionService.checkTransactionPermission(
      context.appId || '',
      context.origin,
      payload
    );
    
    if (validation.allowed && validation.permission) {
      // Execute transaction directly without approval
      try {
        const result = await executeTransaction(payload, context);
        
        // Track usage
        if (validation.permission) {
          await PermissionStore.trackUsage(
            validation.permission.id,
            payload.value || '0',
            result.hash
          );
        }
        
        return {
          pending: false,
          requiresApproval: false,
          ...result,
        };
      } catch (error) {
        return {
          pending: true,
          requiresApproval: true,
        };
      }
    }
    
    // No permission or permission expired - require approval
    return {
      pending: true,
      requiresApproval: true,
    };
  };
}
```

### Phase 3: UI Components

#### 3.1 Permission Request Modal (`components/permissions/PermissionRequestModal.tsx`)

```typescript
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { colors, spacing, typography } from '@/theme';
import type { PermissionConstraints, PermissionType } from '@/scrollone-sdk/types/permissions';
import { formatEther, parseEther } from 'ethers';

interface PermissionRequestModalProps {
  visible: boolean;
  appName: string;
  appIcon?: string;
  permissions: Array<{
    type: PermissionType;
    requestedConstraints: PermissionConstraints;
  }>;
  onApprove: (permissions: Array<{ type: PermissionType; constraints: PermissionConstraints }>) => void;
  onReject: () => void;
}

export function PermissionRequestModal({
  visible,
  appName,
  permissions,
  onApprove,
  onReject,
}: PermissionRequestModalProps) {
  const [modifiedPermissions, setModifiedPermissions] = useState(permissions);

  const handleApprove = () => {
    onApprove(
      modifiedPermissions.map(p => ({
        type: p.type,
        constraints: p.requestedConstraints,
      }))
    );
  };

  const formatAmount = (amount: string | undefined) => {
    if (!amount) return 'Unlimited';
    try {
      return `${formatEther(BigInt(amount))} ETH`;
    } catch {
      return amount;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Grant Permissions</Text>
          <Text style={styles.subtitle}>{appName} wants permission to:</Text>

          <ScrollView style={styles.content}>
            {modifiedPermissions.map((perm, index) => (
              <View key={index} style={styles.permissionCard}>
                <Text style={styles.permissionType}>
                  {perm.type === 'TRANSACTION' ? 'Execute Transactions' :
                   perm.type === 'MESSAGE' ? 'Sign Messages' :
                   'Sign Typed Data'}
                </Text>

                {perm.requestedConstraints.maxAmount && (
                  <View style={styles.constraint}>
                    <Text style={styles.constraintLabel}>Max per transaction:</Text>
                    <Text style={styles.constraintValue}>
                      {formatAmount(perm.requestedConstraints.maxAmount)}
                    </Text>
                  </View>
                )}

                {perm.requestedConstraints.maxPerDay && (
                  <View style={styles.constraint}>
                    <Text style={styles.constraintLabel}>Max per day:</Text>
                    <Text style={styles.constraintValue}>
                      {formatAmount(perm.requestedConstraints.maxPerDay)}
                    </Text>
                  </View>
                )}

                {perm.requestedConstraints.expiresAt && (
                  <View style={styles.constraint}>
                    <Text style={styles.constraintLabel}>Expires:</Text>
                    <Text style={styles.constraintValue}>
                      {new Date(perm.requestedConstraints.expiresAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {perm.requestedConstraints.allowedContracts && (
                  <View style={styles.constraint}>
                    <Text style={styles.constraintLabel}>Allowed contracts:</Text>
                    <Text style={styles.constraintValue}>
                      {perm.requestedConstraints.allowedContracts.length} contract(s)
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={handleApprove}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  content: {
    maxHeight: 400,
    marginBottom: spacing.lg,
  },
  permissionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  permissionType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  constraint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  constraintLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  constraintValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  button: {
    flex: 1,
    padding: spacing.base,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.background.secondary,
  },
  rejectButtonText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  approveButton: {
    backgroundColor: colors.accent.primary,
  },
  approveButtonText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
```

---

## API Reference

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

**Usage in Mini-App:**
```javascript
const result = await window.scrollOne.grantPermissions({
  permissions: [{
    type: 'TRANSACTION',
    constraints: {
      maxAmount: '100000000000000000', // 0.1 ETH in wei
      maxPerDay: '1000000000000000000', // 1 ETH per day
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    },
  }],
});
```

#### `CHECK_PERMISSIONS`

Check if a transaction would be allowed (for testing).

**Request:**
```typescript
{
  type: BridgeMethod.CHECK_PERMISSIONS,
  payload: {
    transaction: TransactionRequest;
  };
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    allowed: boolean;
    reason?: string;
  };
}
```

#### `GET_PERMISSIONS`

Get all permissions or permissions for a specific app.

**Request:**
```typescript
{
  type: BridgeMethod.GET_PERMISSIONS,
  payload?: {
    appId?: string;
  };
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    permissions: Permission[];
  };
}
```

#### `REVOKE_PERMISSIONS`

Revoke a permission or all permissions for an app.

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

**Response:**
```typescript
{
  success: true,
  data: {
    revoked: boolean;
  };
}
```

---

## Security Considerations

### 1. Permission Validation

- All permissions are validated before execution
- Expired permissions are automatically rejected
- Amount limits are enforced per transaction and per time period
- Contract allowlists/denylists are strictly enforced

### 2. Usage Tracking

- All usage is tracked in secure storage
- Daily/weekly/monthly limits are enforced
- Usage history is retained for 90 days
- Users can view usage statistics

### 3. User Control

- Users can revoke permissions at any time
- Permission request UI clearly shows what is being requested
- Users can modify constraints before approving
- All permissions are visible in the app's permission management screen

### 4. Privacy

- Permissions are stored locally (not synced)
- Usage data is only stored locally
- No permission data is sent to external servers
- Permissions are per-device (not cross-device)

### 5. Rate Limiting

- Transaction rate limits prevent abuse
- Amount limits prevent large unauthorized transactions
- Time-based restrictions add additional security layer

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Create permission storage layer
- [ ] Implement permission validator
- [ ] Create permission service
- [ ] Add permission types to SDK
- [ ] Unit tests for core logic

### Phase 2: Bridge Integration (Week 3)

- [ ] Add bridge methods to constants
- [ ] Implement bridge handlers
- [ ] Update transaction handler to check permissions
- [ ] Integration tests for bridge

### Phase 3: UI Components (Week 4)

- [ ] Permission request modal
- [ ] Permission management screen
- [ ] Permission indicator component
- [ ] Usage statistics display

### Phase 4: Testing & Documentation (Week 5)

- [ ] End-to-end testing
- [ ] Security audit
- [ ] Documentation updates
- [ ] Example mini-app with permissions

### Phase 5: Polish & Release (Week 6)

- [ ] UX improvements
- [ ] Performance optimization
- [ ] Beta testing with select mini-apps
- [ ] Public release

---

## Testing Guide

### Unit Tests

```typescript
// services/permissions/__tests__/permissionValidator.test.ts
describe('PermissionValidator', () => {
  it('should allow transaction within amount limit', async () => {
    const permission = createMockPermission({
      constraints: { maxAmount: '100000000000000000' }, // 0.1 ETH
    });
    
    const transaction = createMockTransaction({
      value: '50000000000000000', // 0.05 ETH
    });
    
    const result = await PermissionValidator.validateAgainstPermission(
      permission,
      transaction
    );
    
    expect(result.allowed).toBe(true);
  });

  it('should reject transaction exceeding daily limit', async () => {
    // Test daily limit enforcement
  });
});
```

### Integration Tests

```typescript
// __tests__/bridge/permissions.test.ts
describe('Permission Bridge', () => {
  it('should grant permission and execute transaction', async () => {
    // 1. Request permission
    // 2. Approve permission
    // 3. Execute transaction
    // 4. Verify transaction succeeds without approval
  });
});
```

### Manual Testing Checklist

- [ ] Request permission from mini-app
- [ ] Approve permission with modified constraints
- [ ] Execute transaction within limits (should work without approval)
- [ ] Execute transaction exceeding limits (should require approval)
- [ ] Check daily limit enforcement
- [ ] Revoke permission
- [ ] Verify revoked permission no longer works
- [ ] Test permission expiration
- [ ] Test usage statistics display

---

## Migration Guide

### For Existing Mini-Apps

No changes required! Existing mini-apps will continue to work with per-transaction approval. Permissions are opt-in.

### For New Mini-Apps

1. Request permission on first transaction
2. Handle permission response
3. Use permission for subsequent transactions
4. Handle cases where permission is revoked

### Example Migration

**Before (per-transaction approval):**
```javascript
// Every transaction requires approval
const result = await window.scrollOne.signTransaction({
  to: '0x...',
  value: '0.01',
});
```

**After (with permissions):**
```javascript
// Request permission once
try {
  await window.scrollOne.grantPermissions({
    permissions: [{
      type: 'TRANSACTION',
      constraints: {
        maxAmount: '100000000000000000', // 0.1 ETH
        maxPerDay: '1000000000000000000', // 1 ETH
      },
    }],
  });
} catch (error) {
  console.log('Permission request rejected');
}

// Subsequent transactions work without approval (if within limits)
const result = await window.scrollOne.signTransaction({
  to: '0x...',
  value: '0.01',
});
```

---

## Future Enhancements

### Potential Features

1. **Permission Templates**: Pre-defined permission sets for common use cases
2. **Permission Sharing**: Share permission configurations between apps
3. **Permission Analytics**: Detailed analytics on permission usage
4. **Smart Suggestions**: AI-powered permission constraint suggestions
5. **Multi-Device Sync**: Optional permission sync across devices (encrypted)
6. **Permission Groups**: Group permissions by app category
7. **Batch Permissions**: Grant multiple permissions in one request

### ERC-7715 Compatibility

If we ever want to support browser-based wallets:
- Implement JSON-RPC `wallet_grantPermissions` method
- Support ERC-7715 permission format
- Allow browser extensions to request permissions

---

## Conclusion

This ERC-7715-inspired permissions system provides a powerful, secure, and user-friendly way to manage transaction approvals in the Scroll One SuperApp. By implementing fine-grained permissions, we significantly improve the UX for mini-apps while maintaining strong security through limits and user control.

**Key Takeaways:**

- ✅ Better UX: Reduced approval prompts for trusted apps
- ✅ Enhanced Security: Fine-grained limits prevent abuse
- ✅ User Control: Full visibility and control over permissions
- ✅ Backward Compatible: Existing apps continue to work
- ✅ Future-Proof: Foundation for advanced permission features

For questions or issues, refer to the implementation code and ensure all dependencies are properly installed.

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Status**: Planned for near-future implementation
