import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Section {
    id: string;
    title: string;
    description: string;
    section_order: number;
    modules: Array<{
        id: string;
        title: string;
        description: string;
        module_order: number;
    }>;
}

interface DraggableSectionProps {
    section: Section;
    children: React.ReactNode;
    isInstructor: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
}

const DraggableSection: React.FC<DraggableSectionProps> = ({ section, children, isInstructor, onDelete, onEdit }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`space-y-4 ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="border-l-2 border-primary/30 pl-4">
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
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                        <p className="text-muted-foreground text-sm">{section.description}</p>
                    </div>
                    {isInstructor && (
                        <div className="flex items-center gap-1">
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onEdit}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDelete}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
};

export default DraggableSection;
