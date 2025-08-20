import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  GraduationCap,
  Eye,
  Lock,
  Award
} from 'lucide-react';
import { fetchAllTopicsForStudent } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { BASE_URL } from '../services/config';

// Helper to get full PDF URL
export const getFullPdfUrl = (pdfUrl) =>
  pdfUrl?.startsWith('http') ? pdfUrl : `${BASE_URL}${pdfUrl}`;

const StudentTopicsView = ({ userAuth }) => {
  const [userTopics, setUserTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState(null);

  useEffect(() => {
    const loadUserTopics = async () => {
      setIsLoadingTopics(true);
      setTopicsError(null);
      try {
        console.log('Fetching topics for student...');
        const data = await fetchAllTopicsForStudent();
        console.log('Topics fetched successfully:', data);
        setUserTopics(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setTopicsError("Failed to load topics. Please try again.");
        setUserTopics([]);
        toast({
          title: "Error",
          description: "Failed to load your learning topics",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTopics(false);
      }
    };

    if (userAuth?.level) {
      loadUserTopics();
    }
  }, [userAuth?.level, userAuth?.department]);

  const getTopicStats = () => {
    const total = userTopics.length;
    const approved = userTopics.filter(t => t.is_pdf_approved && t.pdf_url).length;
    const pending = userTopics.filter(t => !t.is_pdf_approved && t.pdf_url).length;
    const noPdf = userTopics.filter(t => !t.pdf_url).length;
    return { total, approved, pending, noPdf };
  };

  const stats = getTopicStats();

  if (isLoadingTopics) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your learning materials...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      {/* Updated bg-gradient-academic to a lighter background for light theme,
          and used primary foreground text color for readability.
          Adjusted icon and text colors to be appropriate for a light background. */}
      <Card className="border-0 shadow-elegant bg-gradient-to-r from-background-light-start to-background-light-end">
        <CardContent className="p-6 text-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Learning Materials</h2>
                <p className="text-muted-foreground/90">Topics from your registered subjects</p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium">
              {stats.total} total topics
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 rounded-xl bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-smooth">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <div className="text-2xl font-bold text-foreground">{stats.approved}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">Available</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-smooth">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-warning" />
                <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">Pending</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-smooth">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="text-2xl font-bold text-foreground">{stats.noPdf}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">No Materials</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-smooth">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">Total Topics</div>
            </div>
          </div>

          {/* Progress Bar */}
          {stats.total > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-muted/20 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-foreground">Learning Progress</span>
                <span className="font-bold text-foreground">{Math.round((stats.approved / stats.total) * 100)}%</span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-3">
                <div 
                  className="bg-success h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userTopics.length > 0 ? (
          userTopics.map((topic, idx) => (
            <Card 
              key={idx} 
              className={`border-2 transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 ${
                topic.is_pdf_approved && topic.pdf_url
                  ? 'border-success/30 bg-gradient-to-br from-card-elegant to-success/5 hover:border-success/50'
                  : topic.pdf_url
                  ? 'border-warning/30 bg-gradient-to-br from-card-elegant to-warning/5 hover:border-warning/50'
                  : 'border-border bg-card-elegant hover:border-accent/40'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-primary/10 text-primary border-primary/20 font-medium"
                  >
                    {topic.subject.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded">
                    Lecture {topic.week_number}
                  </span>
                </div>
                <CardTitle className="text-lg leading-tight text-foreground">
                  {topic.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  {topic.pdf_url ? (
                    topic.is_pdf_approved ? (
                      <>
                        <div className="p-2 rounded-full bg-success/20">
                          <CheckCircle className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <div className="font-medium text-success text-sm">Material Available</div>
                          <div className="text-xs text-muted-foreground">Ready for viewing</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 rounded-full bg-warning/20">
                          <Clock className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <div className="font-medium text-warning text-sm">Pending Approval</div>
                          <div className="text-xs text-muted-foreground">Awaiting instructor review</div>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-muted/50">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground text-sm">No Material Available</div>
                        <div className="text-xs text-muted-foreground">Content not uploaded yet</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Button */}
                {topic.pdf_url ? (
                  topic.is_pdf_approved ? (
                    <Button
                      asChild
                      variant="approved"
                      className="w-full"
                      size="sm"
                    >
                      <a
                        href={getFullPdfUrl(topic.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Materials
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="pending"
                      disabled
                      className="w-full"
                      size="sm"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Awaiting Approval
                    </Button>
                  )
                ) : (
                  <Button
                    variant="elegant"
                    disabled
                    className="w-full opacity-50 cursor-not-allowed"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    No Materials Yet
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 lg:col-span-3 border-dashed border-2 bg-gradient-to-br from-card-elegant to-muted/30">
            <CardContent className="p-12 text-center">
              <div className="p-6 rounded-2xl bg-primary/10 w-fit mx-auto mb-6">
                <GraduationCap className="h-16 w-16 text-primary mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                No Learning Materials Found
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                No topics have been found for your registered subjects. Please contact your instructor
                or check your subject registration to access your learning materials.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Info */}
      <Card className="bg-gradient-to-r from-muted/20 to-accent/5 border-dashed border-accent/30">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-full bg-accent/20">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              All materials are subject to instructor approval before becoming available for viewing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTopicsView;