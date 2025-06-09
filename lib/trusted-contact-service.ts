import { supabase } from './supabase';

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  can_verify_inactivity: boolean;
  can_release_messages: boolean;
  can_manage_account: boolean;
  emergency_contact: boolean;
  verification_status: 'unverified' | 'pending' | 'verified';
  verification_token?: string;
  last_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactVerificationRequest {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_email: string;
  verification_token: string;
  status: 'pending' | 'verified' | 'expired';
  created_at: string;
  verified_at?: string;
  expires_at: string;
}

export interface ContactPermissions {
  can_verify_inactivity: boolean;
  can_release_messages: boolean;
  can_manage_account: boolean;
  emergency_contact: boolean;
}

export interface InactivityVerificationRequest {
  id: string;
  user_id: string;
  contact_id: string;
  status: 'pending' | 'confirmed' | 'denied' | 'expired';
  message: string;
  created_at: string;
  responded_at?: string;
  expires_at: string;
}

export class TrustedContactService {
  private static instance: TrustedContactService;

  public static getInstance(): TrustedContactService {
    if (!TrustedContactService.instance) {
      TrustedContactService.instance = new TrustedContactService();
    }
    return TrustedContactService.instance;
  }

  // Trusted Contact Management
  async addTrustedContact(
    userId: string,
    name: string,
    email: string,
    phone?: string,
    relationship?: string,
    permissions: ContactPermissions = {
      can_verify_inactivity: false,
      can_release_messages: false,
      can_manage_account: false,
      emergency_contact: false
    }
  ): Promise<string | null> {
    try {
      // Check if contact already exists
      const { data: existingContact, error: checkError } = await supabase
        .from('trusted_contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('email', email)
        .single();

      if (existingContact) {
        throw new Error('Contact with this email already exists');
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken();

      const { data, error } = await supabase
        .from('trusted_contacts')
        .insert({
          user_id: userId,
          name,
          email,
          phone,
          relationship,
          can_verify_inactivity: permissions.can_verify_inactivity,
          can_release_messages: permissions.can_release_messages,
          can_manage_account: permissions.can_manage_account,
          emergency_contact: permissions.emergency_contact,
          verification_status: 'unverified',
          verification_token: verificationToken
        })
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'trusted_contact_added',
          details: {
            contact_id: data.id,
            contact_name: name,
            contact_email: email,
            permissions
          }
        });

      return data.id;
    } catch (error) {
      console.error('Error adding trusted contact:', error);
      return null;
    }
  }

