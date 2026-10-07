import { useState } from "react";

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

function StartWalkButton({ className = "" }) {
  const [message, setMessage] = useState("");

  return (
    <>
      <button
        className={`start-button ${className}`.trim()}
        onClick={() =>
          setMessage("Walk setup is coming soon. For now, see how it works below.")
        }
        type="button"
      >
        <span>Start a photowalk</span>
        <span className="button-arrow" aria-hidden="true">
          ↗
        </span>
      </button>
      {message && (
        <p className="button-message" role="status">
          {message} <a href="#how-it-works">How it works</a>
        </p>
      )}
    </>
  );
}

function Header() {
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
      <a className="header-link" href="#start">
        Get outside <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}

function Hero() {
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
          <StartWalkButton />
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

function FinalCallToAction() {
  return (
    <section className="final-cta" id="start">
      <SectionLabel>THE WORLD IS WAITING</SectionLabel>
      <h2>Ready to see differently?</h2>
      <StartWalkButton className="start-button-light" />
      <p>One walk is all it takes to begin.</p>
    </section>
  );
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <Philosophy />
        <ProgressPreview />
        <FinalCallToAction />
      </main>
      <footer className="site-footer">
        <a className="wordmark" href="#top">
          <span className="wordmark-icon" aria-hidden="true">
            P
          </span>
          <span>PHOTO WALK <span className="wordmark-ai">AI</span></span>
        </a>
        <p>Made for the moments between here and there.</p>
        <span>© 2026 PHOTO WALK AI</span>
      </footer>
    </>
  );
}
