// src/pages/ParentApprovalManagement.js
import React, { useState, useEffect } from 'react';
import { fetchPendingParentApprovals, approveChildAssociation, fetchParentWithChildren } from '../../services/api'; // 💡 NEW IMPORT
import SingleParentChildDisplay from '../../components/SingleParentChildDisplay'; // Assuming you created this small display component

const ParentApprovalManagement = () => {
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [approvedAssociations, setApprovedAssociations] = useState([]); // 💡 NEW STATE
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const loadAllData = async () => { // 💡 COMBINED LOADING FUNCTION
        try {
            setLoading(true);
            const pending = await fetchPendingParentApprovals();
            setPendingApprovals(pending);
            
            const approved = await fetchParentWithChildren(); // 💡 FETCH APPROVED DATA
            setApprovedAssociations(approved);

        } catch (err) {
            setError("Failed to fetch data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const handleApproval = async (associationId, approved) => {
        try {
            await approveChildAssociation(associationId, approved);
            setMessage(`Association ${approved ? 'approved' : 'denied'} successfully.`);
            loadAllData(); // Reload both lists after action
        } catch (err) {
            setError("Failed to update approval status: " + err.message);
        }
    };

    if (loading) return <div className="p-6">Loading data...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Parent-Child Approvals</h1>
            {message && <p className="mb-4 text-green-600">{message}</p>}
            {error && <p className="mb-4 text-red-600">{error}</p>}

            {/* Section for Pending Approvals */}
            <h2 className="text-2xl font-bold mb-4 text-gray-700">Pending Requests</h2>
            {pendingApprovals.length === 0 ? (
                <p className="text-gray-600 mb-6">No pending parent-child association requests.</p>
            ) : (
                <ul className="list-none p-0 mb-8">
                    {pendingApprovals.map((approval) => (
                        <li key={approval.id} className="mb-4 p-4 border rounded-lg shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-2 md:mb-0 w-full md:w-auto">
                                <SingleParentChildDisplay parent={approval.parent} child={approval.child} />
                            </div>
                            <div className="flex gap-2 mt-3 md:mt-0">
                                <button
                                    onClick={() => handleApproval(approval.id, true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleApproval(approval.id, false)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Deny
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Section for Approved Associations */}
            <h2 className="text-2xl font-bold mb-4 text-gray-700">Approved Associations</h2>
            {approvedAssociations.length === 0 ? (
                <p className="text-gray-600">No approved parent-child associations found.</p>
            ) : (
                <ul className="space-y-4">
                    {approvedAssociations.map((parent) => (
                        <li key={parent.id} className="p-4 bg-white rounded shadow">
                            <p className="font-semibold text-lg">{parent.full_name} ({parent.email})</p>
                            <ul className="ml-6 mt-2 list-disc text-sm text-gray-700">
                                {parent.children.map((child) => (
                                    <li key={child.id}>
                                        {child.full_name} – {child.student_class} ({child.level ? child.level.toUpperCase() : 'N/A'})
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ParentApprovalManagement;