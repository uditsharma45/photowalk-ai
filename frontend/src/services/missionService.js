const difficultyRank = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

export const missionLibrary = [
  {
    id: "composition-leading-lines",
    creativeDirection: "Composition",
    difficulty: "Beginner",
    title: "Follow the line.",
    description: "Find strong leading lines that guide the eye toward a clear subject.",
    skills: ["leading lines", "visual hierarchy"],
    successCriteria: ["Lines lead toward a subject", "The subject is easy to find"],
  },
  {
    id: "composition-frame-within-frame",
    creativeDirection: "Composition",
    difficulty: "Intermediate",
    title: "Frame a frame.",
    description: "Create a frame within a frame using a doorway, branches, or another found shape.",
    skills: ["framing", "depth"],
    successCriteria: ["A natural frame surrounds the subject", "The frame adds depth"],
  },
  {
    id: "composition-negative-space",
    creativeDirection: "Composition",
    difficulty: "Beginner",
    title: "Leave room to breathe.",
    description: "Use negative space to make one small or simple subject feel intentional.",
    skills: ["negative space", "visual balance"],
    successCriteria: ["Negative space is deliberate", "The subject remains clear"],
  },
  {
    id: "composition-breaking-pattern",
    creativeDirection: "Composition",
    difficulty: "Advanced",
    title: "Break the rhythm.",
    description: "Photograph a repeating pattern with one element that interrupts it.",
    skills: ["patterns", "visual contrast"],
    successCriteria: ["A repeating pattern is visible", "One element breaks the pattern"],
  },
  {
    id: "composition-reflections",
    creativeDirection: "Composition",
    difficulty: "Intermediate",
    title: "Find three reflections.",
    description:
      "Look for reflections in glass, water, metal, or unexpected surfaces. Try to create at least one composition where the reflection is not immediately obvious.",
    skills: ["reflection", "layering", "composition"],
    successCriteria: ["Reflection is visible", "The frame has a clear point of interest"],
  },
  {
    id: "light-three-shadows",
    creativeDirection: "Light & Shadow",
    difficulty: "Beginner",
    title: "Find three different shadows.",
    description:
      "Notice how light shapes the places around you. Look for a hard shadow, a soft one, and a pattern made by light passing through something.",
    skills: ["light observation", "contrast"],
    successCriteria: ["Three distinct shadows are found", "Light and shade are readable"],
  },
  {
    id: "light-backlighting",
    creativeDirection: "Light & Shadow",
    difficulty: "Intermediate",
    title: "Chase the light.",
    description: "Find a subject transformed by strong backlighting and expose with intention.",
    skills: ["backlighting", "silhouette", "exposure"],
    successCriteria: ["Subject is clear", "Backlight shapes the subject", "Composition feels intentional"],
  },
  {
    id: "light-shadow-subject",
    creativeDirection: "Light & Shadow",
    difficulty: "Advanced",
    title: "Let the shadow lead.",
    description: "Find a shadow that becomes the main subject of the photograph.",
    skills: ["shadow as subject", "visual storytelling"],
    successCriteria: ["Shadow is the focal point", "Its source is suggested, not required"],
  },
  {
    id: "light-silhouette",
    creativeDirection: "Light & Shadow",
    difficulty: "Intermediate",
    title: "Find an interesting silhouette.",
    description: "Use a bright background to simplify a subject into a recognizable silhouette.",
    skills: ["silhouette", "shape", "exposure"],
    successCriteria: ["Subject shape is distinct", "Bright and dark areas separate clearly"],
  },
  {
    id: "nature-alive-still-changing",
    creativeDirection: "Nature",
    difficulty: "Beginner",
    title: "Find something alive, something still, and something changing.",
    description:
      "Take your time noticing small details in the natural world. Look for three different rhythms of life, stillness, and change.",
    skills: ["observation", "visual storytelling"],
    successCriteria: ["Three different states of nature are represented"],
  },
  {
    id: "nature-small-world",
    creativeDirection: "Nature",
    difficulty: "Intermediate",
    title: "Make a small world feel vast.",
    description: "Photograph a tiny natural detail so its textures and forms fill the frame.",
    skills: ["close observation", "texture", "scale"],
    successCriteria: ["A small detail is the clear subject", "Texture or scale adds interest"],
  },
  {
    id: "nature-connection",
    creativeDirection: "Nature",
    difficulty: "Advanced",
    title: "Show a quiet connection.",
    description: "Find two natural elements that interact and make that relationship the story.",
    skills: ["visual storytelling", "layering"],
    successCriteria: ["Two elements relate visually", "The relationship is apparent in the frame"],
  },
  {
    id: "street-story",
    creativeDirection: "Street",
    difficulty: "Beginner",
    title: "Find a moment that tells a story without words.",
    description:
      "Look for a small gesture, an arrangement, or a passing moment that hints at a bigger story. Observe respectfully and keep people’s privacy in mind.",
    skills: ["observation", "storytelling", "respectful photography"],
    successCriteria: ["A moment suggests a story", "People's privacy is respected"],
  },
  {
    id: "street-quiet-details",
    creativeDirection: "Street",
    difficulty: "Intermediate",
    title: "Photograph the trace someone left behind.",
    description: "Find an everyday object or detail that hints at a person just out of frame.",
    skills: ["environmental storytelling", "detail"],
    successCriteria: ["A human presence is suggested", "The detail anchors the story"],
  },
  {
    id: "street-layers",
    creativeDirection: "Street",
    difficulty: "Advanced",
    title: "Layer a scene with a clear subject.",
    description: "Use foreground and background details to build a layered street composition.",
    skills: ["layering", "timing", "composition"],
    successCriteria: ["At least two depth layers are visible", "The frame retains a clear subject"],
  },
  {
    id: "architecture-repeating-pattern",
    creativeDirection: "Architecture",
    difficulty: "Beginner",
    title: "Find a repeating pattern created by architecture.",
    description:
      "Look up, down, and across façades for lines, windows, tiles, or shapes that repeat. Try changing your angle to make the rhythm stand out.",
    skills: ["pattern", "geometry", "perspective"],
    successCriteria: ["A repeating architectural form is clear", "The frame has an intentional angle"],
  },
  {
    id: "architecture-scale",
    creativeDirection: "Architecture",
    difficulty: "Intermediate",
    title: "Give a familiar structure a new scale.",
    description: "Use a nearby detail or a small figure to change how large a structure feels.",
    skills: ["scale", "perspective"],
    successCriteria: ["Scale is visually apparent", "Foreground and structure relate"],
  },
  {
    id: "architecture-abstraction",
    creativeDirection: "Architecture",
    difficulty: "Advanced",
    title: "Turn a façade into an abstract study.",
    description: "Use a tight crop, repeated shapes, and light to make a building feel almost abstract.",
    skills: ["abstraction", "cropping", "visual rhythm"],
    successCriteria: ["Architectural source is transformed", "Shape and rhythm carry the frame"],
  },
  {
    id: "abstract-unusual-angle",
    creativeDirection: "Abstract",
    difficulty: "Beginner",
    title: "Change the angle. Change the object.",
    description:
      "Get curious about shape, texture, and scale. Move around a familiar object until it becomes something new in your frame.",
    skills: ["perspective", "shape", "texture"],
    successCriteria: ["An unusual viewpoint is used", "The object reads in a surprising way"],
  },
  {
    id: "abstract-color-shape",
    creativeDirection: "Abstract",
    difficulty: "Intermediate",
    title: "Find a shape hiding in plain sight.",
    description: "Reduce an ordinary scene to bold shapes, edges, and areas of color.",
    skills: ["visual simplification", "shape", "color"],
    successCriteria: ["Main shapes are easy to read", "Unneeded detail is minimized"],
  },
  {
    id: "abstract-ambiguous",
    creativeDirection: "Abstract",
    difficulty: "Advanced",
    title: "Make the familiar hard to name.",
    description: "Create a close, abstract photograph that invites the viewer to guess what it is.",
    skills: ["abstraction", "cropping", "visual curiosity"],
    successCriteria: ["Subject is not immediately obvious", "Texture or form holds attention"],
  },
  {
    id: "reflections-materials",
    creativeDirection: "Reflections",
    difficulty: "Beginner",
    title: "Find reflections in three materials.",
    description: "Look for reflected light in water, glass, and metal—or other surfaces nearby.",
    skills: ["reflection", "observation"],
    successCriteria: ["Three reflective materials are found", "Reflections are visible"],
  },
  {
    id: "reflections-hidden-subject",
    creativeDirection: "Reflections",
    difficulty: "Intermediate",
    title: "Photograph a reflection without its source.",
    description: "Frame a reflection so the object being reflected stays outside the photograph.",
    skills: ["reflection", "framing", "visual storytelling"],
    successCriteria: ["Reflected image is the subject", "Its source is outside the frame"],
  },
  {
    id: "reflections-mystery",
    creativeDirection: "Reflections",
    difficulty: "Advanced",
    title: "Make the reflection a riddle.",
    description: "Compose a reflection that makes the viewer pause to work out what they see.",
    skills: ["reflection", "ambiguity", "composition"],
    successCriteria: ["Reflection is essential to the frame", "The source is not immediately clear"],
  },
];

