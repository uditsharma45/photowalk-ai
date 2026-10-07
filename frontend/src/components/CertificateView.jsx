import { useState } from "react";

export default function CertificateView({ certificate, onBack }) {
  const [shareMessage, setShareMessage] = useState("");

  async function shareCertificate() {
    const text = `${certificate.participantName} — Certificate of Participation for ${certificate.huntName}. Certificate ID: ${certificate.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "PhotoWalk AI Certificate",
          text,
        });
        setShareMessage("Certificate details shared.");
      } catch (error) {
        if (error.name !== "AbortError") {
          setShareMessage(`Could not share certificate: ${error.message}`);
        }
      }
      return;
    }

    if (!navigator.clipboard?.writeText) {
      setShareMessage("Sharing is not available in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareMessage("Certificate details copied to the clipboard.");
    } catch (error) {
      setShareMessage(`Could not copy certificate details: ${error.message}`);
    }
  }

  return (
    <div className="walk-flow">
      <main className="certificate-page hunt-page" id="main-content">
        <div className={`certificate${certificate.isWinner ? " certificate-winner" : ""}`}>
          <div className="certificate-frame">
            <header className="certificate-brand">
              <span className="wordmark-icon" aria-hidden="true">P</span>
              <span>PHOTO WALK <span className="wordmark-ai">AI</span></span>
            </header>
            <p className="certificate-eyebrow">A FIELD NOTE WORTH KEEPING</p>
            <h1>CERTIFICATE OF PARTICIPATION</h1>
            <p className="certificate-presented">This certificate is proudly presented to</p>
            <p className="certificate-name">{certificate.participantName}</p>
            <p className="certificate-for">for successfully participating in</p>
            <h2 className="certificate-hunt-name">{certificate.huntName}</h2>
            <p className="certificate-story">
              A location-based photography challenge focused on creative observation, color
              discovery, and visual storytelling.
            </p>

            {certificate.isWinner && (
              <section aria-label="Winning team distinction" className="certificate-winner-mark">
                <span aria-hidden="true">🏆</span>
                <div>
                  <strong>WINNING TEAM</strong>
                  <span>MEMBER OF THE WINNING TEAM</span>
                </div>
              </section>
            )}

            <p className="certificate-achievement">{certificate.achievement}</p>

            <dl className="certificate-details">
              <div>
                <dt>TEAM</dt>
                <dd>{certificate.teamName}</dd>
              </div>
              <div>
                <dt>TARGET COLOR</dt>
                <dd>{certificate.targetColor}</dd>
              </div>
              <div>
                <dt>ROLE</dt>
                <dd>{certificate.role}</dd>
              </div>
              {certificate.individualScore !== null && certificate.individualScore !== undefined && (
                <div>
                  <dt>INDIVIDUAL SCORE</dt>
                  <dd>{certificate.individualScore}</dd>
                </div>
              )}
              {certificate.teamScore !== null && certificate.teamScore !== undefined && (
                <div>
                  <dt>TEAM SCORE</dt>
                  <dd>{certificate.teamScore}</dd>
                </div>
              )}
            </dl>

            {certificate.awards.length > 0 && (
              <ul aria-label="Special awards" className="certificate-awards">
                {certificate.awards.map((award) => (
                  <li key={typeof award === "string" ? award : award.id}>
                    {typeof award === "string" ? award : award.title}
                  </li>
                ))}
              </ul>
            )}

            <footer className="certificate-footer">
              <div>
                <span className="certificate-location">{certificate.location}</span>
                <span>{certificate.date}</span>
              </div>
              <div>
                <span>{certificate.organizer}</span>
                <span>ORGANIZER / CHALLENGE</span>
              </div>
            </footer>
            <p className="certificate-id">CERTIFICATE ID · {certificate.id}</p>
          </div>
        </div>

        <div className="certificate-actions">
          <button className="text-button" onClick={onBack} type="button">
            <span aria-hidden="true">←</span> Results
          </button>
          <button
            className="continue-button"
            onClick={() => window.print()}
            type="button"
          >
            Download certificate <span aria-hidden="true">↓</span>
          </button>
          <button className="text-button certificate-share" onClick={shareCertificate} type="button">
            Share certificate <span aria-hidden="true">↗</span>
          </button>
          {shareMessage && <p className="certificate-share-message" role="status">{shareMessage}</p>}
        </div>
      </main>
    </div>
  );
}
