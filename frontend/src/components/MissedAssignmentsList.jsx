import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MissedAssignmentsList({ assignments }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <XCircle className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-semibold text-foreground">Overdue (Not Submitted)</h3>
        <Badge variant="destructive" className="text-xs">{assignments.length}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <Card 
            key={assignment.id}
            className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 shadow hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm truncate">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{assignment.subject?.name || "Unknown Subject"}</p>
                </div>
                <Badge variant="destructive" className="text-[10px] px-2 py-1">Not Submitted</Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Due: {new Date(assignment.due_date).toLocaleDateString()}
              </p>

              <p className="text-xs text-destructive font-medium">
                Score: 0 (Auto-graded)
              </p>

              <Button variant="outline" size="sm" className="w-full" disabled>
                Not Submitted
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
