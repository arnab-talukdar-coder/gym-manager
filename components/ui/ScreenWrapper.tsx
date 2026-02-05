import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function ScreenWrapper({ children }: any) {
  return (
    <LinearGradient
      colors={[theme.gradient1, theme.gradient2]}
      style={{ flex: 1, padding: 20 }}
    >
      {children}
    </LinearGradient>
  );
}
