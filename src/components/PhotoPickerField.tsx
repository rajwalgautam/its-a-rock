import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { PhotoRef } from '@/types';

interface Props {
  photo: PhotoRef | null;
  onChange: (photo: PhotoRef | null) => void;
}

export function PhotoPickerField({ photo, onChange }: Props): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);

  async function pickPhoto(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setImageFailed(false);
    onChange({
      assetId: asset.assetId ?? null,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Route photo</Text>
      <TouchableOpacity style={styles.preview} onPress={pickPhoto}>
        {photo?.uri && !imageFailed ? (
          <Image source={{ uri: photo.uri }} style={styles.image} onError={() => setImageFailed(true)} />
        ) : (
          <Text style={styles.placeholder}>{photo?.uri ? 'Photo unavailable' : 'Tap to choose from photo library'}</Text>
        )}
      </TouchableOpacity>
      {photo?.uri && (
        <TouchableOpacity onPress={() => onChange(null)}>
          <Text style={styles.remove}>Remove photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  preview: {
    height: 180,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  remove: {
    color: COLORS.danger,
    fontWeight: '700',
  },
});
