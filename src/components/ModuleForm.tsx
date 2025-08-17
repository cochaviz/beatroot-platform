import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ModuleFormProps {
    onSubmit: (data: {
        title: string;
        description: string;
        content: string;
        content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
        external_url?: string;
    }) => void;
    onCancel: () => void;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content_type: 'markdown' as 'text' | 'markdown' | 'external_link' | 'attachment',
        external_url: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            content: formData.content_type === 'external_link' ? '' : '# New Module\n\nAdd your content here...',
            external_url: formData.external_url || undefined,
            deadline: undefined
        });
    };

    return (
        <Card className="bg-secondary/50 border-dashed border-primary/50">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground">Add New Module</h4>
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
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Module title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the module"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content_type">Content Type</Label>
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
                            <Label htmlFor="external_url">External URL</Label>
                            <Input
                                id="external_url"
                                type="url"
                                value={formData.external_url}
                                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                placeholder="https://example.com"
                                required
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Add Module
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

export default ModuleForm;
