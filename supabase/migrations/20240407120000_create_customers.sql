
-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  -- Registration (RBI, IE, GST, HS, etc.)
  rbi_code TEXT,
  ie_code TEXT,
  gst_number TEXT,
  lut_number TEXT,
  other_references TEXT[], -- Use TEXT[] for dynamic reference lines
  -- Bank Details
  bank_name TEXT,
  bank_branch TEXT,
  bank_address TEXT,
  account_number TEXT,
  swift_code TEXT,
  -- Default Shipment/Header Values
  default_port_of_loading TEXT,
  default_port_of_discharge TEXT,
  default_final_destination TEXT,
  default_final_destination_country TEXT,
  default_terms_of_delivery TEXT,
  default_terms_of_payment TEXT,
  default_currency TEXT DEFAULT 'USD',
  default_hs_code TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own customers
CREATE POLICY "Users can manage their own customers"
ON public.customers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
