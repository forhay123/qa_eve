import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, GraduationCap, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const Navigation = () => {
  const location = useLocation();

  return (
    <Card className="mb-6 shadow-elegant">
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            <span>Demo Navigation:</span>
          </div>
          
          <Button
            asChild
            variant={location.pathname === '/' ? 'premium' : 'outline'}
            size="sm"
          >
            <Link to="/">
              <Shield className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Link>
          </Button>
          
          <Button
            asChild
            variant={location.pathname === '/student' ? 'success' : 'outline'}
            size="sm"
          >
            <Link to="/student">
              <GraduationCap className="h-4 w-4 mr-2" />
              Student View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Navigation;