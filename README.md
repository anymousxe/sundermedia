# Sunder Media

A modern social media platform built with Next.js, TypeScript, and Supabase.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based login/signup system
- 👤 **Profile Creation** - Username validation with real-time availability checking
- 🛡️ **Content Moderation** - Advanced profanity filter that blocks harmful content while allowing normal language
- 🔒 **Security** - XSS protection, input sanitization, secure headers
- 🎨 **Modern UI** - Animated background with color-changing shapes, gradient effects, smooth hover animations
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast Performance** - Optimized with Next.js 14 and App Router

## 🚀 Current Status

**Working:**
- ✅ Authentication (signup, login, logout)
- ✅ Profile creation with username validation (12 char max, no duplicates)
- ✅ Advanced profanity filtering
- ✅ XSS protection
- ✅ Animated background
- ✅ Modern UI components (buttons, inputs, cards)
- ✅ Persistent sessions
- ✅ Database schema

**To Be Implemented:**
- ⏳ Post creation and feed
- ⏳ Comments and replies
- ⏳ Likes and hearts
- ⏳ Media gallery (images/videos)
- ⏳ User profiles
- ⏳ Notifications

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Git

## 🛠️ Setup Instructions

### 1. Install Dependencies

**On Windows:**
- Double-click `install.bat` OR
- Open Command Prompt (not PowerShell) and run:
  ```bash
  npm install
  ```

**On Mac/Linux:**
```bash
npm install
```


### 2. Configure Environment Variables

Copy `.env.local` and add your actual credentials:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random
\`\`\`

### 3. Set Up Database

1. Go to your Supabase project SQL Editor
2. Run the SQL from `database-schema.sql`
3. This creates all necessary tables and indexes

### 4. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
sunder media/sundermedia/
├── src/
│   ├── app/                    # Next.js pages and API routes
│   │   ├── api/                # Backend API endpoints
│   │   │   ├── auth/           # Authentication routes
│   │   │   └── users/          # User management routes
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   ├── create-profile/     # Profile creation page
│   │   ├── feed/               # Main feed page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── AnimatedBackground.tsx
│   │   └── ui/                 # UI components
│   ├── lib/                    # Utilities and helpers
│   │   ├── supabase.ts         # Supabase client
│   │   ├── profanity.ts        # Profanity filter
│   │   ├── security.ts         # XSS protection
│   │   └── constants.ts        # App constants
│   └── types/                  # TypeScript types
├── database-schema.sql         # Database schema
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
\`\`\`

## 🔒 Security Features

- **XSS Protection**: All user input is sanitized
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Content Filtering**: Advanced profanity detection system
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Row Level Security**: Enabled on all Supabase tables

## 🎨 Design System

- **Colors**: Purple/pink gradient primary colors
- **Background**: Animated geometric shapes with changing colors
- **Animations**: Smooth transitions, hover effects, sliding underlines
- **Glass Morphism**: Frosted glass effect on cards
- **Modern Typography**: Clean, readable fonts

## 🧪 Testing

1. **Signup**: Create a new account at `/signup`
2. **Profile Creation**: Choose a username (test the validator!)
3. **Authentication**: Verify session persists on reload
4. **Profanity Filter**: Try usernames like:
   - ✅ "stupidfuck123" (should work - general profanity allowed)
   - ❌ "ihategays" (should fail - hate speech blocked)
   - ❌ Political names (should fail)

## 🤝 Contributing

This is a teamwork project! Feel free to add features incrementally:

1. **Start Small**: Add one feature at a time
2. **Test First**: Make sure existing features still work
3. **Don't Break**: Always test before committing

## 📝 Notes

- The project uses Next.js 14 with App Router
- Environment variables are preserved from the original setup
- Database is PostgreSQL via Supabase
- All code is TypeScript for type safety
- CSS Modules used for component styling

## 🚧 Next Steps

To continue development, consider adding:
1. Post composer component
2. Feed display with infinite scroll
3. Comment system
4. Like/heart functionality
5. Media upload and gallery
6. User profile pages
7. Real-time updates
8. Notifications

---

Built with ❤️ using Next.js, TypeScript, and Supabase
