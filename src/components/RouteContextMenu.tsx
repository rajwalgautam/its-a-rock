import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { routeToInput } from '@/utils/routeInput';
import type { RouteWithGym } from '@/types';

/** Long-press anchor: horizontal center plus the tile's top/bottom edges. */
export interface MenuAnchor {
  x: number;
  top: number;
  bottom: number;
}

interface RouteContextMenuProps {
  visible: boolean;
  route: RouteWithGym | null;
  anchor?: MenuAnchor;
  onDismiss: () => void;
  onEdit?: (route: RouteWithGym) => void;
}

const MENU_HEIGHT = 140; // approximate height of menu with 3 items + dividers
const MENU_WIDTH = 200;

export function RouteContextMenu({ visible, route, anchor, onDismiss, onEdit }: RouteContextMenuProps): React.JSX.Element {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const editRoute = useRouteStore((s) => s.editRoute);
  const removeRoute = useRouteStore((s) => s.removeRoute);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<View>(null);

  const handleMarkCompleted = useCallback(() => {
    if (!route) return;
    const nextCompleted = !route.completed;
    void editRoute(
      route.id,
      routeToInput(route, {
        completed: nextCompleted,
        completedAt: nextCompleted ? route.completedAt ?? Date.now() : null,
      }),
    );
    onDismiss();
  }, [route, editRoute, onDismiss]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!route) return;
    void removeRoute(route.id);
    setShowDeleteConfirm(false);
    onDismiss();
  }, [route, removeRoute, onDismiss]);

  const handleEdit = useCallback(() => {
    if (route && onEdit) {
      onEdit(route);
    }
    onDismiss();
  }, [route, onEdit, onDismiss]);

  if (!visible || !route || !anchor) return <></>;

  const markCompletedLabel = route.completed ? 'Mark Incomplete' : 'Mark Completed';

  // Prefer appearing below the tile; flip above only when there isn't room.
  const fitsBelow = anchor.bottom + SPACING.sm + MENU_HEIGHT <= screenHeight - SPACING.md;
  const menuTop = fitsBelow
    ? anchor.bottom + SPACING.sm
    : anchor.top - MENU_HEIGHT - SPACING.sm;
  const menuLeft = Math.max(SPACING.md, Math.min(anchor.x - MENU_WIDTH / 2, screenWidth - MENU_WIDTH - SPACING.md));

  if (showDeleteConfirm) {
    return (
      <Pressable style={styles.backdrop} onPress={() => setShowDeleteConfirm(false)}>
        <View style={[styles.confirmDialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Delete this climb?</Text>
          <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
            This cannot be undone.
          </Text>
          <View style={styles.confirmButtonRow}>
            <Pressable
              style={[styles.confirmButton, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={[styles.confirmButtonText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, { backgroundColor: colors.danger }]}
              onPress={handleConfirmDelete}
            >
              <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.backdrop} onPress={onDismiss}>
      <View
        ref={menuRef}
        style={[
          styles.menu,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            top: menuTop,
            left: menuLeft,
          },
        ]}
      >
        <MenuItem
          label={markCompletedLabel}
          icon="checkmark-circle"
          onPress={handleMarkCompleted}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuItem label="Edit" icon="pencil" onPress={handleEdit} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuItem
          label="Delete"
          icon="trash"
          onPress={handleDelete}
          colors={colors}
          isDangerous
        />
      </View>
    </Pressable>
  );
}

interface MenuItemProps {
  label: string;
  icon: string;
  onPress: () => void;
  colors: any;
  isDangerous?: boolean;
}

function MenuItem({ label, icon, onPress, colors, isDangerous }: MenuItemProps): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.menuLabel, { color: isDangerous ? colors.danger : colors.textPrimary }]}>
        {label}
      </Text>
      <Ionicons
        name={icon as any}
        size={16}
        color={isDangerous ? colors.danger : colors.textPrimary}
        style={styles.menuIcon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    width: MENU_WIDTH,
  },
  menuItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    flex: 1,
  },
  menuIcon: {
    marginLeft: SPACING.sm,
  },
  divider: {
    height: 1,
  },
  confirmDialog: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  confirmTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  confirmMessage: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.sm,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
