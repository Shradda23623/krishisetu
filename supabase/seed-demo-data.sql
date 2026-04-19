-- =============================================================================
-- KrishiSetu Demo Data Seed Script
-- =============================================================================
-- Populates the site with ~30 products across all 9 categories so the
-- home page, shop page, and category pages look full for demos/screenshots.
--
-- Products are distributed round-robin across every existing farmer account.
-- Also updates each farmer's profile with an Indian city/region + lat/lng so
-- the "Nearby Farmers" map has something to show, and seeds a handful of
-- reviews so product cards show ratings.
--
-- ---------------------------------------------------------------------------
-- HOW TO USE:
--   1. Sign up 1-3 farmer accounts through your site (signup tab, role = Farmer).
--      More farmers = more realistic demo. 1 farmer also works.
--   2. Open https://supabase.com/dashboard -> your project -> "SQL Editor"
--   3. Click "New query", paste this ENTIRE file, click "Run".
--   4. Refresh your site. The Shop, Home, and category pages will be populated.
--
-- TO REMOVE all demo data later:
--   DELETE FROM public.reviews WHERE comment LIKE '[demo]%';
--   DELETE FROM public.products WHERE description LIKE '[demo]%';
-- =============================================================================

DO $$
DECLARE
  farmer_ids UUID[];
  farmer_count INT;
  fid UUID;
  i INT := 0;
  -- Indian locations to sprinkle across the farmers (used round-robin)
  locations TEXT[] := ARRAY[
    'Nashik, Maharashtra',
    'Ludhiana, Punjab',
    'Coimbatore, Tamil Nadu',
    'Ratnagiri, Maharashtra',
    'Shillong, Meghalaya',
    'Dehradun, Uttarakhand',
    'Kolhapur, Maharashtra',
    'Alleppey, Kerala'
  ];
  lats DOUBLE PRECISION[] := ARRAY[19.9975, 30.9010, 11.0168, 16.9944, 25.5788, 30.3165, 16.7050, 9.4981];
  lngs DOUBLE PRECISION[] := ARRAY[73.7898, 75.8573, 76.9558, 73.3000, 91.8933, 78.0322, 74.2433, 76.3388];
