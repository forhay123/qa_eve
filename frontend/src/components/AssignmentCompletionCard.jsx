import { Card, CardContent } from "@/components/ui/card";

export function AssignmentCompletionCard({ variant }) {
  const variants = {
    success: {
      emoji: "🎉",
      title: "Outstanding Work!",
      message: "All assignments completed!",
      sub: "You're doing amazing! Keep it up! 💪",
      bg: "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-300"
    },
    failure: {
      emoji: "😔",
      title: "Let's Get Back on Track",
      message: "All assignments were missed, but it's not too late!",
      sub: "Focus on upcoming assignments and let's make a comeback! 🚀",
      bg: "from-red-50 to-red-50 dark:from-red-950/20 dark:to-red-950/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-300"
    },
    progress: {
      emoji: "💪",
      title: "Great Progress!",
      message: "Some assignments are done, others still pending.",
      sub: "Keep pushing to complete the rest! 🎯",
      bg: "from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-300"
    }
  };

  const v = variants[variant];

  return (
    <Card className={`bg-gradient-to-r ${v.bg} ${v.border}`}>
      <CardContent className="p-8 text-center">
        <div className="mb-4 text-6xl">{v.emoji}</div>
        <h3 className={`text-2xl font-bold mb-2 ${v.text}`}>{v.title}</h3>
        <p className={`${v.text} text-lg mb-1`}>{v.message}</p>
        <p className={`${v.text} text-sm`}>{v.sub}</p>
      </CardContent>
    </Card>
  );
}
