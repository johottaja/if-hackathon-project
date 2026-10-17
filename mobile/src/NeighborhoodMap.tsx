import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Tap as Pressable } from "./ui";
import Svg, {
  Rect,
  Path,
  G,
  Text as SvgText,
  Pattern,
  Defs,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { Place } from "./api";
export function NeighborhoodMap({
  places,
  selected,
  onSelect,
}: {
  places: Place[];
  selected: string;
  onSelect: (p: Place) => void;
}) {
  return (
    <View style={s.map}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 390"
        preserveAspectRatio="xMidYMid slice"
        accessible={false}
      >
        <Defs>
          <Pattern
            id="blocks"
            width="84"
            height="78"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-18)"
          >
            <Rect width="84" height="78" fill="#eeede6" />
            <Rect x="10" y="10" width="64" height="58" rx="3" fill="#deded5" />
            <Rect x="22" y="23" width="39" height="31" rx="2" fill="#f2f0e9" />
            <Path d="M0 0H84M0 0V78" stroke="#fffdf8" strokeWidth="12" />
          </Pattern>
        </Defs>
        <Rect width="400" height="390" fill="url(#blocks)" />
        <Path d="M-10 252Q110 241 144 333L219 410H-10Z" fill="#bcdbe7" />
        <Path
          d="M-10 238Q106 221 158 324L230 410"
          stroke="#d4e2cb"
          strokeWidth="17"
          fill="none"
        />
        <Path d="m155 105 76-22 42 73-66 39-52-40Z" fill="#ccddbd" />
        <Path d="m170 107 60 68m-47-75 9 84" stroke="#f5f3e2" strokeWidth="4" />
        <G fill="none" stroke="#fffdf7" strokeWidth="14">
          <Path d="M90-20 193 410M294-20 229 410M-20 172 420 43M-20 298 420 179M160 386 420 313" />
        </G>
        <G
          fill="#7b837b"
          fontFamily="sans-serif"
          fontSize="9"
          letterSpacing="1"
        >
          <SvgText x="208" y="64">
            CENTRE
          </SvgText>
          <SvgText x="259" y="337">
            RIVERSIDE
          </SvgText>
          <SvgText x="164" y="144" fontSize="8" letterSpacing="0">
            Linnankatu
          </SvgText>
          <SvgText x="48" y="225" transform="rotate(-17 48 225)" fontSize="7">
            LINNANKATU
          </SvgText>
          <SvgText x="280" y="155" transform="rotate(-17 280 155)" fontSize="7">
            AURAKATU
          </SvgText>
          <SvgText x="23" y="344" fill="#58889c" letterSpacing="0" fontSize="9">
            Aurajoki
          </SvgText>
        </G>
      </Svg>
      <View style={s.label}>
        <Ionicons
          accessible={false}
          name="location-outline"
          size={13}
          color="#526477"
        />
        <Text style={s.labelText}>Linnankatu & riverside</Text>
      </View>
      {places.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onSelect(p)}
          accessibilityRole="button"
          accessibilityLabel={`${p.name}, ${p.falls} confirmed falls, ${p.hazards} hazard reports`}
          accessibilityState={{ selected: p.id === selected }}
          style={({ pressed }) => [
            s.target,
            { left: `${p.x}%`, top: `${p.y}%`, opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <View
            style={[
              s.marker,
              p.id === selected ? s.selected : null,
              ["completed", "verified"].includes(p.action.status)
                ? s.verified
                : null,
            ]}
          >
            {["completed", "verified"].includes(p.action.status) ? (
              <Ionicons
                accessible={false}
                name="checkmark"
                size={18}
                color="#fff"
              />
            ) : (
              <Text style={[s.markerText, p.id === selected ? s.white : null]}>
                {p.reports.length}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
      <View style={s.legend}>
        <View style={s.legendDot} />
        <Text style={s.legendText}>Report count</Text>
        <View
          style={[s.legendDot, { backgroundColor: "#287252", marginLeft: 12 }]}
        />
        <Text style={s.legendText}>Maintenance completed</Text>
      </View>
      <Text style={s.caption}>Illustrative map · approximate places</Text>
    </View>
  );
}
const s = StyleSheet.create({
  map: { height: 340, backgroundColor: "#eeede6", overflow: "hidden" },
  label: {
    position: "absolute",
    left: 16,
    top: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  labelText: { fontSize: 10, color: "#526477", fontWeight: "600" },
  target: {
    position: "absolute",
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#2446ed",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px #182b4222",
  },
  selected: { backgroundColor: "#2446ed", boxShadow: "0 0 0 6px #2446ed22" },
  verified: { backgroundColor: "#287252", borderColor: "#287252" },
  markerText: { fontSize: 14, fontWeight: "700", color: "#2446ed" },
  white: { color: "#fff" },
  legend: {
    position: "absolute",
    bottom: 33,
    left: 14,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2446ed",
  },
  legendText: { fontSize: 11, color: "#425368" },
  caption: {
    position: "absolute",
    bottom: 12,
    left: 14,
    fontSize: 10,
    color: "#526477",
    backgroundColor: "#ffffffe8",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
});
