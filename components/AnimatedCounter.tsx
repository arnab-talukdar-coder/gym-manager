import React, { useEffect, useState } from "react";
import { Text, TextStyle } from "react-native";
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Props = {
  value: number;
  duration?: number;
  prefix?: string;
  style?: TextStyle;
};

export default function AnimatedCounter({
  value,
  duration = 1500,
  prefix = "",
  style,
}: Props) {
  const shared = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    shared.value = withTiming(value, { duration });
  }, [value]);

  useAnimatedReaction(
    () => shared.value,
    (current) => {
      runOnJS(setDisplayValue)(Math.floor(current));
    },
  );

  return (
    <Text style={style}>
      {prefix}
      {displayValue}
    </Text>
  );
}