function normalizeHistory(history) {
  return new Set(
    history.map((mission) => (typeof mission === "string" ? mission : mission.id)),
  );
}

function directionForMission(mission, creativeDirection) {
  return creativeDirection === "Surprise Me"
    ? mission.creativeDirection
    : creativeDirection;
}

export function getMissionForDirection(
  creativeDirection,
  { experience = "Beginner", duration = "15 minutes", history = [] } = {},
) {
  const availableDirections =
    creativeDirection === "Surprise Me"
      ? [...new Set(missionLibrary.map((mission) => mission.creativeDirection))]
      : [creativeDirection];
  const pool = missionLibrary.filter((mission) =>
    availableDirections.includes(mission.creativeDirection),
  );

  if (pool.length === 0) {
    throw new Error(`No mission fixtures found for creative direction: ${creativeDirection}`);
  }

  const usedMissionIds = normalizeHistory(history);
  let candidates = pool.filter((mission) => !usedMissionIds.has(mission.id));
  if (candidates.length === 0) candidates = pool;

  const completedCount = history.filter((entry) => {
    const direction = typeof entry === "string" ? null : entry.creativeDirection;
    return direction && availableDirections.includes(direction);
  }).length;
  const startingRank = difficultyRank[experience] ?? difficultyRank.Beginner;
  const desiredRank = Math.min(2, startingRank + Math.floor(completedCount / 2));
  const bestRankDistance = Math.min(
    ...candidates.map((mission) => Math.abs(difficultyRank[mission.difficulty] - desiredRank)),
  );
  candidates = candidates.filter(
    (mission) => Math.abs(difficultyRank[mission.difficulty] - desiredRank) === bestRankDistance,
  );

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  const missionDirection = directionForMission(selected, creativeDirection);

  return {
    ...selected,
    creativeDirection: selected.creativeDirection,
    focus: missionDirection,
    duration: Number.parseInt(duration, 10) || 15,
  };
}

export function getAvailableMissionCount(creativeDirection) {
  return missionLibrary.filter(
    (mission) =>
      creativeDirection === "Surprise Me" ||
      mission.creativeDirection === creativeDirection,
  ).length;
}
