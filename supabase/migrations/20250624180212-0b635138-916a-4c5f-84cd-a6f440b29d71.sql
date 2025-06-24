
-- Update the trigger function to handle username conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Get the base username from metadata or email
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  final_username := base_username;
  
  -- Check if username exists and append numbers until we find a unique one
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || counter::text;
    counter := counter + 1;
  END LOOP;
  
  INSERT INTO public.profiles (user_id, username, full_name, subscription_tier, credits)
  VALUES (
    NEW.id,
    final_username,
    NEW.raw_user_meta_data->>'full_name',
    'free',
    100
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
