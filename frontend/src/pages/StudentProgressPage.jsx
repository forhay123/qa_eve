
import React from 'react';

const StudentProgressPage = () => {
  const subjects = [
    { name: 'Mathematics', progress: 85 },
    { name: 'English', progress: 75 },
    { name: 'Biology', progress: 92 },
    { name: 'Physics', progress: 68 },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-foreground">Progress Overview</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {subjects.map((subject, index) => (
          <div
            key={index}
            className="bg-card rounded-2xl shadow-md p-5 border border-border"
          >
            <h2 className="text-lg font-semibold mb-2 text-foreground">{subject.name}</h2>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all"
                style={{ width: `${subject.progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{subject.progress}% completed</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentProgressPage;
