import { useEffect, useRef, useState } from "react";
import { getMissionForDirection } from "./services/missionService.js";

const steps = [
  {
    number: "01",
    title: "Choose your walk",
    description: "Select your time, skill level and creative direction.",
  },
  {
    number: "02",
    title: "Go outside",
    description: "Get a photography mission and put your phone away.",
  },
  {
    number: "03",
    title: "Capture",
    description: "Explore your surroundings and take photographs.",
  },
  {
    number: "04",
    title: "Come back",
    description: "Upload your photographs and receive AI-powered feedback.",
  },
];

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

function StartWalkButton({ className = "", onClick }) {
  return (
    <button className={`start-button ${className}`.trim()} onClick={onClick} type="button">
      <span>Start a photowalk</span>
      <span className="button-arrow" aria-hidden="true">
        ↗
      </span>
    </button>
  );
}

function Header({ onStart }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="PhotoWalk AI home">
        <span className="wordmark-icon" aria-hidden="true">
          P
        </span>
        <span>PHOTO WALK <span className="wordmark-ai">AI</span></span>
      </a>
      <nav aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#why-photowalk">Our philosophy</a>
      </nav>
      <button className="header-link" onClick={onStart} type="button">
        Get outside <span aria-hidden="true">↗</span>
      </button>
    </header>
  );
}

