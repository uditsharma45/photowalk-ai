import { createColorHuntEvaluation } from "./aiEvaluationService.js";

const baseColors = [
  { name: "Blue", hex: "#5d8db8" },
  { name: "Red", hex: "#d4514c" },
  { name: "Green", hex: "#78a66a" },
  { name: "Yellow", hex: "#e3ca55" },
  { name: "Purple", hex: "#9875b5" },
  { name: "Orange", hex: "#e88a3a" },
  { name: "Pink", hex: "#d789a2" },
  { name: "Teal", hex: "#48a9a6" },
  { name: "White", hex: "#e7e4da" },
  { name: "Black", hex: "#252622" },
  { name: "Coral", hex: "#ec776b" },
  { name: "Indigo", hex: "#5867b2" },
  { name: "Lime", hex: "#a6be45" },
  { name: "Cyan", hex: "#53bdd1" },
  { name: "Magenta", hex: "#c75b9b" },
  { name: "Gold", hex: "#c9a244" },
  { name: "Mint", hex: "#75c3a1" },
  { name: "Lavender", hex: "#a69bd2" },
  { name: "Brown", hex: "#9a684c" },
  { name: "Silver", hex: "#aeb7bd" },
];

const scoreFixtures = [
  { colorMatch: 34, composition: 23, creativity: 19, visualImpact: 12, technicalQuality: 4 },
  { colorMatch: 33, composition: 22, creativity: 18, visualImpact: 11, technicalQuality: 3 },
  { colorMatch: 30, composition: 21, creativity: 17, visualImpact: 10, technicalQuality: 3 },
  { colorMatch: 28, composition: 18, creativity: 15, visualImpact: 10, technicalQuality: 3 },
  { colorMatch: 32, composition: 20, creativity: 18, visualImpact: 12, technicalQuality: 4 },
  { colorMatch: 31, composition: 24, creativity: 16, visualImpact: 13, technicalQuality: 4 },
];

const codeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  return Array.from({ length: 5 }, () =>
    codeCharacters[Math.floor(Math.random() * codeCharacters.length)],
  ).join("");
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function generatedColor(index) {
  const hue = (index * 137.508 + 24) % 360;
  const saturation = index % 2 === 0 ? 63 : 72;
  const lightness = index % 3 === 0 ? 54 : 47;
  const chroma = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100);
  const section = hue / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const m = lightness / 100 - chroma / 2;
  const channels =
    section < 1 ? [chroma, x, 0] :
      section < 2 ? [x, chroma, 0] :
        section < 3 ? [0, chroma, x] :
          section < 4 ? [0, x, chroma] :
            section < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const hex = channels
    .map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0"))
    .join("");
  return { name: `Spectrum ${index + 1}`, hex: `#${hex}` };
}

export function createTargetColorPalette(teamCount) {
  return Array.from({ length: teamCount }, (_, index) => baseColors[index] ?? generatedColor(index));
}

function defaultTeamName(index) {
  const letter = String.fromCharCode(65 + (index % 26));
  return `Team ${letter}${index >= 26 ? ` ${Math.floor(index / 26) + 1}` : ""}`;
}

export function createTeamDraft(index) {
  return {
    id: makeId("team"),
    name: defaultTeamName(index),
    leader: { name: "", email: "" },
    members: [],
  };
}

export function getDefaultRewards(teamCount) {
  const places = teamCount >= 5 ? 3 : 1;
  return Array.from({ length: places }, (_, index) => ({
    place: index + 1,
    label: ["1st place", "2nd place", "3rd place"][index],
    reward: "",
  }));
}

function assertValidTeamDrafts(teams, organizerEmail) {
  if (teams.length < 2) throw new Error("A Color Hunt needs at least two competing teams.");
  const emails = new Set([normalizeEmail(organizerEmail)]);
  const teamNames = new Set();
  for (const [index, team] of teams.entries()) {
    if (!team.name.trim()) throw new Error(`Enter a name for Team ${index + 1}.`);
    const normalizedTeamName = team.name.trim().toLocaleLowerCase();
    if (teamNames.has(normalizedTeamName)) {
      throw new Error(`Team names must be unique. Rename ${team.name}.`);
    }
    teamNames.add(normalizedTeamName);
    if (!team.leader.name.trim()) throw new Error(`Enter a team leader for ${team.name}.`);
    if (!normalizeEmail(team.leader.email)) {
      throw new Error(`Enter the leader's email for ${team.name}.`);
    }
    for (const person of [team.leader, ...team.members]) {
      const email = normalizeEmail(person.email);
      if (!person.name.trim() || !email) {
        throw new Error(`Every participant in ${team.name} needs a full name and email.`);
      }
      if (emails.has(email)) throw new Error(`${email} is already assigned to a participant.`);
      emails.add(email);
    }
  }
}

