# If I'm Gone - Project Overview

## Project Description

"If I'm Gone" is a digital legacy application that allows users to create and schedule messages to be delivered to loved ones after they're gone or in case of prolonged inactivity. The application provides a secure and thoughtful way to leave behind final messages, important information, and heartfelt sentiments to family and friends.

## Tech Stack

- **Frontend**: Next.js 15.3.3 with React 19.0.0
- **UI Framework**: Custom UI built with Tailwind CSS and shadcn/ui components
- **Animation**: Framer Motion for smooth transitions and animations
- **Backend**: Supabase for authentication, database, and storage
- **Deployment**: Ready for deployment on platforms like Vercel or Netlify

## Current Features

### Authentication
- User registration and login with email/password
- Social login with Google
- Protected routes for authenticated users
- Session management

### Message Creation
- Multi-step form for creating messages
- Support for different message formats (text, audio, video, mixed media)
- Recipient management
- Various delivery trigger options:
  - Inactivity detection (after a period of no login)
  - Specific date (time-based delivery)
  - Manual release (by trusted contacts)

### Dashboard
- Overview of all created messages
- Statistics on active messages and total messages
- Message status tracking
- User activity monitoring

### Security
- Row-level security in Supabase database
- Optional PIN protection for sensitive messages
- Secure storage for message content

### Database Schema
- Comprehensive schema with tables for:
  - User profiles
  - Messages
  - Recipients
  - Message-recipient relationships
  - Attachments
  - Verification requests
  - Activity logs
  - User settings
  - Trusted contacts
  - Inactivity checks

## Implemented Workflows

1. **User Registration & Onboarding**:
   - New user registration
   - Profile creation
   - Onboarding flow with explanatory slides

2. **Message Creation**:
   - Recipient selection
   - Message format selection
   - Content creation
   - Delivery trigger configuration
   - Security settings
   - Preview and save

3. **Message Management**:
   - View all messages in dashboard
   - Check message status
   - View message details

## Planned/Potential Features

### Enhanced Message Types
- **Video Recording**: In-app video recording capability
- **Audio Messages**: Voice recording functionality
- **Document Attachments**: Ability to attach important documents (wills, insurance policies, etc.)
- **Location Data**: Include location information with messages

### Advanced Delivery Mechanisms
- **Geofencing Triggers**: Messages that deliver when recipients enter specific locations
- **Multi-stage Delivery**: Messages that deliver in a sequence over time
- **Conditional Delivery**: Messages that deliver based on specific events or conditions

### Security Enhancements
- **Two-factor Authentication**: Additional security for account access
- **End-to-end Encryption**: For highly sensitive message content
- **Biometric Verification**: For accessing sensitive messages

### User Experience
- **Message Templates**: Pre-designed templates for common message types
- **Rich Text Editor**: Enhanced editing capabilities
- **Media Library**: For organizing attachments
- **Mobile App**: Native mobile applications for iOS and Android

### Administration
- **Admin Dashboard**: For platform administrators
- **Analytics**: Usage statistics and insights
- **Content Moderation**: Tools for ensuring appropriate content

### Trusted Contacts System
- **Contact Verification**: Process to verify trusted contacts
- **Contact Management**: Interface for managing trusted contacts
- **Permissions System**: Granular permissions for trusted contacts

### Monetization Options
- **Freemium Model**: Basic features free, premium features paid
- **Storage Tiers**: Different pricing based on storage needs
- **Message Limits**: Tiered pricing based on number of messages

## Technical Improvements

1. **Performance Optimization**:
   - Implement server-side rendering for faster page loads
   - Optimize database queries for better performance

2. **Testing**:
   - Add unit tests for components and functions
   - Implement end-to-end testing for critical user flows

3. **Code Organization**:
   - Refactor components for better reusability
   - Implement a more robust state management solution

4. **DevOps**:
   - Set up CI/CD pipeline
   - Implement automated testing in the deployment process

5. **Monitoring and Logging**:
   - Add error tracking and monitoring
   - Implement comprehensive logging for debugging

## Current Limitations

1. **Message Delivery**:
   - The actual delivery mechanism for messages needs to be implemented
   - Inactivity detection needs to be more robust

2. **User Management**:
   - Limited profile customization options
   - No account recovery process implemented yet

3. **Security**:
   - Additional security measures needed for highly sensitive content
   - No audit logging for security events

## Next Steps for Development

1. **Implement Message Delivery System**:
   - Create background jobs for checking inactivity
   - Set up email delivery service for messages
   - Implement notification system for recipients

2. **Enhance User Profiles**:
   - Add more profile customization options
   - Implement profile verification

3. **Improve Security**:
   - Add two-factor authentication
   - Implement more robust encryption for message content

4. **Expand Message Types**:
   - Add support for file attachments
   - Implement in-app recording for audio/video messages

5. **Develop Trusted Contact System**:
   - Create interface for managing trusted contacts
   - Implement verification process for trusted contacts

## Deployment Notes

The application is configured to work with Supabase for backend services. Before deploying:

1. Set up a Supabase project and configure the necessary tables using the provided schema.sql
2. Configure environment variables for Supabase URL and anon key
3. Set up authentication providers in Supabase dashboard
4. Deploy the application to a hosting platform like Vercel or Netlify

## Conclusion

"If I'm Gone" provides a meaningful solution for digital legacy planning. The current implementation offers a solid foundation with core functionality in place. With further development, it has the potential to become a comprehensive platform for preserving and sharing important messages and memories with loved ones.
