export type Report = {
  id: string;
  placeId: string;
  category: string;
  confirmedFall: boolean;
  description: string;
  photo: boolean;
  source: string;
  at: string;
};
export type Place = {
  id: string;
  name: string;
  area: string;
  category: string;
  description: string;
  x: number;
  y: number;
  falls: number;
  hazards: number;
  reports: Report[];
  action: {
    status: string;
    note: string;
    partner: string;
    history: { status: string; note: string; at: string }[];
  };
};
export type DemoState = {
  places: Place[];
  windowLabel: string;
  reports: Report[];
};
export const API = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/$/, "");
export async function request(
  path = "/state",
  body?: object,
): Promise<DemoState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(API + "/api" + path, {
      signal: controller.signal,
      ...(body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    const value = await response.json();
    if (!response.ok) throw Error(value.error || "Request failed");
    return value;
  } finally {
    clearTimeout(timer);
  }
}