function Hero({ onStart }) {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <SectionLabel>A FIELD GUIDE FOR THE CURIOUS</SectionLabel>
        <h1 id="hero-title">
          Go outside.
          <br />
          <span>See differently.</span>
        </h1>
        <p className="hero-description">
          Turn your next walk into a creative photography adventure.
        </p>
        <div className="hero-action">
          <StartWalkButton onClick={onStart} />
          <p className="hero-note">
            AI-powered photography missions
            <br />
            designed to get you outside.
          </p>
        </div>
        <div className="hero-index" aria-hidden="true">
          <span>01 / 04</span>
          <span className="index-line" />
          <span>THE OUTDOORS, REFRAMED</span>
        </div>
      </div>
      <figure className="hero-image">
        <img
          src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85"
          alt="A quiet mountain lake reflecting forested peaks in the morning light"
        />
        <figcaption className="image-caption">
          <span>TAKE THE LONG WAY</span>
          <span>46° 51′ N — 9° 31′ E</span>
        </figcaption>
        <div className="image-note" aria-hidden="true">
          <span className="note-dot" />
          FIND THE FRAME
        </div>
      </figure>
      <a className="scroll-cue" href="#how-it-works">
        <span className="scroll-line" aria-hidden="true" />
        SCROLL TO EXPLORE
      </a>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-section section-wrap" id="how-it-works">
      <div className="section-heading">
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <h2>
          A little intention.
          <br />
          <span>A lot of outside.</span>
        </h2>
      </div>
      <ol className="steps-list">
        {steps.map((step) => (
          <li className="step" key={step.number}>
            <span className="step-number">{step.number}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
            <span className="step-mark" aria-hidden="true">
              ↗
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Philosophy() {
  return (
    <section className="philosophy" id="why-photowalk">
      <div className="philosophy-image" role="img" aria-label="A hiker looking out across a wide mountain landscape" />
      <div className="philosophy-copy">
        <SectionLabel>WHY PHOTOWALK?</SectionLabel>
        <h2>
          Most apps compete
          <br />
          for your attention.
        </h2>
        <p className="philosophy-lead">PhotoWalk AI does the opposite.</p>
        <div className="philosophy-rule" />
        <p className="philosophy-close">
          The goal isn’t more screen time.
          <br />
          <span>The goal is more time outside.</span>
        </p>
      </div>
    </section>
  );
}

function ProgressPreview() {
  const stats = [
    { value: "12", label: "WALKS COMPLETED" },
    { value: "08h 40m", label: "TIME OUTSIDE" },
    { value: "36", label: "PHOTOS CAPTURED" },
  ];

  return (
    <section className="progress section-wrap" aria-labelledby="progress-title">
      <div className="progress-heading">
        <SectionLabel>A LIFE, WELL OBSERVED</SectionLabel>
        <h2 id="progress-title">Small walks. New perspectives.</h2>
      </div>
      <div className="stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
      <p className="demo-note">A little inspiration from a sample photographer’s log.</p>
    </section>
  );
}

function FinalCallToAction({ onStart }) {
  return (
    <section className="final-cta" id="start">
      <SectionLabel>THE WORLD IS WAITING</SectionLabel>
      <h2>Ready to see differently?</h2>
      <StartWalkButton className="start-button-light" onClick={onStart} />
      <p>One walk is all it takes to begin.</p>
    </section>
  );
}

const durationOptions = ["15 minutes", "30 minutes", "60 minutes"];
const experienceOptions = ["Beginner", "Intermediate", "Advanced"];
const creativeDirections = [
  "Composition",
  "Light & Shadow",
  "Nature",
  "Street",
  "Architecture",
  "Abstract",
  "Surprise Me",
];

function OptionGroup({ title, options, value, onSelect, className = "" }) {
  const groupId = `option-${title.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <fieldset className={`option-group ${className}`.trim()}>
      <legend id={groupId}>{title}</legend>
      <div className="option-grid">
        {options.map((option, index) => (
          <button
            aria-pressed={value === option}
            className={`option-card${value === option ? " is-selected" : ""}`}
            key={option}
            onClick={() => onSelect(option)}
            type="button"
          >
            <span className="option-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{option}</span>
            <span className="option-check" aria-hidden="true">
              {value === option ? "✓" : "+"}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
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

function WalkSetup({ settings, onChange, onBack, onContinue, headingRef }) {
  const canContinue = Object.values(settings).every(Boolean);

  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} />
      <main className="setup-screen" id="main-content">
        <div className="setup-intro">
          <SectionLabel>YOUR NEXT LITTLE ADVENTURE</SectionLabel>
          <h1 ref={headingRef} tabIndex="-1">Plan your walk.</h1>
          <p>Choose how you want to explore today.</p>
        </div>

        <div className="setup-options">
          <OptionGroup
            className="duration-options"
            title="01 — Walk duration"
            options={durationOptions}
            value={settings.duration}
            onSelect={(duration) => onChange("duration", duration)}
          />
          <OptionGroup
            className="experience-options"
            title="02 — Photography experience"
            options={experienceOptions}
            value={settings.experience}
            onSelect={(experience) => onChange("experience", experience)}
          />
          <OptionGroup
            className="direction-options"
            title="03 — Creative direction"
            options={creativeDirections}
            value={settings.creativeDirection}
            onSelect={(creativeDirection) => onChange("creativeDirection", creativeDirection)}
          />
        </div>

        <div className="flow-actions">
          <button className="text-button" onClick={onBack} type="button">
            <span aria-hidden="true">←</span> Back
          </button>
          <button
            className="continue-button"
            disabled={!canContinue}
            onClick={onContinue}
            type="button"
          >
            Continue <span aria-hidden="true">↗</span>
          </button>
        </div>
      </main>
    </div>
  );
}

function MissionPreview({ settings, mission, onBack, headingRef }) {
  const [startMessage, setStartMessage] = useState("");

  function startWalk() {
    setStartMessage("Your mission is ready. Put your phone away and enjoy the walk.");
  }

  return (
    <div className="walk-flow">
      <FlowHeader onBack={onBack} />
      <main className="mission-screen" id="main-content">
        <div className="mission-content">
          <SectionLabel>YOUR PHOTOWALK</SectionLabel>
          <p className="mission-kicker">TODAY’S CREATIVE MISSION</p>
          <h1 ref={headingRef} tabIndex="-1">{mission.title}</h1>
          <p className="mission-description">{mission.description}</p>

          <dl className="mission-settings">
            <div>
              <dt>Duration</dt>
              <dd>{settings.duration}</dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>{settings.experience}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{settings.creativeDirection}</dd>
            </div>
          </dl>

          <div className="mission-actions">
            <button className="text-button" onClick={onBack} type="button">
              <span aria-hidden="true">←</span> Back
            </button>
            <button className="continue-button start-walk-button" onClick={startWalk} type="button">
              Start walk <span aria-hidden="true">↗</span>
            </button>
          </div>
          {startMessage && (
            <p className="walk-start-message" role="status">
              {startMessage}
            </p>
          )}
        </div>
        <div className="mission-side-note" aria-hidden="true">
          <span className="note-dot" />
          LESS SCREEN. MORE WORLD.
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [settings, setSettings] = useState({
    duration: "",
    experience: "",
    creativeDirection: "",
  });
  const [generatedMission, setGeneratedMission] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    if (screen !== "landing") {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [screen]);

  function updateSetting(key, value) {
    setSettings((currentSettings) => ({ ...currentSettings, [key]: value }));
  }

  function showSetup() {
    setScreen("setup");
  }

  function showMission() {
    setGeneratedMission(getMissionForDirection(settings.creativeDirection));
    setScreen("preview");
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {screen === "landing" ? (
        <>
          <Header onStart={showSetup} />
          <main id="main-content">
            <Hero onStart={showSetup} />
            <HowItWorks />
            <Philosophy />
            <ProgressPreview />
            <FinalCallToAction onStart={showSetup} />
          </main>
          <footer className="site-footer">
            <a className="wordmark" href="#top">
              <span className="wordmark-icon" aria-hidden="true">P</span>
              <span>PHOTO WALK <span className="wordmark-ai">AI</span></span>
            </a>
            <p>Made for the moments between here and there.</p>
            <span>© 2026 PHOTO WALK AI</span>
          </footer>
        </>
      ) : screen === "setup" ? (
        <WalkSetup
          settings={settings}
          onChange={updateSetting}
          onBack={() => setScreen("landing")}
          onContinue={showMission}
          headingRef={headingRef}
        />
      ) : (
        <MissionPreview
          settings={settings}
          mission={generatedMission}
          onBack={() => setScreen("setup")}
          headingRef={headingRef}
        />
      )}
    </>
  );
}
