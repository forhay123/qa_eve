import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';

const QuickActionCard = ({
  to,
  Icon,
  text,
  description,
  gradientLight,
  gradientDark,
  iconColorLight,
  iconColorDark
}) => {
  return (
    <Link to={to} className="group block">
      <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.05] hover:-translate-y-1 overflow-hidden bg-gradient-to-br from-background to-muted/20">
        {/* Sophisticated Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        
        <CardContent className="p-6 text-center relative z-10 space-y-4">
          {/* Enhanced Icon Container */}
          <div className="relative">
            <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradientLight} dark:${gradientDark} mb-2 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
              <Icon className={`h-6 w-6 ${iconColorLight} dark:${iconColorDark} drop-shadow-sm`} />
            </div>
            {/* Subtle glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientLight} dark:${gradientDark} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
          </div>

          {/* Enhanced Typography */}
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-200">
              {text}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>

          {/* Subtle Bottom Border Animation */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/50 group-hover:w-3/4 transition-all duration-300"></div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default QuickActionCard;