BEGIN
  -- 1. Gather every farmer ---------------------------------------------------
  SELECT array_agg(user_id ORDER BY id) INTO farmer_ids
  FROM public.user_roles
  WHERE role = 'farmer';

  farmer_count := COALESCE(array_length(farmer_ids, 1), 0);

  IF farmer_count = 0 THEN
    RAISE EXCEPTION
      'No farmer account found. Sign up at least one farmer on the site (signup tab -> role = Farmer), then re-run this script.';
  END IF;

  RAISE NOTICE 'Found % farmer account(s). Seeding products across them...', farmer_count;

  -- 2. Give each farmer a location + coords so the map works -----------------
  FOR i IN 1..farmer_count LOOP
    UPDATE public.profiles
    SET
      address  = COALESCE(NULLIF(address, ''),  locations[((i - 1) % array_length(locations, 1)) + 1]),
      latitude = COALESCE(latitude,  lats[((i - 1) % array_length(lats, 1)) + 1]),
      longitude = COALESCE(longitude, lngs[((i - 1) % array_length(lngs, 1)) + 1]),
      delivery_radius_km = COALESCE(delivery_radius_km, 25)
    WHERE user_id = farmer_ids[i];
  END LOOP;

  -- 3. Insert products (round-robin across farmers) --------------------------
  -- Helper: pick farmer_ids[(row_number % farmer_count) + 1]
  WITH demo_products(name, description, category, image_url, price, unit, stock_quantity) AS (
    VALUES
      -- VEGETABLES (4) -----------------------------------------------------
      ('Fresh Farm Tomatoes',      '[demo] Vine-ripened tomatoes hand-picked this morning. No pesticides. Perfect for curries and salads.',
        'vegetables', 'https://images.unsplash.com/photo-1546470427-e5ac89c8ba1d?w=800', 40.00,  'kg',   50),
      ('Organic Baby Spinach',     '[demo] Tender baby spinach grown using drip irrigation. Rich in iron. Ideal for salads and palak dishes.',
        'vegetables', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800', 60.00,  '500g', 30),
      ('Purple Brinjal',           '[demo] Glossy purple brinjal from Karnataka farms. Great for baingan bharta and curries.',
        'vegetables', 'https://images.unsplash.com/photo-1635341814048-dfa96eb0e9d1?w=800', 50.00,  'kg',   40),
      ('Farm Fresh Okra (Bhindi)', '[demo] Tender okra, harvested young. Non-fibrous, perfect for bhindi masala.',
        'vegetables', 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=800', 55.00,  'kg',   35),

      -- FRUITS (4) ---------------------------------------------------------
      ('Alphonso Mangoes',     '[demo] Premium Ratnagiri Alphonso. Sweet, juicy, pulpy. The King of Fruits. Seasonal.',
        'fruits', 'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800', 450.00, 'kg',   30),
      ('Shimla Apples',        '[demo] Crisp red apples straight from Himachal orchards. Perfect snacking apple.',
        'fruits', 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800', 180.00, 'kg',   60),
      ('Nagpur Oranges',       '[demo] Juicy Nagpur seedless oranges. Thin peel, sweet pulp.',
        'fruits', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800', 90.00,  'kg',   80),
      ('Sweet Bananas (Robusta)', '[demo] Farm-fresh robusta bananas. Naturally ripened, no carbide.',
        'fruits', 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800', 50.00,  'dozen', 40),

      -- DAIRY (3) ----------------------------------------------------------
      ('Pure Desi Ghee',           '[demo] Traditional bilona ghee from grass-fed desi cow milk. Rich aroma, glass jar.',
        'dairy', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800', 850.00, '500g', 20),
      ('A2 Cow Milk',              '[demo] Fresh A2 milk from Gir cows. Delivered chilled. Subscription available.',
        'dairy', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800', 80.00,  'L',    100),
      ('Artisan Paneer',           '[demo] Soft hand-made paneer from buffalo milk. No preservatives. Made fresh daily.',
        'dairy', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800', 320.00, '500g', 25),

      -- GRAINS (3) ---------------------------------------------------------
      ('Basmati Rice (Aged)',          '[demo] Aged long-grain basmati from Dehradun. Perfect biryani and pulao rice.',
        'grains', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800', 180.00, 'kg', 100),
      ('Stone-Ground Wheat Flour',     '[demo] Chakki-ground sharbati wheat atta. Soft rotis, high fiber. Pesticide-free.',
        'grains', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', 65.00,  'kg', 120),
      ('Organic Toor Dal',             '[demo] Unpolished arhar/toor dal from Madhya Pradesh. Cooks faster, tastes earthier.',
        'grains', 'https://images.unsplash.com/photo-1612257999756-74ec4e1ac5fc?w=800', 160.00, 'kg', 70),

      -- DRY FRUITS (3) -----------------------------------------------------
      ('Kashmir Almonds (Mamra)',      '[demo] Premium Mamra almonds from Kashmir. Smaller, sweeter, higher oil content.',
        'dryfruits', 'https://images.unsplash.com/photo-1508747703725-719777637510?w=800', 1200.00, '500g', 25),
      ('California Walnuts (Kernels)', '[demo] Shelled walnut halves. Rich in omega-3. Grown in Kashmir valleys.',
        'dryfruits', 'https://images.unsplash.com/photo-1606841689895-f0a50e0e5a0d?w=800', 950.00,  '500g', 20),
      ('Anjeer (Dried Figs)',          '[demo] Sun-dried Afghani anjeer. Soft, sweet, naturally chewy.',
        'dryfruits', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800', 780.00,  '250g', 30),

      -- SPICES (4) ---------------------------------------------------------
      ('Lakadong Turmeric Powder', '[demo] Stone-ground Lakadong turmeric from Meghalaya. 7%+ curcumin - the highest in India.',
        'spices', 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800', 320.00, '250g', 40),
      ('Kashmiri Red Chilli',      '[demo] Deep red Kashmiri chilli powder. Mild heat, intense color, perfect for tandoori.',
        'spices', 'https://images.unsplash.com/photo-1583275320329-2f9e7c3a4d85?w=800', 280.00, '250g', 45),
      ('Malabar Black Pepper',     '[demo] Whole Malabar peppercorns from Kerala hills. Floral, pungent, fresh ground is best.',
        'spices', 'https://images.unsplash.com/photo-1599909533730-f1e0f37c1a7f?w=800', 420.00, '250g', 35),
      ('Organic Cumin Seeds',      '[demo] Sun-dried cumin seeds from Rajasthan. Strong aroma, essential for tadka.',
        'spices', 'https://images.unsplash.com/photo-1599909049678-9bc80b48a1c8?w=800', 150.00, '250g', 60),

      -- PICKLES (3) --------------------------------------------------------
      ('Traditional Mango Pickle',  '[demo] Homemade raw mango pickle slow-cured in mustard oil. No preservatives, no colors.',
        'pickles', 'https://images.unsplash.com/photo-1612323401395-1dccbf6e2f2b?w=800', 280.00, '500g', 25),
      ('Spicy Lemon Pickle',        '[demo] Sun-cured Nimboo achar with fenugreek and chilli. A tangy punch for every thali.',
        'pickles', 'https://images.unsplash.com/photo-1625944022669-5b6a54a4e0bd?w=800', 220.00, '500g', 30),
      ('Andhra Gongura Pickle',     '[demo] Traditional Andhra gongura pickle in sesame oil. Fiery, tangy, a rice-mixer favorite.',
        'pickles', 'https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=800', 260.00, '500g', 20),

      -- JAGGERY (3) --------------------------------------------------------
      ('Organic Kolhapuri Jaggery', '[demo] Chemical-free jaggery from Kolhapur. Dark, aromatic, rich in iron.',
        'jaggery', 'https://images.unsplash.com/photo-1630146963783-c86b82ddd4b9?w=800', 150.00, 'kg',  60),
      ('Palm Jaggery (Karupatti)',  '[demo] Traditional Tamil Nadu palm jaggery. Lower GI than sugar, earthy flavor.',
        'jaggery', 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=800', 380.00, 'kg',  35),
      ('Date Palm Jaggery (Nolen Gur)', '[demo] Winter-harvested Bengali nolen gur. Smoky, caramel-sweet, seasonal.',
        'jaggery', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800', 420.00, 'kg',  15),

      -- OILS (3) -----------------------------------------------------------
      ('Cold-Pressed Mustard Oil', '[demo] Wood-pressed kachi ghani mustard oil. Pungent, authentic, no refining.',
        'oils', 'https://images.unsplash.com/photo-1601493700518-c24f12f4b34d?w=800', 420.00, 'L', 35),
      ('Groundnut Oil (Wood Pressed)', '[demo] Traditional wood-pressed groundnut oil. Light, nutty, good for South Indian cooking.',
        'oils', 'https://images.unsplash.com/photo-1591772267643-de3b1dd7305e?w=800', 380.00, 'L', 40),
      ('Virgin Coconut Oil',          '[demo] Cold-extracted coconut oil from Kerala. Unrefined, aromatic, good for cooking and skin.',
        'oils', 'https://images.unsplash.com/photo-1623636506125-2ac1e3a24d1a?w=800', 520.00, 'L', 30)
  )
  INSERT INTO public.products (farmer_id, name, description, category, image_url, price, unit, stock_quantity, is_active)
  SELECT
    farmer_ids[((row_number() OVER () - 1)::INT % farmer_count) + 1] AS farmer_id,
    name, description, category, image_url, price, unit, stock_quantity, true
  FROM demo_products;

  RAISE NOTICE 'Inserted demo products. They are distributed across the % farmer(s) you have.', farmer_count;

  -- 4. Seed a few reviews so star ratings show up -----------------------------
  -- We'll have farmers review each other's products (any authenticated user
  -- can leave reviews in the RLS policy, and the seed runs as postgres so
  -- RLS is bypassed anyway). If there's only one farmer, skip reviews.
  IF farmer_count >= 2 THEN
    INSERT INTO public.reviews (customer_id, farmer_id, product_id, rating, comment)
    SELECT
      -- reviewer = a different farmer than the seller
      farmer_ids[((idx) % farmer_count) + 1],
      p.farmer_id,
      p.id,
      rating,
      comment
    FROM (
      SELECT id, farmer_id, row_number() OVER (ORDER BY created_at DESC) - 1 AS idx
      FROM public.products
      WHERE description LIKE '[demo]%'
      LIMIT 12
    ) p
    CROSS JOIN LATERAL (
      VALUES
        (5, '[demo] Fantastic quality, will order again!'),
        (4, '[demo] Fresh and well-packed. Delivery was quick.'),
        (5, '[demo] Exactly as described. Highly recommended.'),
        (4, '[demo] Very good. Slightly pricey but worth it.')
    ) AS r(rating, comment)
    WHERE (p.idx % 4) = 0;  -- only 1 review per 4 products to vary things
  END IF;

  RAISE NOTICE 'Done. Refresh your site to see the demo data.';
END $$;

-- Quick verification of what just got inserted
SELECT
  p.category,
  COUNT(*) AS num_products,
  MIN(p.price) AS min_price,
  MAX(p.price) AS max_price
FROM public.products p
WHERE p.description LIKE '[demo]%'
GROUP BY p.category
ORDER BY p.category;
