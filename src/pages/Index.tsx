import { Button } from '@/components/ui/button';
import { Shield, BookOpen, Users, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <img
              src="/circle_and_hashtag.png"
              alt="Beatroot Academy Logo"
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">beat</span><span className="text-primary">root</span>{" "}
            <span className="text-primary">
              platform
            </span>
          </h1>
          <div className="w-24 h-1 bg-primary rounded-full mx-auto mb-8" />
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            The official learning platform for <span className="text-accent font-semibold">Beatroot Academy</span>. Guide students through{" "}
            <span className="text-primary font-semibold">comprehensive cybersecurity education</span> with structured modules and real-time progress tracking.
          </p>
          <Button
            variant="cyber-primary"
            size="lg"
            onClick={() => window.location.href = '/auth'}
            className="group"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="card-cyber border-primary/20 hover:border-primary/40 transition-all duration-300 p-8 text-center group">
            <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-6 group-hover:bg-primary/20 transition-all duration-300">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Guided Learning</h3>
            <p className="text-muted-foreground leading-relaxed">Step-by-step progression through cybersecurity concepts with structured curriculum and real-time guidance.</p>
          </div>
          <div className="card-cyber border-accent/20 hover:border-accent/40 transition-all duration-300 p-8 text-center group">
            <div className="p-4 bg-accent/10 rounded-2xl w-fit mx-auto mb-6 group-hover:bg-accent/20 transition-all duration-300">
              <Users className="h-12 w-12 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Student Management</h3>
            <p className="text-muted-foreground leading-relaxed">Guide students through their learning journey with comprehensive progress tracking and personalized support.</p>
          </div>
          <div className="card-cyber border-warning/20 hover:border-warning/40 transition-all duration-300 p-8 text-center group">
            <div className="p-4 bg-warning/10 rounded-2xl w-fit mx-auto mb-6 group-hover:bg-warning/20 transition-all duration-300">
              <Shield className="h-12 w-12 text-warning" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Beatroot Academy</h3>
            <p className="text-muted-foreground leading-relaxed">Official learning management system for Beatroot Academy's comprehensive cybersecurity training program.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
