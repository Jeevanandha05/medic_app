
-- Attach the trigger to auth.users (it was missing!)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (user_id, email, first_name, last_name)
SELECT id, COALESCE(email, ''), COALESCE(raw_user_meta_data->>'first_name', ''), COALESCE(raw_user_meta_data->>'last_name', '')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- Backfill user_roles for existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, COALESCE((raw_user_meta_data->>'role')::app_role, 'patient')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- Backfill user_preferences
INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT DO NOTHING;

-- Backfill no_show_scores
INSERT INTO public.no_show_scores (patient_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT patient_id FROM public.no_show_scores)
ON CONFLICT DO NOTHING;
