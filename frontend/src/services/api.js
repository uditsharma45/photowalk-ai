const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001")
  .replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    const isMultipart = typeof FormData !== "undefined" && options.body instanceof FormData;
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !isMultipart ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Backend unavailable. Start the FastAPI server and try again.");
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 404 && path.includes("/code/")) {
      throw new ApiError("Hunt code not found.", response.status);
    }
    const detail = typeof payload?.detail === "string"
      ? payload.detail
      : Array.isArray(payload?.detail)
        ? payload.detail.map((entry) => entry.msg).filter(Boolean).join(" ")
        : null;
    throw new ApiError(detail || `The PhotoWalk AI server returned an error (${response.status}).`, response.status);
  }
  return payload;
}

function jsonBody(value) {
  return { method: "POST", body: JSON.stringify(value) };
}

export function checkApiHealth() {
  return request("/api/health");
}

export function createHunt(payload) {
  return request("/api/hunts", jsonBody(payload));
}

export function getHunt(huntId) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}`);
}

export function getHuntByCode(huntCode) {
  return request(`/api/hunts/code/${encodeURIComponent(huntCode.trim().toUpperCase())}`);
}

export function startHunt(huntId) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/start`, { method: "POST" });
}

export function completeHunt(huntId) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/complete`, { method: "POST" });
}

export function createTeam(huntId, payload) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/teams`, jsonBody(payload));
}

export function getTeams(huntId) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/teams`);
}

export function registerParticipant(huntId, payload) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/participants`, jsonBody(payload));
}

export function getParticipants(huntId) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/participants`);
}

export function createSubmission(huntId, payload) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/submissions`, jsonBody(payload));
}

export function createSubmissionWithPhoto(huntId, { participantId, teamId, file }) {
  const form = new FormData();
  form.append("participant_id", participantId);
  form.append("team_id", teamId);
  form.append("file", file);
  return request(`/api/hunts/${encodeURIComponent(huntId)}/submissions/upload`, {
    method: "POST",
    body: form,
  });
}

export function uploadSubmissionPhoto(submissionId, file) {
  const form = new FormData();
  form.append("file", file);
  return request(`/api/submissions/${encodeURIComponent(submissionId)}/photo`, {
    method: "POST",
    body: form,
  });
}

export function uploadPhoto(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/photos", { method: "POST", body: form });
}

export function getPhoto(photoId) {
  return request(`/api/photos/${encodeURIComponent(photoId)}`);
}

export function resolveApiUrl(path) {
  return new URL(path, `${API_BASE_URL}/`).toString();
}

export function getSubmissions(huntId) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/submissions`);
}

export function getLeaderboard(huntId) {
  return request(`/api/hunts/${encodeURIComponent(huntId)}/leaderboard`);
}
