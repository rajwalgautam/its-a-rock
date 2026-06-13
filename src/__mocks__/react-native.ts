export const Platform = {
  OS: 'android',
  select: (obj: Record<string, unknown>) => obj.android ?? obj.default,
};
export const StyleSheet = {
  create: (s: unknown) => s,
  absoluteFillObject: {},
  hairlineWidth: 1,
};
export const Dimensions = { get: () => ({ width: 390, height: 844 }) };
export const useColorScheme = () => 'light';
export const Animated = {
  Value: class {
    setValue() {}
  },
  timing: () => ({ start: () => {}, stop: () => {} }),
  spring: () => ({ start: () => {}, stop: () => {} }),
  parallel: () => ({ start: () => {}, stop: () => {} }),
  sequence: () => ({ start: () => {}, stop: () => {} }),
  delay: () => ({ start: () => {}, stop: () => {} }),
  View: () => null,
};
export const View = () => null;
export const Text = () => null;
export const Pressable = () => null;
export const TouchableOpacity = () => null;
export const FlatList = () => null;
export const Image = () => null;
export const ScrollView = () => null;
export const TextInput = () => null;
export const Modal = () => null;
export const Switch = () => null;
export const Alert = { alert: () => undefined };
export const SafeAreaView = () => null;
export const KeyboardAvoidingView = () => null;
export const ActivityIndicator = () => null;
export const RefreshControl = () => null;
