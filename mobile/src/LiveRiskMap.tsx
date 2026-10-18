import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles as s } from "./ui";
import { riskColor, type Live } from "./liveDemo";

// Real map of the simulated area with Pito's estimated slip risk from phone detections and weather.
export function LiveRiskMap({ live }: { live: Live }) {
  const { setup, frame } = live;
  const k = 1000 / setup.areaSize;
  return (
    <View style={st.wrap}>
      <View style={st.map}>
        <Image
          source={{ uri: setup.map }}
          style={[StyleSheet.absoluteFill, st.tile]}
          resizeMode="cover"
          accessible={false}
        />
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 1000"
          style={StyleSheet.absoluteFill}
          accessible={false}
        >
          {setup.cells.x.map((x, i) => {
            const fill = riskColor(frame.risk[i]);
            if (!fill) return null;
            const half = setup.cellSize / 2;
            return (
              <Rect
                key={i}
                x={(x - half) * k}
                y={(setup.areaSize - setup.cells.y[i] - half) * k}
                width={setup.cellSize * k}
                height={setup.cellSize * k}
                fill={fill}
              />
            );
          })}
          {frame.gritted.map((id) => {
            const i = setup.zones.id.indexOf(id);
            return (
              <Rect
                key={id}
                x={setup.zones.x[i] * k + 2}
                y={(setup.areaSize - setup.zones.y[i] - setup.zoneSize) * k + 2}
                width={setup.zoneSize * k - 4}
                height={setup.zoneSize * k - 4}
                fill="rgba(40, 114, 82, .12)"
                stroke={colors.green}
                strokeWidth={5}
              />
            );
          })}
        </Svg>
        <View style={st.label}>
          <Ionicons
            accessible={false}
            name={frame.thaw ? "warning-outline" : "snow-outline"}
            size={14}
            color={frame.thaw ? "#9a4b00" : colors.blue}
          />
          <Text style={st.labelText}>{frame.when}</Text>
        </View>
      </View>
      <View
        style={st.legend}
        accessibilityLabel="Slip risk scale from low to very high; green squares are gritted now"
      >
        <Text style={s.small}>Low</Text>
        <View style={st.scale}>
          {[
            "rgba(246, 205, 70, .45)",
            "rgba(230, 120, 60, .7)",
            "rgba(214, 38, 61, .85)",
          ].map((c) => (
            <View key={c} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
        <Text style={s.small}>Very high</Text>
      </View>
      <Text style={[s.small, st.note]}>
        {frame.weather} · estimated from phone slip detections and weather
      </Text>
    </View>
  );
}

// "Right now" list for the live mode, in place of the hazard reports list.
export function LiveNow({ live }: { live: Live }) {
  const { frame } = live;
  const tone = (level: string) =>
    level === "Low"
      ? colors.green
      : level === "Elevated"
        ? "#a16207"
        : "#b42318";
  return (
    <View style={{ gap: 12 }}>
      <View style={s.between}>
        <Text style={s.h2}>Right now</Text>
        <Text style={st.count}>Simulated January 2026</Text>
      </View>
      {frame.streets.map((street) => (
        <View key={street.name} style={[s.card, st.row]}>
          <Text style={s.h3}>{street.name}</Text>
          <Text style={[st.level, { color: tone(street.level) }]}>
            {street.level}
          </Text>
        </View>
      ))}
      {frame.gritting.length ? (
        <View style={[s.card, { gap: 6 }]}>
          <View style={s.row}>
            <Ionicons
              accessible={false}
              name="checkmark-circle-outline"
              size={18}
              color={colors.green}
            />
            <Text style={s.h3}>Gritting in progress</Text>
          </View>
          {frame.gritting.map((g, i) => (
            <Text key={i} style={s.small}>
              {g.street} · until {g.until}
            </Text>
          ))}
          <Text style={s.small}>Gritting does not guarantee safety.</Text>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    gap: 8,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  map: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#eeede6",
  },
  tile: { width: "100%", height: "100%", opacity: 0.9 },
  label: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 11,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  labelText: { fontSize: 12, fontWeight: "600", color: colors.ink },
  legend: { flexDirection: "row", alignItems: "center", gap: 8 },
  scale: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
  },
  note: { marginTop: -2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  level: { fontSize: 14, fontWeight: "700" },
  count: { fontSize: 11, color: colors.muted },
});
