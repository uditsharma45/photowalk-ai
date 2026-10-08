import { useEffect, useMemo, useRef, useState } from "react";
import {
  createFinalCompetitionResults,
  createHunt,
  createPhotoSubmission,
  createTeamDraft,
  completeCompetition,
  getDefaultRewards,
  joinHuntByCode,
  loadHunt,
  loadHuntByCode,
  loadLeaderboard,
  startCompetition as startCompetitionRequest,
  storeParticipantSession,
  uploadExistingParticipantPhoto,
  uploadParticipantPhoto,
} from "../services/colorHuntService.js";
import { checkApiHealth, resolveApiUrl } from "../services/api.js";
import { createParticipantCertificates } from "../services/certificateService.js";
import CertificateView from "./CertificateView.jsx";

function localDateString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function parseServerTimestamp(value) {
  if (typeof value !== "string") return Number.NaN;
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(timestamp).getTime();
}

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

function FlowHeader({ onBack, backLabel = "Back" }) {
  return (
    <header className="flow-header">
      <a className="wordmark" href="#top" aria-label="PhotoWalk AI home">
        <span className="wordmark-icon" aria-hidden="true">P</span>
        <span>PHOTO WALK <span className="wordmark-ai">AI</span></span>
      </a>
      <button className="flow-back" onClick={onBack} type="button">
        <span aria-hidden="true">←</span> {backLabel}
      </button>
    </header>
  );
}

function ColorHuntHome({ onCreate, onJoin, onBack, backendAvailable }) {
  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} backLabel="Photo Walk" />
      <main className="hunt-home hunt-page" id="main-content">
        <SectionLabel>A TEAM PHOTOGRAPHY GAME</SectionLabel>
        <p className="hunt-kicker">PHOTO WALK AI PRESENTS</p>
        <h1>COLOR HUNT</h1>
        <p className="hunt-intro">
          One location, many teams, and a different color challenge for every team.
        </p>
        <div className="hunt-home-actions">
          <button className="continue-button" onClick={onCreate} type="button">
            Create a hunt <span aria-hidden="true">↗</span>
          </button>
          <button className="text-button hunt-join-link" onClick={onJoin} type="button">
            Join a hunt <span aria-hidden="true">→</span>
          </button>
        </div>
        <p className="hunt-local-note">
          {backendAvailable === false
            ? "Backend unavailable. Start the FastAPI server to use multiplayer features."
            : "Hunts, teams, participants and submissions are stored by the Hunt server."}
        </p>
      </main>
    </div>
  );
}

function ParticipantFields({ person, label, onChange }) {
  return (
    <div className="hunt-participant-fields">
      <label>
        {label} name
        <input
          autoComplete="name"
          maxLength={80}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Full name"
          required
          value={person.name}
        />
      </label>
      <label>
        {label} email
        <input
          autoComplete="email"
          maxLength={254}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="name@example.com"
          required
          type="email"
          value={person.email}
        />
      </label>
    </div>
  );
}

