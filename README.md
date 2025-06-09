# If I'm Gone - Digital Legacy Platform

A secure platform for creating and managing digital legacy messages that are delivered to loved ones when needed most.

## Features

- **Digital Legacy Messages**: Create heartfelt messages for loved ones
- **Multiple Delivery Triggers**: Inactivity detection, specific dates, or manual release
- **Trusted Contact System**: Designate people to help manage your digital legacy
- **Secure Message Storage**: PIN protection and encryption options
- **Media Support**: Text, audio, video, and file attachments
- **Email Integration**: Professional email delivery via Resend
- **Two-Factor Authentication**: Enhanced security for accounts
- **Activity Monitoring**: Automatic inactivity detection and warnings

## Tech Stack

- **Frontend**: Next.js 15.3.3 with React 19
- **UI**: Tailwind CSS + shadcn/ui components
- **Animation**: Framer Motion
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **Email**: Resend API integration
- **Deployment**: Vercel/Netlify ready

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the migrations in order:
   ```bash
   # Apply all migrations in the supabase/migrations folder
   supabase db push
   ```
3. Set up authentication providers in Supabase dashboard
4. Configure storage buckets (automatically created by migrations)

### 3. Email Service Setup (Resend)

1. Sign up for [Resend](https://resend.com)
2. Get your API key
3. Add to Supabase Edge Functions environment:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```
4. Verify your domain in Resend dashboard
5. Update email addresses in edge functions to use your domain

### 4. Deploy Edge Functions

```bash
supabase functions deploy send-email
supabase functions deploy send-verification-email
supabase functions deploy send-inactivity-warning
supabase functions deploy send-message-delivery
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

## Email Integration

The platform uses Resend for reliable email delivery:

### Available Email Functions

1. **send-email**: Generic email sending
2. **send-verification-email**: Trusted contact verification
3. **send-inactivity-warning**: User activity warnings
4. **send-message-delivery**: Final message delivery

### Email Features

- **Professional Templates**: Beautiful, responsive email designs
- **Security Notifications**: Automated warnings and alerts
- **Message Delivery**: Secure delivery of final messages
- **Verification System**: Email-based contact verification
- **Emergency Notifications**: Critical alerts to trusted contacts

### Email Configuration

Update the following in your edge functions:
- Replace `ifimgone.app` with your domain
- Configure proper sender addresses
- Set up SPF/DKIM records for deliverability

## Database Schema

The platform includes comprehensive database schema:

- **User Management**: Profiles, settings, security
- **Message System**: Messages, recipients, attachments
- **Trusted Contacts**: Contact management and verification
- **Security**: 2FA, login attempts, security events
- **Activity Tracking**: Comprehensive logging system

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Two-Factor Authentication**: TOTP-based 2FA
- **PIN Protection**: Message-level security
- **Activity Monitoring**: Automatic inactivity detection
- **Audit Logging**: Comprehensive security event tracking

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify Deployment

1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@ifimgone.app or create an issue in the repository.