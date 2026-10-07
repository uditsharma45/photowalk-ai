import { useEffect, useRef } from "react";

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function EndWalkDialog({ onKeepWalking, onConfirmEnd }) {
  const dialogRef = useRef(null);
  const keepWalkingRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    dialog.showModal();
    keepWalkingRef.current?.focus();

    return () => dialog.close();
  }, []);

  return (
    <dialog
      aria-labelledby="end-walk-title"
      aria-describedby="end-walk-description"
      className="end-walk-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onKeepWalking();
      }}
      ref={dialogRef}
    >
      <p className="section-label">TAKE A MOMENT</p>
      <h2 id="end-walk-title">End this walk?</h2>
      <p id="end-walk-description">
        Your current progress will be saved for the session.
      </p>
      <div className="dialog-actions">
        <button
          className="text-button"
          onClick={onKeepWalking}
          ref={keepWalkingRef}
          type="button"
        >
          Keep walking
        </button>
        <button className="continue-button" onClick={onConfirmEnd} type="button">
          End walk
        </button>
      </div>
    </dialog>
  );
}

function FinishedWalk({ status, mission, onDone, headingRef }) {
  const isComplete = status === "completed";

  return (
    <main className="walk-finished" id="main-content">
      <SectionLabel>PHOTO WALK</SectionLabel>
      <p className="finished-kicker">SESSION {isComplete ? "COMPLETE" : "ENDED"}</p>
      <h1 ref={headingRef} tabIndex="-1">
        {isComplete ? "WALK COMPLETE" : "WALK ENDED"}
      </h1>
      <p className="finished-message">
        {isComplete
          ? "Nice work. You made time to look."
          : "Your mission is still here. You can try another walk whenever you're ready."}
      </p>

      <div className="finished-mission">
        <p className="mission-kicker">YOUR MISSION</p>
        <h2>{mission.title}</h2>
        <p>{mission.description}</p>
      </div>

      <button className="continue-button done-button" onClick={onDone} type="button">
        Done <span aria-hidden="true">↗</span>
      </button>
    </main>
  );
}

export default function WalkMode({
  mission,
  remainingSeconds,
  status,
  onRequestEnd,
  onKeepWalking,
  onConfirmEnd,
  onDone,
  headingRef,
}) {
  if (status === "completed" || status === "ended") {
    return (
      <FinishedWalk
        status={status}
        mission={mission}
        onDone={onDone}
        headingRef={headingRef}
      />
    );
  }

  return (
    <main className="walk-mode" id="main-content">
      <div className="walk-mode-topline">
        <SectionLabel>PHOTO WALK</SectionLabel>
        <span className="walk-mode-live">
          <span className="note-dot" />
          OUTSIDE MODE
        </span>
      </div>

      <p
        aria-label={`Time remaining ${formatTime(remainingSeconds)}`}
        aria-live="off"
        className="walk-timer"
        role="timer"
      >
        {formatTime(remainingSeconds)}
      </p>

      <section aria-labelledby="walk-mission-title" className="active-mission">
        <p className="mission-kicker">YOUR MISSION</p>
        <h1 id="walk-mission-title" ref={headingRef} tabIndex="-1">
          {mission.title}
        </h1>
        <p className="active-mission-description">{mission.description}</p>
      </section>

      <div className="active-focus">
        <span>FOCUS</span>
        <p>{mission.focus}</p>
      </div>

      <button className="end-walk-button" onClick={onRequestEnd} type="button">
        End walk
      </button>

      {status === "confirmingEnd" && (
        <EndWalkDialog
          onKeepWalking={onKeepWalking}
          onConfirmEnd={onConfirmEnd}
        />
      )}
    </main>
  );
}
