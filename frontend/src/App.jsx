import { useEffect, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiBaseUrl}/api/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        setApiStatus(result.status === "ok" ? "connected" : "unavailable");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setApiStatus("unavailable");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="page">
      <section className="welcome" aria-labelledby="page-title">
        <p className="eyebrow">GO OUTSIDE. SEE DIFFERENTLY.</p>
        <h1 id="page-title">PhotoWalk AI</h1>
        <p className="description">
          A little less screen time. A little more time noticing the world.
        </p>
        <p className="connection" role="status">
          Backend: {apiStatus}
        </p>
      </section>
    </main>
  );
}
