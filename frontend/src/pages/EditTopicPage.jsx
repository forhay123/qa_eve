
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTopicById, updateTopic } from "../services/api";
import { toast } from "react-toastify";

function EditTopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [formState, setFormState] = useState({
    week_number: "",
    title: "",
    file: null,
  });

  useEffect(() => {
    getTopicById(topicId).then(data => {
      setTopic(data);
      setFormState({
        week_number: data.week_number.toString(),
        title: data.title,
        file: null,
      });
    });
  }, [topicId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("title", formState.title);
    formDataToSend.append("week_number", formState.week_number);
    if (formState.file) {
      formDataToSend.append("file", formState.file);
    }

    try {
      await updateTopic(topicId, formDataToSend);

      toast.success(
        formState.file
          ? "Questions regenerated from new PDF successfully!"
          : "Topic updated successfully!"
      );

      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      console.error("Update failed:", err.message);
      toast.error("Failed to update topic.");
    }
  };

  if (!topic) return <p className="text-center py-10 text-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-md mt-6 border border-border">
      <h2 className="text-2xl font-bold mb-6">Edit Topic</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Week Number</label>
          <input
            name="week_number"
            type="number"
            value={formState.week_number}
            onChange={handleChange}
            required
            className="w-full border border-border px-4 py-2 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            name="title"
            value={formState.title}
            onChange={handleChange}
            required
            className="w-full border border-border px-4 py-2 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">PDF (optional)</label>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            onChange={handleChange}
            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
          />
        </div>

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditTopicPage;
