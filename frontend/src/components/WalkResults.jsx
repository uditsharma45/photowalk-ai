import { useEffect, useState } from "react";

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

export default function WalkResults({
  mission,
  duration,
  photoCount,
  onBack,
  onDone,
  headingRef,
}) {
  const [analysisState, setAnalysisState] = useState("idle");

  useEffect(() => {
    if (analysisState !== "preparing") return undefined;

    const timeoutId = window.setTimeout(() => {
      setAnalysisState("ready");
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [analysisState]);

  const isPreparing = analysisState === "preparing";
  const isReady = analysisState === "ready";

  return (
    <div className="walk-flow">
      <header className="flow-header">
        <a className="wordmark" href="#top" aria-label="PhotoWalk AI home">
          <span className="wordmark-icon" aria-hidden="true">P</span>
          <span>PHOTO WALK <span className="wordmark-ai">AI</span></span>
        </a>
        <button className="flow-back" onClick={onBack} type="button">
          <span aria-hidden="true">←</span> Back
        </button>
      </header>

      <main className="walk-results-screen" id="main-content">
        <SectionLabel>YOUR TIME WELL SPENT</SectionLabel>
        <p className="results-kicker">PHOTO WALK · SESSION COMPLETE</p>
        <h1 ref={headingRef} tabIndex="-1">WALK COMPLETE</h1>
        <p className="results-intro">Nice work. You made time to look.</p>

        <dl className="results-summary">
          <div className="result-mission">
            <dt>Mission</dt>
            <dd>{mission.title}</dd>
          </div>
          <div>
            <dt>Focus</dt>
            <dd>{mission.focus}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{duration}</dd>
          </div>
          <div>
            <dt>Photos</dt>
            <dd>{photoCount}</dd>
          </div>
        </dl>

        <section className={`analysis-preparation${isReady ? " is-ready" : ""}`} aria-live="polite">
          <p className="analysis-label">A MOMENT TO REFLECT</p>
          {isPreparing ? (
            <h2 className="preparation-message">PREPARING YOUR PHOTOS...</h2>
          ) : isReady ? (
            <>
              <h2 className="preparation-message">READY FOR AI ANALYSIS</h2>
              <p className="analysis-note">
                Your photos are prepared for the next phase. No AI analysis has been run.
              </p>
            </>
          ) : (
            <>
              <h2 className="analysis-coming">AI analysis is coming next.</h2>
              <p className="analysis-note">
                Your photos are here, ready for a future creative review.
              </p>
            </>
          )}
        </section>

        <div className="results-actions">
          <button className="text-button" onClick={onBack} type="button">
            <span aria-hidden="true">←</span> Your photos
          </button>
          <button
            className="continue-button"
            disabled={isPreparing || isReady}
            onClick={() => setAnalysisState("preparing")}
            type="button"
          >
            {isPreparing ? (
              "Preparing..."
            ) : isReady ? (
              "Ready for AI analysis"
            ) : (
              <>
                Analyze photos <span aria-hidden="true">↗</span>
              </>
            )}
          </button>
        </div>

        {isReady && (
          <button className="results-done-button" onClick={onDone} type="button">
            Done
          </button>
        )}
      </main>
    </div>
  );
}
