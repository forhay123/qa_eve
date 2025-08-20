// calendar.jsx
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const Calendar = React.forwardRef(({ className, ...props }, ref) => (
  <DayPicker
    ref={ref}
    className={`p-3 bg-white rounded-md shadow ${className || ''}`}
    {...props}
  />
));
Calendar.displayName = 'Calendar';

export { Calendar };
