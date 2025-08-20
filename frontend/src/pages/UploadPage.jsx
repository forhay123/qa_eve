import React, { useState } from 'react';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';
import { uploadPDF } from '../services/api';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [maxQuestions, setMaxQuestions] = useState(35);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatusMessage('Please select a PDF file.');
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage('Uploading...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('max_questions', maxQuestions);

      const response = await uploadPDF(formData);

      if (response?.pdf_id) {
        setStatusMessage('Upload successful! Redirecting...');
        navigate(`/questions/${response.pdf_id}`);
      } else {
        setStatusMessage('Upload failed. No PDF ID returned.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setStatusMessage('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">📄 Upload a PDF</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Choose PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setStatusMessage('');
            }}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Max Questions</label>
          <input
            type="number"
            value={maxQuestions}
            onChange={(e) => setMaxQuestions(e.target.value)}
            min={1}
            max={50}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
            placeholder="e.g. 15"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow disabled:opacity-50"
        >
          {isUploading ? <Spinner message="Uploading..." /> : 'Upload'}
        </button>

        {statusMessage && (
          <p className="text-sm text-gray-600 text-center">{statusMessage}</p>
        )}
      </form>
    </div>
  );
};

export default UploadPage;
