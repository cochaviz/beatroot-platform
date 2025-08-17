import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, CheckCircle, Clock, Edit, ExternalLink, FileText, Link } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import MetadataForm from '@/components/MetadataForm';
import ContentForm from '@/components/ContentForm';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';
import SettingsDialog from '@/components/SettingsDialog';

interface ModuleDetail {
  id: string;
  title: string;
  description: string;
  content: string;
  content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
  external_url: string | null;
  deadline: string | null;
  module_order: number;
  section: {
    id: string;
    title: string;
    section_order: number;
    phase: {
      id: string;
      title: string;
      phase_order: number;
    };
  };
  module_progress?: {
    is_completed: boolean;
    completed_at: string | null;
  }[];
}

interface NavigationModule {
  id: string;
  title: string;
  module_order: number;
  is_completed?: boolean;
}

const ModuleDetail = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [prevModule, setPrevModule] = useState<NavigationModule | null>(null);
  const [nextModule, setNextModule] = useState<NavigationModule | null>(null);
  const [phaseSections, setPhaseSections] = useState<Array<{
    id: string;
    title: string;
    modules: NavigationModule[];
  }>>([]);
  const [isCompletingModule, setIsCompletingModule] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoadingTOC, setIsLoadingTOC] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Reset navigation state when moduleId changes
    setIsNavigating(false);
    setNextModule(null);
    setPrevModule(null);
  }, [moduleId]);

  const fetchModuleDetails = useCallback(async () => {
    if (!user) return;

    try {
      // First get the module data
      const { data: moduleData } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          content,
          content_type,
          external_url,
          deadline,
          module_order,
          section:sections (
            id,
            title,
            section_order,
            phase:phases (
              id,
              title,
              phase_order
            )
          )
        `)
        .eq('id', moduleId)
        .single();

      if (moduleData) {
        // Get user-specific progress
        const { data: progressData } = await supabase
          .from('module_progress')
          .select('is_completed, completed_at')
          .eq('module_id', moduleId)
          .eq('user_id', user.id)
          .maybeSingle();

        // Attach progress data to module
        const moduleWithProgress = {
          ...moduleData,
          module_progress: progressData ? [progressData] : []
        };

        setModule(moduleWithProgress);
      }
    } catch (error) {
      console.error('Error fetching module details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load module details. Please try again.',
        variant: 'destructive',
      });
    }
  }, [moduleId, user, toast]);

  const updateNavigation = useCallback((sectionsWithModules: Array<{ id: string; title: string; modules: NavigationModule[] }>) => {
    // Flatten all modules in order
    const allModules: NavigationModule[] = [];
    sectionsWithModules.forEach(section => {
      allModules.push(...section.modules);
    });

    // Find current module index
    const currentIndex = allModules.findIndex(m => m.id === moduleId);

    if (currentIndex === -1) {
      setPrevModule(null);
      setNextModule(null);
      return;
    }

    // Set previous module
    if (currentIndex > 0) {
      setPrevModule(allModules[currentIndex - 1]);
    } else {
      setPrevModule(null);
    }

    // Set next module
    if (currentIndex < allModules.length - 1) {
      setNextModule(allModules[currentIndex + 1]);
    } else {
      setNextModule(null);
    }
  }, [moduleId]);

  const fetchPhaseStructure = useCallback(async () => {
    if (!user) return;

    setIsLoadingTOC(true);

    try {
      // First get the current module to find its phase
      const { data: currentModule } = await supabase
        .from('modules')
        .select(`
          section:sections (
            phase:phases (
              id,
              title,
              phase_order
            )
          )
        `)
        .eq('id', moduleId)
        .single();

      if (!currentModule) return;

      const phaseId = currentModule.section.phase.id;

      // Get the complete phase structure
      const { data: phaseData } = await supabase
        .from('phases')
        .select(`
          id,
          title,
          phase_order,
          sections(
            id,
            title,
            section_order,
            modules(
              id,
              title,
              module_order,
              is_published
            )
          )
        `)
        .eq('id', phaseId)
        .single();

      if (phaseData && phaseData.sections) {
        // Get all module IDs in this phase
        const allModuleIds: string[] = [];
        phaseData.sections.forEach(section => {
          if (section.modules) {
            section.modules
              .filter(module => module.is_published)
              .forEach(module => allModuleIds.push(module.id));
          }
        });

        // Fetch progress for all modules in this phase
        const { data: progressData } = await supabase
          .from('module_progress')
          .select('module_id, is_completed')
          .eq('user_id', user.id)
          .in('module_id', allModuleIds);

        // Create a map of module_id to completion status
        const progressMap = new Map<string, boolean>();
        if (progressData) {
          progressData.forEach(progress => {
            progressMap.set(progress.module_id, progress.is_completed);
          });
        }

        const sectionsWithModules = phaseData.sections
          .sort((a, b) => a.section_order - b.section_order)
          .map(section => ({
            id: section.id,
            title: section.title,
            modules: (section.modules || [])
              .filter(module => module.is_published)
              .sort((a, b) => a.module_order - b.module_order)
              .map(module => ({
                ...module,
                is_completed: progressMap.get(module.id) || false
              }))
          }));

        setPhaseSections(sectionsWithModules);
        updateNavigation(sectionsWithModules);
      }
    } catch (error) {
      console.error('Error fetching phase structure:', error);
      toast({
        title: 'Error',
        description: 'Failed to load navigation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTOC(false);
    }
  }, [moduleId, user, toast, updateNavigation]);

  useEffect(() => {
    if (moduleId && user) {
      fetchModuleDetails();
      fetchPhaseStructure();
    }
  }, [moduleId, user, fetchModuleDetails, fetchPhaseStructure]);

  const refreshModuleData = async () => {
    // Re-fetch module details and phase structure after updates
    await Promise.all([
      fetchModuleDetails(),
      fetchPhaseStructure()
    ]);
  };

  const handleCompleteModule = async () => {
    if (!module || !user) return;

    setIsCompletingModule(true);

    const isCompleted = module.module_progress &&
      module.module_progress.length > 0 &&
      module.module_progress[0].is_completed;

    try {
      if (isCompleted) {
        // Mark as incomplete - update the existing record
        const { error } = await supabase
          .from('module_progress')
          .update({
            is_completed: false,
            completed_at: null
          })
          .eq('user_id', user.id)
          .eq('module_id', module.id);

        if (error) throw error;

        toast({
          title: 'Module marked as incomplete',
          description: 'You can review this module again.',
        });
      } else {
        // Mark as complete - upsert to handle existing records
        const { error } = await supabase
          .from('module_progress')
          .upsert({
            user_id: user.id,
            module_id: module.id,
            is_completed: true,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,module_id'
          });

        if (error) throw error;

        toast({
          title: 'Module completed!',
          description: 'Great job! Keep up the excellent work.',
        });
      }

      // Refresh module data
      refreshModuleData();
    } catch (error) {
      console.error('Error updating module progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCompletingModule(false);
    }
  };

  const handleEditMetadata = async (moduleData: {
    id: string;
    title: string;
    description: string;
    content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
    external_url?: string;
    deadline?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          title: moduleData.title,
          description: moduleData.description,
          content_type: moduleData.content_type,
          external_url: moduleData.external_url || null,
          deadline: moduleData.deadline || null
        })
        .eq('id', moduleData.id);

      if (error) throw error;

      // Refresh the module data
      refreshModuleData();
      setIsEditingMetadata(false);

      toast({
        title: 'Metadata updated',
        description: 'Module metadata has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating module metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module metadata. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditContent = async (moduleData: {
    id: string;
    content: string;
    external_url?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          content: moduleData.content,
          external_url: moduleData.external_url || null
        })
        .eq('id', moduleData.id);

      if (error) throw error;

      // Refresh the module data
      refreshModuleData();
      setIsEditingContent(false);

      toast({
        title: 'Content updated',
        description: 'Module content has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating module content:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module content. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNavigation = (moduleId: string) => {
    setIsNavigating(true);
    navigate(`/modules/${moduleId}`);
  };

  const handleBackToOverview = () => {
    setIsNavigating(true);
    navigate('/modules');
  };

  const renderContent = () => {
    if (!module) return null;

    switch (module.content_type) {
      case 'external_link':
        return (
          <div className="space-y-6">
            <div className="bg-secondary/50 border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Link className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">External Resource</h3>
                  <p className="text-muted-foreground mb-4">{module.description}</p>
                  {module.external_url && (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        <strong>URL:</strong> {module.external_url}
                      </div>
                      <Button
                        variant="default"
                        onClick={() => window.open(module.external_url!, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open External Resource
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'markdown':
        return (
          <div className="space-y-6">
            <MarkdownRenderer content={module.content || ''} />
            {module.external_url && (
              <div className="bg-secondary/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Additional Resources</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(module.external_url!, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  View External Resource
                </Button>
              </div>
            )}
          </div>
        );
      case 'text':
      default:
        return (
          <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {module.content}
              </div>
            </div>
            {module.external_url && (
              <div className="bg-secondary/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Additional Resources</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(module.external_url!, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  View External Resource
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  if (loading || !module) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  const isCompleted = module.module_progress &&
    module.module_progress.length > 0 &&
    module.module_progress[0].is_completed;

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="curriculum" onSettingsClick={() => setSettingsOpen(true)} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          {/* Main Content - Truly centered on page */}
          <div className="relative w-full max-w-4xl">
            {/* Table of Contents - Positioned relative to centered content */}
            <div className="absolute left-[-280px] top-0 w-64">
              <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <Card className="card-cyber border-accent/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-foreground">
                      Table of Contents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoadingTOC ? (
                      <div className="p-4 space-y-3">
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {phaseSections && phaseSections.length > 0 ? (
                          phaseSections.map((section) => (
                            <div key={section.id} className="space-y-1">
                              {/* Section Header */}
                              <div className="px-4 py-2 text-sm font-medium text-foreground bg-secondary/30 border-b border-border">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-muted-foreground/50 rounded-sm" />
                                  </div>
                                  <span className="truncate">{section.title}</span>
                                </div>
                              </div>

                              {/* Section Modules */}
                              <div className="space-y-0.5">
                                {section.modules.map((module) => (
                                  <button
                                    key={module.id}
                                    onClick={() => navigate(`/modules/${module.id}`)}
                                    className={`w-full text-left px-6 py-2 text-sm transition-colors ${module.id === moduleId
                                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 flex items-center justify-center">
                                        {module.id === moduleId ? (
                                          <div className="w-2 h-2 bg-primary rounded-full" />
                                        ) : module.is_completed ? (
                                          <CheckCircle className="w-3 h-3 text-green-500" />
                                        ) : (
                                          <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                                        )}
                                      </div>
                                      <span className={`truncate ${module.is_completed ? 'text-green-600' : ''}`}>
                                        {module.title}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            No modules found in this phase.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Area */}
            {/* Module Metadata Panel */}
            <Card className="mb-6 card-cyber border-accent/20">
              <CardContent className="pt-6 px-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {module.section.phase.title}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">
                        {module.section.title}
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-3">{module.title}</h1>
                    {module.description && (
                      <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
                        {module.description}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {module.deadline && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Due: {format(new Date(module.deadline), 'MMMM dd, yyyy')}
                        </div>
                      )}
                      {isCompleted && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {profile?.role === 'instructor' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Metadata
                    </Button>
                  )}
                </div>

                {/* Edit Metadata Form */}
                {isEditingMetadata && (
                  <div className="pt-4 border-t border-border">
                    <MetadataForm
                      module={module}
                      onSubmit={handleEditMetadata}
                      onCancel={() => setIsEditingMetadata(false)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Module Content */}
            <Card className="mb-6 card-cyber relative">
              {profile?.role === 'instructor' && (
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setIsEditingContent(!isEditingContent)}
                  >
                    <Edit className="h-4 w-4" />
                    {isEditingContent ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              )}
              <CardContent className="pt-6 px-8">
                {isEditingContent ? (
                  <ContentForm
                    module={module}
                    onSubmit={handleEditContent}
                    onCancel={() => setIsEditingContent(false)}
                  />
                ) : (
                  renderContent()
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              {prevModule ? (
                <Button
                  variant="outline"
                  onClick={() => handleNavigation(prevModule.id)}
                  disabled={isNavigating}
                  className="flex items-center gap-2"
                >
                  {isNavigating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
                  <ArrowLeft className="h-4 w-4" />
                  Previous: {prevModule.title}
                </Button>
              ) : (
                <div className="w-32" />
              )}

              {/* Complete Module Button */}
              <Button
                variant={isCompleted ? "outline" : "hero"}
                onClick={handleCompleteModule}
                disabled={isCompletingModule}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isCompleted ? 'Mark Incomplete' : 'Complete Module'}
              </Button>

              {nextModule ? (
                <Button
                  variant={isCompleted ? "hero" : "outline"}
                  onClick={() => handleNavigation(nextModule.id)}
                  disabled={isNavigating || !isCompleted}
                  className="flex items-center gap-2"
                >
                  Next: {nextModule.title}
                  {isNavigating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              ) : (
                <Button
                  variant={isCompleted ? "hero" : "outline"}
                  onClick={handleBackToOverview}
                  disabled={isNavigating || !isCompleted}
                  className="flex items-center gap-2"
                >
                  Back to Overview
                  {isNavigating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
};

export default ModuleDetail;