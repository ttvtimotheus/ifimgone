import { supabase } from './supabase';
import { EmailService } from './email-service';

export class InactivityChecker {
  private static instance: InactivityChecker;
  private emailService: EmailService;

  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  public static getInstance(): InactivityChecker {
    if (!InactivityChecker.instance) {
      InactivityChecker.instance = new InactivityChecker();
    }
    return InactivityChecker.instance;
  }

  async checkInactiveUsers(): Promise<void> {
    try {
      console.log('Starting inactivity check...');

      // Get all users with their inactivity thresholds
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, inactivity_threshold, last_active')
        .not('last_active', 'is', null);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      const now = new Date();

      for (const profile of profiles) {
        const lastActive = new Date(profile.last_active);
        const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        const thresholdDays = profile.inactivity_threshold || 30;

        // Check if user has been inactive for more than their threshold
        if (daysSinceActive >= thresholdDays) {
          await this.handleInactiveUser(profile, daysSinceActive);
        }
        // Send warning if user is approaching threshold (7 days before)
        else if (daysSinceActive >= (thresholdDays - 7) && daysSinceActive < thresholdDays) {
          await this.sendInactivityWarning(profile, daysSinceActive);
        }
      }

      console.log('Inactivity check completed');
    } catch (error) {
      console.error('Error in checkInactiveUsers:', error);
    }
  }

  private async handleInactiveUser(profile: any, daysSinceActive: number): Promise<void> {
    try {
      // Check if we already have a pending inactivity check for this user
      const { data: existingCheck, error: checkError } = await supabase
        .from('inactivity_checks')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkError) {
        console.error('Error checking existing inactivity checks:', checkError);
        return;
      }

      // If there's already a pending check, check if it has expired
      if (existingCheck && existingCheck.length > 0) {
        const check = existingCheck[0];
        const responseDeadline = new Date(check.response_required_by);
        const now = new Date();

        if (now > responseDeadline) {
          // The check has expired, trigger message delivery
          await this.triggerMessageDelivery(profile.id, check.id);
        }
        return;
      }

      // Create a new inactivity check
      const responseDeadline = new Date();
      responseDeadline.setDate(responseDeadline.getDate() + 7); // 7 days to respond

      const { data: newCheck, error: insertError } = await supabase
        .from('inactivity_checks')
        .insert({
          user_id: profile.id,
          response_required_by: responseDeadline.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating inactivity check:', insertError);
        return;
      }

      // Send warning email
      await this.emailService.sendInactivityWarning(
        profile.id,
        profile.email,
        profile.full_name || 'User',
        daysSinceActive,
        profile.inactivity_threshold || 30
      );

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: profile.id,
          action: 'inactivity_check_created',
          details: {
            days_inactive: daysSinceActive,
            threshold: profile.inactivity_threshold,
            response_deadline: responseDeadline.toISOString()
          }
        });

      console.log(`Created inactivity check for user ${profile.id} (${daysSinceActive} days inactive)`);
    } catch (error) {
      console.error('Error handling inactive user:', error);
    }
  }

  private async sendInactivityWarning(profile: any, daysSinceActive: number): Promise<void> {
    try {
      // Check if we already sent a warning recently
      const { data: recentWarnings, error: warningError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('action', 'inactivity_warning_sent')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(1);

      if (warningError) {
        console.error('Error checking recent warnings:', warningError);
        return;
      }

      if (recentWarnings && recentWarnings.length > 0) {
        return; // Already sent a warning recently
      }

      // Send warning email
      await this.emailService.sendInactivityWarning(
        profile.id,
        profile.email,
        profile.full_name || 'User',
        daysSinceActive,
        profile.inactivity_threshold || 30
      );

      // Log the warning
      await supabase
        .from('activity_logs')
        .insert({
          user_id: profile.id,
          action: 'inactivity_warning_sent',
          details: {
            days_inactive: daysSinceActive,
            threshold: profile.inactivity_threshold
          }
        });

      console.log(`Sent inactivity warning to user ${profile.id} (${daysSinceActive} days inactive)`);
    } catch (error) {
      console.error('Error sending inactivity warning:', error);
    }
  }

  private async triggerMessageDelivery(userId: string, inactivityCheckId: string): Promise<void> {
    try {
      // Update the inactivity check status
      await supabase
        .from('inactivity_checks')
        .update({ 
          status: 'missed',
          updated_at: new Date().toISOString()
        })
        .eq('id', inactivityCheckId);

      // Get all draft messages with inactivity trigger for this user
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          message_recipients!inner(
            recipient_id,
            recipients!inner(email, name)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'draft')
        .eq('trigger_type', 'inactivity');

      if (messagesError) {
        console.error('Error fetching messages for delivery:', messagesError);
        return;
      }

      // Deliver each message
      for (const message of messages) {
        for (const messageRecipient of message.message_recipients) {
          const recipientEmail = messageRecipient.recipients.email;
          const recipientName = messageRecipient.recipients.name;
          
          const success = await this.emailService.sendMessage(message.id, recipientEmail, recipientName);
          
          if (success) {
            console.log(`Delivered message ${message.id} to ${recipientEmail}`);
          } else {
            console.error(`Failed to deliver message ${message.id} to ${recipientEmail}`);
          }
        }
      }

      // Log the triggered delivery
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'messages_delivered_due_to_inactivity',
          details: {
            inactivity_check_id: inactivityCheckId,
            messages_delivered: messages.length
          }
        });

      console.log(`Triggered delivery of ${messages.length} messages for user ${userId}`);
    } catch (error) {
      console.error('Error triggering message delivery:', error);
    }
  }

  async checkDateTriggeredMessages(): Promise<void> {
    try {
      console.log('Checking date-triggered messages...');

      const now = new Date();

      // Get all draft messages with date triggers that should be delivered
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          message_recipients!inner(
            recipient_id,
            recipients!inner(email, name)
          )
        `)
        .eq('status', 'draft')
        .eq('trigger_type', 'date')
        .lte('trigger_date', now.toISOString());

      if (messagesError) {
        console.error('Error fetching date-triggered messages:', messagesError);
        return;
      }

      // Deliver each message
      for (const message of messages) {
        for (const messageRecipient of message.message_recipients) {
          const recipientEmail = messageRecipient.recipients.email;
          const recipientName = messageRecipient.recipients.name;
          
          const success = await this.emailService.sendMessage(message.id, recipientEmail, recipientName);
          
          if (success) {
            console.log(`Delivered date-triggered message ${message.id} to ${recipientEmail}`);
          } else {
            console.error(`Failed to deliver date-triggered message ${message.id} to ${recipientEmail}`);
          }
        }
      }

      console.log(`Processed ${messages.length} date-triggered messages`);
    } catch (error) {
      console.error('Error checking date-triggered messages:', error);
    }
  }

  async respondToInactivityCheck(userId: string): Promise<void> {
    try {
      // Find the most recent pending inactivity check for this user
      const { data: checks, error: checksError } = await supabase
        .from('inactivity_checks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (checksError) {
        console.error('Error fetching inactivity checks:', checksError);
        return;
      }

      if (checks && checks.length > 0) {
        const check = checks[0];
        
        // Update the check status to responded
        await supabase
          .from('inactivity_checks')
          .update({ 
            status: 'responded',
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', check.id);

        // Log the response
        await supabase
          .from('activity_logs')
          .insert({
            user_id: userId,
            action: 'inactivity_check_responded',
            details: {
              inactivity_check_id: check.id
            }
          });

        console.log(`User ${userId} responded to inactivity check ${check.id}`);
      }
    } catch (error) {
      console.error('Error responding to inactivity check:', error);
    }
  }
}