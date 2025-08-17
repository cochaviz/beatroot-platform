import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, Users, AlertTriangle, TrendingUp } from 'lucide-react';
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
}

interface Student {
    user_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
}

interface ModuleCompletion {
    module_id: string;
    module_title: string;
    total_students: number;
    completed_count: number;
    completion_rate: number;
    deadline: string | null;
    section_title: string;
    phase_title: string;
}

interface StudentWithMissedDeadline {
    student: Student;
    module_title: string;
    deadline: string;
    days_overdue: number;
}

const InstructorDashboard: React.FC = () => {
    const [studentsCount, setStudentsCount] = useState(0);
    const [moduleCompletions, setModuleCompletions] = useState<ModuleCompletion[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<Module[]>([]);
    const [studentsWithMissedDeadlines, setStudentsWithMissedDeadlines] = useState<StudentWithMissedDeadline[]>([]);

    useEffect(() => {
        fetchInstructorData();
    }, []);

    const fetchInstructorData = async () => {
        await Promise.all([
            fetchStudentsCount(),
            fetchModuleCompletions(),
            fetchUpcomingDeadlines(),
            fetchStudentsWithMissedDeadlines()
        ]);
    };

    const fetchStudentsCount = async () => {
        const { data: studentsData, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student');

        if (error) {
            console.error('Error fetching students count:', error);
            return;
        }

        setStudentsCount(studentsData?.length || 0);
    };

    const fetchModuleCompletions = async () => {
        // Get all published modules with completion data
        const { data: modulesData } = await supabase
            .from('modules')
            .select(`
        id,
        title,
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

        if (!modulesData) return;

        // Get all students
        const { data: studentsData, error: studentsError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('role', 'student');

        if (studentsError) {
            console.error('Error fetching students for completion calculation:', studentsError);
            return;
        }

        if (!studentsData) return;

        const totalStudents = studentsData.length;
        const studentUserIds = studentsData.map(s => s.user_id);
        const completions: ModuleCompletion[] = [];

        // For each module, get completion data (students only)
        for (const module of modulesData) {
            const { data: progressData, error: progressError } = await supabase
                .from('module_progress')
                .select('is_completed')
                .eq('module_id', module.id)
                .eq('is_completed', true)
                .in('user_id', studentUserIds);

            if (progressError) {
                console.error(`Error fetching progress for module ${module.id}:`, progressError);
                continue;
            }

            const completedCount = progressData?.length || 0;
            const completionRate = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

            completions.push({
                module_id: module.id,
                module_title: module.title,
                total_students: totalStudents,
                completed_count: completedCount,
                completion_rate: completionRate,
                deadline: module.deadline,
                section_title: module.section.title,
                phase_title: module.section.phase.title
            });
        }

        setModuleCompletions(completions);
    };

    const fetchUpcomingDeadlines = async () => {
        const { data: modulesData, error } = await supabase
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
            .not('deadline', 'is', null)
            .gte('deadline', new Date().toISOString())
            .order('deadline')
            .limit(5);

        if (error) {
            console.error('Error fetching upcoming deadlines:', error);
            return;
        }

        if (modulesData) {
            setUpcomingDeadlines(modulesData);
        }
    };

    const fetchStudentsWithMissedDeadlines = async () => {
        // Get modules with deadlines that have passed
        const { data: overdueModules, error: overdueError } = await supabase
            .from('modules')
            .select(`
        id,
        title,
        deadline
      `)
            .eq('is_published', true)
            .not('deadline', 'is', null)
            .lt('deadline', new Date().toISOString())
            .order('deadline', { ascending: false })
            .limit(1); // Get the most recent deadline

        if (overdueError) {
            console.error('Error fetching overdue modules:', overdueError);
            return;
        }

        if (!overdueModules || overdueModules.length === 0) {
            return;
        }

        const mostRecentDeadline = overdueModules[0];

        // Get all students
        const { data: studentsData, error: studentsError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .eq('role', 'student');

        if (studentsError) {
            console.error('Error fetching students for missed deadlines:', studentsError);
            return;
        }

        if (!studentsData) return;

        const studentsWithMissedDeadlines: StudentWithMissedDeadline[] = [];

        // Check which students missed this deadline
        for (const student of studentsData) {
            const { data: progressData } = await supabase
                .from('module_progress')
                .select('is_completed')
                .eq('module_id', mostRecentDeadline.id)
                .eq('user_id', student.user_id)
                .eq('is_completed', true)
                .single();

            if (!progressData) {
                // Student missed the deadline
                const daysOverdue = Math.ceil(
                    (new Date().getTime() - new Date(mostRecentDeadline.deadline).getTime()) / (1000 * 60 * 60 * 24)
                );

                studentsWithMissedDeadlines.push({
                    student: {
                        user_id: student.user_id,
                        full_name: student.full_name || 'Unknown Student',
                        email: student.email,
                        avatar_url: student.avatar_url
                    },
                    module_title: mostRecentDeadline.title,
                    deadline: mostRecentDeadline.deadline,
                    days_overdue: daysOverdue
                });
            }
        }

        setStudentsWithMissedDeadlines(studentsWithMissedDeadlines);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Total Students */}
                <Card className="card-cyber border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-foreground text-lg">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            Total Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary mb-2">{studentsCount}</p>
                        <p className="text-muted-foreground text-sm">Active learners</p>
                    </CardContent>
                </Card>

                {/* Average Completion Rate */}
                <Card className="card-cyber border-accent/20 hover:border-accent/40 transition-all duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-foreground text-lg">
                            <div className="p-2 bg-accent/10 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-accent" />
                            </div>
                            Avg. Completion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-accent mb-2">
                            {moduleCompletions.length > 0
                                ? Math.round(moduleCompletions.reduce((sum, m) => sum + m.completion_rate, 0) / moduleCompletions.length)
                                : 0}%
                        </p>
                        <p className="text-muted-foreground text-sm">Across all modules</p>
                    </CardContent>
                </Card>

                {/* Upcoming Deadlines Count */}
                <Card className="card-cyber border-warning/20 hover:border-warning/40 transition-all duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-foreground text-lg">
                            <div className="p-2 bg-warning/10 rounded-lg">
                                <Clock className="h-5 w-5 text-warning" />
                            </div>
                            Upcoming
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-warning mb-2">{upcomingDeadlines.length}</p>
                        <p className="text-muted-foreground text-sm">Deadlines this week</p>
                    </CardContent>
                </Card>

                {/* Students with Missed Deadlines */}
                <Card className="card-cyber border-destructive/20 hover:border-destructive/40 transition-all duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-foreground text-lg">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-destructive mb-2">{studentsWithMissedDeadlines.length}</p>
                        <p className="text-muted-foreground text-sm">Missed recent deadline</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Module Completion Overview */}
                <Card className="card-cyber">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            Module Completion Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary/50">
                            {moduleCompletions.length > 0 ? (
                                moduleCompletions.map((module) => (
                                    <div key={module.module_id} className="border border-border/50 rounded-lg p-4 hover:border-accent/50 transition-all duration-300 bg-card/50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-foreground text-sm">{module.module_title}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {module.phase_title} • {module.section_title}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs border-accent/20 text-accent">
                                                {Math.round(module.completion_rate)}%
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Completed</span>
                                                <span className="text-foreground font-medium">
                                                    {module.completed_count}/{module.total_students}
                                                </span>
                                            </div>
                                            <Progress value={module.completion_rate} className="h-2 bg-secondary" />
                                        </div>
                                        {module.deadline && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Due: {format(new Date(module.deadline), 'MMM dd, yyyy')}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No modules found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card className="card-cyber">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-warning rounded-full"></div>
                            Upcoming Deadlines
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcomingDeadlines.length > 0 ? (
                                upcomingDeadlines.map((module) => (
                                    <div key={module.id} className="border border-border/50 rounded-lg p-4 hover:border-warning/50 transition-all duration-300 bg-card/50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-foreground text-sm">{module.title}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {module.section.phase.title} • {module.section.title}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20">
                                                {module.deadline ? format(new Date(module.deadline), 'MMM dd') : 'No deadline'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{module.description}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No upcoming deadlines</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Students with Missed Deadlines */}
            {studentsWithMissedDeadlines.length > 0 && (
                <Card className="mt-6 card-cyber border-destructive/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            Students Who Missed Recent Deadline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {studentsWithMissedDeadlines.map((item) => (
                                <div key={item.student.user_id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-destructive/30 transition-all duration-300 bg-card/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-primary">
                                                {item.student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{item.student.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{item.student.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">{item.module_title}</p>
                                        <Badge variant="destructive" className="text-xs">
                                            {item.days_overdue} day{item.days_overdue !== 1 ? 's' : ''} overdue
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default InstructorDashboard;
