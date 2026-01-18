# Swedish Studio

Production-ready web app for studying Swedish, built with Next.js, Supabase, and Tailwind CSS.

## Features
- **User Authentication**: Secure login/signup via Supabase.
- **Notes**: Markdown-supported notes with tags.
- **Vocabulary**: Manage Swedish-Dutch words, examples, and practice.
- **Grammar (NEW)**: Manage grammar topics with theory (Markdown) and exercises (MCQ/Fill-in).
- **Reading (NEW)**: Add reading texts, answer comprehension questions, and highlight words to add directly to Vocabulary.
- **Practice Modes**: 
  - Vocabulary: Multiple choice & Typing, SV->NL and NL->SV.
  - Grammar: Practice mixed exercises by topic.
  - Reading: Read texts and quiz yourself.
- **Import**: Bulk import vocabulary, grammar, and reading texts from Excel (.xlsx).
- **Export**: JSON backup of all user data.
- **Dark Mode**: Fully supported with persistent toggle.
- **Dutch UI**: Playful and professional interface.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database: Supabase (Postgres + Auth)
- UI: Tailwind CSS + shadcn/ui
- Excel Parsing: SheetJS

## Local Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Supabase Setup**
   - Create a new Supabase project.
   - Run the SQL contents from `supabase/schema.sql`, `supabase/migrations/phase2_grammar.sql`, and `supabase/migrations/phase3_reading.sql` in the Supabase SQL Editor to create tables and RLS policies.
   - Go to **Auth Settings** and ensure **Email auth** is enabled.
   - Set Site URL and Redirect URLs to `http://localhost:3000` (and `http://localhost:3000/auth/callback`).

3. **Environment Variables**
   Create a `.env.local` file in the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run Dev Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Import Template (Excel)

### Vocabulary
Upload an Excel file with columns (header matched vaguely via text):
- `Zweeds` / `sv`
- `Nederlands` / `nl`
- `Voorbeeld` / `Example`
- `Niveau` / `Level`

### Grammar
Upload an Excel file with 2 specific sheets:
1. **Grammar Topics**
   - Columns: `Title`, `Theory` (Markdown), `Level`, `Source`
2. **Grammar Exercises**
   - Columns: `Topic` (Must match a title from Topics), `Type` ('mcq' or 'fill_in'), `Question`, `Answer`, `Choices` (pipe separated `|` for MCQ), `Explanation`

### Reading
Upload an Excel file with 2 specific sheets:
1. **Reading Texts**
   - Columns: `Title`, `Content`, `Level`, `Source`
2. **Reading Questions**
   - Columns: `Text` (Must match a title from Texts), `Type` ('mcq' or 'open'), `Question`, `Answer`, `Choices` (pipe separated `|` for MCQ), `Explanation`

## Netlify Deployment

1. Push to GitHub.
2. Link repository in Netlify.
3. Add Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Netlify Site Settings.
4. Deploy.
