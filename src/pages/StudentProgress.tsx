import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import SettingsDialog from '@/components/SettingsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2, Clock, Search, Users } from 'lucide-react';

interface ModuleWithStatus {
    id: string;
    title: string;
    sectionTitle: string;
    phaseTitle: string;
    deadline: string | null;
    isCompleted: boolean;
    completedAt: string | null;
}

interface StudentProgressSummary {
    user_id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    completedModules: number;
    totalModules: number;
    completionRate: number;
    modules: ModuleWithStatus[];
}

const StudentProgress: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [studentProgress, setStudentProgress] = useState<StudentProgressSummary[]>([]);
    const [publishedModuleCount, setPublishedModuleCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStudentProgress = useCallback(async () => {
        setIsFetching(true);

        const { data: modulesData, error: modulesError } = await supabase
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

        if (modulesError) {
            console.error('Error loading modules for progress view:', modulesError);
            setIsFetching(false);
            return;
        }

        const { data: studentsData, error: studentsError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .eq('role', 'student')
            .order('full_name');

        if (studentsError) {
            console.error('Error loading students for progress view:', studentsError);
            setIsFetching(false);
            return;
        }

        if (!studentsData) {
            setStudentProgress([]);
            setIsFetching(false);
            return;
        }

        const studentIds = studentsData.map(student => student.user_id).filter(Boolean);

        let progressRows: { user_id: string; module_id: string; is_completed: boolean; completed_at: string | null; }[] = [];

        if (studentIds.length > 0) {
            const { data: progressData, error: progressError } = await supabase
                .from('module_progress')
                .select('user_id, module_id, is_completed, completed_at')
                .in('user_id', studentIds);

            if (progressError) {
                console.error('Error loading module progress records:', progressError);
            } else if (progressData) {
                progressRows = progressData;
            }
        }

        const progressMap = new Map<string, Map<string, { is_completed: boolean; completed_at: string | null }>>();
        progressRows.forEach(progress => {
            if (!progressMap.has(progress.user_id)) {
                progressMap.set(progress.user_id, new Map());
            }
            progressMap.get(progress.user_id)?.set(progress.module_id, {
                is_completed: progress.is_completed,
                completed_at: progress.completed_at,
            });
        });

        const modules = modulesData ?? [];
        const totalModules = modules.length;
        setPublishedModuleCount(totalModules);

        const compiledProgress = studentsData.map<StudentProgressSummary>(student => {
            const moduleStatuses: ModuleWithStatus[] = modules.map(module => {
                const moduleProgress = progressMap.get(student.user_id)?.get(module.id);
                return {
                    id: module.id,
                    title: module.title,
                    sectionTitle: module.section?.title ?? 'Unassigned Section',
                    phaseTitle: module.section?.phase?.title ?? 'Unassigned Phase',
                    deadline: module.deadline,
                    isCompleted: moduleProgress?.is_completed ?? false,
                    completedAt: moduleProgress?.completed_at ?? null,
                };
            });

            const completedModules = moduleStatuses.filter(status => status.isCompleted).length;
            const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

            return {
                user_id: student.user_id,
                full_name: student.full_name ?? 'Unnamed Student',
                email: student.email,
                avatar_url: student.avatar_url,
                completedModules,
                totalModules,
                completionRate,
                modules: moduleStatuses,
            };
        });

        setStudentProgress(compiledProgress);
        setIsFetching(false);
    }, []);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            navigate('/auth');
            return;
        }

        if (profile?.role !== 'instructor') {
            navigate('/dashboard');
            return;
        }

        fetchStudentProgress();
    }, [fetchStudentProgress, loading, navigate, profile?.role, user]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) {
            return studentProgress;
        }

        const term = searchTerm.toLowerCase();
        return studentProgress.filter(student =>
            student.full_name.toLowerCase().includes(term) || (student.email?.toLowerCase().includes(term) ?? false)
        );
    }, [searchTerm, studentProgress]);

    const averageCompletion = useMemo(() => {
        if (studentProgress.length === 0) {
            return 0;
        }

        const totalRate = studentProgress.reduce((sum, student) => sum + student.completionRate, 0);
        return Math.round(totalRate / studentProgress.length);
    }, [studentProgress]);

    const totalStudents = studentProgress.length;

    return (
        <div className="min-h-screen bg-background">
            <Header currentPage="students" onSettingsClick={() => setSettingsOpen(true)} />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-4 pb-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Student Progress</h1>
                        <p className="text-sm text-muted-foreground">
                            Explore individual learner progress across published Beatroot Academy modules.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <Button variant="outline" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to dashboard
                        </Button>
                        <Button variant="cyber" onClick={fetchStudentProgress} disabled={isFetching}>
                            <Clock className="h-4 w-4" />
                            Refresh data
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="card-cyber border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-3 text-sm font-medium text-foreground">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                Active students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">{totalStudents}</p>
                        </CardContent>
                    </Card>
                    <Card className="card-cyber border-accent/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-3 text-sm font-medium text-foreground">
                                <div className="rounded-lg bg-accent/10 p-2">
                                    <CheckCircle2 className="h-5 w-5 text-accent" />
                                </div>
                                Avg. completion rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-accent">{averageCompletion}%</p>
                        </CardContent>
                    </Card>
                    <Card className="card-cyber border-warning/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-3 text-sm font-medium text-foreground">
                                <div className="rounded-lg bg-warning/10 p-2">
                                    <Clock className="h-5 w-5 text-warning" />
                                </div>
                                Published modules
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-warning">{publishedModuleCount}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="card-cyber">
                    <CardHeader>
                        <CardTitle className="text-foreground">Cohort progress overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email"
                                        value={searchTerm}
                                        onChange={event => setSearchTerm(event.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {filteredStudents.length} of {totalStudents} students shown
                                </p>
                            </div>

                            {isFetching ? (
                                <div className="flex justify-center py-12">
                                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-b-transparent"></div>
                                </div>
                            ) : filteredStudents.length > 0 ? (
                                <Accordion type="multiple" className="space-y-3">
                                    {filteredStudents.map(student => (
                                        <AccordionItem
                                            key={student.user_id}
                                            value={student.user_id}
                                            className="overflow-hidden rounded-xl border border-border/40 bg-card/40"
                                        >
                                            <AccordionTrigger className="flex flex-col items-start gap-4 px-4 py-3 text-left sm:flex-row sm:items-center sm:gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                        {student.full_name
                                                            .split(' ')
                                                            .map(name => name[0])
                                                            .join('')
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="text-sm">
                                                        <p className="font-semibold text-foreground">{student.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{student.email ?? 'No email recorded'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex w-full flex-col gap-2 sm:max-w-sm">
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>Completed</span>
                                                        <span className="font-medium text-foreground">
                                                            {student.completedModules}/{student.totalModules}
                                                        </span>
                                                    </div>
                                                    <Progress value={student.completionRate} className="h-2 bg-secondary" />
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {Math.round(student.completionRate)}% complete
                                                </Badge>
                                            </AccordionTrigger>
                                            <AccordionContent className="border-t border-border/40 bg-background/60">
                                                <div className="space-y-2 p-4">
                                                    {student.modules.length > 0 ? (
                                                        student.modules.map(module => (
                                                            <div
                                                                key={module.id}
                                                                className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-medium text-foreground">{module.title}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {module.phaseTitle} • {module.sectionTitle}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-start gap-2 sm:items-end">
                                                                    <Badge variant={module.isCompleted ? 'default' : 'outline'} className="text-xs">
                                                                        {module.isCompleted ? 'Completed' : 'In progress'}
                                                                    </Badge>
                                                                    {module.deadline && (
                                                                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                                            Due {format(new Date(module.deadline), 'MMM dd, yyyy')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="py-4 text-sm text-muted-foreground">No published modules available.</p>
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No students match your search query.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
};

export default StudentProgress;
