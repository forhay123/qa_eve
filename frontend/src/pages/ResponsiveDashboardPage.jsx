import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  FileText,
  Upload,
  BarChart3,
  Brain,
  User,
} from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import InstallButton from '@/components/InstallButton';

const actions = [
  { icon: Upload, color: 'text-red-600 dark:text-red-400', label: 'Upload PDFs' },
  { icon: FileText, color: 'text-red-600 dark:text-red-400', label: 'View Questions' },
  { icon: BookOpen, color: 'text-red-600 dark:text-red-400', label: 'Study Materials' },
  { icon: Calendar, color: 'text-red-600 dark:text-red-400', label: 'Timetable' },
  { icon: BarChart3, color: 'text-red-600 dark:text-red-400', label: 'Track Progress' },
  { icon: Brain, color: 'text-red-600 dark:text-red-400', label: 'Ask AI Tutor' },
];

const subjects = [
  { name: 'Mathematics', color: 'bg-white text-wine-900 dark:bg-gray-800 dark:text-wine-100' },
  { name: 'Physics', color: 'bg-white text-wine-900 dark:bg-gray-800 dark:text-wine-100' },
  { name: 'Biology', color: 'bg-white text-wine-900 dark:bg-gray-800 dark:text-wine-100' },
  { name: 'English', color: 'bg-white text-wine-900 dark:bg-gray-800 dark:text-wine-100' },
];

const ResponsiveDashboardPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedMode = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = storedMode || (prefersDark ? 'dark' : 'light');

    if (initialMode === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDarkMode;

    html.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    setIsDarkMode(newIsDark);
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full min-h-screen bg-wine-50 dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
        
        {/* Theme Toggle */}
        <div className="flex justify-end pt-6">
          <DarkModeToggle isDark={isDarkMode} onToggle={toggleTheme} />
        </div>

        {/* Install Button */}
        <div className="flex justify-center pt-4">
          <InstallButton />
        </div>

        {/* Hero Section */}
        <section className="flex flex-col-reverse lg:flex-row items-center gap-10 pt-4 lg:pt-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Good day 👋
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">{today}</p>
            <p className="text-md text-red-600 dark:text-red-400 italic">
              “Education is the most powerful weapon which you can use to change the world.” — Nelson Mandela
            </p>
          </div>

          <div className="flex-1">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full max-w-md mx-auto rounded-xl shadow-lg"
            >
              <source src="/videos/online-learning.mp4" type="video/mp4" />
              <p>Your browser does not support the video tag.</p>
            </video>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-8">
          <h2 className="text-3xl font-semibold text-center">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {actions.map(({ icon: Icon, label, color }, idx) => (
              <div
                key={idx}
                className="group bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md border dark:border-gray-700 hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center space-y-2 hover:border-red-300 hover:-translate-y-1"
              >
                <Icon className={`w-6 h-6 ${color} group-hover:scale-110 transition-transform duration-200`} />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 text-center">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Subjects */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Featured Subjects</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {subjects.map(({ name, color }, idx) => (
              <div
                key={idx}
                className={`px-6 py-3 rounded-full font-medium shadow-sm hover:scale-105 transition-transform cursor-pointer ${color}`}
              >
                {name}
              </div>
            ))}
          </div>
        </section>

        {/* Progress Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Topics Completed', value: '34', color: 'text-red-600 dark:text-red-400' },
            { label: 'Average Score', value: '82%', color: 'text-red-600 dark:text-red-400' },
            { label: 'AI Tutor Questions', value: '12', color: 'text-red-600 dark:text-red-400' },
          ].map(({ label, value, color }, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md text-center space-y-2">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</h4>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        {/* Upcoming Events */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-500" /> Upcoming Events
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
            <li>🧪 Chemistry Quiz – Monday, July 8</li>
            <li>📘 Literature Assignment Due – Wednesday, July 10</li>
            <li>🧠 Physics AI Practice Session – Friday, July 12</li>
          </ul>
        </section>

        {/* Mission Statement */}
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-10 max-w-4xl mx-auto text-center space-y-4">
          <h3 className="text-2xl font-semibold">Our Mission</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            We believe every student deserves a personalized, joyful learning experience. Our platform empowers you to grow, track, and thrive — at your own pace.
          </p>
        </section>

        {/* Student Info */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Your Profile</h2>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-md flex items-center space-x-4">
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-full shadow-inner">
              <User className="w-6 h-6 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="text-lg font-semibold">John Doe</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">SS2 – Science Class</p>
            </div>
          </div>
        </section>

        {/* Mobile CTA */}
        <section className="lg:hidden fixed bottom-0 inset-x-0 bg-red-600 text-white text-center py-4 px-6 z-50 shadow-md">
          <p className="text-sm">
            Need help with a topic? <span className="underline font-medium">Ask the AI Tutor</span>
          </p>
        </section>
      </div>
    </div>
  );
};

export default ResponsiveDashboardPage;