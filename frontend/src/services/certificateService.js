function normalizeToken(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findTeamForParticipant(participant, hunt) {
  if (participant.team && typeof participant.team === "object") {
    return participant.team;
  }

  const teamId = participant.teamId;
  return hunt.teams?.find((team) => team.id === teamId) ?? null;
}

function findTeamStanding(team, results) {
  if (!team) return null;
  const standings = results.teamStandings ?? results.teamLeaderboard ?? [];
  return standings.find((entry) => entry.id === team.id || entry.teamId === team.id) ?? null;
}

function getParticipantRole(participant, team) {
  if (participant.role) return participant.role;
  if (team) return participant.isLeader ? "Team Leader" : "Team Member";
  return participant.isLeader ? "Hunt Leader" : "Participant";
}

function getTeamRank(team, results) {
  if (!team) return null;

  const standings = results.teamStandings ?? results.teamLeaderboard ?? [];
  const rankedTeam = findTeamStanding(team, results);
  if (rankedTeam?.rank) return rankedTeam.rank;
  if (rankedTeam) return standings.indexOf(rankedTeam) + 1;
  if (results.winnerTeamId === team.id || team.isWinner) return 1;
  return null;
}

export function generateCertificateAchievement(participant, team, hunt, results) {
  const teamRank = getTeamRank(team, results);
  const isWinner =
    Boolean(team) &&
    (teamRank === 1 || results.winnerTeamId === team.id || team.isWinner === true);
  const role = getParticipantRole(participant, team);
  const score = Number(participant.totalScore ?? participant.score ?? 0);

  if (isWinner) {
    return "Recognized as a member of the winning team for making a significant contribution to an outstanding collection of photographs.";
  }
  if (role === "Team Leader") {
    return "Recognized for guiding the team's creative approach and bringing a distinctive perspective to the hunt.";
  }
  if (score >= 85) {
    return "Recognized for finding an unexpected and visually compelling interpretation of the assigned color.";
  }
  if (score >= 70) {
    return "Recognized for contributing creative compositions that strengthened the team's final collection.";
  }
  return "Recognized for bringing a distinctive perspective to the team's interpretation of color.";
}

export function createParticipantCertificate(
  participant,
  hunt,
  results = {},
  certificateNumber = null,
) {
  const team = findTeamForParticipant(participant, hunt);
  const teamRank = getTeamRank(team, results);
  const teamStandings = results.teamStandings ?? results.teamLeaderboard ?? [];
  const winnerTeamId =
    results.winnerTeamId ??
    teamStandings.find((entry) => entry.rank === 1)?.id ??
    teamStandings[0]?.teamId;
  const isWinner =
    Boolean(team) &&
    (teamRank === 1 || team.id === winnerTeamId || team.isWinner === true);
  const completedAt = hunt.date
    ? new Date(`${hunt.date}T12:00:00`).toISOString()
    : results.completedAt ?? hunt.completedAt ?? new Date().toISOString();
  const date = new Date(completedAt);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = safeDate.getFullYear();
  const huntName = hunt.name ?? hunt.title ?? "Color Hunt";
  const location =
    hunt.location?.name ??
    hunt.location?.address ??
    (typeof hunt.location === "string" ? hunt.location : "Location not provided");
  const teamName = team?.name ?? "Individual entry";
  const participantRole = getParticipantRole(participant, team);
  const targetColor =
    participant.targetColor ?? team?.targetColor ?? hunt.targetColor ?? "Unassigned";
  const achievementInput = {
    participant,
    team,
    hunt,
    targetColor,
    individualScore: participant.totalScore ?? participant.score ?? null,
    teamScore: team?.totalScore ?? team?.score ?? null,
    teamRank,
    isWinner,
    bestPhoto: participant.bestPhoto ?? participant.photos?.[0] ?? null,
    achievement: "",
  };
  const resultsForAchievement = {
    ...results,
    ...achievementInput,
    teamRank,
    winnerTeamId,
    isWinner,
  };
  const certificateIdParts = [
    "PWA",
    year,
    normalizeToken(hunt.code ?? hunt.id ?? huntName).slice(0, 12),
    normalizeToken(team?.name ?? "SOLO").slice(0, 12),
    certificateNumber === null
      ? normalizeToken(participant.id ?? participant.name).slice(-12)
      : `P${String(certificateNumber).padStart(2, "0")}`,
  ].filter(Boolean);

  return {
    id: certificateIdParts.join("-"),
    participantId: participant.id,
    participantName: participant.name,
    huntName,
    location,
    date: new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(safeDate),
    teamId: team?.id ?? null,
    teamName,
    targetColor,
    role: participantRole,
    achievement: generateCertificateAchievement(
      participant,
      team,
      hunt,
      resultsForAchievement,
    ),
    isWinner,
    individualScore: achievementInput.individualScore,
    teamScore:
      achievementInput.teamScore ?? findTeamStanding(team, results)?.totalScore ?? null,
    teamRank,
    bestPhoto: achievementInput.bestPhoto,
    awards: [...(participant.awards ?? [])],
    organizer: hunt.organizer ?? "PhotoWalk AI · Community Challenge",
    organizerName: hunt.organizerName ?? "PhotoWalk AI",
  };
}

export function createParticipantCertificates(hunt, results = {}) {
  const individualStandings = results.individualStandings ?? results.leaderboard ?? [];
  const participants = hunt.participants ?? hunt.players ?? [];

  return participants
    .filter((participant) => participant.submitted)
    .map((participant, index) => {
      const standing = individualStandings.find(
        (entry) => entry.id === participant.id || entry.participantId === participant.id,
      );
      return createParticipantCertificate(
        { ...participant, ...standing },
        hunt,
        results,
        index + 1,
      );
    });
}
