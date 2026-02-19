
-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'));
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  INSERT INTO public.no_show_scores (patient_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS: profiles
CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS: providers
CREATE POLICY "Anyone can read active providers" ON public.providers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can read all providers" ON public.providers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can insert own provider" ON public.providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can update own provider" ON public.providers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS: availability_slots
CREATE POLICY "Anyone can read active slots" ON public.availability_slots FOR SELECT USING (is_active = true);
CREATE POLICY "Doctors manage own slots" ON public.availability_slots FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);

-- RLS: appointments
CREATE POLICY "Patients read own appts" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors read their appts" ON public.appointments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Admins read all appts" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients create appts" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients update own appts" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors update their appts" ON public.appointments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);

-- RLS: reviews
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Patients create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Admins update reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: ai_predictions
CREATE POLICY "Patients read own predictions" ON public.ai_predictions FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors read patient predictions" ON public.ai_predictions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage predictions" ON public.ai_predictions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: notifications
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: user_preferences
CREATE POLICY "Users manage own prefs" ON public.user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS: no_show_scores
CREATE POLICY "Users read own score" ON public.no_show_scores FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Admins manage scores" ON public.no_show_scores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Indexes
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_provider ON public.appointments(provider_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX idx_ai_predictions_patient ON public.ai_predictions(patient_id);
