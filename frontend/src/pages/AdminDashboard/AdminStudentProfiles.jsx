import { useEffect, useState } from 'react';
import {
  getAllStudentProfiles,
  updateStudentProfile,
} from '../../services/api';
import Layout from '../../components/Layout.jsx';

function AdminStudentProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [formData, setFormData] = useState({
    guardian_name: '',
    contact_number: '',
    address: '',
    admission_date: '',
    date_of_birth: '',
    gender: '',
    state_of_origin: '',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await getAllStudentProfiles();
      setProfiles(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch profiles.');
      setLoading(false);
    }
  };

  const handleEdit = (profile) => {
    setEditingProfileId(profile.id);
    setFormData({
      guardian_name: profile.guardian_name || '',
      contact_number: profile.contact_number || '',
      address: profile.address || '',
      admission_date: profile.admission_date?.split('T')[0] || '',
      date_of_birth: profile.date_of_birth?.split('T')[0] || '',
      gender: profile.gender || '',
      state_of_origin: profile.state_of_origin || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setEditingProfileId(null);
    setFormData({
      guardian_name: '',
      contact_number: '',
      address: '',
      admission_date: '',
      date_of_birth: '',
      gender: '',
      state_of_origin: '',
    });
  };

  const handleSave = async (userId) => {
    try {
      await updateStudentProfile(userId, formData);
      await loadProfiles();
      setEditingProfileId(null);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Update failed');
    }
  };

  if (loading) return <p className="p-6 text-gray-800 dark:text-gray-200">Loading student profiles...</p>;
  if (error) return <p className="p-6 text-red-600 dark:text-red-400">{error}</p>;

  return (
    <div className="p-6 space-y-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">🎓 All Student Profiles</h1>

      <div className="overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg shadow-md bg-white dark:bg-gray-800">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">
            <tr>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Image</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Username</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Full Name</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Class</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Level</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Department</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Guardian</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Contact</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Address</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Admission Date</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Date of Birth</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">State</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Gender</th>
              <th className="p-3 border border-gray-300 dark:border-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {profiles.map((profile) => {
              const user = profile.user || {};

              return (
                <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 even:bg-gray-50 dark:even:bg-gray-750">
                  <td className="p-2 border border-gray-300 dark:border-gray-600 text-center">
                    {profile.profile_image ? (
                      <img
                        src={`http://127.0.0.1:8000${profile.profile_image}`}
                        alt="Profile"
                        className="w-10 h-10 object-cover rounded-full mx-auto"
                      />
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{user.username || '—'}</td>
                  <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{user.full_name || '—'}</td>
                  <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{user.student_class || '—'}</td>
                  <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 capitalize">{user.level || '—'}</td>
                  <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{user.department || '—'}</td>

                  {editingProfileId === profile.id ? (
                    <>
                      {['guardian_name', 'contact_number', 'address', 'state_of_origin'].map((field) => (
                        <td key={field} className="p-2 border border-gray-300 dark:border-gray-600">
                          <input
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                        </td>
                      ))}
                      {['admission_date', 'date_of_birth'].map((field) => (
                        <td key={field} className="p-2 border border-gray-300 dark:border-gray-600">
                          <input
                            type="date"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                        </td>
                      ))}
                      <td className="p-2 border border-gray-300 dark:border-gray-600">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-nowrap">
                        <button
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-2 py-1 rounded mr-1 transition-colors"
                          onClick={() => handleSave(user.id)}
                        >
                          Save
                        </button>
                        <button
                          className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{profile.guardian_name || '—'}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{profile.contact_number || '—'}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{profile.address || '—'}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                        {profile.admission_date
                          ? new Date(profile.admission_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                        {profile.date_of_birth
                          ? new Date(profile.date_of_birth).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{profile.state_of_origin || '—'}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">{profile.gender || '—'}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-center">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                          onClick={() => handleEdit(profile)}
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminStudentProfiles;
