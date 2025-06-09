'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Heart, 
  MessageSquare, 
  Star, 
  Plus, 
  Eye, 
  Copy,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { MediaService, MessageTemplate } from '@/lib/media-service';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplatesProps {
  onTemplateSelect?: (content: string) => void;
  onTemplateCreate?: (template: MessageTemplate) => void;
}

const templateCategories = [
  { id: 'farewell', name: 'Farewell', icon: Heart, color: 'text-red-400' },
  { id: 'birthday', name: 'Birthday', icon: Star, color: 'text-yellow-400' },
  { id: 'anniversary', name: 'Anniversary', icon: Heart, color: 'text-pink-400' },
  { id: 'advice', name: 'Advice', icon: MessageSquare, color: 'text-blue-400' },
  { id: 'love', name: 'Love', icon: Heart, color: 'text-purple-400' },
  { id: 'apology', name: 'Apology', icon: MessageSquare, color: 'text-orange-400' },
];

export function MessageTemplates({ onTemplateSelect, onTemplateCreate }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  
  // Create template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    content: ''
  });

  // Template variables form
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({
    recipient_name: '',
    sender_name: '',
    personal_message: '',
    birthday_message: '',
    wisdom_content: '',
    love_message: ''
  });

  const mediaService = MediaService.getInstance();
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const fetchedTemplates = await mediaService.getMessageTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load message templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const createTemplate = async () => {
    try {
      if (!newTemplate.name || !newTemplate.category || !newTemplate.content) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const templateId = await mediaService.createMessageTemplate(
        newTemplate.name,
        newTemplate.description,
        newTemplate.category,
        newTemplate.content
      );

      if (templateId) {
        toast({
          title: 'Template Created',
          description: 'Your message template has been saved',
          variant: 'default'
        });

        // Reset form
        setNewTemplate({
          name: '',
          description: '',
          category: '',
          content: ''
        });
        setShowCreateDialog(false);

        // Refresh templates
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      });
    }
  };

  const useTemplate = async (template: MessageTemplate) => {
    try {
      const content = await mediaService.useTemplate(template.id, templateVariables);
      onTemplateSelect?.(content);
      
      toast({
        title: 'Template Applied',
        description: 'Template content has been added to your message',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply template',
        variant: 'destructive'
      });
    }
  };

  const previewTemplate = (template: MessageTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewDialog(true);
  };

  const copyTemplate = async (template: MessageTemplate) => {
    try {
      await navigator.clipboard.writeText(template.content_template);
      toast({
        title: 'Copied',
        description: 'Template content copied to clipboard',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error copying template:', error);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return templateCategories.find(cat => cat.id === categoryId) || {
      id: categoryId,
      name: categoryId,
      icon: MessageSquare,
      color: 'text-slate-400'
    };
  };

  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-12 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded mb-4"></div>
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Message Templates
            </CardTitle>
            <CardDescription>
              Choose from pre-written templates or create your own
            </CardDescription>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Template</DialogTitle>
                <DialogDescription>
                  Create a reusable message template for future use
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name" className="text-slate-300">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="My Custom Template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category" className="text-slate-300">Category</Label>
                    <Select 
                      value={newTemplate.category} 
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="template-description" className="text-slate-300">Description</Label>
                  <Input
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Brief description of the template"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-content" className="text-slate-300">Template Content</Label>
                  <Textarea
                    id="template-content"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white min-h-32"
                    placeholder="Write your template content here. Use {recipient_name}, {sender_name}, etc. for variables."
                    rows={8}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use variables like {'{recipient_name}'}, {'{sender_name}'}, {'{personal_message}'} for dynamic content
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createTemplate}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                  >
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {templateCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Variables */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white text-sm">Template Variables</CardTitle>
            <CardDescription className="text-xs">
              Fill in these variables to personalize your templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="recipient-name" className="text-slate-300 text-xs">Recipient Name</Label>
                <Input
                  id="recipient-name"
                  value={templateVariables.recipient_name}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, recipient_name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="sender-name" className="text-slate-300 text-xs">Your Name</Label>
                <Input
                  id="sender-name"
                  value={templateVariables.sender_name}
                  onChange={(e) => setTemplateVariables(prev => ({ ...prev, sender_name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                  placeholder="Mom"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredTemplates.map((template, index) => {
              const categoryInfo = getCategoryInfo(template.category);
              const IconComponent = categoryInfo.icon;
              
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`w-4 h-4 ${categoryInfo.color}`} />
                          <CardTitle className="text-white text-sm">{template.name}</CardTitle>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                          {categoryInfo.name}
                        </Badge>
                      </div>
                      {template.description && (
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewTemplate(template)}
                            className="text-slate-400 hover:text-white text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTemplate(template)}
                            className="text-slate-400 hover:text-white text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => useTemplate(template)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs"
                        >
                          Use Template
                        </Button>
                      </div>
                      
                      {template.usage_count > 0 && (
                        <p className="text-xs text-slate-500 mt-2">
                          Used {template.usage_count} times
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
            <p className="text-slate-400 mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first template to get started'
              }
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Template Preview</DialogTitle>
              <DialogDescription>
                {previewTemplate?.name} - {getCategoryInfo(previewTemplate?.category || '').name}
              </DialogDescription>
            </DialogHeader>
            
            {previewTemplate && (
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <pre className="text-white whitespace-pre-wrap text-sm">
                    {previewTemplate.content_template}
                  </pre>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => copyTemplate(previewTemplate)}
                    className="border-slate-600 text-slate-300"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    onClick={() => {
                      useTemplate(previewTemplate);
                      setShowPreviewDialog(false);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}