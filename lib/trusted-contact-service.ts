import { SupabaseClient } from '@supabase/supabase-js';

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

export interface ContactPermissions {
  can_verify_inactivity: boolean;
  can_release_messages: boolean;
  can_manage_account: boolean;
  emergency_contact: boolean;
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
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    console.log('🔧 TrustedContactService: Initialized with supabase client:', !!supabaseClient);
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
    console.log('🔧 TrustedContactService: Adding trusted contact for user:', userId);
    
    try {
      // Check if contact already exists
      const { data: existingContact, error: checkError } = await this.supabase
        .from('trusted_contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('email', email)
        .single();

      console.log('🔧 TrustedContactService: addTrustedContact check result:', {
        success: !checkError,
        error: checkError?.message,
        existingContact: !!existingContact,
        userId,
        email
      });

      if (existingContact) {
        throw new Error('Contact with this email already exists');
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken();
      
      const { data, error } = await this.supabase
        .from('trusted_contacts')
        .insert({
          user_id: userId,
          name,
          email,
          phone,
          relationship,
          ...permissions,
          verification_status: 'unverified',
          verification_token: verificationToken
        })
        .select()
        .single();

      console.log('🔧 TrustedContactService: addTrustedContact result:', {
        success: !error,
        error: error?.message,
        data: data
      });

      if (error) throw error;

      // Log the activity
      await this.supabase
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
      console.error('🔧 TrustedContactService: Error adding trusted contact:', error);
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
    console.log('🔧 TrustedContactService: Updating trusted contact:', contactId);
    
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

      const { error } = await this.supabase
        .from('trusted_contacts')
        .update(updateData)
        .eq('id', contactId);

      console.log('🔧 TrustedContactService: updateTrustedContact result:', {
        success: !error,
        error: error?.message,
        contactId
      });

      if (error) throw error;

      // Log the activity
      const { data: contact } = await this.supabase
        .from('trusted_contacts')
        .select('user_id')
        .eq('id', contactId)
        .single();

      if (contact) {
        await this.supabase
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
      console.error('🔧 TrustedContactService: Error updating trusted contact:', error);
      return false;
    }
  }

  async removeTrustedContact(contactId: string): Promise<boolean> {
    console.log('🔧 TrustedContactService: Removing trusted contact:', contactId);
    
    try {
      // Get contact info for logging
      const { data: contact } = await this.supabase
        .from('trusted_contacts')
        .select('user_id, name, email')
        .eq('id', contactId)
        .single();

      const { error } = await this.supabase
        .from('trusted_contacts')
        .delete()
        .eq('id', contactId);

      console.log('🔧 TrustedContactService: removeTrustedContact result:', {
        success: !error,
        error: error?.message,
        contactId
      });

      if (error) throw error;

      // Log the activity
      if (contact) {
        await this.supabase
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
      console.error('🔧 TrustedContactService: Error removing trusted contact:', error);
      return false;
    }
  }

  async getTrustedContacts(userId: string): Promise<TrustedContact[]> {
    console.log('🔧 TrustedContactService: Getting trusted contacts for user:', userId);
    
    try {
      const { data, error } = await this.supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('🔧 TrustedContactService: getTrustedContacts result:', {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0,
        userId,
        data: data
      });

      if (error) {
        console.error('🔧 TrustedContactService: Error fetching trusted contacts:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('🔧 TrustedContactService: Exception in getTrustedContacts:', err);
      throw err;
    }
  }

  // Verification Management
  async sendVerificationRequest(contactId: string): Promise<boolean> {
    console.log('🔧 TrustedContactService: Sending verification request for contact:', contactId);
    
    try {
      // Get contact details
      const { data: contact, error: contactError } = await this.supabase
        .from('trusted_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      console.log('🔧 TrustedContactService: sendVerificationRequest contact result:', {
        success: !contactError,
        error: contactError?.message,
        contactId
      });

      if (contactError || !contact) {
        throw new Error('Contact not found');
      }

      // Create verification request
      const verificationToken = this.generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to verify

      const { data: verification, error: verificationError } = await this.supabase
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

      console.log('🔧 TrustedContactService: sendVerificationRequest verification result:', {
        success: !verificationError,
        error: verificationError?.message,
        contactId
      });

      if (verificationError) throw verificationError;

      // Update contact status
      await this.supabase
        .from('trusted_contacts')
        .update({
          verification_status: 'pending',
          verification_token: verificationToken
        })
        .eq('id', contactId);

      // Send verification email (using edge function)
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-contact?token=${verificationToken}`;
      
      const { error: emailError } = await this.supabase.functions.invoke('send-verification-email', {
        body: {
          to: contact.email,
          contactName: contact.name,
          verificationLink: verificationLink,
          verificationToken: verificationToken
        }
      });

      console.log('🔧 TrustedContactService: sendVerificationRequest email result:', {
        success: !emailError,
        error: emailError?.message,
        contactId
      });

      if (emailError) {
        console.error('🔧 TrustedContactService: Error sending verification email:', emailError);
        // Don't fail the whole process if email fails
      }

      // Log the activity
      await this.supabase
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
      console.error('🔧 TrustedContactService: Error sending verification request:', error);
      return false;
    }
  }

  async verifyContact(verificationToken: string): Promise<boolean> {
    console.log('🔧 TrustedContactService: Verifying contact with token:', verificationToken);
    
    try {
      // Find verification request
      const { data: verification, error: verificationError } = await this.supabase
        .from('contact_verification_requests')
        .select('*')
        .eq('verification_token', verificationToken)
        .eq('status', 'pending')
        .single();

      console.log('🔧 TrustedContactService: verifyContact verification result:', {
        success: !verificationError,
        error: verificationError?.message,
        verificationToken
      });

      if (verificationError || !verification) {
        throw new Error('Invalid or expired verification token');
      }

      // Check if expired
      if (new Date() > new Date(verification.expires_at)) {
        await this.supabase
          .from('contact_verification_requests')
          .update({ status: 'expired' })
          .eq('id', verification.id);
        
        throw new Error('Verification token has expired');
      }

      // Update verification request
      await this.supabase
        .from('contact_verification_requests')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id);

      // Update contact
      await this.supabase
        .from('trusted_contacts')
        .update({
          verification_status: 'verified',
          last_verified_at: new Date().toISOString()
        })
        .eq('id', verification.contact_id);

      // Log the activity
      const { data: contact } = await this.supabase
        .from('trusted_contacts')
        .select('user_id')
        .eq('id', verification.contact_id)
        .single();

      if (contact) {
        await this.supabase
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
      console.error('🔧 TrustedContactService: Error verifying contact:', error);
      return false;
    }
  }

  async getVerificationRequests(userId: string): Promise<ContactVerificationRequest[]> {
    console.log('🔧 TrustedContactService: Getting verification requests for user:', userId);
    
    try {
      const { data, error } = await this.supabase
        .from('contact_verification_requests')
        .select(`
          *,
          trusted_contacts!inner(user_id)
        `)
        .eq('trusted_contacts.user_id', userId)
        .order('created_at', { ascending: false });

      console.log('🔧 TrustedContactService: getVerificationRequests result:', {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0,
        userId,
        data: data
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('🔧 TrustedContactService: Error fetching verification requests:', error);
      return [];
    }
  }

  // Inactivity Verification
  async requestInactivityVerification(
    userId: string,
    message: string = 'Please confirm if this person is inactive or unreachable'
  ): Promise<boolean> {
    console.log('🔧 TrustedContactService: Requesting inactivity verification for user:', userId);
    
    try {
      // Get verified contacts who can verify inactivity
      const { data: contacts, error: contactsError } = await this.supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .eq('can_verify_inactivity', true);

      console.log('🔧 TrustedContactService: requestInactivityVerification contacts result:', {
        success: !contactsError,
        error: contactsError?.message,
        userId
      });

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        throw new Error('No verified contacts available for inactivity verification');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3); // 3 days to respond

      // Create verification requests for all eligible contacts
      const verificationPromises = contacts.map(contact => 
        this.supabase
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
        this.supabase.functions.invoke('send-inactivity-verification', {
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
      await this.supabase
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
      console.error('🔧 TrustedContactService: Error requesting inactivity verification:', error);
      return false;
    }
  }

  async respondToInactivityVerification(
    requestId: string,
    response: 'confirmed' | 'denied',
    notes?: string
  ): Promise<boolean> {
    console.log('🔧 TrustedContactService: Responding to inactivity verification request:', requestId);
    
    try {
      const { error } = await this.supabase
        .from('inactivity_verification_requests')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
          response_notes: notes
        })
        .eq('id', requestId);

      console.log('🔧 TrustedContactService: respondToInactivityVerification result:', {
        success: !error,
        error: error?.message,
        requestId
      });

      if (error) throw error;

      // Log the activity
      const { data: request } = await this.supabase
        .from('inactivity_verification_requests')
        .select('user_id, contact_id')
        .eq('id', requestId)
        .single();

      if (request) {
        await this.supabase
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
      console.error('🔧 TrustedContactService: Error responding to inactivity verification:', error);
      return false;
    }
  }

  // Message Release Management
  async requestMessageRelease(
    contactId: string,
    messageIds: string[],
    reason: string
  ): Promise<boolean> {
    console.log('🔧 TrustedContactService: Requesting message release for contact:', contactId);
    
    try {
      // Verify contact has permission
      const { data: contact, error: contactError } = await this.supabase
        .from('trusted_contacts')
        .select('*')
        .eq('id', contactId)
        .eq('verification_status', 'verified')
        .eq('can_release_messages', true)
        .single();

      console.log('🔧 TrustedContactService: requestMessageRelease contact result:', {
        success: !contactError,
        error: contactError?.message,
        contactId
      });

      if (contactError || !contact) {
        throw new Error('Contact not authorized to release messages');
      }

      // Create release request
      const { data: releaseRequest, error: releaseError } = await this.supabase
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

      console.log('🔧 TrustedContactService: requestMessageRelease release result:', {
        success: !releaseError,
        error: releaseError?.message,
        contactId
      });

      if (releaseError) throw releaseError;

      // Send notification email to contact
      await this.supabase.functions.invoke('send-message-release-request', {
        body: {
          to: contact.email,
          contactName: contact.name,
          messageCount: messageIds.length,
          reason: reason,
          approvalLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/approve-release?request=${releaseRequest.id}`
        }
      });

      // Log the activity
      await this.supabase
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
      console.error('🔧 TrustedContactService: Error requesting message release:', error);
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
    console.log('🔧 TrustedContactService: Getting contact by email:', email);
    
    try {
      const { data, error } = await this.supabase
        .from('trusted_contacts')
        .select('*')
        .eq('email', email)
        .single();

      console.log('🔧 TrustedContactService: getContactByEmail result:', {
        success: !error,
        error: error?.message,
        email
      });

      if (error) return null;
      return data;
    } catch (error) {
      console.error('🔧 TrustedContactService: Error getting contact by email:', error);
      return null;
    }
  }

  async getEmergencyContacts(userId: string): Promise<TrustedContact[]> {
    console.log('🔧 TrustedContactService: Getting emergency contacts for user:', userId);
    
    try {
      const { data, error } = await this.supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('emergency_contact', true)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      console.log('🔧 TrustedContactService: getEmergencyContacts result:', {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0,
        userId,
        data: data
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('🔧 TrustedContactService: Error fetching emergency contacts:', error);
      return [];
    }
  }

  async notifyEmergencyContacts(
    userId: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    console.log('🔧 TrustedContactService: Notifying emergency contacts for user:', userId);
    
    try {
      const emergencyContacts = await this.getEmergencyContacts(userId);
      
      if (emergencyContacts.length === 0) {
        console.warn('🔧 TrustedContactService: No emergency contacts found for user:', userId);
        return false;
      }

      // Send notifications to all emergency contacts
      const notificationPromises = emergencyContacts.map(contact =>
        this.supabase.functions.invoke('send-emergency-notification', {
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
      await this.supabase
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
      console.error('🔧 TrustedContactService: Error notifying emergency contacts:', error);
      return false;
    }
  }
}