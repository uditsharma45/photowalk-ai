import { useEffect, useMemo, useRef, useState } from "react";
import {
  assignTeamColors,
  createFinalCompetitionResults,
  createHunt,
  createLiveStandings,
  createPhotoSubmission,
  createTeamDraft,
  getDefaultRewards,
  joinHunt,
} from "../services/colorHuntService.js";
import { createParticipantCertificates } from "../services/certificateService.js";
import CertificateView from "./CertificateView.jsx";

function localDateString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
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

function ColorHuntHome({ onCreate, onJoin, onBack }) {
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
          Prototype data lives in this browser session. Real shared events require a backend.
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
          <button className="continue-button" type="submit">
            Create shared Hunt <span aria-hidden="true">↗</span>
          </button>
        </form>
      </main>
    </div>
  );
}

function JoinHunt({ hunt, code, setCode, person, setPerson, teamId, setTeamId, error, onJoin, onBack }) {
  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} />
      <main className="hunt-form-page hunt-page" id="main-content">
        <SectionLabel>JOIN THE SHARED COMPETITION</SectionLabel>
        <p className="hunt-kicker">{hunt?.location ?? "COLOR HUNT"}</p>
        <h1>{hunt?.name ?? "Join a Color Hunt."}</h1>
        <p className="hunt-intro">Join one of the teams competing in this event.</p>
        <form className="hunt-form" onSubmit={(event) => { event.preventDefault(); onJoin(); }}>
          <label>
            Hunt code
            <input autoCapitalize="characters" maxLength={5} onChange={(event) => setCode(event.target.value.toUpperCase())} required value={code} />
          </label>
          <ParticipantFields
            label="Participant"
            onChange={(key, value) => setPerson((current) => ({ ...current, [key]: value }))}
            person={person}
          />
          <label>
            Choose your team
            <select onChange={(event) => setTeamId(event.target.value)} required value={teamId}>
              <option value="">Select a team</option>
              {hunt?.teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name} · {team.participantIds.length} players</option>
              ))}
            </select>
          </label>
          {error && <p className="hunt-error" role="alert">{error}</p>}
          <button className="continue-button" type="submit">
            Join this Hunt <span aria-hidden="true">↗</span>
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

