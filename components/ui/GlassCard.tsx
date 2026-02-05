import { theme } from "@/constants/theme";
import { StyleSheet, View } from "react-native";

export default function GlassCard({ children }: any) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    padding: 18,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
});
