import { useEffect, useRef, useState } from "react";
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  uploadProfileImage,
} from "../services/api";
import {
  FaUser,
  FaBook,
  FaPhone,
  FaHome,
  FaCalendarAlt,
  FaUserGraduate,
  FaUserTie,
  FaEdit,
  FaDownload,
  FaGlobeAfrica,
  FaVenusMars,
  FaBirthdayCake,
  FaEnvelope,
} from "react-icons/fa";
import { Calendar } from "../components/ui/calendar";
// Import the BASE_URL from your config.js
import { BASE_URL } from "../services/config";

function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const profileRef = useRef();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyStudentProfile();
      setProfile(data);
      setForm({
        guardian_name: data.guardian_name || "",
        guardian_email: data.guardian_email || "",
        contact_number: data.contact_number || "",
        address: data.address || "",
        admission_date: data.admission_date?.split("T")[0] || "",
        date_of_birth: data.date_of_birth?.split("T")[0] || "",
        gender: data.gender || "",
        state_of_origin: data.state_of_origin || "",
      });
    } catch (err) {
      console.error("❌ Failed to load profile", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const handleSave = async () => {
    try {
      // Clone the form so we don't mutate state directly
      const payload = { ...form };

      // Remove empty dates so backend doesn't throw 422 error
      if (!payload.admission_date) delete payload.admission_date;
      if (!payload.date_of_birth) delete payload.date_of_birth;

      await updateMyStudentProfile(payload);

      if (imageFile) {
        const imageForm = new FormData();
        imageForm.append("file", imageFile);
        await uploadProfileImage(imageForm);
      }

      alert("✅ Profile updated successfully");
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      console.error("❌ Failed to update profile", err);
      alert("❌ Error updating profile");
    }
  };

  const exportToPDF = () => {
    if (window.html2pdf) {
      window.html2pdf().from(profileRef.current).save("StudentProfile.pdf");
    } else {
      alert("❌ PDF export not available");
    }
  };

  if (!profile) {
    return (
      <p className="p-6 text-center text-gray-600 dark:text-gray-300">
        Loading profile...
      </p>
    );
  }

  const user = profile.user || {};

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        🎓 Student Profile
      </h2>

      <div className="flex flex-col items-center gap-4 mb-6">
        <img
          className="w-32 h-32 rounded-full object-cover border dark:border-gray-600 shadow"
          // CORRECTED LINE: Use the BASE_URL from your config
          src={
            profile.profile_image
              ? `${BASE_URL}${profile.profile_image}`
              : "/default-profile.png"
          }
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-profile.png";
          }}
          alt="Profile"
        />
        <div className="flex gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FaDownload /> PDF
          </button>
        </div>
      </div>

      <section className="mb-8" ref={profileRef}>
        <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-200">
          Student Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={<FaUser />} label="Username" value={user.username} />
          <InfoCard icon={<FaUserGraduate />} label="Full Name" value={user.full_name} />
          <InfoCard icon={<FaEnvelope />} label="Email" value={user.email} />
          <InfoCard icon={<FaBook />} label="Class" value={user.student_class} />
          <InfoCard icon={<FaBook />} label="Level" value={user.level} />
          {user.department && (
            <InfoCard icon={<FaBook />} label="Department" value={user.department} />
          )}
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-200">
          Guardian & Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.guardian_name && (
            <InfoCard
              icon={<FaUserTie />}
              label="Guardian Name"
              value={profile.guardian_name}
            />
          )}

          {profile.guardian_email && (
            <InfoCard
              icon={<FaEnvelope />}
              label="Guardian Email"
              value={profile.guardian_email}
            />
          )}

          <InfoCard icon={<FaPhone />} label="Contact Number" value={profile.contact_number} />
          <InfoCard icon={<FaHome />} label="Address" value={profile.address} />
          {profile.admission_date && (
            <InfoCard
              icon={<FaCalendarAlt />}
              label="Admission Date"
              value={new Date(profile.admission_date).toLocaleDateString()}
            />
          )}

          {profile.date_of_birth && (
            <InfoCard
              icon={<FaBirthdayCake />}
              label="Date of Birth"
              value={new Date(profile.date_of_birth).toLocaleDateString()}
            />
          )}
          <InfoCard icon={<FaGlobeAfrica />} label="State of Origin" value={profile.state_of_origin} />
          <InfoCard icon={<FaVenusMars />} label="Gender" value={profile.gender} />
        </div>
      </section>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              ✏️ Edit Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.guardian_name && (
                <Input
                  label="Guardian Name"
                  name="guardian_name"
                  value={form.guardian_name}
                  onChange={handleInputChange}
                />
              )}

              {form.guardian_email && (
                <Input
                  label="Guardian Email"
                  name="guardian_email"
                  value={form.guardian_email}
                  onChange={handleInputChange}
                />
              )}

              <Input label="Contact Number" name="contact_number" value={form.contact_number} onChange={handleInputChange} />
              <Input label="Address" name="address" value={form.address} onChange={handleInputChange} />
              <Input label="State of Origin" name="state_of_origin" value={form.state_of_origin} onChange={handleInputChange} />

              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {form.admission_date && (
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                    Admission Date
                  </label>
                  <input
                    type="date"
                    name="admission_date"
                    value={form.admission_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {form.date_of_birth && (
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoCard = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded shadow-sm">
    <div className="text-blue-600 dark:text-blue-400 text-xl">{icon}</div>
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="font-medium text-gray-800 dark:text-gray-100">{value || "—"}</div>
    </div>
  </div>
);

const Input = ({ label, name, value, onChange }) => (
  <div>
    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">{label}</label>
    <input
      name={name}
      type={name.includes("email") ? "email" : "text"}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default StudentProfilePage;