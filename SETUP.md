# Quick Setup Guide for Sunder Media

## ⚡ Quick Start (3 Steps)

### 1️⃣ Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy ALL the code from `database-schema.sql` in this folder
5. Paste it into the SQL Editor
6. Click "Run" button (or press Ctrl+Enter)
7. You should see "Success. No rows returned" - that's perfect!

### 2️⃣ Configure Environment Variables

1. Open `.env.local` in this folder
2. Replace these values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Go to your Supabase project
- Click "Settings" (gear icon) → "API"
- Copy the "Project URL" and "anon public" key

3. Generate a random JWT secret (any random string):
```env
JWT_SECRET=make-this-a-long-random-string-abc123xyz789
```

### 3️⃣ Start the Server

**Option A:** Double-click `start.bat`

**Option B:** Open Command Prompt and run:
```bash
npm run dev
```

Then open: http://localhost:3000

---

## ✅ Testing

1. **Sign up** for a new account
2. **Create a profile** with a username (try the validator!)
3. **See your feed** - you're logged in!
4. **Refresh the page** - you should stay logged in
5. **Test the profanity filter**:
   - Try username "stupidfuck123" → Should work ✅
   - Try username "ihategays" → Should fail ❌
   - Try username "trump2024" → Should fail ❌

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Make sure you ran the `database-schema.sql` in Supabase
- Check that your `.env.local` has the correct Supabase URL and key

### "Invalid token" or "Unauthorized"
- Make sure you set a `JWT_SECRET` in `.env.local`
- Try logging out and logging back in

### PowerShell script errors
- Use Command Prompt instead of PowerShell
- Or run the `.bat` files by double-clicking them

---

## 📁 Project Structure

```
sundermedia/
├── src/
│   ├── app/              # Pages and API routes
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utilities (security, profanity filter, etc.)
│   └── types/            # TypeScript types
├── database-schema.sql   # Run this in Supabase!
├── .env.local           # Your environment variables
├── start.bat            # Quick start script
└── README.md            # Full documentation
```

---

## 🚀 What's Next?

The foundation is complete! Now you or another developer can add:
- Posts and feed
- Comments and replies
- Media uploads
- Likes and hearts
- More polish!

Check `README.md` for full details.

---

**Need help?** Check the full walkthrough in the artifacts! 📚
