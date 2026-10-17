export const WINDOW = "11–17 October 2026";
export const CATEGORIES = [
  "Icy stairs",
  "Slippery path",
  "Pothole",
  "Other obstacle",
  "Slippery pavement",
  "Uneven surface",
];
export const STATUS = {
  new: "New report",
  reviewed: "Under review",
  assigned: "Maintenance assigned",
  completed: "Maintenance completed",
  verified: "Maintenance verified",
};
export const NEXT = {
  new: "reviewed",
  reviewed: "assigned",
  assigned: "completed",
  completed: "verified",
};
export const PLACES = [
  {
    "id": "stairs",
    "name": "Linnankatu pavement",
    "area": "City centre",
    "category": "Slippery pavement",
    "x": 53,
    "y": 42,
    "description": "Repeated slipping reports on Linnankatu pavement. Inspect and grit the pedestrian surface.",
    "task": "Inspect and grit the pavement"
  },
  {
    "id": "square",
    "name": "Market square approach",
    "area": "Riverside",
    "category": "Slippery pavement",
    "x": 72,
    "y": 73,
    "description": "Repeated reports of a slippery surface on the square’s western approach.",
    "task": "Grit the pedestrian crossing approach"
  },
  {
    "id": "crossing",
    "name": "Linnankatu crossing",
    "area": "City centre",
    "category": "Slippery pavement",
    "x": 63,
    "y": 21,
    "description": "Slippery pavement reported beside the crossing.",
    "task": "Inspect surface and apply grit"
  },
  {
    "id": "path",
    "name": "Riverside path",
    "area": "City centre",
    "category": "Uneven surface",
    "x": 27,
    "y": 68,
    "description": "An uneven paving edge has been reported on the lakeside footpath.",
    "task": "Inspect uneven paving and refer repairs"
  },
  {
    "id": "steps",
    "name": "Riverside steps",
    "area": "City centre",
    "category": "Icy stairs",
    "x": 66,
    "y": 55,
    "description": "A maintenance partner has recorded gritting. Independent verification is still needed.",
    "task": "Remove ice and grit the steps"
  },
  {
    "id": "walkway",
    "name": "Neighbourhood walkway",
    "area": "City centre",
    "category": "Uneven surface",
    "x": 25,
    "y": 28,
    "description": "Two reports describe a raised paving stone.",
    "task": "Inspect and refer pavement repairs"
  }
];
export function initialState() { return {
  "reports": [
    {
      "id": "R-0101",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "simulated trigger, user-confirmed",
      "at": "2026-10-17T14:00:00+03:00"
    },
    {
      "id": "R-0102",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-17T13:00:00+03:00"
    },
    {
      "id": "R-0103",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-17T12:00:00+03:00"
    },
    {
      "id": "R-0104",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-16T11:00:00+03:00"
    },
    {
      "id": "R-0105",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-16T10:00:00+03:00"
    },
    {
      "id": "R-0106",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-16T09:00:00+03:00"
    },
    {
      "id": "R-0107",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T14:00:00+03:00"
    },
    {
      "id": "R-0108",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T13:00:00+03:00"
    },
    {
      "id": "R-0109",
      "placeId": "stairs",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T12:00:00+03:00"
    },
    {
      "id": "R-0201",
      "placeId": "square",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "simulated trigger, user-confirmed",
      "at": "2026-10-16T14:00:00+03:00"
    },
    {
      "id": "R-0202",
      "placeId": "square",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-16T13:00:00+03:00"
    },
    {
      "id": "R-0203",
      "placeId": "square",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-16T12:00:00+03:00"
    },
    {
      "id": "R-0204",
      "placeId": "square",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T11:00:00+03:00"
    },
    {
      "id": "R-0205",
      "placeId": "square",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T10:00:00+03:00"
    },
    {
      "id": "R-0206",
      "placeId": "square",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T09:00:00+03:00"
    },
    {
      "id": "R-0207",
      "placeId": "square",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-14T14:00:00+03:00"
    },
    {
      "id": "R-0301",
      "placeId": "crossing",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "simulated trigger, user-confirmed",
      "at": "2026-10-15T14:00:00+03:00"
    },
    {
      "id": "R-0302",
      "placeId": "crossing",
      "category": "Slippery pavement",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T13:00:00+03:00"
    },
    {
      "id": "R-0303",
      "placeId": "crossing",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-15T12:00:00+03:00"
    },
    {
      "id": "R-0304",
      "placeId": "crossing",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-14T11:00:00+03:00"
    },
    {
      "id": "R-0305",
      "placeId": "crossing",
      "category": "Slippery pavement",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-14T10:00:00+03:00"
    },
    {
      "id": "R-0401",
      "placeId": "path",
      "category": "Uneven surface",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "simulated trigger, user-confirmed",
      "at": "2026-10-14T14:00:00+03:00"
    },
    {
      "id": "R-0402",
      "placeId": "path",
      "category": "Uneven surface",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-14T13:00:00+03:00"
    },
    {
      "id": "R-0403",
      "placeId": "path",
      "category": "Uneven surface",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-14T12:00:00+03:00"
    },
    {
      "id": "R-0404",
      "placeId": "path",
      "category": "Uneven surface",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-13T11:00:00+03:00"
    },
    {
      "id": "R-0501",
      "placeId": "steps",
      "category": "Icy stairs",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "simulated trigger, user-confirmed",
      "at": "2026-10-13T14:00:00+03:00"
    },
    {
      "id": "R-0502",
      "placeId": "steps",
      "category": "Icy stairs",
      "confirmedFall": true,
      "description": "User confirmed a fall and reported the surface condition.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-13T13:00:00+03:00"
    },
    {
      "id": "R-0503",
      "placeId": "steps",
      "category": "Icy stairs",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-13T12:00:00+03:00"
    },
    {
      "id": "R-0601",
      "placeId": "walkway",
      "category": "Uneven surface",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-12T14:00:00+03:00"
    },
    {
      "id": "R-0602",
      "placeId": "walkway",
      "category": "Uneven surface",
      "confirmedFall": false,
      "description": "Hazard reported without a fall.",
      "photo": false,
      "source": "manual",
      "at": "2026-10-12T13:00:00+03:00"
    }
  ],
  "actions": [
    {
      "status": "new",
      "partner": "",
      "history": [
        {
          "status": "new",
          "note": "Initial synthetic record.",
          "time": "17 Oct, 08:30",
          "at": "17 Oct, 08:30"
        }
      ],
      "note": "Initial synthetic record.",
      "placeId": "stairs"
    },
    {
      "status": "reviewed",
      "partner": "",
      "history": [
        {
          "status": "reviewed",
          "note": "Initial synthetic record.",
          "time": "17 Oct, 08:30",
          "at": "17 Oct, 08:30"
        }
      ],
      "note": "Initial synthetic record.",
      "placeId": "square"
    },
    {
      "status": "assigned",
      "partner": "Nordic Care · fictional partner",
      "history": [
        {
          "status": "assigned",
          "note": "Initial synthetic record.",
          "time": "17 Oct, 08:30",
          "at": "17 Oct, 08:30"
        }
      ],
      "note": "Initial synthetic record.",
      "placeId": "crossing"
    },
    {
      "status": "new",
      "partner": "",
      "history": [
        {
          "status": "new",
          "note": "Initial synthetic record.",
          "time": "17 Oct, 08:30",
          "at": "17 Oct, 08:30"
        }
      ],
      "note": "Initial synthetic record.",
      "placeId": "path"
    },
    {
      "status": "completed",
      "partner": "Nordic Care · fictional partner",
      "history": [
        {
          "status": "completed",
          "note": "Partner recorded ice removal and gritting.",
          "time": "17 Oct, 08:30",
          "at": "17 Oct, 08:30"
        }
      ],
      "note": "Partner recorded ice removal and gritting.",
      "placeId": "steps"
    },
    {
      "status": "verified",
      "partner": "Nordic Care · fictional partner",
      "history": [
        {
          "status": "verified",
          "note": "Surface work reviewed in the synthetic scenario.",
          "time": "17 Oct, 08:30",
          "at": "17 Oct, 08:30"
        }
      ],
      "note": "Surface work reviewed in the synthetic scenario.",
      "placeId": "walkway"
    }
  ]
}; }
export function placesFor(state) {
  return PLACES.map((p) => {
    const reports = state.reports.filter((r) => r.placeId === p.id);
    return {
      ...p,
      reports,
      falls: reports.filter((r) => r.confirmedFall).length,
      hazards: reports.filter((r) => !r.confirmedFall).length,
      action: state.actions.find((a) => a.placeId === p.id),
    };
  });
}
export function addReport(state, r) {
  if (state.reports.some((item) => item.id === r.id)) return state;
  if (
    !PLACES.some((p) => p.id === r.placeId) ||
    !CATEGORIES.includes(r.category) ||
    typeof r.confirmedFall !== "boolean"
  )
    throw Error("Check the location and hazard type.");
  return {
    ...state,
    reports: [...state.reports, { ...r, at: "2026-10-17T12:00:00.000Z" }],
    actions: state.actions.map((a) =>
      a.placeId === r.placeId && ["completed", "verified"].includes(a.status)
        ? {
            ...a,
            status: "reviewed",
            history: [
              ...a.history,
              {
                status: "reviewed",
                note: "A new report reopened review after maintenance.",
                at: "2026-10-17T12:00:00.000Z",
              },
            ],
          }
        : a,
    ),
  };
}
export function maintenance(state, placeId, note) {
  if (!note.trim()) throw Error("Add a note explaining the update.");
  return {
    ...state,
    actions: state.actions.map((a) => {
      if (a.placeId !== placeId) return a;
      const status = NEXT[a.status];
      if (!status) throw Error("Maintenance already verified.");
      return {
        ...a,
        status,
        partner: status === "assigned" ? "Nordic Care (fictional)" : a.partner,
        note: note.trim(),
        history: [
          ...a.history,
          { status, note: note.trim(), at: "2026-10-17T12:00:00.000Z" },
        ],
      };
    }),
  };
}