export function createHunt({ organizer, name, location, date, duration, teams, rewards }) {
  const cleanName = String(name ?? "").trim();
  const cleanLocation = String(location ?? "").trim();
  const organizerName = String(organizer?.name ?? "").trim();
  const organizerEmail = normalizeEmail(organizer?.email);
  if (!cleanName) throw new Error("Enter a name for the Color Hunt.");
  if (!cleanLocation) throw new Error("Enter the Hunt location.");
  if (!date) throw new Error("Choose the Hunt date.");
  if (!organizerName || !organizerEmail) throw new Error("Enter the organizer's name and email.");
  if (!Array.isArray(teams) || teams.length < 2) {
    throw new Error("Add at least two teams to this Color Hunt.");
  }
  assertValidTeamDrafts(teams, organizerEmail);

  const id = makeId("hunt");
  const organizerTeamId = teams.some((team) => team.id === organizer.teamId)
    ? organizer.teamId
    : teams[0].id;
  let participantIndex = 0;
  const organizerParticipant = {
    id: `${id}-participant-${participantIndex++}`,
    huntId: id,
    teamId: `${id}-${organizerTeamId}`,
    name: organizerName,
    email: organizerEmail,
    role: "Organizer",
    submitted: false,
    photos: [],
  };
  const participants = [organizerParticipant];
  const createdTeams = teams.map((draft) => {
    const teamId = `${id}-${draft.id}`;
    const participantIds = [
      ...(draft.id === organizerTeamId ? [organizerParticipant.id] : []),
      ...[draft.leader, ...draft.members].map((person, index) => {
        const participant = {
          id: `${id}-participant-${participantIndex++}`,
          huntId: id,
          teamId,
          name: person.name.trim(),
          email: normalizeEmail(person.email),
          role: index === 0 ? "Team Leader" : "Team Member",
          submitted: false,
          photos: [],
        };
        participants.push(participant);
        return participant.id;
      }),
    ];
    return {
      id: teamId,
      huntId: id,
      name: draft.name.trim(),
      participantIds,
      targetColor: null,
      targetHex: null,
      score: null,
      rank: null,
    };
  });

  return {
    id,
    code: makeCode(),
    name: cleanName,
    location: cleanLocation,
    date,
    duration: Number(duration),
    organizer: `${organizerName} · ${organizerEmail}`,
    organizerName,
    participants,
    teams: createdTeams,
    rewards: rewards.filter((reward) => reward.reward.trim()),
    status: "lobby",
    remainingSeconds: Number(duration) * 60,
    createdAt: new Date().toISOString(),
  };
}

export function joinHunt(hunt, code, { name, email, teamId }) {
  if (!hunt) throw new Error("No active Hunt is available in this browser session.");
  if (hunt.status !== "lobby") throw new Error("This Color Hunt has already started.");
  if (String(code).trim().toUpperCase() !== hunt.code) throw new Error("That Hunt Code was not found.");
  const cleanName = String(name ?? "").trim();
  const cleanEmail = normalizeEmail(email);
  const team = hunt.teams.find((entry) => entry.id === teamId);
  if (!cleanName) throw new Error("Enter your full name.");
  if (!cleanEmail) throw new Error("Enter your email address.");
  if (!team) throw new Error("Choose a team in this Hunt.");
  if (hunt.participants.some((participant) => normalizeEmail(participant.email) === cleanEmail)) {
    throw new Error("That email is already registered in this Hunt.");
  }

  const participant = {
    id: makeId(`${hunt.id}-participant`),
    huntId: hunt.id,
    teamId: team.id,
    name: cleanName,
    email: cleanEmail,
    role: "Team Member",
    submitted: false,
    photos: [],
  };
  const updatedHunt = {
    ...hunt,
    participants: [...hunt.participants, participant],
    teams: hunt.teams.map((entry) =>
      entry.id === team.id
        ? { ...entry, participantIds: [...entry.participantIds, participant.id] }
        : entry,
    ),
  };
  return { hunt: updatedHunt, participant };
}

