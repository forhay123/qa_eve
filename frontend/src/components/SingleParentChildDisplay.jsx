// components/SingleParentChildDisplay.js
import React from 'react';

const SingleParentChildDisplay = ({ parent, child }) => {
    if (!parent || !child) {
        return <p>Invalid association data.</p>;
    }
    return (
        <div>
            <p className="font-semibold text-gray-700">
                Parent: {parent.full_name || parent.username} ({parent.email})
            </p>
            <p className="text-gray-600">
                Child: {child.full_name || child.username} - Class: {child.student_class} ({child.level ? child.level.toUpperCase() : 'N/A'})
            </p>
        </div>
    );
};

export default SingleParentChildDisplay;