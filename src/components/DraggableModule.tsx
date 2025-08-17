import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, GripVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

interface DraggableModuleProps {
    module: Module;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isInstructor: boolean;
}

const DraggableModule: React.FC<DraggableModuleProps> = ({ module, onClick, onEdit, onDelete, isInstructor }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isCompleted = module.module_progress &&
        module.module_progress.length > 0 &&
        module.module_progress[0].is_completed;

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`bg-secondary/50 border-border hover:border-primary/50 transition-all cursor-pointer group ${isDragging ? 'opacity-50 shadow-lg' : ''
                }`}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {isInstructor && (
                            <div
                                {...attributes}
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
                            >
                                <GripVertical className="h-4 w-4" />
                            </div>
                        )}
                        <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2">
                        {isCompleted && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                        {isInstructor && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit();
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <h4 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                    {module.title}
                </h4>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {module.description}
                </p>

                <div className="flex items-center justify-between">
                    <Badge
                        variant={isCompleted ? "default" : "secondary"}
                        className="text-xs"
                    >
                        {isCompleted ? "Completed" : "In Progress"}
                    </Badge>

                    {module.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(module.deadline), 'MMM dd')}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default DraggableModule;
