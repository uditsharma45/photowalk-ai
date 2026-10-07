const missionFixtures = {
  Composition: {
    title: "Find three reflections.",
    description:
      "Look for reflections in glass, water, metal, or unexpected surfaces. Try to create at least one composition where the reflection is not immediately obvious.",
  },
  "Light & Shadow": {
    title: "Find three different shadows.",
    description:
      "Notice how light shapes the places around you. Look for a hard shadow, a soft one, and a pattern made by light passing through something.",
  },
  Nature: {
    title: "Find something alive, something still, and something changing.",
    description:
      "Take your time noticing small details in the natural world. Look for three different rhythms of life, stillness, and change.",
  },
  Street: {
    title: "Find a moment that tells a story without words.",
    description:
      "Look for a small gesture, an arrangement, or a passing moment that hints at a bigger story. Observe respectfully and keep people’s privacy in mind.",
  },
  Architecture: {
    title: "Find a repeating pattern created by architecture.",
    description:
      "Look up, down, and across façades for lines, windows, tiles, or shapes that repeat. Try changing your angle to make the rhythm stand out.",
  },
  Abstract: {
    title: "Find an ordinary object that looks completely different from an unusual angle.",
    description:
      "Get curious about shape, texture, and scale. Move around a familiar object until it becomes something new in your frame.",
  },
};

export function getMissionForDirection(creativeDirection) {
  if (creativeDirection === "Surprise Me") {
    const missions = Object.values(missionFixtures);
    return {
      ...missions[Math.floor(Math.random() * missions.length)],
      focus: creativeDirection,
    };
  }

  const mission = missionFixtures[creativeDirection];
  if (!mission) {
    throw new Error(`No mission fixture found for creative direction: ${creativeDirection}`);
  }

  return { ...mission, focus: creativeDirection };
}
