-- ============================================================
-- Run AFTER you create your account and sign in for the first time
-- This makes your account an approved admin
-- Replace 'YOUR_EMAIL' with your actual email
-- ============================================================

UPDATE public.profiles
SET approved = TRUE, is_admin = TRUE
WHERE email = 'YOUR_EMAIL';

-- Verify it worked:
SELECT id, email, nome, approved, is_admin FROM public.profiles;
