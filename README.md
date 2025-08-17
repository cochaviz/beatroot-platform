# Beatroot Platform

A comprehensive cybersecurity learning platform designed to guide students through their cybersecurity education journey.

## Project Overview

Beatroot Platform is the official learning management system for Beatroot Academy, designed to guide students through comprehensive cybersecurity education, particularly focused on penetration testing and security training. The platform provides:

- **Student Dashboard**: Track progress through cybersecurity modules and phases
- **Instructor Dashboard**: Manage students and create engaging course content
- **Module Management**: Organize content with phases, sections, and modules
- **Progress Tracking**: Monitor completion rates and deadlines
- **Real-time Analytics**: View student performance and engagement metrics
- **Guided Learning Path**: Structured curriculum to guide students from basics to advanced concepts

## Features

- **Guided Learning Experience**: Step-by-step progression through cybersecurity concepts
- **Role-based Access**: Separate interfaces for students and instructors
- **Drag & Drop Organization**: Easy module and section reordering
- **Progress Visualization**: Clear progress indicators and completion tracking
- **Deadline Management**: Track upcoming deadlines and overdue assignments
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Modern UI**: Cybersecurity-inspired design with dark theme
- **Interactive Content**: Rich media support for enhanced learning

## Technology Stack

This project is built with:

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Build Tool**: Vite
- **State Management**: React Context + React Query
- **Drag & Drop**: @dnd-kit
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd beatroot-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, etc.)
├── hooks/          # Custom React hooks
├── integrations/   # External service integrations
├── lib/           # Utility functions
├── pages/         # Page components
└── main.tsx       # Application entry point
```

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Vercel Deployment

This project is optimized for Vercel deployment. Follow these steps:

1. **Connect your repository to Vercel**
   - Push your code to GitHub/GitLab/Bitbucket
   - Import the project in Vercel dashboard

2. **Configure environment variables in Vercel**
   - Go to your project settings in Vercel
   - Add the following environment variables:
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Deploy**
   - Vercel will automatically detect the Vite configuration
   - The `vercel.json` file provides optimal settings for SPA routing

### Other Hosting Options

- **Netlify**: Great for static sites with serverless functions
- **GitHub Pages**: Free hosting for open source projects
- **Supabase Edge Functions**: For backend functionality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository or contact the Beatroot Academy team.
