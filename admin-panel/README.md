# Saher Flow Solutions - Admin Panel

A modern React-based admin panel for managing users and companies in the Saher Flow Solutions platform.

## Features

- **Dashboard**: Overview of system statistics and recent activity
- **User Management**: View all users, filter by role/status, export data
- **Company Management**: Create, edit, and manage approved companies
- **Authentication**: Secure admin-only access with JWT tokens
- **Responsive Design**: Works perfectly on desktop and mobile devices

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the admin-panel directory:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the admin panel:**
   Open http://localhost:3001 in your browser

## Default Admin Account

Use these credentials to access the admin panel:
- **Email**: admin@saherflow.com
- **Password**: Admin123

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Axios** for API calls
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Project Structure

```
admin-panel/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth)
│   ├── pages/          # Page components
│   ├── services/       # API service functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # App entry point
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

## Features Overview

### Dashboard
- System statistics overview
- Recent user registrations
- Recent company additions
- Quick access to key metrics

### User Management
- View all registered users
- Filter by role (user/admin)
- Filter by verification status
- Export user data to CSV
- View user details and activity

### Company Management
- View all approved companies
- Add new companies with domains
- Edit existing company details
- Activate/deactivate companies
- Manage allowed domains for registration

## API Integration

The admin panel communicates with the backend API running on port 5000. All API calls are authenticated using JWT tokens stored in localStorage.

## Security

- Admin-only access (role-based authentication)
- JWT token validation
- Secure API communication
- Protected routes and components

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The admin panel can be deployed as a static site to any hosting provider. Make sure to update the API URL in the environment variables for production.