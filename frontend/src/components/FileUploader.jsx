import React from 'react';

export const FileUploader = ({ onUpload }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!res.ok) {
      alert('File upload failed');
      return;
    }

    const data = await res.json();
    onUpload(data.file_url, file.type);
  };

  return (
    <div className="mt-2">
      <label className="cursor-pointer text-blue-500 hover:underline">
        Upload File
        <input type="file" onChange={handleFileChange} className="hidden" />
      </label>
    </div>
  );
};