function HuntLobby({ hunt, onJoin, onStart, onBack, participantId }) {
  const participants = hunt.participants.filter((participant) => participant.teamId);
  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} />
      <main className="hunt-lobby-page hunt-page" id="main-content">
        <SectionLabel>THE COMPETITION IS GATHERING</SectionLabel>
        <p className="hunt-kicker">{hunt.location.toUpperCase()}</p>
        <h1>{hunt.name}</h1>
        <p className="hunt-intro">One shared event. Every team will receive a distinct target color when the Hunt starts.</p>
        <dl className="hunt-details">
          <div><dt>Teams</dt><dd>{hunt.teams.length}</dd></div>
          <div><dt>Players</dt><dd>{participants.length}</dd></div>
          <div><dt>Duration</dt><dd>{hunt.duration} minutes</dd></div>
          <div><dt>Date</dt><dd>{new Date(`${hunt.date}T12:00:00`).toLocaleDateString()}</dd></div>
          <div><dt>Location</dt><dd>{hunt.location}</dd></div>
          <div><dt>Hunt code</dt><dd className="hunt-code">{hunt.code}</dd></div>
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
          {participantId
            ? `You are registered in ${hunt.teams.find((team) => team.id === hunt.participants.find((person) => person.id === participantId)?.teamId)?.name ?? "this Hunt"}.`
            : "The organizer is ready to start. Participants can join with the Hunt code in this browser."}
          {" "}Cross-device participation requires a backend.
        </p>
        <div className="hunt-lobby-actions">
          <button className="text-button" onClick={onJoin} type="button">Join as participant →</button>
          <button className="continue-button" onClick={onStart} type="button">
            Start Hunt <span aria-hidden="true">↗</span>
          </button>
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
            <strong className="standing-score">{team.score.toFixed(1)}</strong>
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
      <FlowHeader onBack={onReturnToHunt} backLabel={hunt.status === "active" ? "Return to Hunt" : "Hunt closed"} />
      <main className="hunt-submit-page hunt-page" id="main-content">
        <SectionLabel>INDIVIDUAL PARTICIPANT SUBMISSIONS</SectionLabel>
        <p className="hunt-kicker">{hunt.name.toUpperCase()} · {hunt.location.toUpperCase()}</p>
        <h1>Bring back your best frame.</h1>
        <p className="hunt-intro">Each participant submits independently for their team's assigned color.</p>
        <label className="active-participant-picker submission-participant-picker">
          PARTICIPANT
          <select onChange={(event) => setActiveParticipantId(event.target.value)} value={participant?.id ?? ""}>
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
                <img src={submission.photo.url} alt={`Submission by ${participant.name} for ${team.targetColor}`} />
                <button aria-label={`Remove ${submission.photo.name}`} className="photo-remove-button" onClick={() => onRemovePhoto(participant.id, submission.id)} type="button">×</button>
              </figure>
            ))}
            {submissions.length < 3 && !participant.submitted && (
              <div className="photo-add-control">
                <input
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="visually-hidden"
                  id="hunt-photos"
                  multiple
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
          <button className="continue-button submit-player-button" disabled={!submissions.length || participant.submitted} onClick={() => onSubmit(participant.id)} type="button">
            {participant.submitted ? "Submission complete" : "Submit my photos"} <span aria-hidden="true">↗</span>
          </button>
        </section>
        <div className="submission-progress">
          {submittedCount} / {hunt.participants.filter((entry) => entry.teamId).length} participants submitted.
          {!allSubmitted && <span> Finalize once submissions are closed.</span>}
        </div>
        {hunt.status !== "active" && (
          <button className="text-button finalize-hunt-button" onClick={onFinalize} type="button">
          {allSubmitted ? "Finalize all results" : "Close submissions & finalize results"} <span aria-hidden="true">→</span>
          </button>
        )}
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
            <p className="winner-score">{winner.totalScore.toFixed(1)} <span>/ 100 average</span></p>
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
                <span>{team.totalScore.toFixed(1)} · {team.targetColor}</span>
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
                <p className="final-team-average">TEAM SCORE · {team.totalScore.toFixed(1)}</p>
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
        <p className="hunt-local-note">Scores and winner explanation are deterministic prototype fixtures, not AI analysis.</p>
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
  const [results, setResults] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
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
  const objectUrlsRef = useRef(new Set());
  const submissionSequenceRef = useRef(0);
  const liveStandings = useMemo(() => hunt ? createLiveStandings(hunt) : [], [hunt]);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (screen !== "hunting") return undefined;
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [screen]);

  useEffect(() => {
    if (screen === "hunting" && remainingSeconds === 0) closeHunt();
  }, [screen, remainingSeconds]);

  function closeHunt() {
    setHunt((current) => current ? { ...current, status: "submissions", completedAt: new Date().toISOString() } : current);
    setScreen("submissions");
  }

  function createNewHunt() {
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
      setHunt(created);
      setActiveParticipantId(created.participants.find((participant) => participant.teamId)?.id ?? "");
      setJoinCode(created.code);
      setJoinError("");
      setScreen("lobby");
    } catch (error) {
      setJoinError(error.message);
    }
  }

  function joinExistingHunt() {
    try {
      const joined = joinHunt(hunt, joinCode, { ...joinPerson, teamId: joinTeamId });
      setHunt(joined.hunt);
      setActiveParticipantId(joined.participant.id);
      setJoinError("");
      setScreen("lobby");
    } catch (error) {
      setJoinError(error.message);
    }
  }

  function startCompetition() {
    const assignedHunt = assignTeamColors(hunt);
    setHunt(assignedHunt);
    setRemainingSeconds(assignedHunt.duration * 60);
    setScreen("hunting");
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

  function submitParticipant(participantId) {
    const participant = hunt.participants.find((entry) => entry.id === participantId);
    if (!participant?.photos.length) {
      setUploadError("Add at least one photo before submitting.");
      return;
    }
    const updated = {
      ...hunt,
      participants: hunt.participants.map((entry) =>
        entry.id === participantId ? { ...entry, submitted: true, submittedAt: new Date().toISOString() } : entry,
      ),
    };
    setHunt(updated);
    setUploadError("");
    const competitors = updated.participants.filter((entry) => entry.teamId);
    if (updated.status === "active") {
      setScreen("hunting");
    } else if (competitors.every((entry) => entry.submitted)) {
      finalizeResults(updated);
    }
  }

  function finalizeResults(currentHunt = hunt) {
    const completed = {
      ...currentHunt,
      status: "completed",
      completedAt: currentHunt.completedAt ?? new Date().toISOString(),
    };
    const finalResults = createFinalCompetitionResults(completed);
    completed.teamStandings = finalResults.teamStandings;
    completed.winnerTeamId = finalResults.winnerTeamId;
    setHunt(completed);
    setResults(finalResults);
    setScreen("results");
  }

  function exitHunt() {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    onExit();
  }

  if (screen === "home") {
    return <ColorHuntHome onCreate={() => setScreen("create")} onJoin={() => setScreen("join")} onBack={onExit} />;
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
        onBack={() => setScreen(hunt ? "lobby" : "home")}
        onJoin={joinExistingHunt}
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
        onJoin={() => { setJoinError(""); setScreen("join"); }}
        onStart={startCompetition}
        participantId={activeParticipantId}
      />
    );
  }
  if (screen === "hunting") {
    const participant = hunt.participants.find((entry) => entry.id === activeParticipantId) ?? hunt.participants.find((entry) => entry.teamId);
    const team = hunt.teams.find((entry) => entry.id === participant.teamId);
    return (
      <HuntCountdown
        hunt={hunt}
        onEnd={closeHunt}
        onParticipantChange={setActiveParticipantId}
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
        onReturnToHunt={() => setScreen("hunting")}
        onSubmit={submitParticipant}
        setActiveParticipantId={setActiveParticipantId}
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
