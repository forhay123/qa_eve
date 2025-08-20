
import React from 'react';
import { Button } from './ui/button';

const ChartToggleButtons = ({ visible = {}, setVisible }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {Object.keys(visible).map((key) => (
        <Button
          key={key}
          variant={visible[key] ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setVisible({ ...visible, [key]: !visible[key] })}
        >
          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </Button>
      ))}
    </div>
  );
};

export default ChartToggleButtons;