export function assignTeamColors(hunt) {
  const colors = createTargetColorPalette(hunt.teams.length);
  const teams = hunt.teams.map((team, index) => ({
    ...team,
    targetColor: colors[index].name,
    targetHex: colors[index].hex,
  }));
  return {
    ...hunt,
    status: "active",
    startedAt: new Date().toISOString(),
    remainingSeconds: hunt.duration * 60,
    teams,
    participants: hunt.participants.map((participant) => {
      const team = teams.find((entry) => entry.id === participant.teamId);
      return team
        ? { ...participant, targetColor: team.targetColor, targetHex: team.targetHex }
        : participant;
    }),
  };
}

export function createPhotoSubmission(hunt, participant, photo) {
  const team = hunt.teams.find((entry) => entry.id === participant.teamId);
  if (!team) throw new Error("This participant is not assigned to a team.");
  return {
    id: makeId("submission"),
    huntId: hunt.id,
    teamId: team.id,
    participantId: participant.id,
    targetColor: team.targetColor,
    photo,
    timestamp: new Date().toISOString(),
  };
}

function getIndividualEvaluation(participant, index) {
  if (!participant.submitted) return null;
  return createColorHuntEvaluation(
    scoreFixtures[index % scoreFixtures.length],
    `A considered interpretation of ${participant.targetColor ?? "the target color"} anchors the submission.`,
  );
}

function participantsForTeam(hunt, team) {
  return team.participantIds
    .map((participantId) => hunt.participants.find((participant) => participant.id === participantId))
    .filter(Boolean);
}

export function createLiveStandings(hunt) {
  const indexes = new Map(hunt.participants.map((participant, index) => [participant.id, index]));
  return hunt.teams
    .map((team) => {
      const participants = participantsForTeam(hunt, team);
      const submitted = participants
        .filter((participant) => participant.submitted)
        .map((participant) => ({
          participant,
          score: getIndividualEvaluation(participant, indexes.get(participant.id)).totalScore,
        }));
      const score = submitted.length
        ? submitted.reduce((total, entry) => total + entry.score, 0) / submitted.length
        : 0;
      return {
        ...team,
        participants,
        score: Number(score.toFixed(1)),
        submissionCount: submitted.length,
        participantCount: participants.length,
        progress: participants.length ? submitted.length / participants.length : 0,
      };
    })
    .sort((first, second) =>
      second.score - first.score ||
      second.submissionCount - first.submissionCount ||
      first.name.localeCompare(second.name),
    )
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export function createFinalCompetitionResults(hunt) {
  const standings = createLiveStandings(hunt);
  const indexes = new Map(hunt.participants.map((participant, index) => [participant.id, index]));
  const individualStandings = hunt.participants
    .filter((participant) => participant.teamId && participant.submitted)
    .map((participant) => {
      const team = hunt.teams.find((entry) => entry.id === participant.teamId);
      const evaluation = getIndividualEvaluation(participant, indexes.get(participant.id));
      return {
        ...participant,
        targetColor: team?.targetColor,
        scores: evaluation,
        totalScore: evaluation.totalScore,
        bestPhoto: participant.photos?.[0] ?? null,
      };
    });
  const teamStandings = standings.map((team) => {
    const members = individualStandings.filter((participant) => participant.teamId === team.id);
    const strongestParticipant = [...members].sort((first, second) => second.totalScore - first.totalScore)[0];
    return {
      ...team,
      totalScore: team.score,
      individualStandings: members,
      strongestParticipant,
      strongestPhoto: strongestParticipant?.bestPhoto ?? null,
    };
  });
  const winner = teamStandings[0]?.submissionCount ? teamStandings[0] : null;
  return {
    huntId: hunt.id,
    completedAt: hunt.completedAt ?? new Date().toISOString(),
    teamStandings,
    individualStandings,
    winnerTeamId: winner?.id ?? null,
    winnerExplanation: winner
      ? `${winner.name} demonstrated the strongest overall interpretation of ${winner.targetColor}. Their team's submissions showed a compelling color match with a considered variety of photographic perspectives.`
      : "The Hunt ended before any team submitted photographs.",
    rewards: hunt.rewards,
  };
}
