import { useRef } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface PhotoViewerProps {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
}

const MAX_SCALE = 3;
const DOUBLE_TAP_MS = 280;

/**
 * Full-screen photo viewer. Double-tap toggles zoom; drag pans while zoomed.
 * A toolbar offers save-to-gallery and close. Tapping the dimmed backdrop
 * (outside the image) dismisses. Uses only core RN APIs so it works on Android
 * without the gesture-handler/reanimated runtime.
 */
export function PhotoViewer({ uri, visible, onClose }: PhotoViewerProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const zoomedRef = useRef(false);
  const lastTapRef = useRef(0);

  function resetZoom(): void {
    zoomedRef.current = false;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translate, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
    ]).start();
  }

  function handleClose(): void {
    resetZoom();
    onClose();
  }

  function handleTap(): void {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      if (zoomedRef.current) {
        resetZoom();
      } else {
        zoomedRef.current = true;
        Animated.spring(scale, { toValue: MAX_SCALE, useNativeDriver: true }).start();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the gesture for panning once zoomed and the finger moves,
      // so single/double taps still reach the image's Pressable.
      onMoveShouldSetPanResponder: (_e, g) =>
        zoomedRef.current && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onPanResponderGrant: () => {
        translate.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: translate.x, dy: translate.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        translate.flattenOffset();
      },
    }),
  ).current;

  async function handleDownload(): Promise<void> {
    if (uri === null) return;
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo access to save this image to your gallery.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Photo saved to your gallery.');
    } catch {
      Alert.alert('Save failed', 'Could not save the photo to your gallery.');
    }
  }

  return (
    <Modal visible={visible && uri !== null} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {uri !== null && (
          <Animated.View
            style={[styles.imageWrap, { transform: [{ scale }, ...translate.getTranslateTransform()] }]}
            {...panResponder.panHandlers}
          >
            <Pressable onPress={handleTap} style={styles.imagePress}>
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.toolbar} pointerEvents="box-none">
          <ToolbarButton icon="close" label="Close photo" onPress={handleClose} colors={colors} />
          <ToolbarButton
            icon="download-outline"
            label="Save photo to gallery"
            onPress={() => void handleDownload()}
            colors={colors}
          />
        </View>
      </View>
    </Modal>
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
  imageWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePress: {
    width: '100%',
    height: '100%',
  },
  image: {
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
});
