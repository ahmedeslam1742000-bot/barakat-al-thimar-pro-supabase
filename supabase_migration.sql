CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_no TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all actions for authenticated users only" ON public.journal_entries
  FOR ALL USING (auth.role() = 'authenticated');
