import { Text, View } from "react-native";

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  )
}

export default LegendItem;
