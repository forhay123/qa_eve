import React, { useEffect, useState } from "react";
import { getStudentResources, downloadResource } from "../services/api";

const ResourcesListPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await getStudentResources();
        setResources(res);
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError("Failed to load resources. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleDownload = async (id) => {
    try {
      setDownloadingId(id);
      await downloadResource(id);
    } catch (err) {
      console.error("Error downloading resource:", err);
      alert("Download failed. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 sm:p-10 bg-background text-foreground min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Study Resources</h1>
        <p className="text-sm text-muted-foreground">
          View and download subject-specific learning materials.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading resources...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : resources.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-card text-card-foreground p-5 rounded-xl shadow hover:shadow-md transition border border-border"
            >
              <h2 className="text-lg font-semibold">{resource.title}</h2>

              {resource.description && (
                <p className="text-sm text-foreground mt-1 mb-2 line-clamp-3">
                  {resource.description}
                </p>
              )}

              <p className="text-sm text-muted-foreground mb-3">
                Subject: {resource.subject}
              </p>

              <button
                onClick={() => handleDownload(resource.id)}
                disabled={downloadingId === resource.id}
                className="inline-block px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-md transition-colors"
              >
                {downloadingId === resource.id ? "Downloading..." : "Download"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground mt-6 text-center">
          <p>No resources available for your class and subjects at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default ResourcesListPage;
