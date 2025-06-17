'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Shield, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Clock,
  UserCheck,
  UserX,
  Settings,
  Eye,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { TrustedContactService, TrustedContact, ContactVerificationRequest } from '@/lib/trusted-contact-service';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';

export default function TrustedContactsPage() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<ContactVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<TrustedContact | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<ContactVerificationRequest | null>(null);
  
  // Form states
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    can_verify_inactivity: false,
    can_release_messages: false,
    can_manage_account: false,
    emergency_contact: false
  });

  const [editContact, setEditContact] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    can_verify_inactivity: false,
    can_release_messages: false,
    can_manage_account: false,
    emergency_contact: false
  });

  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const trustedContactService = new TrustedContactService(supabase);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contactsData, verificationsData] = await Promise.all([
        trustedContactService.getTrustedContacts(user!.id),
        trustedContactService.getVerificationRequests(user!.id)
      ]);
      
      setContacts(contactsData);
      setVerificationRequests(verificationsData);
    } catch (error) {
      console.error('Error fetching trusted contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trusted contacts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      if (!newContact.name || !newContact.email) {
        toast({
          title: 'Validation Error',
          description: 'Name and email are required',
          variant: 'destructive'
        });
        return;
      }

      const contactId = await trustedContactService.addTrustedContact(
        user!.id,
        newContact.name,
        newContact.email,
        newContact.phone,
        newContact.relationship,
        {
          can_verify_inactivity: newContact.can_verify_inactivity,
          can_release_messages: newContact.can_release_messages,
          can_manage_account: newContact.can_manage_account,
          emergency_contact: newContact.emergency_contact
        }
      );

      if (contactId) {
        toast({
          title: 'Contact Added',
          description: 'Trusted contact has been added successfully',
          variant: 'default'
        });

        // Reset form
        setNewContact({
          name: '',
          email: '',
          phone: '',
          relationship: '',
          can_verify_inactivity: false,
          can_release_messages: false,
          can_manage_account: false,
          emergency_contact: false
        });
        setShowAddDialog(false);

        // Refresh data
        await fetchData();
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add trusted contact',
        variant: 'destructive'
      });
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    try {
      const success = await trustedContactService.updateTrustedContact(
        selectedContact.id,
        editContact.name,
        editContact.email,
        editContact.phone,
        editContact.relationship,
        {
          can_verify_inactivity: editContact.can_verify_inactivity,
          can_release_messages: editContact.can_release_messages,
          can_manage_account: editContact.can_manage_account,
          emergency_contact: editContact.emergency_contact
        }
      );

      if (success) {
        toast({
          title: 'Contact Updated',
          description: 'Trusted contact has been updated successfully',
          variant: 'default'
        });

        setShowEditDialog(false);
        setSelectedContact(null);
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update trusted contact',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const success = await trustedContactService.removeTrustedContact(contactId);
      
      if (success) {
        toast({
          title: 'Contact Removed',
          description: 'Trusted contact has been removed',
          variant: 'default'
        });
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove trusted contact',
        variant: 'destructive'
      });
    }
  };

  const handleSendVerification = async (contactId: string) => {
    try {
      const success = await trustedContactService.sendVerificationRequest(contactId);
      
      if (success) {
        toast({
          title: 'Verification Sent',
          description: 'Verification request has been sent to the contact',
          variant: 'default'
        });
        await fetchData();
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send verification request',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (contact: TrustedContact) => {
    setSelectedContact(contact);
    setEditContact({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      relationship: contact.relationship || '',
      can_verify_inactivity: contact.can_verify_inactivity,
      can_release_messages: contact.can_release_messages,
      can_manage_account: contact.can_manage_account,
      emergency_contact: contact.emergency_contact
    });
    setShowEditDialog(true);
  };

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'unverified': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPermissionBadges = (contact: TrustedContact) => {
    const badges = [];
    if (contact.emergency_contact) badges.push({ label: 'Emergency', color: 'bg-red-500/20 text-red-400' });
    if (contact.can_verify_inactivity) badges.push({ label: 'Verify Activity', color: 'bg-blue-500/20 text-blue-400' });
    if (contact.can_release_messages) badges.push({ label: 'Release Messages', color: 'bg-purple-500/20 text-purple-400' });
    if (contact.can_manage_account) badges.push({ label: 'Manage Account', color: 'bg-orange-500/20 text-orange-400' });
    return badges;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-950">
          <Navigation />
          <div className="container mx-auto px-4 py-8 pt-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 pt-20 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                    <Users className="w-8 h-8 mr-3 text-amber-500" />
                    Trusted Contacts
                  </h1>
                  <p className="text-slate-400">Manage people who can help with your digital legacy</p>
                </div>
                
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add Trusted Contact</DialogTitle>
                      <DialogDescription>
                        Add someone you trust to help manage your digital legacy
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="text-white font-medium">Contact Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contact-name" className="text-slate-300">Name *</Label>
                            <Input
                              id="contact-name"
                              value={newContact.name}
                              onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                              className="bg-slate-800 border-slate-700 text-white"
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <Label htmlFor="contact-email" className="text-slate-300">Email *</Label>
                            <Input
                              id="contact-email"
                              type="email"
                              value={newContact.email}
                              onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                              className="bg-slate-800 border-slate-700 text-white"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contact-phone" className="text-slate-300">Phone</Label>
                            <Input
                              id="contact-phone"
                              type="tel"
                              value={newContact.phone}
                              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                              className="bg-slate-800 border-slate-700 text-white"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div>
                            <Label htmlFor="contact-relationship" className="text-slate-300">Relationship</Label>
                            <Select 
                              value={newContact.relationship} 
                              onValueChange={(value) => setNewContact(prev => ({ ...prev, relationship: value }))}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spouse">Spouse/Partner</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="friend">Friend</SelectItem>
                                <SelectItem value="lawyer">Lawyer</SelectItem>
                                <SelectItem value="executor">Executor</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-slate-700" />

                      {/* Permissions */}
                      <div className="space-y-4">
                        <h4 className="text-white font-medium">Permissions</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-white font-medium">Emergency Contact</h5>
                              <p className="text-slate-400 text-sm">Primary contact in case of emergency</p>
                            </div>
                            <Switch
                              checked={newContact.emergency_contact}
                              onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, emergency_contact: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-white font-medium">Verify Inactivity</h5>
                              <p className="text-slate-400 text-sm">Can confirm if you're inactive or unreachable</p>
                            </div>
                            <Switch
                              checked={newContact.can_verify_inactivity}
                              onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, can_verify_inactivity: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-white font-medium">Release Messages</h5>
                              <p className="text-slate-400 text-sm">Can manually trigger message delivery</p>
                            </div>
                            <Switch
                              checked={newContact.can_release_messages}
                              onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, can_release_messages: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-white font-medium">Manage Account</h5>
                              <p className="text-slate-400 text-sm">Can access and manage your account settings</p>
                            </div>
                            <Switch
                              checked={newContact.can_manage_account}
                              onCheckedChange={(checked) => setNewContact(prev => ({ ...prev, can_manage_account: checked }))}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddDialog(false)}
                          className="border-slate-600 text-slate-300"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddContact}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                        >
                          Add Contact
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="border-amber-500/50 bg-amber-500/10 mb-8">
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-amber-300">
                <strong>Important:</strong> Trusted contacts can help manage your digital legacy when you're unable to do so yourself. 
                Choose people you trust completely and verify their contact information regularly.
              </AlertDescription>
            </Alert>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Contacts</p>
                      <p className="text-2xl font-bold text-white">{contacts.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Verified</p>
                      <p className="text-2xl font-bold text-white">
                        {contacts.filter(c => c.verification_status === 'verified').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Emergency Contacts</p>
                      <p className="text-2xl font-bold text-white">
                        {contacts.filter(c => c.emergency_contact).length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Pending Verification</p>
                      <p className="text-2xl font-bold text-white">
                        {verificationRequests.filter(v => v.status === 'pending').length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contacts List */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Your Trusted Contacts</h2>
              
              {contacts.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No trusted contacts yet</h3>
                    <p className="text-slate-400 mb-6">Add people you trust to help manage your digital legacy</p>
                    <Button 
                      onClick={() => setShowAddDialog(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Contact
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  <AnimatePresence>
                    {contacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                                  <Badge 
                                    variant="outline" 
                                    className={getContactStatusColor(contact.verification_status)}
                                  >
                                    {contact.verification_status}
                                  </Badge>
                                  {contact.emergency_contact && (
                                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                                      Emergency
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-slate-400 text-sm mb-3">
                                  <div className="flex items-center">
                                    <Mail className="w-4 h-4 mr-1" />
                                    {contact.email}
                                  </div>
                                  {contact.phone && (
                                    <div className="flex items-center">
                                      <Phone className="w-4 h-4 mr-1" />
                                      {contact.phone}
                                    </div>
                                  )}
                                  {contact.relationship && (
                                    <span className="capitalize">{contact.relationship}</span>
                                  )}
                                </div>
                                
                                {/* Permission Badges */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {getPermissionBadges(contact).map((badge, i) => (
                                    <Badge 
                                      key={i}
                                      variant="outline" 
                                      className={`${badge.color} border-opacity-30 text-xs`}
                                    >
                                      {badge.label}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <p className="text-xs text-slate-500">
                                  Added: {new Date(contact.created_at).toLocaleDateString()}
                                  {contact.last_verified_at && (
                                    <> • Last verified: {new Date(contact.last_verified_at).toLocaleDateString()}</>
                                  )}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {contact.verification_status !== 'verified' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSendVerification(contact.id)}
                                    className="text-blue-400 hover:text-blue-300"
                                  >
                                    <Send className="w-4 h-4 mr-1" />
                                    Verify
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(contact)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteContact(contact.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Verification Requests */}
            {verificationRequests.length > 0 && (
              <div className="space-y-6 mt-12">
                <h2 className="text-xl font-semibold text-white">Verification Requests</h2>
                <div className="grid gap-4">
                  {verificationRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="border-slate-800 bg-slate-900/50">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">
                                Verification for {request.contact_name}
                              </h3>
                              <p className="text-slate-400 text-sm mb-2">
                                Sent to: {request.contact_email}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={getContactStatusColor(request.status)}
                                >
                                  {request.status}
                                </Badge>
                                <span className="text-slate-500 text-xs">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVerification(request);
                                  setShowVerificationDialog(true);
                                }}
                                className="text-slate-400 hover:text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Contact Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Edit Trusted Contact</DialogTitle>
                  <DialogDescription>
                    Update contact information and permissions
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-contact-name" className="text-slate-300">Name *</Label>
                        <Input
                          id="edit-contact-name"
                          value={editContact.name}
                          onChange={(e) => setEditContact(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-contact-email" className="text-slate-300">Email *</Label>
                        <Input
                          id="edit-contact-email"
                          type="email"
                          value={editContact.email}
                          onChange={(e) => setEditContact(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-contact-phone" className="text-slate-300">Phone</Label>
                        <Input
                          id="edit-contact-phone"
                          type="tel"
                          value={editContact.phone}
                          onChange={(e) => setEditContact(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-contact-relationship" className="text-slate-300">Relationship</Label>
                        <Select 
                          value={editContact.relationship} 
                          onValueChange={(value) => setEditContact(prev => ({ ...prev, relationship: value }))}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse/Partner</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="lawyer">Lawyer</SelectItem>
                            <SelectItem value="executor">Executor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Permissions */}
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Permissions</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-white font-medium">Emergency Contact</h5>
                          <p className="text-slate-400 text-sm">Primary contact in case of emergency</p>
                        </div>
                        <Switch
                          checked={editContact.emergency_contact}
                          onCheckedChange={(checked) => setEditContact(prev => ({ ...prev, emergency_contact: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-white font-medium">Verify Inactivity</h5>
                          <p className="text-slate-400 text-sm">Can confirm if you're inactive or unreachable</p>
                        </div>
                        <Switch
                          checked={editContact.can_verify_inactivity}
                          onCheckedChange={(checked) => setEditContact(prev => ({ ...prev, can_verify_inactivity: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-white font-medium">Release Messages</h5>
                          <p className="text-slate-400 text-sm">Can manually trigger message delivery</p>
                        </div>
                        <Switch
                          checked={editContact.can_release_messages}
                          onCheckedChange={(checked) => setEditContact(prev => ({ ...prev, can_release_messages: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-white font-medium">Manage Account</h5>
                          <p className="text-slate-400 text-sm">Can access and manage your account settings</p>
                        </div>
                        <Switch
                          checked={editContact.can_manage_account}
                          onCheckedChange={(checked) => setEditContact(prev => ({ ...prev, can_manage_account: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowEditDialog(false)}
                      className="border-slate-600 text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleEditContact}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                    >
                      Update Contact
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Verification Details Dialog */}
            <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
              <DialogContent className="bg-slate-900 border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Verification Request Details</DialogTitle>
                  <DialogDescription>
                    Information about the verification request
                  </DialogDescription>
                </DialogHeader>
                
                {selectedVerification && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Contact Name</Label>
                        <p className="text-white">{selectedVerification.contact_name}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300">Email</Label>
                        <p className="text-white">{selectedVerification.contact_email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Status</Label>
                        <Badge 
                          variant="outline" 
                          className={getContactStatusColor(selectedVerification.status)}
                        >
                          {selectedVerification.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-slate-300">Sent</Label>
                        <p className="text-white">{new Date(selectedVerification.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {selectedVerification.verified_at && (
                      <div>
                        <Label className="text-slate-300">Verified At</Label>
                        <p className="text-white">{new Date(selectedVerification.verified_at).toLocaleString()}</p>
                      </div>
                    )}
                    
                    {selectedVerification.expires_at && (
                      <div>
                        <Label className="text-slate-300">Expires</Label>
                        <p className="text-white">{new Date(selectedVerification.expires_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}