import { createColorHuntEvaluation } from "./aiEvaluationService.js";
import * as api from "./api.js";

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

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
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

function validateHuntDraft({ organizer, name, location, date, teams }) {
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

  return { cleanName, cleanLocation, organizerName, organizerEmail };
}

const HUNT_STORAGE_KEY = "photowalk_hunt_id";
const PARTICIPANT_STORAGE_KEY = "photowalk_participant_id";

export function storeParticipantSession(huntId, participantId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HUNT_STORAGE_KEY, huntId);
  window.localStorage.setItem(PARTICIPANT_STORAGE_KEY, participantId);
}

function getStoredParticipantId(huntId) {
  if (typeof window === "undefined" || window.localStorage.getItem(HUNT_STORAGE_KEY) !== huntId) {
    return "";
  }
  return window.localStorage.getItem(PARTICIPANT_STORAGE_KEY) ?? "";
}

function colorHex(targetColor) {
  const known = baseColors.find((color) => color.name === targetColor);
  if (known) return known.hex;
  return targetColor?.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? "#8b9389";
}

const TARGET_COLOR_ORDER = ["Blue", "Red", "Green", "Yellow", "Purple", "Orange", "Cyan", "Magenta"];

function targetColorOrder(targetColor) {
  const colorIndex = TARGET_COLOR_ORDER.indexOf(targetColor);
  if (colorIndex >= 0) return colorIndex;
  const generatedIndex = Number(targetColor?.match(/^Color (\d+)/)?.[1]);
  return Number.isFinite(generatedIndex) ? generatedIndex - 1 : TARGET_COLOR_ORDER.length;
}

function mapRole(role) {
  return role === "organizer" ? "Organizer" : role === "leader" ? "Team Leader" : "Team Member";
}

function mapBundle(huntData, teamData, participantData, submissionData, previousHunt, rewards) {
  const submissionsByParticipant = new Map();
  for (const submission of submissionData) {
    const collection = submissionsByParticipant.get(submission.participant_id) ?? [];
    collection.push(submission);
    submissionsByParticipant.set(submission.participant_id, collection);
  }

  const participants = participantData.map((participant) => {
    const previous = previousHunt?.participants.find((entry) => entry.id === participant.id);
    const previousPhotos = previous?.photos ?? [];
    const storedSubmissions = submissionsByParticipant.get(participant.id) ?? [];
    const usedLocalPhotoIds = new Set();
    const unpersistedLocalPhotos = previousPhotos.filter((entry) => !entry.backendSubmissionId);
    const persistedPhotos = storedSubmissions.map((submission) => {
      const matchingLocalPhoto = previousPhotos.find(
        (entry) => entry.backendSubmissionId === submission.id,
      );
      const localPhoto = matchingLocalPhoto ?? unpersistedLocalPhotos.shift();
      if (localPhoto) usedLocalPhotoIds.add(localPhoto.id);
      return localPhoto
        ? {
            ...localPhoto,
            backendSubmissionId: submission.id,
            imageReference: submission.image_reference,
            uploaded: Boolean(submission.image_url),
            photo: {
              ...localPhoto.photo,
              url: submission.image_url
                ? api.resolveApiUrl(submission.image_url)
                : localPhoto.photo.url,
            },
          }
        : {
            id: submission.id,
            backendSubmissionId: submission.id,
            imageReference: submission.image_reference,
            uploaded: Boolean(submission.image_url),
            photo: {
              name: submission.image_url ? "Uploaded photo" : "Upload incomplete",
              url: submission.image_url ? api.resolveApiUrl(submission.image_url) : null,
            },
          };
    });
    const persistedIds = new Set(storedSubmissions.map((submission) => submission.id));
    const pendingPhotos = previousPhotos.filter(
      (entry) => !usedLocalPhotoIds.has(entry.id) &&
        (!entry.backendSubmissionId || !persistedIds.has(entry.backendSubmissionId)),
    );
    return {
      id: participant.id,
      huntId: participant.hunt_id,
      teamId: participant.team_id,
      userId: participant.user_id,
      name: participant.user.name,
      email: participant.user.email,
      role: mapRole(participant.role),
      submitted: storedSubmissions.length > 0 && pendingPhotos.length === 0,
      photos: [...persistedPhotos, ...pendingPhotos],
      targetColor: teamData.find((team) => team.id === participant.team_id)?.target_color ?? null,
    };
  });
  const teams = teamData
    .map((team) => ({
      id: team.id,
      huntId: team.hunt_id,
      name: team.name,
      leaderId: team.leader_id,
      targetColor: team.target_color,
      targetHex: colorHex(team.target_color),
      participantIds: participants
        .filter((participant) => participant.teamId === team.id)
        .map((participant) => participant.id),
    }))
    .sort((first, second) => targetColorOrder(first.targetColor) - targetColorOrder(second.targetColor));
  const storedParticipantId = getStoredParticipantId(huntData.id);
  const activeParticipantId = participants.some(({ id }) => id === storedParticipantId)
    ? storedParticipantId
    : "";

  return {
    id: huntData.id,
    code: huntData.hunt_code,
    name: huntData.name,
    location: huntData.location,
    date: huntData.date,
    duration: huntData.duration_minutes,
    status: huntData.status,
    startedAt: huntData.started_at,
    completedAt: huntData.completed_at,
    createdAt: huntData.created_at,
    organizer: "",
    organizerName: participants.find((participant) => participant.role === "Organizer")?.name ?? "",
    participants,
    teams,
    rewards: rewards ?? previousHunt?.rewards ?? [],
    activeParticipantId,
  };
}

