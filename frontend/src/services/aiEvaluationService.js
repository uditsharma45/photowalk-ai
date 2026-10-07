export const colorHuntScoreWeights = {
  colorMatch: { weight: 0.35, maximum: 35 },
  composition: { weight: 0.25, maximum: 25 },
  creativity: { weight: 0.2, maximum: 20 },
  visualImpact: { weight: 0.15, maximum: 15 },
  technicalQuality: { weight: 0.05, maximum: 5 },
};

export function createWalkEvaluationRequest(mission, photos) {
  return {
    mission: {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      creativeDirection: mission.creativeDirection,
      successCriteria: [...mission.successCriteria],
      skills: [...mission.skills],
    },
    photos: photos.map(({ id, file, name }) => ({ id, file, name })),
  };
}

export function createWalkEvaluationResult() {
  return {
    missionSatisfied: false,
    missionMatch: 0,
    strengths: [],
    improvements: [],
    skillsDemonstrated: [],
    score: 0,
    reasoning: "",
  };
}

export function createColorHuntEvaluation(scores, reasoning = "") {
  const criteria = Object.keys(colorHuntScoreWeights);
  const normalizedScores = Object.fromEntries(
    criteria.map((criterion) => [
      criterion,
      Math.min(
        colorHuntScoreWeights[criterion].maximum,
        Math.max(0, Number(scores[criterion]) || 0),
      ),
    ]),
  );

  return {
    ...normalizedScores,
    totalScore: criteria.reduce((total, criterion) => total + normalizedScores[criterion], 0),
    reasoning,
  };
}

export async function evaluateWalkPhotos() {
  throw new Error("Photo analysis is not available until a vision model is connected.");
}

export async function evaluateColorHuntPhotos() {
  throw new Error("Color Hunt judging is not available until a vision model is connected.");
}
