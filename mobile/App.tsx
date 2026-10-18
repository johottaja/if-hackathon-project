import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { NeighborhoodMap } from "./src/NeighborhoodMap";
import { LiveRiskMap, LiveNow } from "./src/LiveRiskMap";
import { useLiveDemo } from "./src/liveDemo";
import {
  Button,
  Label,
  Empty,
  Tap as Pressable,
  styles as s,
  colors,
} from "./src/ui";
import {
  initialState,
  placesFor,
  addReport,
  maintenance,
  WINDOW,
  STATUS,
  NEXT,
  CATEGORIES,
  PLACES,
} from "./src/model.mjs";
import type { State } from "./src/model.mjs";
import { request, type Place, type DemoState } from "./src/api";
import "./global.css";
const KEY = "pito-mobile-v2",
  DRAFT = "pito-draft-v2";
const connected = !!process.env.EXPO_PUBLIC_API_URL;
type Draft = {
  id: string;
  placeId: string;
  category: string;
  confirmedFall: boolean;
  description: string;
  photo: boolean;
  source: string;
};
function fromRemote(value: DemoState): State {
  return {
    reports: value.reports,
    actions: value.places.map((p) => ({ ...p.action, placeId: p.id })),
  };
}
export default function App() {
  return (
    <SafeAreaProvider>
      <MobileApp />
    </SafeAreaProvider>
  );
}
function MobileApp() {
  const insets = useSafeAreaInsets();
  const live = useLiveDemo();
  const [state, setState] = useState<State>(initialState),
    [ready, setReady] = useState(false),
    [tab, setTab] = useState("Explore"),
    [selected, setSelected] = useState("stairs"),
    [mapMode, setMapMode] = useState(true),
    [category, setCategory] = useState("All"),
    [detail, setDetail] = useState(false),
    [fallPrompt, setFallPrompt] = useState(false),
    [reportOpen, setReportOpen] = useState(false),
    [draft, setDraft] = useState<Draft | null>(null),
    [step, setStep] = useState(1),
    [choosingPlace, setChoosingPlace] = useState(false),
    [success, setSuccess] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [storageError, setStorageError] = useState(""),
    [refreshing, setRefreshing] = useState(false),
    [maintenanceNote, setMaintenanceNote] = useState("");
  const homeScroll = useRef<ScrollView>(null);
  function simulateFall() {
    setTab("Explore");
    setSelected("stairs");
    setCategory("All");
    setMapMode(true);
    setDetail(false);
    setReportOpen(false);
    setFallPrompt(true);
    homeScroll.current?.scrollTo({ y: 0, animated: false });
  }
  const submitting = useRef(false);
  const places = placesFor(state),
    place = places.find((p) => p.id === selected) || places[0];
  const filtered = places.filter(
    (p) => category === "All" || p.reports.some((r) => r.category === category),
  );
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [saved, savedDraft] = await Promise.all([
          AsyncStorage.getItem(KEY),
          AsyncStorage.getItem(DRAFT),
        ]);
        if (saved && !connected) {
          const value = JSON.parse(saved);
          if (
            Array.isArray(value.reports) &&
            PLACES.every((p) =>
              value.actions?.some(
                (a: { placeId: string; status: string }) =>
                  a.placeId === p.id && STATUS[a.status],
              ),
            )
          )
            if (live) setState(value);
        }
        if (savedDraft && live) {
          const value = JSON.parse(savedDraft);
          if (
            PLACES.some((p) => p.id === value.placeId) &&
            CATEGORIES.includes(value.category)
          )
            setDraft(value);
        }
        if (connected) {
          const value = await request();
          if (live) setState(fromRemote(value));
        }
      } catch (e) {
        if (live)
          setError(
            connected
              ? "Couldn’t connect to the service. Check the address and your connection."
              : "Couldn’t restore saved data. The initial reports are shown.",
          );
      } finally {
        if (live) setReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (ready && !connected)
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() =>
        setStorageError(
          "Device storage is unavailable. Changes last for this session.",
        ),
      );
  }, [state, ready]);
  useEffect(() => {
    if (ready) {
      const operation = draft
        ? AsyncStorage.setItem(DRAFT, JSON.stringify(draft))
        : AsyncStorage.removeItem(DRAFT);
      operation.catch(() =>
        setStorageError("The draft could not be saved on this device."),
      );
    }
  }, [draft, ready]);
  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => {
      if (!submitting.current)
        request()
          .then((v) => {
            setState(fromRemote(v));
            setError("");
          })
          .catch(() =>
            setError(
              "Connection lost. Displayed reports may be stale. Pull to refresh.",
            ),
          );
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  async function refresh() {
    setRefreshing(true);
    try {
      if (connected) setState(fromRemote(await request()));
      setError("");
    } catch {
      setError("Couldn’t refresh. Existing reports remain visible.");
    } finally {
      setRefreshing(false);
    }
  }
  function startReport(fall = false) {
    setError("");
    setSuccess(false);
    setStep(1);
    setChoosingPlace(false);
    setDraft({
      id: Crypto.randomUUID(),
      placeId: selected,
      category: place.category,
      confirmedFall: fall,
      description: "",
      photo: false,
      source: fall ? "simulated trigger" : "manual",
    });
    setReportOpen(true);
  }
  async function publish() {
    if (!draft || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      if (connected) setState(fromRemote(await request("/reports", draft)));
      else setState((previous) => addReport(previous, draft));
      setSelected(draft.placeId);
      setDraft(null);
      setSuccess(true);
    } catch {
      setError(
        "Couldn’t publish. Your draft is saved; check the connection and retry.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  async function updateMaintenance() {
    if (!maintenanceNote.trim()) {
      setError("Add a note explaining the maintenance update.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (connected)
        setState(
          fromRemote(
            await request("/actions", {
              placeId: selected,
              status: NEXT[place.action.status],
              note: maintenanceNote,
            }),
          ),
        );
      else
        setState((previous) =>
          maintenance(previous, selected, maintenanceNote),
        );
      setMaintenanceNote("");
    } catch {
      setError("Couldn’t save the maintenance update. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    Alert.alert(
      "Reset local data?",
      "This clears local reports, maintenance updates and your saved draft.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset data",
          style: "destructive",
          onPress: () => {
            setState(initialState());
            setDraft(null);
            setError("");
          },
        },
      ],
    );
  }
  const modalHeader = (title: string, close: () => void) => (
    <View style={local.modalHeader}>
      <Text style={s.h3}>{title}</Text>
      <Pressable
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={local.iconButton}
      >
        <Ionicons
          accessible={false}
          name="close"
          size={24}
          color={colors.ink}
        />
      </Pressable>
    </View>
  );
  if (!ready)
    return (
      <View
        style={[s.screen, { alignItems: "center", justifyContent: "center" }]}
      >
        <ActivityIndicator color={colors.blue} />
        <Text style={[s.body, { marginTop: 12 }]}>Loading reports…</Text>
      </View>
    );
  return (
    <View style={s.screen}>
      <View
        style={s.screen}
        pointerEvents={fallPrompt || reportOpen ? "none" : "auto"}
        aria-hidden={fallPrompt || reportOpen}
        {...(Platform.OS === "web"
          ? { inert: fallPrompt || reportOpen ? true : undefined }
          : {})}
        accessibilityElementsHidden={fallPrompt || reportOpen}
        importantForAccessibility={
          fallPrompt || reportOpen ? "no-hide-descendants" : "auto"
        }
      >
        <View style={[local.header, { paddingTop: insets.top + 12 }]}>
          <View className="flex-row items-center gap-3">
            <Text style={local.brand}>If</Text>
            <View style={local.brandDivider} />
            <Text style={local.brandName}>Pito</Text>
          </View>
        </View>
        <ScrollView
          ref={homeScroll}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 28 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.blue}
            />
          }
        >
          {tab === "Explore" ? (
            <>
              <View
                style={[
                  s.content,
                  { paddingTop: 8, paddingBottom: 16, gap: 8 },
                ]}
              >
                <Text style={s.h1}>Around you</Text>
                <Text style={s.body}>
                  Spot a hazard. Help someone on their way.
                </Text>
              </View>
              <View style={s.content}>
                <View style={s.between}>
                  <View style={s.row}>
                    <View style={local.locationIcon}>
                      <Ionicons
                        accessible={false}
                        name="location-outline"
                        size={18}
                        color={colors.blue}
                      />
                    </View>
                    <View>
                      <Text style={local.area}>
                        {live ? live.setup.place : "Linnankatu"}
                      </Text>
                      <Text style={s.small}>
                        {live ? live.setup.area : "Turku"}
                      </Text>
                    </View>
                  </View>
                  <View style={local.segment}>
                    <Pressable
                      onPress={() => setMapMode(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Show map"
                      accessibilityState={{ selected: mapMode }}
                      style={[
                        local.segmentButton,
                        mapMode ? local.segmentSelected : null,
                      ]}
                    >
                      <Ionicons
                        accessible={false}
                        name="map-outline"
                        size={17}
                        color={mapMode ? colors.blue : colors.muted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => setMapMode(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Show nearby list"
                      accessibilityState={{ selected: !mapMode }}
                      style={[
                        local.segmentButton,
                        !mapMode ? local.segmentSelected : null,
                      ]}
                    >
                      <Ionicons
                        accessible={false}
                        name="list-outline"
                        size={20}
                        color={!mapMode ? colors.blue : colors.muted}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
              {live ? null : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={local.filters}
                >
                  {["All", ...CATEGORIES].map((c) => (
                    <Pressable
                      key={c}
                      accessibilityRole="button"
                      accessibilityState={{ selected: category === c }}
                      onPress={() => setCategory(c)}
                      style={({ pressed }) => [
                        s.chip,
                        category === c ? s.chipSelected : null,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text
                        style={[
                          s.chipText,
                          category === c ? s.chipTextSelected : null,
                        ]}
                      >
                        {c === "All" ? "All hazards" : c}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {live ? (
                <LiveRiskMap live={live} />
              ) : mapMode ? (
                <NeighborhoodMap
                  places={filtered}
                  selected={selected}
                  onSelect={(p) => {
                    setSelected(p.id);
                    setDetail(true);
                  }}
                />
              ) : null}
              {live ? (
                <View style={s.content}>
                  <LiveNow live={live} />
                </View>
              ) : (
                <View style={s.content}>
                  <View style={s.between}>
                    <Text style={s.h2}>Nearby hazards</Text>
                    <Text style={local.count}>{filtered.length} places</Text>
                  </View>
                  <Text style={[s.small, { marginTop: -12 }]}>
                    {WINDOW} · synthetic reports
                  </Text>
                  {filtered.length === 0 ? (
                    <Empty
                      title="No matching reports"
                      description="Try another hazard type. An absence of reports does not establish safety."
                    />
                  ) : (
                    filtered.map((p) => (
                      <PlaceCard
                        key={p.id}
                        place={p}
                        onPress={() => {
                          setSelected(p.id);
                          setDetail(true);
                        }}
                      />
                    ))
                  )}
                </View>
              )}
            </>
          ) : tab === "Updates" ? (
            <View style={s.content}>
              <Text style={s.h1}>Maintenance updates</Text>
              {places
                .filter((p) => p.action.status !== "new")
                .map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelected(p.id);
                      setDetail(true);
                    }}
                    style={s.card}
                  >
                    <View style={s.row}>
                      <Ionicons
                        accessible={false}
                        name={
                          p.action.status === "verified"
                            ? "checkmark-circle-outline"
                            : "time-outline"
                        }
                        size={24}
                        color={
                          p.action.status === "verified"
                            ? colors.green
                            : colors.blue
                        }
                      />
                      <Text style={s.h3}>{p.name}</Text>
                    </View>
                    <StatusBadge status={p.action.status} />
                    {p.action.note ? (
                      <Text style={s.body}>{p.action.note}</Text>
                    ) : null}
                  </Pressable>
                ))}
            </View>
          ) : (
            <View style={s.content}>
              <Text style={s.h1}>About Pito</Text>
              <View style={s.card}>
                <Text style={s.h3}>Privacy and data</Text>
                <Text style={s.body}>
                  Reports and maintenance partners are fictional. No routes are
                  collected. Pito data is not used for pricing or claims
                  decisions. Sensor detection is simulated. Map locations are
                  approximate.
                </Text>
                <Text style={s.small}>
                  {connected
                    ? "Connected: updates sync across devices."
                    : "Local storage: saved on this device. No dashboard connection."}
                </Text>
              </View>
              <View style={s.card}>
                <Text style={s.h3}>Maintenance controls</Text>
                <Text style={s.small}>
                  Presenter tools only. No real work is dispatched. Choose a
                  place, then record each step with a note.
                </Text>
                {places.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setSelected(p.id);
                      setError("");
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected === p.id }}
                    style={[
                      local.option,
                      selected === p.id ? local.optionSelected : null,
                    ]}
                  >
                    <Text style={s.h3}>{p.name}</Text>
                    <StatusBadge status={p.action.status} />
                  </Pressable>
                ))}
                {NEXT[place.action.status] ? (
                  <>
                    <Text accessibilityRole="header" style={s.fieldLabel}>
                      Note for {place.name}
                    </Text>
                    <TextInput
                      accessibilityLabel="Maintenance note"
                      multiline
                      value={maintenanceNote}
                      onChangeText={setMaintenanceNote}
                      placeholder="What was assessed, completed or checked?"
                      placeholderTextColor={colors.muted}
                      style={[
                        s.input,
                        { minHeight: 90, textAlignVertical: "top" },
                      ]}
                    />
                    <Button
                      title={STATUS[NEXT[place.action.status]]}
                      disabled={busy}
                      onPress={updateMaintenance}
                    />
                  </>
                ) : (
                  <Text style={s.body}>
                    Maintenance verified. A new report at this place will reopen
                    review.
                  </Text>
                )}
              </View>
              <View style={s.card}>
                <Text style={s.h3}>Simulate a fall</Text>
                <Text style={s.body}>
                  No report is shared until you confirm and publish it.
                </Text>
                <Button
                  title="Simulate possible fall"
                  secondary
                  icon="flask-outline"
                  onPress={simulateFall}
                />
              </View>
              {!connected ? (
                <Button
                  title="Reset local data"
                  secondary
                  icon="refresh-outline"
                  onPress={reset}
                />
              ) : null}
            </View>
          )}
          {error ? (
            <View style={[s.content, { paddingTop: 0 }]}>
              <Text accessibilityRole="alert" style={s.danger}>
                {error}
              </Text>
              <Button title="Refresh reports" secondary onPress={refresh} />
            </View>
          ) : null}
          {storageError ? (
            <Text style={[s.small, { paddingHorizontal: 24 }]}>
              {storageError}
            </Text>
          ) : null}
        </ScrollView>
        {tab === "Explore" ? (
          <View style={local.reportBar}>
            <Button
              title={draft ? "Continue your report" : "Report something"}
              icon="add"
              onPress={() => {
                if (draft) {
                  setSuccess(false);
                  setStep(1);
                  setReportOpen(true);
                } else startReport();
              }}
            />
          </View>
        ) : null}
        <View
          style={[local.tabbar, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          {(
            [
              { name: "Explore", icon: "map-outline" },
              { name: "Updates", icon: "notifications-outline" },
              { name: "About", icon: "information-circle-outline" },
            ] as const
          ).map((t) => (
            <Pressable
              key={t.name}
              accessibilityRole="tab"
              accessibilityLabel={t.name === "Explore" ? "Home" : t.name}
              accessibilityState={{ selected: tab === t.name }}
              onPress={() => {
                setTab(t.name);
                setError("");
              }}
              style={({ pressed }) => [
                local.tab,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Ionicons
                accessible={false}
                name={t.icon}
                size={22}
                color={tab === t.name ? colors.blue : colors.muted}
              />
              <Text
                style={[
                  local.tabText,
                  { color: tab === t.name ? colors.blue : colors.muted },
                ]}
              >
                {t.name === "Explore" ? "Home" : t.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {fallPrompt ? (
        <View
          style={StyleSheet.absoluteFill}
          accessibilityViewIsModal
          importantForAccessibility="yes"
        >
          <BlurView
            intensity={65}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              local.fallOverlay,
              {
                paddingTop: insets.top + 24,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <View style={local.fallCard} accessibilityLiveRegion="assertive">
              <View style={s.between}>
                <Text style={s.h2}>Did you fall?</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss fall prompt"
                  onPress={() => setFallPrompt(false)}
                  style={local.iconButton}
                >
                  <Ionicons
                    accessible={false}
                    name="close"
                    size={22}
                    color={colors.ink}
                  />
                </Pressable>
              </View>
              <Text style={s.body}>
                Take a moment. If you need urgent help, call 112. Nothing has
                been shared.
              </Text>
              <Button
                title="Yes, report what happened"
                onPress={() => {
                  setFallPrompt(false);
                  startReport(true);
                }}
              />
              <Button
                title="No, I didn’t fall"
                secondary
                onPress={() => setFallPrompt(false)}
              />
              <Text style={s.small}>
                Simulated trigger · no sensor detection
              </Text>
            </View>
          </ScrollView>
        </View>
      ) : null}
      <Modal
        visible={detail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetail(false)}
      >
        <View style={s.screen}>
          {modalHeader("Reported place", () => setDetail(false))}
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[
              s.content,
              { paddingBottom: insets.bottom + 32 },
            ]}
          >
            <Label>{place.area.toUpperCase()} · APPROXIMATE LOCATION</Label>
            <Text style={s.h1}>{place.name}</Text>
            <StatusBadge status={place.action.status} />
            <Text style={s.body}>{place.description}</Text>
            <View style={local.evidence}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={local.number}>{place.falls}</Text>
                <Text style={s.small}>Confirmed-fall reports</Text>
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={local.number}>{place.hazards}</Text>
                <Text style={s.small}>Hazard-only reports</Text>
              </View>
            </View>
            <Text style={s.small}>{WINDOW} · synthetic data</Text>
            {place.action.status === "verified" ||
            place.action.status === "completed" ? (
              <View style={s.notice}>
                <Text style={[s.h3, { color: colors.green }]}>
                  {STATUS[place.action.status]}
                </Text>
                <Text style={[s.body, { marginTop: 7 }]}>
                  {place.action.note}
                </Text>
                <Text style={[s.small, { marginTop: 8 }]}>
                  Work does not guarantee current safety. Conditions can change.
                </Text>
              </View>
            ) : null}
            <Text style={s.h2}>What’s been reported</Text>
            {[...place.reports].reverse().map((r) => (
              <View key={r.id} style={local.historyRow}>
                <View style={local.historyDot} />
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={s.h3}>
                    {r.confirmedFall
                      ? "User-confirmed fall"
                      : "Hazard report · no fall"}
                  </Text>
                  <Text style={s.small}>
                    {r.at.slice(0, 10)} · {r.id}
                  </Text>
                  <Text style={s.body}>{r.description || r.category}</Text>
                  {r.photo ? <SamplePhoto /> : null}
                  <Text style={s.small}>
                    {r.source === "simulated trigger"
                      ? "Simulated trigger, explicitly confirmed"
                      : "Manual report"}
                  </Text>
                </View>
              </View>
            ))}
            {place.action.history.length ? (
              <>
                <Text style={s.h2}>Maintenance history</Text>
                {[...place.action.history].reverse().map((h, i) => (
                  <View key={`${h.at}-${i}`} style={s.card}>
                    <StatusBadge status={h.status} />
                    <Text style={s.body}>{h.note}</Text>
                    <Text style={s.small}>
                      {h.at.slice(0, 10)} · synthetic update
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
            <Button
              title="Report a hazard here"
              icon="add"
              onPress={() => {
                setDetail(false);
                startReport();
              }}
            />
          </ScrollView>
        </View>
      </Modal>
      {reportOpen ? (
        <View
          style={StyleSheet.absoluteFill}
          accessibilityViewIsModal
          importantForAccessibility="yes"
        >
          <BlurView
            intensity={65}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={[
                local.fallOverlay,
                {
                  paddingTop: insets.top + 24,
                  paddingBottom: insets.bottom + 24,
                },
              ]}
            >
              <View style={local.questionCard}>
                <View style={s.between}>
                  <Text style={s.small}>
                    {success
                      ? "Shared with the community"
                      : `Report · ${step} of 4`}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Save draft and close"
                    disabled={busy}
                    onPress={() => setReportOpen(false)}
                    style={local.iconButton}
                  >
                    <Ionicons
                      accessible={false}
                      name="close"
                      size={24}
                      color={colors.ink}
                    />
                  </Pressable>
                </View>
                {success ? (
                  <>
                    <Ionicons
                      accessible={false}
                      name="checkmark-circle-outline"
                      size={56}
                      color={colors.green}
                    />
                    <Text style={local.question}>Thank you.</Text>
                    <Text style={s.body}>
                      Your report at {place.name} is now on the map.
                    </Text>
                    <Button
                      title="Back to map"
                      onPress={() => {
                        setReportOpen(false);
                        setTab("Explore");
                      }}
                    />
                  </>
                ) : draft ? (
                  <>
                    <Text accessibilityRole="header" style={local.question}>
                      {step === 1
                        ? "Did it happen here?"
                        : step === 2
                          ? "What was the hazard?"
                          : step === 3
                            ? "Anything to add?"
                            : "Share this report?"}
                    </Text>
                    {step === 1 ? (
                      <>
                        {!choosingPlace ? (
                          <>
                            <Ionicons
                              accessible={false}
                              name="location-outline"
                              size={48}
                              color={colors.blue}
                            />
                            <Text style={local.answer}>
                              {PLACES.find((p) => p.id === draft.placeId)?.name}
                            </Text>
                            <Text style={s.small}>Approximate location</Text>
                            <Button
                              title="Yes, here"
                              onPress={() => setStep(2)}
                            />
                            <Button
                              title="Somewhere else"
                              secondary
                              onPress={() => setChoosingPlace(true)}
                            />
                          </>
                        ) : (
                          PLACES.map((p) => (
                            <Button
                              key={p.id}
                              title={p.name}
                              secondary
                              onPress={() => {
                                setDraft({ ...draft, placeId: p.id });
                                setChoosingPlace(false);
                              }}
                            />
                          ))
                        )}
                      </>
                    ) : step === 2 ? (
                      <>
                        <View style={local.hazardChoices}>
                          {CATEGORIES.map((c) => (
                            <Pressable
                              key={c}
                              accessibilityRole="button"
                              accessibilityLabel={c}
                              onPress={() => {
                                setDraft({ ...draft, category: c });
                                setStep(3);
                              }}
                              style={({ pressed }) => [
                                local.hazardChoice,
                                { opacity: pressed ? 0.65 : 1 },
                              ]}
                            >
                              <Ionicons
                                accessible={false}
                                name={
                                  c.includes("Icy") || c.includes("Slippery")
                                    ? "snow-outline"
                                    : c === "Pothole" || c === "Uneven surface"
                                      ? "warning-outline"
                                      : "walk-outline"
                                }
                                size={28}
                                color={colors.blue}
                              />
                              <Text style={local.choiceText}>{c}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </>
                    ) : step === 3 ? (
                      <>
                        <Text style={s.body}>
                          A short note can help others. You can skip this.
                        </Text>
                        <TextInput
                          accessibilityLabel="Optional report note"
                          value={draft.description}
                          onChangeText={(description) =>
                            setDraft({ ...draft, description })
                          }
                          multiline
                          maxLength={600}
                          placeholder="What should others know?"
                          placeholderTextColor={colors.muted}
                          style={[
                            s.input,
                            {
                              minHeight: 110,
                              textAlignVertical: "top",
                              fontSize: 18,
                            },
                          ]}
                        />
                        <Button
                          title={
                            draft.description.trim()
                              ? "Continue"
                              : "Skip for now"
                          }
                          onPress={() => setStep(4)}
                        />
                      </>
                    ) : (
                      <>
                        <Text style={local.answer}>{draft.category}</Text>
                        <Text style={s.body}>
                          {PLACES.find((p) => p.id === draft.placeId)?.name}
                        </Text>
                        <Text style={s.body}>
                          {draft.confirmedFall
                            ? "You confirmed a fall."
                            : "Hazard only · no fall reported."}
                        </Text>
                        {draft.description ? (
                          <Text style={s.body}>{draft.description}</Text>
                        ) : null}
                        {draft.photo ? <SamplePhoto /> : null}
                        <Text style={s.small}>
                          Shared at an approximate place on the community map.
                          This won’t request emergency help or dispatch
                          maintenance.
                        </Text>
                        {error ? (
                          <Text accessibilityRole="alert" style={s.danger}>
                            {error}
                          </Text>
                        ) : null}
                        <Button
                          title={busy ? "Sharing…" : "Share report"}
                          disabled={busy}
                          onPress={publish}
                        />
                      </>
                    )}
                    {step > 1 ? (
                      <Button
                        title="Back"
                        secondary
                        disabled={busy}
                        onPress={() => {
                          setError("");
                          setStep(step - 1);
                        }}
                      />
                    ) : null}
                  </>
                ) : null}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </View>
  );
}
function StatusBadge({ status }: { status: string }) {
  const done = ["completed", "verified"].includes(status);
  return (
    <View style={[s.badge, done ? { backgroundColor: "#eaf4ed" } : null]}>
      <Text style={[s.badgeText, done ? { color: colors.green } : null]}>
        {STATUS[status] || status}
      </Text>
    </View>
  );
}
function PlaceCard({
  place: p,
  onPress,
}: {
  place: Place;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${p.name}, ${p.category}, ${p.falls} confirmed falls, ${p.hazards} hazard-only reports, ${STATUS[p.action.status]}`}
      style={({ pressed }) => [local.placeCard, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={local.placeIcon}>
        <Ionicons
          accessible={false}
          name={
            p.action.status === "verified"
              ? "checkmark-circle-outline"
              : p.category === "Icy stairs"
                ? "snow-outline"
                : p.category === "Pothole"
                  ? "warning-outline"
                  : "footsteps-outline"
          }
          color={p.action.status === "verified" ? colors.green : colors.blue}
          size={23}
        />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={s.h3}>{p.name}</Text>
        <Text style={s.small}>
          {p.category} · {p.area}
        </Text>
        <StatusBadge status={p.action.status} />
        <Text style={s.small}>
          {p.falls} confirmed falls · {p.hazards} hazard-only
        </Text>
      </View>
      <Ionicons
        accessible={false}
        name="chevron-forward"
        size={18}
        color="#76879a"
      />
    </Pressable>
  );
}
function SamplePhoto() {
  return (
    <View
      style={{
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#e8eef6",
      }}
    >
      <Svg
        width="100%"
        height={125}
        viewBox="0 0 300 125"
        accessible
        accessibilityLabel="Synthetic illustration of icy steps"
      >
        <Rect width="300" height="125" fill="#e8eef6" />
        <Circle cx="246" cy="26" r="15" fill="#f9fcff" />
        <Path
          d="M0 105 60 85 110 95 155 53 220 70 300 48V125H0Z"
          fill="#d2dfd5"
        />
        <Path
          d="M100 125V99h28V77h28V55h28V33h28"
          stroke="#7b8fa5"
          strokeWidth="11"
          fill="none"
        />
        <Path
          d="M111 90 203 12m-77 62V44m48-12V1"
          stroke="#52677e"
          strokeWidth="3"
        />
        <Path
          d="M94 94h33m0-22h29m-1-22h30m-2-22h30"
          stroke="#fff"
          strokeWidth="5"
        />
      </Svg>
      <Text style={[s.small, { padding: 10 }]}>
        Sample illustration · synthetic, not a real photo
      </Text>
    </View>
  );
}
const local = StyleSheet.create({
  questionCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    gap: 20,
    boxShadow: "0 12px 48px #29272226",
  },
  question: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "500",
    letterSpacing: -1,
    color: colors.ink,
    textAlign: "center",
  },
  answer: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "500",
    color: colors.ink,
    textAlign: "center",
  },
  hazardChoices: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  hazardChoice: {
    width: "47%",
    flexGrow: 1,
    minHeight: 92,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  choiceText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    textAlign: "center",
    fontWeight: "500",
  },
  fallOverlay: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(35, 33, 29, 0.2)",
  },
  fallCard: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    boxShadow: "0 12px 48px #29272226",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  reportBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
  },
  brand: {
    color: colors.blue,
    fontWeight: "700",
    fontSize: 34,
    letterSpacing: -2,
  },
  brandDivider: { height: 22, width: 1, backgroundColor: "#cdd6e2" },
  brandName: {
    fontSize: 17,
    color: colors.ink,
    fontWeight: "500",
    letterSpacing: -0.4,
  },
  locationIcon: { backgroundColor: "#e8effa", padding: 10, borderRadius: 12 },
  area: { fontWeight: "600", fontSize: 14, color: colors.ink, marginBottom: 3 },
  segment: {
    backgroundColor: "#e9edf3",
    padding: 3,
    borderRadius: 10,
    flexDirection: "row",
  },
  segmentButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  segmentSelected: { backgroundColor: "#fff" },
  filters: { paddingHorizontal: 24, paddingBottom: 18, gap: 8 },
  count: { fontSize: 11, color: colors.muted },
  placeCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 17,
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
  },
  placeIcon: {
    height: 47,
    width: 47,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4fa",
    borderRadius: 13,
  },
  tabbar: {
    paddingTop: 10,
    paddingHorizontal: 25,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: { alignItems: "center", minWidth: 72, minHeight: 51, gap: 5 },
  tabText: { fontSize: 10, fontWeight: "600" },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 35 : 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#e9edf3",
  },
  option: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    minHeight: 52,
  },
  optionSelected: { borderColor: colors.blue, backgroundColor: "#f0f5ff" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  evidence: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 20,
    gap: 20,
  },
  number: { fontSize: 30, fontWeight: "500", color: colors.ink },
  historyRow: { flexDirection: "row", gap: 14, paddingBottom: 14 },
  historyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.blue,
    marginTop: 6,
  },
});
