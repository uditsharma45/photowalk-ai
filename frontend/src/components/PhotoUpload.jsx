import { useRef } from "react";

const imageAccept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

function AddPhotosControl({ inputRef, onFilesSelected }) {
  return (
    <div className="photo-add-control">
      <input
        accept={imageAccept}
        className="visually-hidden"
        id="walk-photos"
        multiple
        onChange={onFilesSelected}
        ref={inputRef}
        type="file"
      />
      <label className="photo-add-label" htmlFor="walk-photos">
        <span className="photo-add-icon" aria-hidden="true">+</span>
        <span>ADD PHOTOS</span>
        <span className="photo-add-hint">Choose the photos you captured during your walk.</span>
      </label>
    </div>
  );
}

export default function PhotoUpload({
  photos,
  error,
  onAddFiles,
  onRemovePhoto,
  onBack,
  onContinue,
  headingRef,
}) {
  const inputRef = useRef(null);

  function handleFileSelection(event) {
    onAddFiles(event.target.files);
    event.target.value = "";
  }

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

      <main className="photo-upload-screen" id="main-content">
        <div className="photo-upload-heading">
          <SectionLabel>THE WALK IS YOURS</SectionLabel>
          <h1 ref={headingRef} tabIndex="-1">YOUR PHOTOS</h1>
          <p>Add the photos you captured during this PhotoWalk.</p>
        </div>

        {photos.length === 0 ? (
          <section className="photo-empty-state" aria-labelledby="empty-photos-title">
            <span className="empty-photo-mark" aria-hidden="true">✳</span>
            <h2 id="empty-photos-title">NO PHOTOS YET</h2>
            <p>Add the photographs you captured during your walk.</p>
            <AddPhotosControl inputRef={inputRef} onFilesSelected={handleFileSelection} />
          </section>
        ) : (
          <section className="photo-selection" aria-label="Selected walk photos">
            <div className="photo-selection-heading">
              <p aria-live="polite">
                {photos.length} {photos.length === 1 ? "photo" : "photos"} selected
              </p>
            </div>
            <div className="photo-grid">
              {photos.map((photo, index) => (
                <figure className="photo-thumbnail" key={photo.id}>
                  <img src={photo.url} alt={`Selected walk photo ${index + 1}: ${photo.name}`} />
                  <figcaption className="visually-hidden">{photo.name}</figcaption>
                  <button
                    aria-label={`Remove photo ${index + 1}: ${photo.name}`}
                    className="photo-remove-button"
                    onClick={() => onRemovePhoto(photo.id)}
                    type="button"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </figure>
              ))}
              <AddPhotosControl inputRef={inputRef} onFilesSelected={handleFileSelection} />
            </div>
          </section>
        )}

        {error && (
          <p className="photo-upload-error" role="alert">
            {error}
          </p>
        )}

        <div className="photo-upload-actions">
          <button className="text-button" onClick={onBack} type="button">
            <span aria-hidden="true">←</span> Back
          </button>
          <button
            className="continue-button"
            disabled={photos.length === 0}
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
