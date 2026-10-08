import { useRef, useState } from "react";
import { uploadPhoto, resolveApiUrl } from "../services/api.js";

const imageAccept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

function AddPhotosControl({ disabled, inputRef, onFilesSelected }) {
  return (
    <div className="photo-add-control">
      <input
        accept={imageAccept}
        className="visually-hidden"
        capture="environment"
        id="walk-photos"
        multiple
        disabled={disabled}
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
  onPhotoUploaded,
  headingRef,
}) {
  const inputRef = useRef(null);
  const isUploadingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function handleFileSelection(event) {
    onAddFiles(event.target.files);
    event.target.value = "";
  }

  async function handleContinue() {
    if (isUploadingRef.current || photos.length === 0) return;
    isUploadingRef.current = true;
    setIsUploading(true);
    setUploadError("");
    try {
      for (const photo of photos) {
        if (photo.uploaded) continue;
        if (!photo.file) {
          throw new Error("A selected photo is no longer available. Please select it again.");
        }
        const asset = await uploadPhoto(photo.file);
        onPhotoUploaded(photo.id, {
          ...asset,
          url: resolveApiUrl(asset.image_url),
        });
      }
      if (photos.every((photo) => photo.uploaded)) onContinue();
    } catch (error) {
      setUploadError(error.message || "Photo upload failed. Please try again.");
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
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
            <AddPhotosControl disabled={isUploading} inputRef={inputRef} onFilesSelected={handleFileSelection} />
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
                  <img src={photo.url} alt={`${photo.uploaded ? "Uploaded" : "Selected"} walk photo ${index + 1}: ${photo.name}`} />
                  <figcaption className="visually-hidden">
                    {photo.uploaded ? `${photo.name}, uploaded` : photo.name}
                  </figcaption>
                  <button
                    aria-label={`Remove photo ${index + 1}: ${photo.name}`}
                    className="photo-remove-button"
                    disabled={isUploading || photo.uploaded}
                    onClick={() => onRemovePhoto(photo.id)}
                    type="button"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </figure>
              ))}
              <AddPhotosControl disabled={isUploading} inputRef={inputRef} onFilesSelected={handleFileSelection} />
            </div>
          </section>
        )}

        {(error || uploadError) && (
          <p className="photo-upload-error" role="alert">
            {uploadError || error}
          </p>
        )}
        {photos.some((photo) => photo.uploaded) && (
          <p className="photo-upload-success" role="status">Uploaded to PhotoWalk AI.</p>
        )}

        <div className="photo-upload-actions">
          <button className="text-button" disabled={isUploading} onClick={onBack} type="button">
            <span aria-hidden="true">←</span> Back
          </button>
          <button
            className="continue-button"
            disabled={photos.length === 0 || isUploading}
            onClick={handleContinue}
            type="button"
          >
            {isUploading
              ? "Uploading photos..."
              : uploadError
                ? "Retry upload"
                : photos.every((photo) => photo.uploaded)
                  ? "Continue to results"
                  : "Continue"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </main>
    </div>
  );
}
