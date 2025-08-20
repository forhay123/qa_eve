import React, { useEffect, useState } from 'react';
import { getFilteredResources, getResourceSubjects, downloadResource } from '../../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const AdminViewResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🔄 AdminViewResourcesPage component rendered');
  console.log('📊 Current state:', { resources: resources.length, subjects: subjects.length, loading, error });

  const loadResources = async () => {
    try {
      console.log('🔄 Starting to load resources...');
      setLoading(true);
      setError(null);

      const filters = subjectFilter === 'all' ? {} : { subject: subjectFilter };
      console.log('🔍 Applying filters:', filters);

      const res = await getFilteredResources(filters);
      console.log('✅ Resources loaded successfully:', res);

      setResources(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('❌ Failed to load resources:', err);
      setError(`Failed to load resources: ${err.message}`);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      console.log('🔄 Starting to load subjects...');
      const subs = await getResourceSubjects();
      console.log('✅ Subjects loaded successfully:', subs);
      setSubjects(Array.isArray(subs) ? subs : []);
    } catch (err) {
      console.error('❌ Failed to load subjects:', err);
      setError(`Failed to load subjects: ${err.message}`);
      setSubjects([]);
    }
  };

  useEffect(() => {
    console.log('🚀 Component mounted, loading initial data...');
    loadSubjects();
    loadResources();
  }, []);

  useEffect(() => {
    console.log('🔄 Subject filter changed:', subjectFilter);
    loadResources();
  }, [subjectFilter]);

  console.log('🎨 About to render component with:', {
    loading,
    error,
    resourcesCount: resources.length,
    subjectsCount: subjects.length,
  });

  if (error && !loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-foreground">📚 Uploaded Resources</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reload Page
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-foreground">📚 Uploaded Resources</h2>

      {/* Debug info - remove this in production */}
      <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
        <strong>Debug Info:</strong> Loading: {loading.toString()},
        Resources: {resources.length},
        Subjects: {subjects.length},
        Error: {error || 'None'}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="subject-filter">Filter by Subject</Label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent position="item-aligned" avoidCollisions={false}>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s, idx) => (
                  <SelectItem key={idx} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center mt-10">
          <p className="text-muted-foreground">Loading resources...</p>
          <div className="mt-2 w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No resources found.</p>
            {subjectFilter !== 'all' && (
              <p className="text-sm text-muted-foreground mt-2">
                Try clearing the subject filter to see all resources.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{r.student_class}</TableCell>
                    <TableCell className="capitalize">{r.level}</TableCell>
                    <TableCell className="max-w-xs truncate" title={r.description}>
                      {r.description}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResource(r.id)}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminViewResourcesPage;
