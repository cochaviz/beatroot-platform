import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Module {
    id: string;
    content: string;
    content_type: 'text' | 'markdown' | 'external_link' | 'attachment';
    external_url: string | null;
}

interface ContentFormProps {
    module: Module;
    onSubmit: (data: {
        id: string;
        content: string;
        external_url?: string;
    }) => void;
    onCancel: () => void;
}

const ContentForm: React.FC<ContentFormProps> = ({ module, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        content: '',
        external_url: ''
    });

    // Initialize form data when module changes
    useEffect(() => {
        setFormData({
            content: module.content || '',
            external_url: module.external_url || ''
        });
    }, [module]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            id: module.id,
            content: formData.content,
            external_url: formData.external_url || undefined
        });
    };

    if (module.content_type === 'external_link') {
        return (
            <Card className="bg-secondary/50 border-dashed border-primary/50">
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-foreground">Edit External Link</h4>
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
                            <Label htmlFor="content-external_url">External URL</Label>
                            <Input
                                id="content-external_url"
                                type="url"
                                value={formData.external_url}
                                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                placeholder="https://example.com"
                                required
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" size="sm" className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Save Content
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-secondary/50 border-dashed border-primary/50">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground">Edit Module Content</h4>
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

                    <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="content-textarea">
                                    {module.content_type === 'markdown' ? 'Markdown Content' : 'Text Content'}
                                </Label>
                                <Textarea
                                    id="content-textarea"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder={
                                        module.content_type === 'markdown'
                                            ? "# Module Content\n\nWrite your markdown content here..."
                                            : "Module content"
                                    }
                                    rows={12}
                                    className="font-mono"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Preview</Label>
                                <div className="border border-border rounded-md p-4 bg-background min-h-[200px]">
                                    {module.content_type === 'markdown' ? (
                                        <MarkdownRenderer content={formData.content || '*No content to preview*'} />
                                    ) : (
                                        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                                            {formData.content || 'No content to preview'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Content
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

export default ContentForm;