function CreateHunt({
  organizer,
  setOrganizer,
  name,
  setName,
  location,
  setLocation,
  date,
  setDate,
  duration,
  setDuration,
  teams,
  setTeams,
  teamCountValue,
  setTeamCountValue,
  rewards,
  setRewards,
  rewardPlaces,
  setRewardPlaces,
  rewardPlacesCustomized,
  setRewardPlacesCustomized,
  onCreate,
  onBack,
  error,
  pending,
}) {
  function updateTeam(teamId, update) {
    setTeams((current) => current.map((team) => team.id === teamId ? update(team) : team));
  }

  function updatePerson(teamId, memberId, key, value) {
    updateTeam(teamId, (team) => ({
      ...team,
      ...(memberId === "leader"
        ? { leader: { ...team.leader, [key]: value } }
        : {
            members: team.members.map((member) =>
              member.id === memberId ? { ...member, [key]: value } : member,
            ),
          }),
    }));
  }

  function setTeamCount(value) {
    const count = Math.max(2, Number.parseInt(value, 10) || 2);
    setTeamCountValue(String(count));
    setTeams((current) => {
      if (count < current.length) return current.slice(0, count);
      return [
        ...current,
        ...Array.from({ length: count - current.length }, (_, offset) =>
          createTeamDraft(current.length + offset),
        ),
      ];
    });
    const nextRewardCount = rewardPlacesCustomized
      ? Math.min(rewardPlaces, Math.min(count, 3))
      : count >= 5 ? 3 : 1;
    setRewardPlaces(nextRewardCount);
    setRewards((current) =>
      Array.from({ length: nextRewardCount }, (_, index) =>
        current[index] ?? {
          place: index + 1,
          label: ["1st place", "2nd place", "3rd place"][index],
          reward: "",
        },
      ),
    );
  }

  function updateRewardCount(count) {
    setRewardPlacesCustomized(true);
    setRewardPlaces(count);
    setRewards((current) =>
      Array.from({ length: count }, (_, index) =>
        current[index] ?? { place: index + 1, label: ["1st place", "2nd place", "3rd place"][index], reward: "" },
      ),
    );
  }

  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} />
      <main className="hunt-form-page hunt-page" id="main-content">
        <SectionLabel>ONE EVENT · MANY TEAMS</SectionLabel>
        <h1>Create a Color Hunt.</h1>
        <p className="hunt-intro">Set the place and pace, then bring your teams together.</p>
        <form
          className="hunt-form hunt-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate();
          }}
        >
          <fieldset className="hunt-event-fields">
            <legend>THE HUNT</legend>
            <ParticipantFields
              label="Organizer"
              onChange={(key, value) => setOrganizer((current) => ({ ...current, [key]: value }))}
              person={organizer}
            />
            <label>
              Organizer team
              <select
                onChange={(event) => setOrganizer((current) => ({ ...current, teamId: event.target.value }))}
                required
                value={teams.some((team) => team.id === organizer.teamId) ? organizer.teamId : teams[0]?.id ?? ""}
              >
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <label>
              Challenge name
              <input maxLength={80} onChange={(event) => setName(event.target.value)} required value={name} />
            </label>
            <label>
              Location
              <input maxLength={120} onChange={(event) => setLocation(event.target.value)} required value={location} />
            </label>
            <div className="hunt-form-row">
              <label>
                Date
                <input min={localDateString()} onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
              </label>
              <label>
                Duration
                <select onChange={(event) => setDuration(event.target.value)} value={duration}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </label>
            </div>
          </fieldset>

          <section className="hunt-team-builder" aria-labelledby="team-builder-title">
            <div className="hunt-team-builder-heading">
              <div>
                <p className="hunt-field-label">THE COMPETING UNITS</p>
                <h2 id="team-builder-title">Build your teams.</h2>
              </div>
              <label className="team-count-label">
                Number of teams
                <input
                  min="2"
                  onBlur={() => setTeamCount(teamCountValue)}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    setTeamCountValue(rawValue);
                    const parsed = Number.parseInt(rawValue, 10);
                    if (parsed >= 2) {
                      const count = parsed;
                      setTeams((current) => {
                        if (count < current.length) return current.slice(0, count);
                        return [
                          ...current,
                          ...Array.from({ length: count - current.length }, (_, offset) =>
                            createTeamDraft(current.length + offset),
                          ),
                        ];
                      });
                      const rewardCount = rewardPlacesCustomized
                        ? Math.min(rewardPlaces, Math.min(count, 3))
                        : count >= 5 ? 3 : 1;
                      setRewardPlaces(rewardCount);
                      setRewards((current) =>
                        Array.from({ length: rewardCount }, (_, index) =>
                          current[index] ?? {
                            place: index + 1,
                            label: ["1st place", "2nd place", "3rd place"][index],
                            reward: "",
                          },
                        ),
                      );
                    }
                  }}
                  type="number"
                  value={teamCountValue}
                />
              </label>
            </div>
            <p className="hunt-form-hint">Every team needs a unique name and one leader. Add the rest of the team below.</p>
            <div className="hunt-team-drafts">
              {teams.map((team, index) => (
                <fieldset className="hunt-team-draft" key={team.id}>
                  <legend>TEAM {String(index + 1).padStart(2, "0")}</legend>
                  <label>
                    Team name
                    <input
                      maxLength={48}
                      onChange={(event) => updateTeam(team.id, (current) => ({ ...current, name: event.target.value }))}
                      required
                      value={team.name}
                    />
                  </label>
                  <ParticipantFields
                    label="Team leader"
                    onChange={(key, value) => updatePerson(team.id, "leader", key, value)}
                    person={team.leader}
                  />
                  <div className="hunt-member-heading">
                    <span>Team members · {team.members.length}</span>
                    <button
                      className="text-button"
                      onClick={() => updateTeam(team.id, (current) => ({
                        ...current,
                        members: [...current.members, { id: `${team.id}-member-${Date.now()}`, name: "", email: "" }],
                      }))}
                      type="button"
                    >
                      + Add member
                    </button>
                  </div>
                  {team.members.map((member) => (
                    <div className="hunt-member-row" key={member.id}>
                      <ParticipantFields
                        label="Team member"
                        onChange={(key, value) => updatePerson(team.id, member.id, key, value)}
                        person={member}
                      />
                      <button
                        aria-label={`Remove ${member.name || "team member"} from ${team.name}`}
                        className="photo-remove-button hunt-remove-member"
                        onClick={() => updateTeam(team.id, (current) => ({
                          ...current,
                          members: current.members.filter((entry) => entry.id !== member.id),
                        }))}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </fieldset>
              ))}
            </div>
            <button className="text-button add-team-button" onClick={() => setTeamCount(teams.length + 1)} type="button">
              + Add another team
            </button>
          </section>

          <section className="hunt-reward-builder" aria-labelledby="reward-builder-title">
            <div className="hunt-team-builder-heading">
              <div>
                <p className="hunt-field-label">RECOGNITION</p>
                <h2 id="reward-builder-title">Set the rewards.</h2>
              </div>
              <label className="team-count-label">
                Reward places
                <select onChange={(event) => updateRewardCount(Number(event.target.value))} value={rewardPlaces}>
                  {Array.from({ length: Math.min(3, teams.length) }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="hunt-form-hint">Defaults to 1st place for 2–4 teams and the top 3 for 5+ teams. Choose a custom number of places if you prefer.</p>
            <div className="hunt-rewards-grid">
              {rewards.slice(0, rewardPlaces).map((reward, index) => (
                <label key={reward.place}>
                  {reward.label} reward
                  <input
                    maxLength={100}
                    onChange={(event) => setRewards((current) => current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, reward: event.target.value } : item,
                    ))}
                    placeholder="Optional reward"
                    value={reward.reward}
                  />
                </label>
              ))}
            </div>
          </section>

          {error && <p className="hunt-error" role="alert">{error}</p>}
          <button className="continue-button" disabled={pending} type="submit">
            {pending ? "Creating Hunt..." : "Create shared Hunt"} <span aria-hidden="true">↗</span>
          </button>
        </form>
      </main>
    </div>
  );
}

function JoinHunt({
  hunt,
  code,
  setCode,
  person,
  setPerson,
  teamId,
  setTeamId,
  error,
  pending,
  onJoin,
  onBack,
}) {
  const matchingHunt = hunt?.code === code.trim().toUpperCase() ? hunt : null;
  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} />
      <main className="hunt-form-page hunt-page" id="main-content">
        <SectionLabel>JOIN THE SHARED COMPETITION</SectionLabel>
        <p className="hunt-kicker">{matchingHunt?.location ?? "COLOR HUNT"}</p>
        <h1>{matchingHunt?.name ?? "Join a Color Hunt."}</h1>
        <p className="hunt-intro">Join one of the teams competing in this event.</p>
        <form className="hunt-form" onSubmit={(event) => { event.preventDefault(); onJoin(); }}>
          <label>
            Hunt code
            <input autoCapitalize="characters" maxLength={6} onChange={(event) => setCode(event.target.value.toUpperCase())} required value={code} />
          </label>
          {matchingHunt && (
            <>
              <div className="hunt-details" aria-label="Hunt details">
                <div><dt>Location</dt><dd>{matchingHunt.location}</dd></div>
                <div><dt>Duration</dt><dd>{matchingHunt.duration} minutes</dd></div>
                <div><dt>Status</dt><dd>{matchingHunt.status}</dd></div>
              </div>
              <ul className="shared-hunt-teams">
                {matchingHunt.teams.map((team) => (
                  <li key={team.id}>
                    <strong>{team.name}</strong>
                    <span className="hunt-team-color">
                      <i aria-hidden="true" style={{ "--target-color": team.targetHex }} />
                      {team.targetColor}
                    </span>
                  </li>
                ))}
              </ul>
              <ParticipantFields
                label="Participant"
                onChange={(key, value) => setPerson((current) => ({ ...current, [key]: value }))}
                person={person}
              />
              <label>
                Choose your team
                <select onChange={(event) => setTeamId(event.target.value)} required value={teamId}>
                  <option value="">Select a team</option>
                  {matchingHunt.teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name} · {team.participantIds.length} players</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {error && <p className="hunt-error" role="alert">{error}</p>}
          <button className="continue-button" disabled={pending} type="submit">
            {pending ? (matchingHunt ? "Joining Hunt..." : "Loading Hunt...") : (matchingHunt ? "Join this Hunt" : "Find Hunt")} <span aria-hidden="true">↗</span>
          </button>
        </form>
      </main>
    </div>
  );
}

function Rewards({ rewards }) {
  if (!rewards.length) return null;
  return (
    <section className="hunt-rewards" aria-label="Hunt rewards">
      <h2>REWARDS</h2>
      <ol>
        {rewards.map((reward) => (
          <li key={reward.place}>
            <span>{reward.label}</span>
            <strong>{reward.reward}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HuntLobby({
  hunt,
  onJoin,
  onStart,
  onBack,
  onRefresh,
  participantId,
  error,
  refreshPending,
  startPending,
}) {
  const participants = hunt.participants.filter((participant) => participant.teamId);
  const activeParticipant = participants.find((participant) => participant.id === participantId);
  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} />
      <main className="hunt-lobby-page hunt-page" id="main-content">
        <SectionLabel>THE COMPETITION IS GATHERING</SectionLabel>
        <p className="hunt-kicker">{hunt.location.toUpperCase()}</p>
        <h1>{hunt.name}</h1>
        <p className="hunt-intro">One shared event. Team colors, participants and status are synced with the Hunt server.</p>
        <dl className="hunt-details">
          <div><dt>Teams</dt><dd>{hunt.teams.length}</dd></div>
          <div><dt>Players</dt><dd>{participants.length}</dd></div>
          <div><dt>Duration</dt><dd>{hunt.duration} minutes</dd></div>
          <div><dt>Date</dt><dd>{new Date(`${hunt.date}T12:00:00`).toLocaleDateString()}</dd></div>
          <div><dt>Location</dt><dd>{hunt.location}</dd></div>
          <div><dt>Hunt code</dt><dd className="hunt-code">{hunt.code}</dd></div>
          <div><dt>Status</dt><dd>{hunt.status}</dd></div>
        </dl>
        <section className="shared-hunt-teams" aria-labelledby="shared-teams-title">
          <div className="hunt-team-heading">
            <h2 id="shared-teams-title">ALL COMPETING TEAMS</h2>
            <span>{hunt.teams.length} teams · {participants.length} players</span>
          </div>
          <ul>
            {hunt.teams.map((team, index) => {
              const teamPlayers = team.participantIds
                .map((id) => hunt.participants.find((participant) => participant.id === id))
                .filter(Boolean);
              return (
                <li key={team.id}>
                  <span className="hunt-team-number">{String(index + 1).padStart(2, "0")}</span>
                  <div className="shared-team-info">
                    <strong>{team.name}</strong>
                    <span>
                      {teamPlayers.length} players · {teamPlayers.map((player) => {
                        const roleLabel = player.role === "Team Leader"
                          ? " (leader)"
                          : player.role === "Organizer" ? " (organizer)" : "";
                        return `${player.name}${roleLabel}`;
                      }).join(", ")}
                    </span>
                  </div>
                  <span className="hunt-team-color">
                    {team.targetColor ? (
                      <>
                        <i aria-hidden="true" style={{ "--target-color": team.targetHex }} />
                        {team.targetColor}
                      </>
                    ) : "COLOR AT START"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <Rewards rewards={hunt.rewards} />
        <p className="hunt-local-note">
          {activeParticipant
            ? `You are registered in ${hunt.teams.find((team) => team.id === activeParticipant.teamId)?.name ?? "this Hunt"}.`
            : "Select Join as participant to register for this Hunt."}
        </p>
        {error && <p className="hunt-error" role="alert">{error}</p>}
        <div className="hunt-lobby-actions">
          {hunt.status === "lobby" && (
            <button className="text-button" onClick={onJoin} type="button">Join as participant →</button>
          )}
          <button className="text-button" disabled={refreshPending || startPending} onClick={onRefresh} type="button">
            {refreshPending ? "Refreshing Hunt..." : "Refresh Hunt"}
          </button>
          {hunt.status === "lobby" && activeParticipant?.role === "Organizer" && (
            <button className="continue-button" disabled={refreshPending || startPending} onClick={onStart} type="button">
              {startPending ? "Starting Hunt..." : "Start Hunt"} <span aria-hidden="true">↗</span>
            </button>
          )}
          {hunt.status === "active" && <p className="hunt-local-note">This Hunt is already in progress.</p>}
        </div>
      </main>
    </div>
  );
}

function TeamStandings({ standings, live = false }) {
  return (
    <section className={`competition-standings${live ? " is-live" : ""}`} aria-labelledby={live ? "live-standings-title" : "final-standings-title"}>
      <div className="competition-standings-heading">
        <h2 id={live ? "live-standings-title" : "final-standings-title"}>
          {live ? "LIVE STANDINGS" : "FINAL LEADERBOARD"}
        </h2>
        {live && <span><i aria-hidden="true" /> LIVE</span>}
      </div>
      <ol>
        {standings.map((team) => (
          <li key={team.id}>
            <div className="standing-place">{team.rank <= 3 ? ["🥇", "🥈", "🥉"][team.rank - 1] : `${team.rank}.`}</div>
            <i aria-label={`Target ${team.targetColor}`} className="standing-color" style={{ "--target-color": team.targetHex }} />
            <div className="standing-team">
              <strong>{team.name}</strong>
              <span>{team.targetColor} · {team.submissionCount} / {team.participantCount} submissions</span>
              <span className="standing-progress"><i style={{ width: `${Math.round(team.progress * 100)}%` }} /></span>
            </div>
            <strong className="standing-score">{team.scorePending ? "PENDING" : team.score.toFixed(1)}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HuntCountdown({ hunt, participant, team, remainingSeconds, standings, onParticipantChange, onSubmitPhotos, onEnd }) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return (
    <main className="color-hunt-active hunt-page multi-team-active" id="main-content">
      <div className="hunt-live-label">
        <SectionLabel>{hunt.name.toUpperCase()}</SectionLabel>
        <span><i /> HUNT IN PROGRESS</span>
      </div>
      <p className="hunt-event-location">{hunt.location}</p>
      <label className="active-participant-picker">
        PARTICIPATING AS
        <select onChange={(event) => onParticipantChange(event.target.value)} value={participant.id}>
          {hunt.participants.filter((person) => person.teamId).map((person) => (
            <option key={person.id} value={person.id}>{person.name} · {hunt.teams.find((entry) => entry.id === person.teamId)?.name}</option>
          ))}
        </select>
      </label>
      <p className="hunt-field-label">YOUR TEAM</p>
      <h1 className="active-team-name">{team.name}</h1>
      <p className="hunt-field-label">YOUR TARGET</p>
      <h2 className="active-target-name">{team.targetColor}</h2>
      <span aria-hidden="true" className="hunt-color-swatch hunt-large-swatch" style={{ "--target-color": team.targetHex }} />
      <p className="hunt-intro">Find interesting subjects containing {team.targetColor.toLowerCase()}.</p>
      <p className="hunt-field-label hunt-time-label">TIME REMAINING</p>
      <p aria-label={`Time remaining ${minutes} minutes ${seconds} seconds`} aria-live="off" className="hunt-timer" role="timer">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
      <TeamStandings live standings={standings} />
      <p className="hunt-fairness-note">Team progress is visible. Other teams' photos and individual analysis stay hidden until the Hunt ends.</p>
      <p className="put-phone-away">Put your phone away and explore.</p>
      <div className="active-hunt-actions">
        <button className="continue-button" onClick={onSubmitPhotos} type="button">Submit photos <span aria-hidden="true">↗</span></button>
        <button className="end-walk-button" onClick={onEnd} type="button">End Hunt</button>
      </div>
    </main>
  );
}

function HuntSubmissions({
  hunt,
  activeParticipantId,
  setActiveParticipantId,
  onAddFiles,
  onRemovePhoto,
  onSubmit,
  onFinalize,
  onReturnToHunt,
  error,
  pending,
  canReturnToHunt,
}) {
  const inputRef = useRef(null);
  const participant = hunt.participants.find((entry) => entry.id === activeParticipantId) ?? hunt.participants.find((entry) => entry.teamId);
  const team = hunt.teams.find((entry) => entry.id === participant?.teamId);
  const submissions = participant?.photos ?? [];
  const submittedCount = hunt.participants.filter((entry) => entry.teamId && entry.submitted).length;
  const allSubmitted = hunt.participants.filter((entry) => entry.teamId).every((entry) => entry.submitted);

  function handleFiles(event) {
    onAddFiles(participant.id, event.target.files);
    event.target.value = "";
  }

  return (
    <div className="walk-flow">
      <FlowHeader onBack={onReturnToHunt} backLabel={canReturnToHunt ? "Return to Hunt" : "Hunt closed"} />
      <main className="hunt-submit-page hunt-page" id="main-content">
        <SectionLabel>INDIVIDUAL PARTICIPANT SUBMISSIONS</SectionLabel>
        <p className="hunt-kicker">{hunt.name.toUpperCase()} · {hunt.location.toUpperCase()}</p>
        <h1>Bring back your best frame.</h1>
        <p className="hunt-intro">Each participant submits independently for their team's assigned color.</p>
        <label className="active-participant-picker submission-participant-picker">
          PARTICIPANT
          <select disabled={pending} onChange={(event) => setActiveParticipantId(event.target.value)} value={participant?.id ?? ""}>
            {hunt.participants.filter((person) => person.teamId).map((person) => (
              <option disabled={person.submitted} key={person.id} value={person.id}>
                {person.name} · {hunt.teams.find((entry) => entry.id === person.teamId)?.name}{person.submitted ? " · SUBMITTED" : ""}
              </option>
            ))}
          </select>
        </label>
        {participant && team && (
          <div className="submission-person-context">
            <span>{participant.name} · {participant.role}</span>
            <strong><i style={{ "--target-color": team.targetHex }} /> {team.name} · {team.targetColor}</strong>
          </div>
        )}
        <section aria-labelledby="submitting-as-title" className="submission-editor">
          <h2 id="submitting-as-title">{submissions.length} / 3 PHOTOS SELECTED</h2>
          <div className="hunt-photo-grid">
            {submissions.map((submission) => (
              <figure className="hunt-photo-thumb" key={submission.id}>
                {submission.photo.url
                  ? <img src={submission.photo.url} alt={`Submission by ${participant.name} for ${team.targetColor}`} />
                  : <figcaption>{submission.photo.name}</figcaption>}
                {!submission.uploaded && (
                  <button aria-label={`Remove ${submission.photo.name}`} className="photo-remove-button" onClick={() => onRemovePhoto(participant.id, submission.id)} type="button">×</button>
                )}
                {submission.uploaded && (
                  <figcaption className="visually-hidden">Uploaded successfully</figcaption>
                )}
              </figure>
            ))}
            {submissions.length < 3 && !participant.submitted && (
              <div className="photo-add-control">
                <input
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="visually-hidden"
                  capture="environment"
                  id="hunt-photos"
                  multiple
                  disabled={pending}
                  onChange={handleFiles}
                  ref={inputRef}
                  type="file"
                />
                <label className="photo-add-label" htmlFor="hunt-photos">
                  <span className="photo-add-icon" aria-hidden="true">+</span>
                  <span>ADD PHOTOS</span>
                </label>
              </div>
            )}
          </div>
          {error && <p className="hunt-error" role="alert">{error}</p>}
          <button className="continue-button submit-player-button" disabled={!submissions.length || participant.submitted || pending} onClick={() => onSubmit(participant.id)} type="button">
            {pending ? "Submitting..." : participant.submitted ? "Submission complete" : "Submit my photos"} <span aria-hidden="true">↗</span>
          </button>
        </section>
        <div className="submission-progress">
          {submittedCount} / {hunt.participants.filter((entry) => entry.teamId).length} participants submitted.
          {!allSubmitted && <span> Finalize once submissions are closed.</span>}
        </div>
        <button className="text-button finalize-hunt-button" disabled={pending} onClick={onFinalize} type="button">
          {pending ? "Loading leaderboard..." : allSubmitted ? "Finalize all results" : "Close submissions & finalize results"} <span aria-hidden="true">→</span>
        </button>
      </main>
    </div>
  );
}

function HuntResults({ hunt, results, onDone, onViewCertificate }) {
  const certificates = useMemo(
    () => createParticipantCertificates(hunt, results),
    [hunt, results],
  );
  const winner = results.teamStandings[0];
  const photoUrl = (photo) => photo?.url ?? photo?.photo?.url;

  return (
    <div className="walk-flow">
      <main className="color-hunt-results hunt-page multi-team-results" id="main-content">
        <SectionLabel>{hunt.location.toUpperCase()} · {hunt.teams.length} TEAMS</SectionLabel>
        <p className="hunt-kicker">{hunt.name.toUpperCase()}</p>
        <h1>COLOR HUNT COMPLETE</h1>
        {winner && (
          <section className="hunt-winner" aria-labelledby="winner-title">
            <p className="hunt-field-label">🏆 WINNING TEAM</p>
            <h2 id="winner-title">{winner.name.toUpperCase()}</h2>
            <p className="winner-score">
              {winner.scorePending ? "SCORING PENDING" : `${winner.totalScore.toFixed(1)} / 100 average`}
            </p>
            <p className="winner-reason">{results.winnerExplanation}</p>
          </section>
        )}
        <TeamStandings standings={results.teamStandings} />
        <Rewards rewards={results.rewards} />
        <section className="final-team-results" aria-label="Final team and participant results">
          {results.teamStandings.map((team) => (
            <details className="final-team-result" key={team.id}>
              <summary>
                <span>{team.rank <= 3 ? ["🥇", "🥈", "🥉"][team.rank - 1] : `${team.rank}.`} {team.name}</span>
                <span>{team.scorePending ? "PENDING" : team.totalScore.toFixed(1)} · {team.targetColor}</span>
              </summary>
              <div className="final-team-members">
                {team.individualStandings.map((participant) => (
                  <div className="final-member-result" key={participant.id}>
                    <div>
                      <strong>{participant.name}</strong>
                      <span>{participant.role} · {participant.totalScore} points</span>
                    </div>
                    {photoUrl(participant.bestPhoto) && (
                      <img alt={`Strongest submitted photograph by ${participant.name}`} src={photoUrl(participant.bestPhoto)} />
                    )}
                  </div>
                ))}
                <p className="final-team-average">TEAM SCORE · {team.scorePending ? "PENDING" : team.totalScore.toFixed(1)}</p>
                {photoUrl(team.strongestPhoto) && (
                  <figure className="team-strongest-photo">
                    <img alt={`Strongest photograph from ${team.name}`} src={photoUrl(team.strongestPhoto)} />
                    <figcaption>STRONGEST TEAM PHOTOGRAPH · {team.strongestParticipant.name}</figcaption>
                  </figure>
                )}
              </div>
            </details>
          ))}
        </section>
        <p className="hunt-local-note">Submission counts and rankings come from the server. Scores remain pending until AI analysis is added.</p>
        <section aria-labelledby="participant-certificates-title" className="participant-certificates">
          <p className="hunt-field-label">YOUR CERTIFICATE</p>
          <h2 id="participant-certificates-title">A record of your contribution.</h2>
          <p>Every participant with a completed submission has an individual certificate.</p>
          <ul>
            {certificates.map((certificate) => (
              <li key={certificate.id}>
                <span>
                  {certificate.participantName}
                  {certificate.isWinner && <strong> · 🏆 WINNING TEAM</strong>}
                </span>
                <button className="text-button" onClick={() => onViewCertificate(certificate)} type="button">
                  {certificate.isWinner ? "View winner certificate" : "View certificate"} <span aria-hidden="true">→</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <button className="continue-button" onClick={onDone} type="button">Done <span aria-hidden="true">↗</span></button>
      </main>
    </div>
  );
}

export default function ColorHunt({ onExit }) {
  const [screen, setScreen] = useState("home");
  const [hunt, setHunt] = useState(null);
  const huntRef = useRef(hunt);
  huntRef.current = hunt;
  const [results, setResults] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [liveStandings, setLiveStandings] = useState([]);
  const [teams, setTeams] = useState(() => [createTeamDraft(0), createTeamDraft(1)]);
  const [organizer, setOrganizer] = useState({ name: "", email: "", teamId: "" });
  const [huntName, setHuntName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(localDateString);
  const [duration, setDuration] = useState("30");
  const [teamCountValue, setTeamCountValue] = useState("2");
  const [rewards, setRewards] = useState(() => getDefaultRewards(2));
  const [rewardPlaces, setRewardPlaces] = useState(1);
  const [rewardPlacesCustomized, setRewardPlacesCustomized] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinPerson, setJoinPerson] = useState({ name: "", email: "" });
  const [joinTeamId, setJoinTeamId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [activeParticipantId, setActiveParticipantId] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [pending, setPending] = useState("");
  const [backendAvailable, setBackendAvailable] = useState(null);
  const [joinReturnScreen, setJoinReturnScreen] = useState("home");
  const objectUrlsRef = useRef(new Set());
  const submissionSequenceRef = useRef(0);
  const timerEndedRef = useRef(false);
  const actionInFlightRef = useRef(false);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (screen !== "home") return undefined;
    let cancelled = false;
    checkApiHealth()
      .then(() => { if (!cancelled) setBackendAvailable(true); })
      .catch(() => { if (!cancelled) setBackendAvailable(false); });
    return () => { cancelled = true; };
  }, [screen]);

  useEffect(() => {
    if (!hunt?.id || !["lobby", "hunting", "submissions"].includes(screen)) return undefined;
    let cancelled = false;
    const synchronize = async () => {
      try {
        const previous = huntRef.current;
        const [updatedHunt, standings] = await Promise.all([
          loadHunt(hunt.id, previous),
          loadLeaderboard(previous),
        ]);
        if (cancelled) return;
        setHunt(updatedHunt);
        setLiveStandings(standings);
        if (updatedHunt.status === "active" && screen === "lobby" && updatedHunt.activeParticipantId) {
          setActiveParticipantId(updatedHunt.activeParticipantId);
          setScreen("hunting");
        } else if (updatedHunt.status === "completed" && screen === "hunting") {
          setScreen("submissions");
        }
      } catch (error) {
        if (!cancelled) setJoinError(error.message);
      }
    };
    const intervalId = window.setInterval(synchronize, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [hunt?.id, screen]);

  useEffect(() => {
    if (screen !== "hunting" || !hunt?.startedAt) return undefined;
    const updateRemainingTime = () => {
      const startedAt = parseServerTimestamp(hunt.startedAt);
      const endTime = startedAt + hunt.duration * 60_000;
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0 && !timerEndedRef.current) {
        timerEndedRef.current = true;
        setScreen("submissions");
      }
    };
    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [hunt?.duration, hunt?.startedAt, screen]);

  function closeHunt() {
    setScreen("submissions");
  }

  async function createNewHunt() {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setPending("create");
    setJoinError("");
    try {
      const rewardList = rewards.slice(0, rewardPlaces);
      const created = createHunt({
        organizer,
        name: huntName,
        location,
        date,
        duration,
        teams,
        rewards: rewardList,
      });
      const persisted = await created;
      const standings = await loadLeaderboard(persisted);
      setHunt(persisted);
      setLiveStandings(standings);
      setActiveParticipantId(persisted.activeParticipantId);
      setJoinCode(persisted.code);
      timerEndedRef.current = false;
      setScreen("lobby");
    } catch (error) {
      setJoinError(error.message);
    } finally {
      actionInFlightRef.current = false;
      setPending("");
    }
  }

  async function joinExistingHunt() {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setPending("join");
    setJoinError("");
    try {
      const huntMatchesCode = hunt?.code === joinCode.trim().toUpperCase();
      if (!huntMatchesCode) {
        const found = await loadHuntByCode(joinCode);
        const standings = await loadLeaderboard(found);
        setHunt(found);
        setLiveStandings(standings);
        setJoinTeamId("");
        if (found.status !== "lobby" && !found.activeParticipantId) {
          throw new Error("This Hunt has already started and is not accepting new participants.");
        }
        if (found.activeParticipantId) {
          setActiveParticipantId(found.activeParticipantId);
          setScreen(found.status === "active" ? "hunting" : found.status === "completed" ? "submissions" : "lobby");
        }
        return;
      }
      const joined = await joinHuntByCode(joinCode, { ...joinPerson, teamId: joinTeamId });
      const standings = await loadLeaderboard(joined.hunt);
      setHunt(joined.hunt);
      setLiveStandings(standings);
      setActiveParticipantId(joined.participant.id);
      setScreen(joined.hunt.status === "active" ? "hunting" : "lobby");
    } catch (error) {
      setJoinError(error.message);
    } finally {
      actionInFlightRef.current = false;
      setPending("");
    }
  }

  async function startCompetition() {
    if (actionInFlightRef.current || !hunt) return;
    actionInFlightRef.current = true;
    setPending("start");
    setJoinError("");
    try {
      const started = await startCompetitionRequest(hunt);
      const standings = await loadLeaderboard(started);
      setHunt(started);
      setLiveStandings(standings);
      setActiveParticipantId(started.activeParticipantId || activeParticipantId);
      timerEndedRef.current = false;
      setScreen("hunting");
    } catch (error) {
      setJoinError(error.message);
    } finally {
      actionInFlightRef.current = false;
      setPending("");
    }
  }

  async function refreshHunt() {
    if (!hunt || actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setPending("refresh");
    setJoinError("");
    try {
      const [updated, standings] = await Promise.all([
        loadHunt(hunt.id, huntRef.current),
        loadLeaderboard(huntRef.current),
      ]);
      setHunt(updated);
      setLiveStandings(standings);
      if (updated.status === "active" && updated.activeParticipantId) {
        setActiveParticipantId(updated.activeParticipantId);
        setScreen("hunting");
      } else if (updated.status === "completed") {
        setScreen("submissions");
      }
    } catch (error) {
      setJoinError(error.message);
    } finally {
      actionInFlightRef.current = false;
      setPending("");
    }
  }

  function addSubmissionPhotos(participantId, fileList) {
    const participant = hunt.participants.find((entry) => entry.id === participantId);
    if (!participant || participant.submitted) return;
    const files = Array.from(fileList ?? []);
    const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const accepted = files.filter((file) => supportedTypes.has(file.type.toLowerCase()));
    const remaining = Math.max(0, 3 - participant.photos.length);
    const additions = [];
    try {
      for (const file of accepted.slice(0, remaining)) {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.add(url);
        const photo = {
          id: `submission-photo-${submissionSequenceRef.current++}`,
          name: file.name,
          file,
          url,
        };
        additions.push(createPhotoSubmission(hunt, participant, photo));
      }
    } catch (error) {
      additions.forEach((submission) => {
        URL.revokeObjectURL(submission.photo.url);
        objectUrlsRef.current.delete(submission.photo.url);
      });
      setUploadError(`Could not prepare selected photos: ${error.message}`);
      return;
    }
    const rejected = files.length - accepted.length + Math.max(0, accepted.length - remaining);
    setHunt((current) => ({
      ...current,
      participants: current.participants.map((entry) =>
        entry.id === participantId
          ? { ...entry, photos: [...entry.photos, ...additions] }
          : entry,
      ),
    }));
    setUploadError(
      rejected
        ? `${rejected} file${rejected === 1 ? " was" : "s were"} skipped. Choose up to three JPEG, PNG, or WebP images per participant.`
        : "",
    );
  }

  function removePhoto(participantId, submissionId) {
    const participant = hunt.participants.find((entry) => entry.id === participantId);
    const submission = participant?.photos.find((photo) => photo.id === submissionId);
    if (submission) {
      URL.revokeObjectURL(submission.photo.url);
      objectUrlsRef.current.delete(submission.photo.url);
    }
    setHunt((current) => ({
      ...current,
      participants: current.participants.map((entry) =>
        entry.id === participantId
          ? { ...entry, photos: entry.photos.filter((photo) => photo.id !== submissionId) }
          : entry,
      ),
    }));
  }

  async function submitParticipant(participantId) {
    if (actionInFlightRef.current) return;
    let currentHunt = huntRef.current;
    const participant = currentHunt?.participants.find((entry) => entry.id === participantId);
    if (!participant?.photos.length) {
      setUploadError("Add at least one photo before submitting.");
      return;
    }
    if (participant.submitted) return;
    actionInFlightRef.current = true;
    setPending("submission");
    setUploadError("");
    try {
      const pendingPhotos = participant.photos.filter((photo) => !photo.uploaded);
      for (const photo of pendingPhotos) {
        if (!photo.photo.file) {
          throw new Error("This photo is no longer available on this device. Select it again before retrying.");
        }
        const submission = photo.backendSubmissionId
          ? await uploadExistingParticipantPhoto(photo.backendSubmissionId, photo)
          : await uploadParticipantPhoto(currentHunt, participant, photo);
        if (photo.photo.url?.startsWith("blob:")) {
          URL.revokeObjectURL(photo.photo.url);
          objectUrlsRef.current.delete(photo.photo.url);
        }
        const uploadedUrl = resolveApiUrl(submission.image_url);
        currentHunt = {
          ...currentHunt,
          participants: currentHunt.participants.map((entry) => entry.id === participantId
            ? {
                ...entry,
                photos: entry.photos.map((entryPhoto) => entryPhoto.id === photo.id
                  ? {
                      ...entryPhoto,
                      backendSubmissionId: submission.id,
                      imageReference: submission.image_reference,
                      uploaded: true,
                      photo: { ...entryPhoto.photo, file: undefined, url: uploadedUrl },
                    }
                  : entryPhoto),
              }
            : entry),
        };
        setHunt(currentHunt);
      }
      currentHunt = {
        ...currentHunt,
        participants: currentHunt.participants.map((entry) =>
          entry.id === participantId ? { ...entry, submitted: true } : entry,
        ),
      };
      setHunt(currentHunt);
      const [updated, standings] = await Promise.all([
        loadHunt(currentHunt.id, currentHunt),
        loadLeaderboard(currentHunt),
      ]);
      setHunt(updated);
      setLiveStandings(standings);
      if (updated.status === "active") setScreen("hunting");
    } catch (error) {
      setUploadError(error.message);
    } finally {
      actionInFlightRef.current = false;
      setPending("");
    }
  }

  async function finalizeResults(currentHunt = huntRef.current) {
    if (actionInFlightRef.current || !currentHunt) return;
    actionInFlightRef.current = true;
    setPending("finalize");
    setUploadError("");
    try {
      let completed = currentHunt;
      if (completed.status !== "completed") {
        completed = await completeCompetition(completed);
      } else {
        completed = await loadHunt(completed.id, completed);
      }
      const [officialStandings, latest] = await Promise.all([
        loadLeaderboard(completed),
        loadHunt(completed.id, completed),
      ]);
      const mockResults = createFinalCompetitionResults(latest);
      const finalStandings = officialStandings.map((standing) => {
        const mockTeam = mockResults.teamStandings.find((team) => team.id === standing.id);
        return { ...mockTeam, ...standing, individualStandings: mockTeam?.individualStandings ?? [] };
      });
      const winningTeam = finalStandings.find((team) => team.submissionCount > 0) ?? null;
      const finalResults = {
        ...mockResults,
        teamStandings: finalStandings,
        winnerTeamId: winningTeam?.id ?? null,
        winnerExplanation: winningTeam
          ? "This provisional result follows the server leaderboard. Official AI scoring is not enabled yet."
          : "The Hunt ended before any team submitted photographs.",
      };
      const finalHunt = { ...latest, winnerTeamId: finalResults.winnerTeamId };
      setHunt(finalHunt);
      setLiveStandings(finalStandings);
      setResults(finalResults);
      setScreen("results");
    } catch (error) {
      setUploadError(error.message);
    } finally {
      actionInFlightRef.current = false;
      setPending("");
    }
  }

  function selectParticipant(participantId) {
    setActiveParticipantId(participantId);
    if (hunt) storeParticipantSession(hunt.id, participantId);
  }

  function exitHunt() {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    onExit();
  }

  if (screen === "home") {
    return (
      <ColorHuntHome
        backendAvailable={backendAvailable}
        onCreate={() => { setJoinError(""); setScreen("create"); }}
        onJoin={() => {
          setHunt(null);
          setJoinCode("");
          setJoinTeamId("");
          setJoinReturnScreen("home");
          setJoinError("");
          setScreen("join");
        }}
        onBack={onExit}
      />
    );
  }
  if (screen === "create") {
    return (
      <CreateHunt
        date={date}
        duration={duration}
        error={joinError}
        location={location}
        name={huntName}
        onBack={() => setScreen("home")}
        onCreate={createNewHunt}
        pending={pending === "create"}
        organizer={organizer}
        rewardPlaces={rewardPlaces}
        rewards={rewards}
        setDate={setDate}
        setDuration={setDuration}
        setLocation={setLocation}
        setName={setHuntName}
        setOrganizer={setOrganizer}
        setRewardPlaces={setRewardPlaces}
        setRewards={setRewards}
        rewardPlacesCustomized={rewardPlacesCustomized}
        setRewardPlacesCustomized={setRewardPlacesCustomized}
        setTeams={setTeams}
        setTeamCountValue={setTeamCountValue}
        teamCountValue={teamCountValue}
        teams={teams}
      />
    );
  }
  if (screen === "join") {
    return (
      <JoinHunt
        code={joinCode}
        error={joinError}
        hunt={hunt}
        onBack={() => setScreen(joinReturnScreen === "lobby" && hunt ? "lobby" : "home")}
        onJoin={joinExistingHunt}
        pending={pending === "join"}
        person={joinPerson}
        setCode={setJoinCode}
        setPerson={setJoinPerson}
        setTeamId={setJoinTeamId}
        teamId={joinTeamId}
      />
    );
  }
  if (screen === "lobby") {
    return (
      <HuntLobby
        hunt={hunt}
        onBack={() => setScreen("home")}
        error={joinError}
        onRefresh={refreshHunt}
        onJoin={() => {
          setJoinError("");
          setJoinCode(hunt.code);
          setJoinTeamId("");
          setJoinReturnScreen("lobby");
          setScreen("join");
        }}
        onStart={startCompetition}
        participantId={activeParticipantId}
        refreshPending={pending === "refresh"}
        startPending={pending === "start"}
      />
    );
  }
  if (screen === "hunting") {
    const participant = hunt.participants.find((entry) => entry.id === activeParticipantId) ?? hunt.participants.find((entry) => entry.teamId);
    const team = hunt.teams.find((entry) => entry.id === participant?.teamId);
    if (!participant || !team) {
      return <ColorHuntHome backendAvailable={backendAvailable} onBack={onExit} onCreate={() => setScreen("create")} onJoin={() => setScreen("join")} />;
    }
    return (
      <HuntCountdown
        hunt={hunt}
        onEnd={closeHunt}
        onParticipantChange={selectParticipant}
        onSubmitPhotos={() => setScreen("submissions")}
        participant={participant}
        remainingSeconds={remainingSeconds}
        standings={liveStandings}
        team={team}
      />
    );
  }
  if (screen === "submissions") {
    return (
      <HuntSubmissions
        activeParticipantId={activeParticipantId}
        error={uploadError}
        hunt={hunt}
        onAddFiles={addSubmissionPhotos}
        onFinalize={() => finalizeResults()}
        onRemovePhoto={removePhoto}
        onReturnToHunt={() => {
          if (hunt.status === "active" && remainingSeconds > 0) setScreen("hunting");
        }}
        onSubmit={submitParticipant}
        setActiveParticipantId={setActiveParticipantId}
        pending={pending === "submission" || pending === "finalize"}
        canReturnToHunt={hunt.status === "active" && remainingSeconds > 0}
      />
    );
  }
  if (screen === "results") {
    return (
      <HuntResults
        hunt={hunt}
        onDone={exitHunt}
        onViewCertificate={(certificate) => {
          setSelectedCertificate(certificate);
          setScreen("certificate");
        }}
        results={results}
      />
    );
  }
  if (screen === "certificate" && selectedCertificate) {
    return <CertificateView certificate={selectedCertificate} onBack={() => setScreen("results")} />;
  }
  return null;
}