export async function loadHunt(huntId, previousHunt = null) {
  const [hunt, teams, participants, submissions] = await Promise.all([
    api.getHunt(huntId),
    api.getTeams(huntId),
    api.getParticipants(huntId),
    api.getSubmissions(huntId),
  ]);
  return mapBundle(hunt, teams, participants, submissions, previousHunt);
}

export async function loadHuntByCode(code) {
  const hunt = await api.getHuntByCode(code);
  const [teams, participants, submissions] = await Promise.all([
    api.getTeams(hunt.id),
    api.getParticipants(hunt.id),
    api.getSubmissions(hunt.id),
  ]);
  return mapBundle(hunt, teams, participants, submissions, null);
}

export async function createHunt({ organizer, name, location, date, duration, teams, rewards }) {
  const { cleanName, cleanLocation, organizerName, organizerEmail } = validateHuntDraft({
    organizer,
    name,
    location,
    date,
    teams,
  });
  const hunt = await api.createHunt({
    name: cleanName,
    location: cleanLocation,
    date,
    duration_minutes: Number(duration),
  });

  const createdTeams = [];
  for (const teamDraft of teams) {
    createdTeams.push(await api.createTeam(hunt.id, { name: teamDraft.name.trim() }));
  }
  const organizerIndex = teams.findIndex((team) => team.id === organizer.teamId);
  const organizerTeam = createdTeams[organizerIndex] ?? createdTeams[0];
  const organizerParticipant = await api.registerParticipant(hunt.id, {
    user: { name: organizerName, email: organizerEmail },
    role: "organizer",
    team_id: organizerTeam.id,
  });
  for (const [index, teamDraft] of teams.entries()) {
    await api.registerParticipant(hunt.id, {
      user: { name: teamDraft.leader.name.trim(), email: normalizeEmail(teamDraft.leader.email) },
      role: "leader",
      team_id: createdTeams[index].id,
    });
    for (const member of teamDraft.members) {
      await api.registerParticipant(hunt.id, {
        user: { name: member.name.trim(), email: normalizeEmail(member.email) },
        role: "member",
        team_id: createdTeams[index].id,
      });
    }
  }

  storeParticipantSession(hunt.id, organizerParticipant.id);
  return {
    ...(await loadHunt(hunt.id)),
    rewards: rewards.filter((reward) => reward.reward.trim()),
    activeParticipantId: organizerParticipant.id,
  };
}

export async function joinHuntByCode(code, { name, email, teamId }) {
  const hunt = await loadHuntByCode(code);
  if (hunt.status !== "lobby") {
    const storedParticipant = hunt.participants.find(({ id }) => id === hunt.activeParticipantId);
    if (storedParticipant) return { hunt, participant: storedParticipant };
    throw new Error("This Hunt is no longer open for new participants.");
  }
  const cleanEmail = normalizeEmail(email);
  if (hunt.participants.some((participant) => participant.email === cleanEmail)) {
    throw new Error("This email is already registered in this Hunt.");
  }
  const participant = await api.registerParticipant(hunt.id, {
    user: { name: String(name ?? "").trim(), email: cleanEmail },
    role: "member",
    team_id: teamId,
  });
  storeParticipantSession(hunt.id, participant.id);
  return {
    hunt: await loadHunt(hunt.id, hunt),
    participant: {
      id: participant.id,
      huntId: participant.hunt_id,
      teamId: participant.team_id,
      userId: participant.user_id,
      name: participant.user.name,
      email: participant.user.email,
      role: mapRole(participant.role),
      submitted: false,
      photos: [],
    },
  };
}

export async function startCompetition(hunt) {
  await api.startHunt(hunt.id);
  return loadHunt(hunt.id, hunt);
}

export async function completeCompetition(hunt) {
  await api.completeHunt(hunt.id);
  return loadHunt(hunt.id, hunt);
}

export function createSubmissionReference(hunt, participant, reference) {
  return api.createSubmission(hunt.id, {
    participant_id: participant.id,
    team_id: participant.teamId,
    image_reference: reference,
  });
}

export function uploadParticipantPhoto(hunt, participant, photo) {
  const team = hunt.teams.find((entry) => entry.id === participant.teamId);
  if (!team) throw new Error("This participant is not assigned to a team.");
  return api.createSubmissionWithPhoto(hunt.id, {
    participantId: participant.id,
    teamId: participant.teamId,
    file: photo.photo.file,
  });
}

export function uploadExistingParticipantPhoto(submissionId, photo) {
  return api.uploadSubmissionPhoto(submissionId, photo.photo.file);
}

export async function loadLeaderboard(hunt) {
  const leaderboard = await api.getLeaderboard(hunt.id);
  return leaderboard.map((entry) => {
    const team = hunt.teams.find((candidate) => candidate.id === entry.team_id);
    const participantCount = team?.participantIds.length ?? 0;
    const submittedParticipantCount = team
      ? hunt.participants.filter(
          (participant) => participant.teamId === team.id && participant.submitted,
        ).length
      : entry.submission_count;
    return {
      id: entry.team_id,
      teamId: entry.team_id,
      name: entry.team_name,
      targetColor: entry.target_color,
      targetHex: team?.targetHex ?? colorHex(entry.target_color),
      score: entry.average_score,
      totalScore: entry.average_score,
      scorePending: true,
      rank: entry.rank,
      submissionCount: submittedParticipantCount,
      participantCount,
      progress: participantCount ? submittedParticipantCount / participantCount : 0,
      individualStandings: [],
    };
  });
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
