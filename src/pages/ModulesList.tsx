import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, CheckCircle, Clock, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import ModuleForm from '@/components/ModuleForm';
import SectionForm from '@/components/SectionForm';
import MetadataForm from '@/components/MetadataForm';
import DraggableModule from '@/components/DraggableModule';
import DraggableSection from '@/components/DraggableSection';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';
import SettingsDialog from '@/components/SettingsDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Phase {
  id: string;
  title: string;
  description: string;
  phase_order: number;
  sections: Section[];
}

interface Section {
  id: string;
  title: string;
  description: string;
  section_order: number;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
  external_url: string | null;
  deadline: string | null;
  module_order: number;
  module_progress?: {
    is_completed: boolean;
    completed_at: string | null;
  }[];
}

const ModulesList = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isAddingModule, setIsAddingModule] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [deleteModuleTitle, setDeleteModuleTitle] = useState('');
  const [deleteSectionTitle, setDeleteSectionTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchPhasesWithModules = useCallback(async () => {
    setIsLoadingModules(true);
    try {
      const { data: phasesData } = await supabase
        .from('phases')
        .select(`
          id,
          title,
          description,
          phase_order,
          sections (
            id,
            title,
            description,
            section_order,
            modules (
              id,
              title,
              description,
              content,
              content_type,
              external_url,
              deadline,
              module_order,
              module_progress (
                is_completed,
                completed_at
              )
            )
          )
        `)
        .order('phase_order');

      if (phasesData) {
        // Sort sections and modules within each phase
        const sortedPhases = phasesData.map(phase => ({
          ...phase,
          sections: phase.sections
            .sort((a, b) => a.section_order - b.section_order)
            .map(section => ({
              ...section,
              modules: section.modules.sort((a, b) => a.module_order - b.module_order)
            }))
        }));

        setPhases(sortedPhases);
      }
    } catch (error) {
      console.error('Error fetching phases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load modules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingModules(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPhasesWithModules();
    }
  }, [user, fetchPhasesWithModules]);

  const getTotalProgress = () => {
    let total = 0;
    let completed = 0;

    phases.forEach(phase => {
      phase.sections.forEach(section => {
        section.modules.forEach(module => {
          total++;
          if (module.module_progress &&
            module.module_progress.length > 0 &&
            module.module_progress[0].is_completed) {
            completed++;
          }
        });
      });
    });

    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const progress = getTotalProgress();

  const handleAddModule = async (sectionId: string, moduleData: {
    title: string;
    description: string;
    content: string;
    content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
    external_url?: string;
  }) => {
    try {
      // Get the current highest module_order in this section
      const { data: existingModules } = await supabase
        .from('modules')
        .select('module_order')
        .eq('section_id', sectionId)
        .order('module_order', { ascending: false })
        .limit(1);

      const nextOrder = existingModules && existingModules.length > 0
        ? existingModules[0].module_order + 1
        : 1;

      const { error } = await supabase
        .from('modules')
        .insert({
          section_id: sectionId,
          title: moduleData.title.trim(),
          description: moduleData.description.trim(),
          content: moduleData.content,
          content_type: moduleData.content_type,
          external_url: moduleData.external_url || null,
          module_order: nextOrder,
          is_published: true
        });

      if (error) throw error;

      // Refresh the data
      fetchPhasesWithModules();
      setIsAddingModule(null);

      toast({
        title: 'Module added',
        description: 'The module has been successfully created.',
      });
    } catch (error) {
      console.error('Error adding module:', error);
      toast({
        title: 'Error',
        description: 'Failed to add module. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddSection = async (phaseId: string, sectionData: {
    title: string;
    description: string;
  }) => {
    try {
      // Get the current highest section_order in this phase
      const { data: existingSections } = await supabase
        .from('sections')
        .select('section_order')
        .eq('phase_id', phaseId)
        .order('section_order', { ascending: false })
        .limit(1);

      const nextOrder = existingSections && existingSections.length > 0
        ? existingSections[0].section_order + 1
        : 1;

      const { error } = await supabase
        .from('sections')
        .insert({
          phase_id: phaseId,
          title: sectionData.title.trim(),
          description: sectionData.description.trim(),
          section_order: nextOrder
        });

      if (error) throw error;

      // Refresh the data
      fetchPhasesWithModules();
      setIsAddingSection(null);

      toast({
        title: 'Section added',
        description: 'The section has been successfully created.',
      });
    } catch (error) {
      console.error('Error adding section:', error);
      toast({
        title: 'Error',
        description: 'Failed to add section. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditModule = async (moduleData: {
    id: string;
    title: string;
    description: string;
    content: string;
    content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
    external_url?: string;
    deadline?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          title: moduleData.title.trim(),
          description: moduleData.description.trim(),
          content: moduleData.content,
          content_type: moduleData.content_type,
          external_url: moduleData.external_url || null,
          deadline: moduleData.deadline || null
        })
        .eq('id', moduleData.id);

      if (error) throw error;

      // Refresh the data
      fetchPhasesWithModules();
      setEditingModule(null);

      toast({
        title: 'Module updated',
        description: 'The module has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditSection = async (sectionId: string, sectionData: {
    title: string;
    description: string;
  }) => {
    try {
      const { error } = await supabase
        .from('sections')
        .update({
          title: sectionData.title.trim(),
          description: sectionData.description.trim()
        })
        .eq('id', sectionId);

      if (error) throw error;

      // Refresh the data
      fetchPhasesWithModules();
      setEditingSection(null);

      toast({
        title: 'Section updated',
        description: 'The section has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to update section. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleModuleDragEnd = async (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const section = phases
        .flatMap(phase => phase.sections)
        .find(s => s.id === sectionId);

      if (section) {
        const oldIndex = section.modules.findIndex(module => module.id === active.id);
        const newIndex = section.modules.findIndex(module => module.id === over?.id);

        const newModules = arrayMove(section.modules, oldIndex, newIndex);

        // Update local state immediately for smooth UX
        setPhases(prevPhases =>
          prevPhases.map(phase => ({
            ...phase,
            sections: phase.sections.map(s =>
              s.id === sectionId
                ? { ...s, modules: newModules }
                : s
            )
          }))
        );

        // Update database
        try {
          for (let i = 0; i < newModules.length; i++) {
            const { error } = await supabase
              .from('modules')
              .update({ module_order: i + 1 })
              .eq('id', newModules[i].id);

            if (error) throw error;
          }
        } catch (error) {
          console.error('Error updating module order:', error);
          // Revert local state on error
          fetchPhasesWithModules();
        }
      }
    }
  };

  const handleSectionDragEnd = async (event: DragEndEvent, phaseId: string) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const phase = phases.find(p => p.id === phaseId);

      if (phase) {
        const oldIndex = phase.sections.findIndex(section => section.id === active.id);
        const newIndex = phase.sections.findIndex(section => section.id === over?.id);

        const newSections = arrayMove(phase.sections, oldIndex, newIndex);

        // Update local state immediately for smooth UX
        setPhases(prevPhases =>
          prevPhases.map(p =>
            p.id === phaseId
              ? { ...p, sections: newSections }
              : p
          )
        );

        // Update database
        try {
          for (let i = 0; i < newSections.length; i++) {
            const { error } = await supabase
              .from('sections')
              .update({ section_order: i + 1 })
              .eq('id', newSections[i].id);

            if (error) throw error;
          }
        } catch (error) {
          console.error('Error updating section order:', error);
          // Revert local state on error
          fetchPhasesWithModules();
        }
      }
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      // Refresh the data
      fetchPhasesWithModules();
      setDeleteModuleId(null);

      toast({
        title: 'Module deleted',
        description: 'The module has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete module. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      // Refresh the data
      fetchPhasesWithModules();
      setDeleteSectionId(null);

      toast({
        title: 'Section deleted',
        description: 'The section and all its modules have been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete section. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getModuleToDelete = () => {
    if (!deleteModuleId) return null;
    for (const phase of phases) {
      for (const section of phase.sections) {
        const module = section.modules.find(m => m.id === deleteModuleId);
        if (module) return module;
      }
    }
    return null;
  };

  const getSectionToDelete = () => {
    if (!deleteSectionId) return null;
    for (const phase of phases) {
      const section = phase.sections.find(s => s.id === deleteSectionId);
      if (section) return section;
    }
    return null;
  };

  const getSectionToEdit = () => {
    if (!editingSection) return null;
    for (const phase of phases) {
      const section = phase.sections.find(s => s.id === editingSection);
      if (section) return section;
    }
    return null;
  };

  const moduleToDelete = getModuleToDelete();
  const sectionToDelete = getSectionToDelete();
  const sectionToEdit = getSectionToEdit();

  if (loading || isLoadingModules) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : 'Loading modules...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="curriculum" onSettingsClick={() => setSettingsOpen(true)} />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {phases.map((phase) => (
            <Card key={phase.id} className="card-cyber border-accent/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-primary rounded-full"></div>
                  <div>
                    <CardTitle className="text-xl text-foreground">{phase.title}</CardTitle>
                    <p className="text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleSectionDragEnd(event, phase.id)}
                >
                  <SortableContext
                    items={phase.sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-6">
                      {phase.sections.map((section) => (
                        <DraggableSection
                          key={section.id}
                          section={section}
                          isInstructor={profile?.role === 'instructor'}
                          onDelete={() => setDeleteSectionId(section.id)}
                          onEdit={() => setEditingSection(section.id)}
                        >
                          {editingSection === section.id ? (
                            <SectionForm
                              section={sectionToEdit}
                              onSubmit={(data) => handleEditSection(editingSection, data)}
                              onCancel={() => setEditingSection(null)}
                            />
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleModuleDragEnd(event, section.id)}
                            >
                              <SortableContext
                                items={section.modules.map(m => m.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ml-6">
                                  {section.modules.map((module) => (
                                    editingModule === module.id ? (
                                      <MetadataForm
                                        key={module.id}
                                        module={module}
                                        onSubmit={handleEditModule}
                                        onCancel={() => setEditingModule(null)}
                                      />
                                    ) : (
                                      <DraggableModule
                                        key={module.id}
                                        module={module}
                                        onClick={() => navigate(`/modules/${module.id}`)}
                                        onEdit={() => setEditingModule(module.id)}
                                        onDelete={() => setDeleteModuleId(module.id)}
                                        isInstructor={profile?.role === 'instructor'}
                                      />
                                    )
                                  ))}

                                  {/* Add Module Button */}
                                  {profile?.role === 'instructor' && (
                                    isAddingModule === section.id ? (
                                      <ModuleForm
                                        onSubmit={(data) => handleAddModule(section.id, data)}
                                        onCancel={() => setIsAddingModule(null)}
                                      />
                                    ) : (
                                      <Card
                                        className="bg-secondary/30 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer group"
                                        onClick={() => setIsAddingModule(section.id)}
                                      >
                                        <CardContent className="p-4 flex items-center justify-center h-full min-h-[120px]">
                                          <div className="text-center">
                                            <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground group-hover:text-primary">
                                              Add Module
                                            </p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )
                                  )}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </DraggableSection>
                      ))}

                      {/* Add Section Button */}
                      {profile?.role === 'instructor' && (
                        isAddingSection === phase.id ? (
                          <SectionForm
                            onSubmit={(data) => handleAddSection(phase.id, data)}
                            onCancel={() => setIsAddingSection(null)}
                          />
                        ) : (
                          <div className="ml-6">
                            <Card
                              className="bg-secondary/30 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer group"
                              onClick={() => setIsAddingSection(phase.id)}
                            >
                              <CardContent className="p-6 flex items-center justify-center">
                                <div className="text-center">
                                  <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground group-hover:text-primary">
                                    Add Section
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Module Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteModuleId} onOpenChange={() => {
        setDeleteModuleId(null);
        setDeleteModuleTitle('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this module? This action cannot be undone and will also delete all associated progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-module-title" className="text-sm font-medium">
                To confirm deletion, please type the exact module title:
              </Label>
              <div className="mt-1 text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {moduleToDelete?.title}
              </div>
            </div>
            <div>
              <Input
                id="delete-module-title"
                value={deleteModuleTitle}
                onChange={(e) => setDeleteModuleTitle(e.target.value)}
                placeholder="Type the module title to confirm"
                className="font-mono"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteModuleId(null);
              setDeleteModuleTitle('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModuleId && handleDeleteModule(deleteModuleId)}
              disabled={deleteModuleTitle.trim() !== moduleToDelete?.title}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSectionId} onOpenChange={() => {
        setDeleteSectionId(null);
        setDeleteSectionTitle('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This action cannot be undone and will also delete all modules and progress data within this section.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-section-title" className="text-sm font-medium">
                To confirm deletion, please type the exact section title:
              </Label>
              <div className="mt-1 text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {sectionToDelete?.title}
              </div>
            </div>
            <div>
              <Input
                id="delete-section-title"
                value={deleteSectionTitle}
                onChange={(e) => setDeleteSectionTitle(e.target.value)}
                placeholder="Type the section title to confirm"
                className="font-mono"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteSectionId(null);
              setDeleteSectionTitle('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSectionId && handleDeleteSection(deleteSectionId)}
              disabled={deleteSectionTitle.trim() !== sectionToDelete?.title}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default ModulesList;