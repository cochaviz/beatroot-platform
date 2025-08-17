import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Section {
    id: string;
    title: string;
    description: string;
    section_order: number;
}

interface SectionFormProps {
    section?: Section; // Optional - if provided, we're editing; if not, we're adding
    onSubmit: (data: {
        title: string;
        description: string;
    }) => void;
    onCancel: () => void;
}

const SectionForm: React.FC<SectionFormProps> = ({ section, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    // Initialize form data when section changes (for editing)
    useEffect(() => {
        if (section) {
            setFormData({
                title: section.title,
                description: section.description
            });
        }
    }, [section]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isEditing = !!section;

    return (
        <Card className="bg-secondary/50 border-dashed border-primary/50">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground">
                            {isEditing ? 'Edit Section' : 'Add New Section'}
                        </h4>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section-title">Title</Label>
                        <Input
                            id="section-title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Section title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section-description">Description</Label>
                        <Textarea
                            id="section-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the section"
                            required
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {isEditing ? 'Update Section' : 'Add Section'}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default SectionForm;
