import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { X, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Module {
    id: string;
    title: string;
    description: string;
    content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
    external_url: string | null;
    deadline: string | null;
}

interface MetadataFormProps {
    module: Module;
    onSubmit: (data: {
        id: string;
        title: string;
        description: string;
        content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
        external_url?: string;
        deadline?: string;
    }) => void;
    onCancel: () => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ module, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content_type: 'markdown' as 'text' | 'markdown' | 'external_link' | 'attachment',
        external_url: '',
        deadline: ''
    });

    // Initialize form data when module changes
    useEffect(() => {
        setFormData({
            title: module.title,
            description: module.description,
            content_type: module.content_type,
            external_url: module.external_url || '',
            deadline: module.deadline ? new Date(module.deadline).toISOString().slice(0, 16) : ''
        });
    }, [module]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            id: module.id,
            ...formData,
            external_url: formData.external_url || undefined,
            deadline: formData.deadline || undefined
        });
    };

    return (
        <Card className="bg-secondary/50 border-dashed border-primary/50">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground">Edit Module Metadata</h4>
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
                        <Label htmlFor="metadata-title">Title</Label>
                        <Input
                            id="metadata-title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Module title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metadata-description">Description</Label>
                        <Textarea
                            id="metadata-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the module"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metadata-content_type">Content Type</Label>
                        <Select
                            value={formData.content_type}
                            onValueChange={(value: 'text' | 'markdown' | 'external_link' | 'attachment') =>
                                setFormData({ ...formData, content_type: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="markdown">Markdown</SelectItem>
                                <SelectItem value="text">Plain Text</SelectItem>
                                <SelectItem value="external_link">External Link</SelectItem>
                                <SelectItem value="attachment">Attachment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.content_type === 'external_link' && (
                        <div className="space-y-2">
                            <Label htmlFor="metadata-external_url">External URL</Label>
                            <Input
                                id="metadata-external_url"
                                type="url"
                                value={formData.external_url}
                                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                placeholder="https://example.com"
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="metadata-deadline">Deadline (Optional)</Label>
                        <DatePicker
                            value={formData.deadline}
                            onChange={(value) => setFormData({ ...formData, deadline: value })}
                            placeholder="Select deadline"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Metadata
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

export default MetadataForm;
