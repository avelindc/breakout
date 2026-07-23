# Breakout Architecture Rules

## Staging Upload Architecture (CRITICAL)
- **Upload Flow**: All client-side music uploads (Release MP3s & Covers) **MUST** use **Supabase Storage** for the initial upload (`upload.ts` generating Supabase signed URLs). 
- **Reason**: Indonesian ISPs (Telkomsel, Indihome) actively block `*.r2.cloudflarestorage.com`. Using Cloudflare R2 presigned URLs directly from the browser will fail with `Status: 0` (CORS/Network Error). Supabase is anti-block.
- **Migration Flow**: Supabase is only a transit station to save quota. The files are periodically migrated from Supabase to **Cloudflare R2** via a migration script.
- **DO NOT** attempt to change `UploadForm.tsx` or `upload.ts` to point directly to R2 again. It will break the application for Indonesian users.
- **How to Migrate**: When the user asks to "migrate" or "sedot file ke R2", run the script that downloads releases from Supabase, uploads them to R2, updates the Prisma database to point to the R2 URLs, and then deletes the files from Supabase.