  async updateTrustedContact(
    contactId: string,
    name: string,
    email: string,
    phone?: string,
    relationship?: string,
    permissions?: ContactPermissions
  ): Promise<boolean> {
    try {
      const updateData: any = {
        name,
        email,
        phone,
        relationship,
        updated_at: new Date().toISOString()
      };

      if (permissions) {
        updateData.can_verify_inactivity = permissions.can_verify_inactivity;
        updateData.can_release_messages = permissions.can_release_messages;
        updateData.can_manage_account = permissions.can_manage_account;
        updateData.emergency_contact = permissions.emergency_contact;
      }

      const { error } = await supabase
        .from('trusted_contacts')
        .update(updateData)
        .eq('id', contactId);

      if (error) throw error;

      // Log the activity
      const { data: contact } = await supabase
        .from('trusted_contacts')
        .select('user_id')
        .eq('id', contactId)
        .single();

      if (contact) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: contact.user_id,
            action: 'trusted_contact_updated',
            details: {
              contact_id: contactId,
              updated_fields: Object.keys(updateData)
            }
          });
      }

      return true;
    } catch (error) {
      console.error('Error updating trusted contact:', error);
      return false;
    }
  }

  async removeTrustedContact(contactId: string): Promise<boolean> {
    try {
      // Get contact info for logging
      const { data: contact } = await supabase
        .from('trusted_contacts')
        .select('user_id, name, email')
        .eq('id', contactId)
        .single();

      const { error } = await supabase
        .from('trusted_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      // Log the activity
      if (contact) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: contact.user_id,
            action: 'trusted_contact_removed',
            details: {
              contact_id: contactId,
              contact_name: contact.name,
              contact_email: contact.email
            }
          });
      }

      return true;
    } catch (error) {
      console.error('Error removing trusted contact:', error);
      return false;
    }
  }

  async getTrustedContacts(userId: string): Promise<TrustedContact[]> {
    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trusted contacts:', error);
      return [];
    }
  }

  // Verification Management
  async sendVerificationRequest(contactId: string): Promise<boolean> {
    try {
      // Get contact details
      const { data: contact, error: contactError } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError || !contact) {
        throw new Error('Contact not found');
      }

      // Create verification request
      const verificationToken = this.generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to verify

      const { data: verification, error: verificationError } = await supabase
        .from('contact_verification_requests')
        .insert({
          contact_id: contactId,
          contact_name: contact.name,
          contact_email: contact.email,
          verification_token: verificationToken,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (verificationError) throw verificationError;

      // Update contact status
      await supabase
        .from('trusted_contacts')
        .update({
          verification_status: 'pending',
          verification_token: verificationToken
        })
        .eq('id', contactId);

      // Send verification email (using edge function)
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-contact?token=${verificationToken}`;
      
      const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
        body: {
          to: contact.email,
          contactName: contact.name,
          verificationLink: verificationLink,
          verificationToken: verificationToken
        }
      });

      if (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail the whole process if email fails
      }

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: contact.user_id,
          action: 'verification_request_sent',
          details: {
            contact_id: contactId,
            contact_email: contact.email,
            verification_id: verification.id
          }
        });

      return true;
    } catch (error) {
      console.error('Error sending verification request:', error);
      return false;
    }
  }

  async verifyContact(verificationToken: string): Promise<boolean> {
    try {
      // Find verification request
      const { data: verification, error: verificationError } = await supabase
        .from('contact_verification_requests')
        .select('*')
        .eq('verification_token', verificationToken)
        .eq('status', 'pending')
        .single();

      if (verificationError || !verification) {
        throw new Error('Invalid or expired verification token');
      }

      // Check if expired
      if (new Date() > new Date(verification.expires_at)) {
        await supabase
          .from('contact_verification_requests')
          .update({ status: 'expired' })
          .eq('id', verification.id);
        
        throw new Error('Verification token has expired');
      }

      // Update verification request
      await supabase
        .from('contact_verification_requests')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id);

      // Update contact
      await supabase
        .from('trusted_contacts')
        .update({
          verification_status: 'verified',
          last_verified_at: new Date().toISOString()
        })
        .eq('id', verification.contact_id);

      // Log the activity
      const { data: contact } = await supabase
        .from('trusted_contacts')
        .select('user_id')
        .eq('id', verification.contact_id)
        .single();

      if (contact) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: contact.user_id,
            action: 'contact_verified',
            details: {
              contact_id: verification.contact_id,
              verification_id: verification.id
            }
          });
      }

      return true;
    } catch (error) {
      console.error('Error verifying contact:', error);
      return false;
    }
  }

  async getVerificationRequests(userId: string): Promise<ContactVerificationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('contact_verification_requests')
        .select(`
          *,
          trusted_contacts!inner(user_id)
        `)
        .eq('trusted_contacts.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      return [];
    }
  }

  // Inactivity Verification
  async requestInactivityVerification(
    userId: string,
    message: string = 'Please confirm if this person is inactive or unreachable'
  ): Promise<boolean> {
    try {
      // Get verified contacts who can verify inactivity
      const { data: contacts, error: contactsError } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .eq('can_verify_inactivity', true);

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        throw new Error('No verified contacts available for inactivity verification');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3); // 3 days to respond

      // Create verification requests for all eligible contacts
      const verificationPromises = contacts.map(contact => 
        supabase
          .from('inactivity_verification_requests')
          .insert({
            user_id: userId,
            contact_id: contact.id,
            message,
            status: 'pending',
            expires_at: expiresAt.toISOString()
          })
      );

      await Promise.all(verificationPromises);

      // Send notification emails to contacts
      const emailPromises = contacts.map(contact => 
        supabase.functions.invoke('send-inactivity-verification', {
          body: {
            to: contact.email,
            contactName: contact.name,
            userId: userId,
            message: message,
            verificationLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-inactivity?contact=${contact.id}&user=${userId}`
          }
        })
      );

      await Promise.all(emailPromises);

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'inactivity_verification_requested',
          details: {
            contacts_notified: contacts.length,
            message: message
          }
        });

      return true;
    } catch (error) {
      console.error('Error requesting inactivity verification:', error);
      return false;
    }
  }

  async respondToInactivityVerification(
    requestId: string,
    response: 'confirmed' | 'denied',
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inactivity_verification_requests')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
          response_notes: notes
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log the activity
      const { data: request } = await supabase
        .from('inactivity_verification_requests')
        .select('user_id, contact_id')
        .eq('id', requestId)
        .single();

      if (request) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: request.user_id,
            action: 'inactivity_verification_responded',
            details: {
              request_id: requestId,
              contact_id: request.contact_id,
              response: response,
              notes: notes
            }
          });
      }

      return true;
    } catch (error) {
      console.error('Error responding to inactivity verification:', error);
      return false;
    }
  }

  // Message Release Management
  async requestMessageRelease(
    contactId: string,
    messageIds: string[],
    reason: string
  ): Promise<boolean> {
    try {
      // Verify contact has permission
      const { data: contact, error: contactError } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('id', contactId)
        .eq('verification_status', 'verified')
        .eq('can_release_messages', true)
        .single();

      if (contactError || !contact) {
        throw new Error('Contact not authorized to release messages');
      }

      // Create release request
      const { data: releaseRequest, error: releaseError } = await supabase
        .from('message_release_requests')
        .insert({
          user_id: contact.user_id,
          contact_id: contactId,
          message_ids: messageIds,
          reason: reason,
          status: 'pending'
        })
        .select()
        .single();

      if (releaseError) throw releaseError;

      // Send notification email to contact
      await supabase.functions.invoke('send-message-release-request', {
        body: {
          to: contact.email,
          contactName: contact.name,
          messageCount: messageIds.length,
          reason: reason,
          approvalLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/approve-release?request=${releaseRequest.id}`
        }
      });

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: contact.user_id,
          action: 'message_release_requested',
          details: {
            contact_id: contactId,
            message_count: messageIds.length,
            reason: reason,
            request_id: releaseRequest.id
          }
        });

      return true;
    } catch (error) {
      console.error('Error requesting message release:', error);
      return false;
    }
  }

  // Utility Functions
  private generateVerificationToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async getContactByEmail(email: string): Promise<TrustedContact | null> {
    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('email', email)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting contact by email:', error);
      return null;
    }
  }

  async getEmergencyContacts(userId: string): Promise<TrustedContact[]> {
    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('emergency_contact', true)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return [];
    }
  }

  async notifyEmergencyContacts(
    userId: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    try {
      const emergencyContacts = await this.getEmergencyContacts(userId);
      
      if (emergencyContacts.length === 0) {
        console.warn('No emergency contacts found for user:', userId);
        return false;
      }

      // Send notifications to all emergency contacts
      const notificationPromises = emergencyContacts.map(contact =>
        supabase.functions.invoke('send-emergency-notification', {
          body: {
            to: contact.email,
            contactName: contact.name,
            subject: subject,
            message: message,
            userId: userId
          }
        })
      );

      await Promise.all(notificationPromises);

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'emergency_contacts_notified',
          details: {
            contacts_notified: emergencyContacts.length,
            subject: subject
          }
        });

      return true;
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
      return false;
    }
  }
}