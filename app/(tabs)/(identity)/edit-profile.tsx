import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, User, CloudUpload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  buildProfileBundle,
  uploadProfileBundle,
} from '@/services/walrus/profile';
import { uploadBlob } from '@/services/walrus/storage';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, badges, setProfile, earnBadge } = useUserStore();
  const { address } = useWalletStore();
  const { isTestnet } = useSettingsStore();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [suiId, setSuiId] = useState(profile?.suiId ?? '');
  const [avatarUri, setAvatarUri] = useState(profile?.avatar);
  const [isSaving, setIsSaving] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo access to set your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setAvatarUri(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
      } else if (asset.uri) {
        setAvatarUri(asset.uri);
      }
    }
  };

  const handleSave = async () => {
    if (!address || !profile) {
      Alert.alert('Wallet required', 'Connect a wallet to save your profile to Walrus.');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('Display name required', 'Enter a display name for your Scroll-One ID.');
      return;
    }

    setIsSaving(true);
    try {
      let walrusAvatarBlobId = profile.walrusAvatarBlobId;

      if (avatarUri && (avatarUri.startsWith('data:') || avatarUri.startsWith('file:'))) {
        const response = await fetch(avatarUri);
        const bytes = new Uint8Array(await response.arrayBuffer());
        const avatarUpload = await uploadBlob(bytes, address, isTestnet, 'avatar.jpg');
        walrusAvatarBlobId = avatarUpload.blobId;
      }

      const updatedProfile = {
        ...profile,
        displayName: displayName.trim(),
        bio: bio.trim(),
        suiId: suiId.trim() || profile.suiId,
        avatar: avatarUri,
        walrusAvatarBlobId,
      };

      const bundle = buildProfileBundle(updatedProfile, address, badges, {
        avatarBlobId: walrusAvatarBlobId,
        avatarDataUri: avatarUri,
      });

      const { blobId, contentHash } = await uploadProfileBundle(bundle, address, isTestnet);

      setProfile({
        ...updatedProfile,
        walrusBlobId: blobId,
        profileContentHash: contentHash,
      });

      earnBadge('walrus-pioneer');

      Alert.alert(
        'Profile saved to Walrus',
        `Your Scroll-One ID is stored on Walrus.\nBlob ID: ${blobId.slice(0, 16)}…`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Walrus upload failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft color={colors.text.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen scrollable>
        <Card variant="bordered" style={styles.walrusCard}>
          <CloudUpload color={colors.accent.primary} size={20} />
          <View style={styles.walrusTextWrap}>
            <Text style={styles.walrusTitle}>Walrus-backed identity</Text>
            <Text style={styles.walrusSubtitle}>
              Profile data is uploaded to Walrus decentralized storage with an on-chain blob reference.
            </Text>
          </View>
        </Card>

        <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User color={colors.text.primary} size={48} />
            </View>
          )}
          <Text style={styles.avatarHint}>Tap to change avatar</Text>
        </TouchableOpacity>

        <Card style={styles.fieldCard}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.text.tertiary}
          />
        </Card>

        <Card style={styles.fieldCard}>
          <Text style={styles.label}>Scroll-One ID</Text>
          <TextInput
            style={styles.input}
            value={suiId}
            onChangeText={setSuiId}
            placeholder="username"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="none"
          />
        </Card>

        <Card style={styles.fieldCard}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the Sui ecosystem about yourself"
            placeholderTextColor={colors.text.tertiary}
            multiline
          />
        </Card>

        {profile?.walrusBlobId ? (
          <Text style={styles.blobId}>
            Walrus blob: {profile.walrusBlobId}
          </Text>
        ) : null}

        <Button onPress={handleSave} fullWidth disabled={isSaving} style={styles.saveButton}>
          {isSaving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={colors.text.primary} size="small" />
              <Text style={styles.savingText}>Uploading to Walrus…</Text>
            </View>
          ) : (
            'Save to Walrus'
          )}
        </Button>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  walrusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  walrusTextWrap: {
    flex: 1,
  },
  walrusTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  walrusSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
  },
  avatarHint: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  fieldCard: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  blobId: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.mono,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: spacing.md,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  savingText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
