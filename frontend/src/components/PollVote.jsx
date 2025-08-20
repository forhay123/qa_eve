import React, { useState, useEffect } from 'react';
import { createPoll, votePoll, fetchChatGroups } from '../services/messaging';

export const PollVote = ({ groupId }) => {
  const [poll, setPoll] = useState(null);
  const [option, setOption] = useState('');

  useEffect(() => {
    // Optionally, load existing polls here if you store them
  }, []);

  const handleCreatePoll = async () => {
    const question = prompt('Enter poll question');
    const options = prompt('Enter options separated by commas');
    if (question && options) {
      const pollData = {
        group_id: groupId,
        question,
        options: options.split(',').map(opt => opt.trim()),
      };
      const newPoll = await createPoll(pollData);
      setPoll(newPoll);
    }
  };

  const handleVote = async () => {
    await votePoll({ poll_id: poll.id, option });
    alert('Vote submitted!');
  };

  if (!poll) {
    return (
      <button onClick={handleCreatePoll} className="text-green-500 mt-2 hover:underline">
        Create Poll
      </button>
    );
  }

  return (
    <div className="mt-4 p-2 border rounded-xl bg-gray-50">
      <h4 className="font-bold">{poll.question}</h4>
      {poll.options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2 mt-1">
          <input
            type="radio"
            name="poll"
            value={opt}
            onChange={(e) => setOption(e.target.value)}
          />
          <span>{opt}</span>
        </div>
      ))}
      <button onClick={handleVote} className="mt-2 bg-green-500 text-white px-4 py-1 rounded-xl">Vote</button>
    </div>
  );
};
