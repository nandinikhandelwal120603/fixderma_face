-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Product Catalog Table
create table product_catalog (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  concerns text[] not null,
  ingredients text[] not null,
  description text not null,
  price integer not null,
  image_url text not null,
  buy_link text not null,
  usage text not null
);

-- Condition to Product Map Table
create table condition_product_map (
  id uuid primary key default uuid_generate_v4(),
  condition text not null,
  severity text not null,
  product_ids uuid[] not null
);

-- Insert dummy data (you can replace with actual data)
insert into product_catalog (id, name, category, concerns, ingredients, description, price, image_url, buy_link, usage) values
  ('d1a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b1', 'Nigrifix Cream', 'Body Care', '{"pigmentation", "dark_patches", "acanthosis_nigricans"}', '{"Retinol", "Lactic Acid", "Tea Tree Oil"}', 'Customized formulation for Acanthosis Nigricans. Helps to clear the darkness and hardness related to certain body parts like neck, nape, thighs, elbows.', 600, 'https://via.placeholder.com/150', 'https://www.fixderma.com/products/nigrifix-cream', 'Apply on affected areas twice daily.'),
  ('d2a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b2', 'Salyzap Gel', 'Face Care', '{"acne"}', '{"Salicylic Acid", "Nicotinamide"}', 'A non-irritating, soothing formula that works fast to clear up breakouts and calm inflamed skin.', 400, 'https://via.placeholder.com/150', 'https://www.fixderma.com/products/salyzap-gel', 'Apply a thin layer to the affected area.'),
  ('d3a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b3', 'Skarfix-TX Cream', 'Face Care', '{"pigmentation", "melasma"}', '{"Tranexamic Acid", "Alpha Arbutin"}', 'Advanced formulation for melasma and hyperpigmentation. Promotes even skin tone.', 550, 'https://via.placeholder.com/150', 'https://www.fixderma.com/products/skarfix-tx-cream', 'Apply gently on the affected area.')
on conflict do nothing;

insert into condition_product_map (condition, severity, product_ids) values
  ('acne', 'mild', '{"d2a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b2"}'),
  ('acne', 'moderate', '{"d2a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b2"}'),
  ('acne', 'severe', '{"d2a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b2"}'),
  ('pigmentation', 'moderate', '{"d1a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b1", "d3a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b3"}'),
  ('dark_patches', 'moderate', '{"d1a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b1"}'),
  ('melasma', 'moderate', '{"d3a34b22-8d7a-4c91-9e7b-c4f4a3e9c2b3"}')
on conflict do nothing;
