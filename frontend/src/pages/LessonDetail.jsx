
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTopicById } from '../services/api';

const LessonDetail = () => {
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTopic = async () => {
      try {
        const data = await getTopicById(topicId);
        setTopic(data);
      } catch (err) {
        setError("Failed to load topic details.");
        console.error("LessonDetail error:", err);
      }
    };
    loadTopic();
  }, [topicId]);

  if (error) {
    return <div className="text-destructive p-6 text-center font-medium">{error}</div>;
  }

  if (!topic) {
    return <div className="p-6 text-center text-muted-foreground">Loading topic...</div>;
  }

  const classLabel = topic.level?.toUpperCase();

  return (
    <div className="p-6 max-w-4xl mx-auto bg-background text-foreground">
      <div className="bg-card text-card-foreground rounded-2xl shadow-md p-6 md:p-8 border border-border">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Week {topic.week_number}: {topic.title}
        </h1>

        <div className="space-y-2 text-muted-foreground">
          {classLabel && (
            <p>
              <strong>Class:</strong> {classLabel}
            </p>
          )}
          {topic.subject && (
            <p>
              <strong>Subject:</strong> {topic.subject}
            </p>
          )}
        </div>

        {topic.pdf_url ? (
          <>
            <div className="mt-4 mb-4">
              <a
                href={topic.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                📄 Open PDF in new tab
              </a>
            </div>
            <div className="w-full h-[600px] border border-border rounded-xl overflow-hidden shadow">
              <iframe
                src={topic.pdf_url}
                title="Lesson PDF"
                className="w-full h-full"
                frameBorder="0"
              />
            </div>
          </>
        ) : (
          <p className="text-muted-foreground mt-4">No PDF available for this lesson.</p>
        )}
      </div>
    </div>
  );
};

export default LessonDetail;