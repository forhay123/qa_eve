import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AssignmentList({ title, assignments, badgeColor, icon: Icon }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 text-${badgeColor}-500`} />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Badge variant="outline" className="text-xs">{assignments.length}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="shadow hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm truncate">{assignment.title}</p>
                <Badge variant="outline" className="text-[10px] px-2 py-1">{assignment.subject?.name || "Subject"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
              {assignment.status && (
                <Badge variant="secondary" className="text-[10px]">{assignment.status}</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
