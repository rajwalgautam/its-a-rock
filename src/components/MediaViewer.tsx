import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { MediaType } from '@/types';

export interface ViewerMedia {
  uri: string;
  type: MediaType;
}

interface MediaViewerProps {
  media: ViewerMedia[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen swipeable gallery. Photos fit to the screen; videos play in-app
 * with native controls. A toolbar saves the current item to the device gallery
 * and closes. Uses a paging FlatList so it works without gesture-handler.
 */
export function MediaViewer({
  media,
  initialIndex = 0,
  visible,
  onClose,
}: MediaViewerProps): React.JSX.Element {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  async function handleDownload(): Promise<void> {
    const item = media[index];
    if (item === undefined) return;
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow media access to save this to your gallery.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(item.uri);
      Alert.alert('Saved', `${item.type === 'video' ? 'Video' : 'Photo'} saved to your gallery.`);
    } catch {
      Alert.alert('Save failed', 'Could not save this item to your gallery.');
    }
  }

  return (
    <Modal
      visible={visible && media.length > 0}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <FlatList
          data={media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(item, i) => `${item.uri}-${i}`}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index: i }) =>
            item.type === 'video' ? (
              <VideoPage uri={item.uri} active={visible && i === index} width={width} height={height} />
            ) : (
              <View style={[styles.page, { width, height }]}>
                <Image source={{ uri: item.uri }} style={styles.media} resizeMode="contain" />
              </View>
            )
          }
        />

        <View style={styles.toolbar} pointerEvents="box-none">
          <ToolbarButton icon="close" label="Close viewer" onPress={onClose} colors={colors} />
          <ToolbarButton
            icon="download-outline"
            label="Save to gallery"
            onPress={() => void handleDownload()}
            colors={colors}
          />
        </View>

        {media.length > 1 && (
          <View style={[styles.counter, { backgroundColor: colors.overlay }]} pointerEvents="none">
            <Text style={[styles.counterText, { color: colors.onOverlay }]}>
              {index + 1} / {media.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

function VideoPage({
  uri,
  active,
  width,
  height,
}: {
  uri: string;
  active: boolean;
  width: number;
  height: number;
}): React.JSX.Element {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = true; // Mute videos by default
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <View style={[styles.page, { width, height }]}>
      <VideoView style={styles.media} player={player} contentFit="contain" nativeControls />
    </View>
  );
}

function ToolbarButton({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[styles.toolbarBtn, { backgroundColor: colors.overlay }]}
    >
      <Ionicons name={icon} size={24} color={colors.onOverlay} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  toolbar: {
    position: 'absolute',
    top: SPACING.xxl,
    right: SPACING.lg,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toolbarBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    bottom: SPACING.xxl,
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  counterText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
