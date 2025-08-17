import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Module {
    id: string;
    title: string;
    description: string;
    deadline: string | null;
    section: {
        title: string;
        phase: {
            title: string;
        };
    };
    module_progress?: {
        is_completed: boolean;
        completed_at: string | null;
    }[];
}

interface ProgressStats {
    totalModules: number;
    completedModules: number;
    progressPercentage: number;
}

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [modules, setModules] = useState<Module[]>([]);
    const [progressStats, setProgressStats] = useState<ProgressStats>({
        totalModules: 0,
        completedModules: 0,
        progressPercentage: 0
    });

    useEffect(() => {
        if (user) {
            fetchModules();
        }
    }, [user]);

    const fetchModules = async () => {
        if (!user) return;

        const { data: modulesData } = await supabase
            .from('modules')
            .select(`
        id,
        title,
        description,
        deadline,
        section:sections (
          title,
          phase:phases (
            title
          )
        )
      `)
            .eq('is_published', true)
            .order('module_order');

        if (modulesData) {
            // Get user-specific progress for all modules
            const { data: progressData } = await supabase
                .from('module_progress')
                .select('module_id, is_completed, completed_at')
                .eq('user_id', user.id);

            // Create a map of module_id to progress
            const progressMap = new Map();
            if (progressData) {
                progressData.forEach(progress => {
                    progressMap.set(progress.module_id, progress);
                });
            }

            // Attach progress data to modules
            const modulesWithProgress = modulesData.map(module => ({
                ...module,
                module_progress: progressMap.has(module.id) ? [progressMap.get(module.id)] : []
            }));

            setModules(modulesWithProgress);

            const total = modulesWithProgress.length;
            const completed = modulesWithProgress.filter(m =>
                m.module_progress && m.module_progress.length > 0 && m.module_progress[0].is_completed
            ).length;

            setProgressStats({
                totalModules: total,
                completedModules: completed,
                progressPercentage: total > 0 ? (completed / total) * 100 : 0
            });
        }
    };

    const upcomingModules = modules
        .filter(m => !m.module_progress || !m.module_progress[0]?.is_completed)
        .filter(m => m.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 3);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Progress Overview */}
                <Card className="card-cyber border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-foreground">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                            Your Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Completed</span>
                                    <span className="text-foreground font-medium">
                                        {progressStats.completedModules}/{progressStats.totalModules}
                                    </span>
                                </div>
                                <Progress value={progressStats.progressPercentage} className="h-3 bg-secondary" />
                            </div>
                            <p className="text-3xl font-bold text-primary">
                                {Math.round(progressStats.progressPercentage)}%
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card className="card-cyber border-warning/20 hover:border-warning/40 transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-foreground">
                            <div className="p-2 bg-warning/10 rounded-lg">
                                <Clock className="h-5 w-5 text-warning" />
                            </div>
                            Upcoming Deadlines
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingModules.length > 0 ? (
                                upcomingModules.map((module) => (
                                    <div key={module.id} className="flex justify-between items-start p-3 border border-border/50 rounded-lg hover:border-warning/30 transition-all duration-300 bg-card/30">
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground text-sm">{module.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {module.section.phase.title} • {module.section.title}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20">
                                            {module.deadline ? format(new Date(module.deadline), 'MMM dd') : 'No deadline'}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No upcoming deadlines</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Modules */}
            <Card className="mt-6 card-cyber">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        Beatroot Academy Modules
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {modules.slice(0, 6).map((module) => {
                            const isCompleted = module.module_progress &&
                                module.module_progress.length > 0 &&
                                module.module_progress[0].is_completed;

                            return (
                                <div
                                    key={module.id}
                                    className="border border-border/50 rounded-lg p-4 hover:border-accent/50 transition-all duration-300 cursor-pointer bg-card/50 hover:bg-card/70"
                                    onClick={() => navigate(`/modules/${module.id}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-medium text-foreground">{module.title}</h3>
                                        {isCompleted && (
                                            <div className="p-1 bg-success/10 rounded-full">
                                                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs border-accent/20 text-accent">
                                            {module.section.phase.title}
                                        </Badge>
                                        {module.deadline && (
                                            <span className="text-xs text-muted-foreground">
                                                Due {format(new Date(module.deadline), 'MMM dd, yyyy')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {modules.length > 6 && (
                        <div className="mt-6 text-center">
                            <Button variant="cyber-secondary" onClick={() => navigate('/modules')}>
                                View All Curriculum
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentDashboard;
