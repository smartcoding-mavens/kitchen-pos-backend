# Kitchen POS Admin Dashboard

A comprehensive Point of Sale (POS) system for restaurants with multi-location support, staff management, and real-time order tracking.

## Features

- **Multi-Role Authentication**: Super Admin, Kitchen Owner, Manager, and Staff roles
- **Restaurant Management**: Complete restaurant setup and configuration
- **Menu Management**: Categories, items, combo meals, and daily deals
- **Order Processing**: Real-time order tracking and status updates
- **Staff Management**: Role-based access control and revenue center assignments
- **Customer Management**: Customer profiles and order history
- **QR Code Generation**: Table, counter, and menu QR codes
- **Business Hours**: Configurable operating hours per revenue center
- **Reports & Analytics**: Sales reports, customer insights, and performance metrics
- **Golf Club Integration**: Manage golf club partnerships
- **Payment Processing**: Stripe integration for subscriptions

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payment Processing**: Stripe
- **Charts**: Recharts
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account (for payment processing)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Database Setup

1. **Run Migrations**: Apply all database migrations in order:
   ```bash
   # Apply migrations in your Supabase dashboard SQL editor or via CLI
   # Run migrations in this order:
   # 1. create_initial_schema.sql
   # 2. create_subscription_plan.sql
   # 3. create_helper_functions.sql
   # 4. create_golf_club_triggers.sql
   # 5. create_default_super_admin.sql
   ```

2. **Create Super Admin**: Run the setup script to create the default super admin:
   ```bash
   npm run create-super-admin
   ```

3. **Verify Setup**: Test the super admin login:
   ```bash
   npm run debug-super-admin
   ```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Edge Functions Deployment

The following Supabase Edge Functions are included:

- `create-kitchen-owner` - Creates new kitchen owner accounts
- `create-checkout-session` - Stripe checkout session creation
- `create-payment-intent` - Stripe payment intent creation
- `confirm-payment` - Payment confirmation
- `stripe-webhook` - Stripe webhook handler
- `send-approval-email` - Account approval notifications
- `send-welcome-email` - Welcome email for new users
- `validate-barcode` - QR code validation
- `process-order` - Order processing
- `get-menu` - Public menu API
- `update-order-status` - Order status updates
- `get-restaurant-info` - Public restaurant information

Deploy functions to Supabase:
```bash
# Functions are automatically deployed when you push to your Supabase project
# No manual deployment needed in WebContainer environment
```

## Default Credentials

### Super Admin
- **Email**: admin@kitchenpos.com
- **Password**: SuperAdmin123!

### Test Kitchen Owner (if created via script)
- **Email**: brendan@teqmavens.com
- **Password**: admin@123

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── hooks/              # Custom React hooks
├── lib/                # Library configurations (Supabase, Stripe)
├── middleware/         # Authentication middleware
├── pages/              # Page components
├── services/           # API service classes
└── store/              # Redux store and slices

supabase/
├── functions/          # Edge Functions
└── migrations/         # Database migrations

scripts/                # Utility scripts for setup
```

## User Roles & Permissions

### Super Admin
- Manage all restaurants and kitchen owners
- Approve new registrations
- Access system-wide analytics
- Configure subscription plans

### Kitchen Owner
- Manage their restaurant(s)
- Set up menus and pricing
- Manage staff and assignments
- View restaurant analytics
- Manage golf club partnerships

### Manager
- Manage restaurant operations
- View and update orders
- Manage staff (limited)
- Access reports and analytics

### Staff
- View and update orders (assigned revenue centers only)
- Basic order management
- Limited dashboard access

## API Endpoints

### Public APIs (Edge Functions)
- `GET /functions/v1/get-menu?restaurant_id=xxx` - Get restaurant menu
- `GET /functions/v1/get-restaurant-info?domain_name=xxx` - Get restaurant info
- `POST /functions/v1/validate-barcode` - Validate QR codes
- `POST /functions/v1/process-order` - Submit new orders

### Admin APIs
- `POST /functions/v1/create-kitchen-owner` - Create kitchen owner account
- `POST /functions/v1/update-order-status` - Update order status
- Payment processing endpoints (Stripe integration)

## Development Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview               # Preview production build

# Database Management
npm run create-super-admin     # Create default super admin
npm run debug-super-admin      # Debug super admin issues
npm run fix-auth-user         # Fix auth user linking issues
npm run create-brendan-admin   # Create test admin user
```

## Deployment

The application is designed to work with:
- **Frontend**: Any static hosting (Vercel, Netlify, etc.)
- **Backend**: Supabase (managed PostgreSQL + Edge Functions)
- **Payments**: Stripe

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control
- Email verification required
- Account approval workflow
- Secure password requirements
- API authentication via Supabase Auth

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For technical support or questions:
- Check the documentation
- Review the code comments
- Contact the development team

## License

This project is proprietary software. All rights reserved.