import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import type { Transaction } from '@/store/walletStore';
import { shortenAddress } from '@/services/sui/wallet';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  transactionHash?: string;
  transactionId?: string;
  type: 'transaction_confirmed' | 'transaction_failed' | 'transaction_pending' | 'incoming_transaction';
}

class NotificationService {
  private token: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[NotificationService] Permission not granted');
        return false;
      }

      // Get the Expo Push Token (only for push notifications, not local)
      // Skip in Expo Go - remote push notifications were removed in SDK 53+
      // Local notifications still work fine in Expo Go
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                         Constants.expoConfig?.extra?.projectId ||
                         undefined;
        
        if (projectId) {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          this.token = tokenData.data;
          console.log('[NotificationService] Push token:', this.token);
        } else {
          console.log('[NotificationService] Project ID not found, skipping push token (local notifications will still work)');
        }
      } catch (error: any) {
        // Push token is optional for local notifications
        // In Expo Go (SDK 53+), getExpoPushTokenAsync throws an error - that's expected
        // We'll catch it and continue - local notifications still work
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('Expo Go') || errorMessage.includes('SDK 53') || errorMessage.includes('development build')) {
          // This is expected in Expo Go - local notifications still work
          console.log('[NotificationService] Push notifications not available in Expo Go (expected) - local notifications still work');
        } else {
          console.log('[NotificationService] Could not get push token (this is OK for local notifications):', error);
        }
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check if permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Send local notification for transaction confirmation
   */
  async notifyTransactionConfirmed(transaction: Transaction): Promise<void> {
    const isOutgoing = transaction.type === 'send';
    const title = isOutgoing 
      ? 'Transaction Confirmed' 
      : 'Funds Received';
    
    const body = isOutgoing
      ? `You sent ${transaction.amount} ${transaction.symbol} to ${shortenAddress(transaction.to || '', 4)}`
      : `You received ${transaction.amount} ${transaction.symbol}`;

    // Trigger haptic feedback for success
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          transactionHash: transaction.hash,
          transactionId: transaction.id,
          type: 'transaction_confirmed',
        } as NotificationData,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Send local notification for transaction failure
   */
  async notifyTransactionFailed(transaction: Transaction): Promise<void> {
    // Trigger haptic feedback for error
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Transaction Failed',
        body: `Your transaction to ${shortenAddress(transaction.to || '', 4)} could not be completed.`,
        data: {
          transactionHash: transaction.hash,
          transactionId: transaction.id,
          type: 'transaction_failed',
        } as NotificationData,
        sound: true,
      },
      trigger: null,
    });
  }

  /**
   * Cancel notification for a specific transaction
   */
  async cancelTransactionNotification(transactionId: string): Promise<void> {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const notificationToCancel = allNotifications.find(
      (n) => n.content.data?.transactionId === transactionId
    );
    
    if (notificationToCancel) {
      await Notifications.cancelScheduledNotificationAsync(notificationToCancel.identifier);
    }
  }

  /**
   * Get the Expo Push Token (for future server-side push notifications)
   */
  getPushToken(): string | null {
    return this.token;
  }

  /**
   * Setup notification listeners
   */
  setupListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationTapped: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription[] {
    // Listener for notifications received while app is foregrounded
    const receivedListener = Notifications.addNotificationReceivedListener(onNotificationReceived);

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationTapped);

    return [receivedListener, responseListener];
  }

  /**
   * Remove all notification listeners
   */
  removeListeners(subscriptions: Notifications.Subscription[]): void {
    subscriptions.forEach((subscription) => subscription.remove());
  }

  /**
   * Clear the app badge count
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('[NotificationService] Badge count cleared');
    } catch (error) {
      console.error('[NotificationService] Error clearing badge count:', error);
    }
  }

  /**
   * Set the app badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('[NotificationService] Badge count set to:', count);
    } catch (error) {
      console.error('[NotificationService] Error setting badge count:', error);
    }
  }

  /**
   * Get the current badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      console.error('[NotificationService] Error getting badge count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

