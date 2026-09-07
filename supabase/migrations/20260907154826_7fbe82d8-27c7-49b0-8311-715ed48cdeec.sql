CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TYPE public.app_role AS ENUM ('customer','producer');
CREATE TYPE public.verification_status AS ENUM ('pending','verified','needs_attention');
CREATE TYPE public.document_type AS ENUM ('cottage_food_permit','food_handler_card','business_id');
CREATE TYPE public.tasting_mode AS ENUM ('market_pickup','home_pickup','producer_delivery');
CREATE TYPE public.booking_status AS ENUM ('reserved','confirmed','ready','completed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL DEFAULT 'customer',
  full_name text,
  phone text,
  dietary_preferences text[] NOT NULL DEFAULT '{}',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.producers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  bio text,
  cuisine_categories text[] NOT NULL DEFAULT '{}',
  address text,
  lat numeric,
  lng numeric,
  cover_image_url text,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  is_available_for_tastings boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  file_url text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  price numeric NOT NULL DEFAULT 0,
  full_order_price numeric NOT NULL DEFAULT 0,
  is_tasting_available boolean NOT NULL DEFAULT true,
  image_url text,
  dietary_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tasting_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  capacity int NOT NULL DEFAULT 10,
  booked_count int NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  slot_id uuid NOT NULL REFERENCES public.tasting_slots(id) ON DELETE CASCADE,
  booking_ref text UNIQUE NOT NULL,
  tasting_mode public.tasting_mode NOT NULL DEFAULT 'market_pickup',
  status public.booking_status NOT NULL DEFAULT 'reserved',
  qr_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.producers, public.verification_documents, public.products, public.tasting_slots, public.bookings TO anon, authenticated;
GRANT ALL ON public.profiles, public.producers, public.verification_documents, public.products, public.tasting_slots, public.bookings TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo open profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open producers" ON public.producers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open verification_documents" ON public.verification_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open products" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open tasting_slots" ON public.tasting_slots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open bookings" ON public.bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_producers_upd BEFORE UPDATE ON public.producers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_docs_upd BEFORE UPDATE ON public.verification_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_products_upd BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_slots_upd BEFORE UPDATE ON public.tasting_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_bookings_upd BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.profiles (id, role, full_name, phone, dietary_preferences) VALUES
 ('11111111-1111-4111-8111-111111111101','customer','Demo Customer','512-555-0100','{Gluten-Free,Vegetarian}'),
 ('11111111-1111-4111-8111-111111111102','producer','Marisol Vega','512-555-0111','{}'),
 ('11111111-1111-4111-8111-111111111103','producer','Dwight Carver','512-555-0112','{}'),
 ('11111111-1111-4111-8111-111111111104','producer','Ada Whitfield','214-555-0113','{}'),
 ('11111111-1111-4111-8111-111111111105','producer','Rosa Duarte','713-555-0114','{}'),
 ('11111111-1111-4111-8111-111111111106','producer','Nate Kimball','210-555-0115','{}'),
 ('11111111-1111-4111-8111-111111111107','producer','Priya Raman','512-555-0116','{}');

INSERT INTO public.producers (id, profile_id, business_name, bio, cuisine_categories, address, lat, lng, cover_image_url, verification_status, is_available_for_tastings) VALUES
 ('22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111102','Vega Hearth Breads','Third-generation sourdough baker working out of a small Austin kitchen. Long ferments, Texas-milled flour, nothing else.','{Bakery,Sourdough}','1204 E Cesar Chavez St, Austin, TX',30.2570,-97.7250,'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80','verified',true),
 ('22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111103','Carver Jam Co.','Small-batch preserves from Hill Country orchards. Peach, fig, and jalapeno jelly are the house trio.','{Jams,Preserves}','905 W 10th St, Austin, TX',30.2760,-97.7560,'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&q=80','verified',true),
 ('22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111104','Whitfield Confections','Hand-tempered chocolates and pecan brittle made in a Dallas home kitchen.','{Confections,Chocolate}','3311 Greenville Ave, Dallas, TX',32.8230,-96.7700,'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1200&q=80','verified',true),
 ('22222222-2222-4222-8222-222222222204','11111111-1111-4111-8111-111111111105','Duarte Pan Dulce','Conchas, orejas, and tres leches cups baked fresh each morning in Houston.','{Bakery,Mexican}','2402 Navigation Blvd, Houston, TX',29.7500,-95.3350,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&q=80','verified',true),
 ('22222222-2222-4222-8222-222222222205','11111111-1111-4111-8111-111111111106','Kimball Smokehouse Sauces','Slow-simmered barbecue sauces and rubs from San Antonio. Awaiting permit review.','{Sauces,BBQ}','1420 S Alamo St, San Antonio, TX',29.4100,-98.4900,'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=1200&q=80','pending',true),
 ('22222222-2222-4222-8222-222222222206','11111111-1111-4111-8111-111111111107','Raman Spice Kitchen','South Indian pickles, podi, and ghee sweets. Paperwork in progress.','{Pickles,Indian}','6800 Burnet Rd, Austin, TX',30.3560,-97.7390,'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&q=80','pending',true);

INSERT INTO public.verification_documents (producer_id, document_type, file_url) VALUES
 ('22222222-2222-4222-8222-222222222201','cottage_food_permit','demo/vega-permit.pdf'),
 ('22222222-2222-4222-8222-222222222201','food_handler_card','demo/vega-handler.pdf'),
 ('22222222-2222-4222-8222-222222222202','cottage_food_permit','demo/carver-permit.pdf'),
 ('22222222-2222-4222-8222-222222222203','cottage_food_permit','demo/whitfield-permit.pdf'),
 ('22222222-2222-4222-8222-222222222204','cottage_food_permit','demo/duarte-permit.pdf'),
 ('22222222-2222-4222-8222-222222222205','food_handler_card','demo/kimball-handler.pdf');

INSERT INTO public.products (producer_id, name, description, category, price, full_order_price, is_tasting_available, image_url, dietary_tags) VALUES
 ('22222222-2222-4222-8222-222222222201','Country Sourdough Loaf','48-hour cold-fermented loaf with a blistered crust and open crumb.','Bread',4.00,11.00,true,'https://images.unsplash.com/photo-1585478259715-1c093a7b70d3?w=900&q=80','{Vegan,Nut-Free}'),
 ('22222222-2222-4222-8222-222222222201','Rosemary Focaccia','Olive-oil rich focaccia with garden rosemary and flaky salt.','Bread',3.50,9.50,true,'https://images.unsplash.com/photo-1591985666643-1ecc67e4b7e5?w=900&q=80','{Vegetarian,Nut-Free}'),
 ('22222222-2222-4222-8222-222222222201','Seeded Rye Batard','Caraway and sunflower seed rye, dense and tangy.','Bread',4.50,12.00,true,'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=900&q=80','{Vegan}'),
 ('22222222-2222-4222-8222-222222222201','Cardamom Morning Buns','Laminated buns rolled in cardamom sugar.','Pastry',3.00,14.00,false,'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=900&q=80','{Vegetarian}'),
 ('22222222-2222-4222-8222-222222222202','Hill Country Peach Jam','Late-summer peaches, lemon, and a whisper of vanilla bean.','Jam',3.00,9.00,true,'https://images.unsplash.com/photo-1600854109436-e1ae0b6ba64f?w=900&q=80','{Vegan,Gluten-Free,Nut-Free}'),
 ('22222222-2222-4222-8222-222222222202','Fig & Black Pepper Preserve','Mission figs with cracked pepper. Excellent on sharp cheese.','Jam',3.50,10.00,true,'https://images.unsplash.com/photo-1560180474-e8563fd75bab?w=900&q=80','{Vegan,Gluten-Free}'),
 ('22222222-2222-4222-8222-222222222202','Jalapeno Pepper Jelly','Sweet-hot jelly for biscuits and cream cheese.','Jelly',3.00,8.50,true,'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=80','{Vegan,Gluten-Free,Halal}'),
 ('22222222-2222-4222-8222-222222222203','Sea Salt Pecan Brittle','Buttery brittle with Texas pecans and flaked sea salt.','Confection',4.00,13.00,true,'https://images.unsplash.com/photo-1511381939415-e44015466834?w=900&q=80','{Gluten-Free,Vegetarian}'),
 ('22222222-2222-4222-8222-222222222203','Dark Chocolate Truffles','70% ganache truffles rolled in cocoa.','Chocolate',5.00,22.00,true,'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=900&q=80','{Gluten-Free,Vegetarian,Kosher}'),
 ('22222222-2222-4222-8222-222222222203','Bourbon Caramels','Slow-cooked caramels finished with a touch of bourbon.','Confection',4.50,16.00,true,'https://images.unsplash.com/photo-1587244141530-c1a5c6ad0c68?w=900&q=80','{Gluten-Free,Nut-Free}'),
 ('22222222-2222-4222-8222-222222222204','Vanilla Concha','Classic sweet bread with a crackled vanilla shell.','Pastry',2.50,8.00,true,'https://images.unsplash.com/photo-1587248720327-8eb72c48e850?w=900&q=80','{Vegetarian,Nut-Free}'),
 ('22222222-2222-4222-8222-222222222204','Oreja Palmier','Flaky sugar-glazed palmiers, crisp all the way through.','Pastry',2.00,7.50,true,'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=900&q=80','{Vegetarian}'),
 ('22222222-2222-4222-8222-222222222204','Tres Leches Cup','Individual sponge soaked in three milks, cinnamon dusted.','Dessert',4.00,15.00,true,'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=900&q=80','{Vegetarian,Nut-Free}'),
 ('22222222-2222-4222-8222-222222222205','Mesquite BBQ Sauce','Molasses and mesquite smoke, thick enough to cling.','Sauce',3.00,9.00,true,'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=900&q=80','{Gluten-Free,Vegan}'),
 ('22222222-2222-4222-8222-222222222205','Coffee Brisket Rub','Ground coffee, chili, and brown sugar dry rub.','Spice',3.00,8.00,true,'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=80','{Vegan,Gluten-Free}'),
 ('22222222-2222-4222-8222-222222222206','Lemon Avakkai Pickle','Sharp lemon pickle cured with mustard and chili.','Pickle',3.00,10.00,true,'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=900&q=80','{Vegan,Gluten-Free,Halal}'),
 ('22222222-2222-4222-8222-222222222206','Idli Milagai Podi','Roasted lentil and chili powder for dosa and idli.','Spice',2.50,7.00,true,'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=900&q=80','{Vegan,Gluten-Free}'),
 ('22222222-2222-4222-8222-222222222206','Ghee Mysore Pak','Dense gram flour sweet, cut into squares.','Dessert',4.00,14.00,true,'https://images.unsplash.com/photo-1605478371310-a9f1e96b4ff4?w=900&q=80','{Vegetarian,Gluten-Free}');

INSERT INTO public.tasting_slots (product_id, date, start_time, capacity, booked_count, is_available)
SELECT p.id,
       (CURRENT_DATE + d)::date,
       t.start_time,
       cap.capacity,
       LEAST(cap.capacity, (abs(hashtext(p.id::text || d::text || t.start_time::text)) % (cap.capacity + 1))),
       true
FROM public.products p
CROSS JOIN generate_series(0,6) AS d
CROSS JOIN (VALUES ('10:00'::time),('12:30'::time),('15:00'::time),('17:30'::time)) AS t(start_time)
CROSS JOIN LATERAL (SELECT 4 + (abs(hashtext(p.id::text || d::text)) % 9) AS capacity) cap
WHERE p.is_tasting_available = true;