ALTER TABLE public.stores ADD COLUMN plan text NOT NULL DEFAULT 'free';

CREATE OR REPLACE FUNCTION public.validate_store_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan NOT IN ('free', 'pro', 'premium') THEN
    RAISE EXCEPTION 'Invalid plan value: %. Must be free, pro, or premium.', NEW.plan;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_store_plan
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_store_plan();