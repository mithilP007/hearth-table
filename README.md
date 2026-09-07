# Hearth & Table

PROMPT 1 — Foundation & Roles

plain

Build "Hearth & Table", a responsive web marketplace connecting customers with verified cottage food producers through scheduled tastings. Two user roles only: Customer and Producer. Set up role-based authentication (email/password + Google social login) with a role field on users. Landing page at "/": warm hero with headline "Taste Before You Buy", subtext about discovering verified local cottage food producers, and two role cards — "I'm a Customer" and "I'm a Producer" — each routing to its signup flow. Cream background #FAF7F2, serif headline font, terracotta CTAs. No admin functionality anywhere in this app. Ask me any questions you need before generating.

(The "ask me questions" line triggers Lovable's clarifying mode and prevents misinterpretation.)

PROMPT 2 — Data Model (paste, then click "Apply Changes" on the SQL)

plain

Create the database schema for Hearth & Table:
- profiles (extends auth.users: id, role [customer|producer], full_name, phone, dietary_preferences as text array, avatar_url)
- producers (id references profiles, business_name, bio, cuisine_categories text array, address, lat, lng, cover_image_url, verification_status enum: pending|verified|needs_attention DEFAULT pending, is_available_for_tastings boolean)
- verification_documents (id, producer_id references producers, document_type enum: cottage_food_permit|food_handler_card|business_id, file_url, uploaded_at)
- products (id, producer_id references producers, name, description, category, price numeric, full_order_price numeric, is_tasting_available boolean, image_url, dietary_tags text array)
- tasting_slots (id, product_id references products, date, start_time, capacity int, booked_count int DEFAULT 0, is_available boolean DEFAULT true)
- bookings (id, customer_id references profiles, slot_id references tasting_slots, booking_ref text unique, tasting_mode enum: market_pickup|home_pickup|producer_delivery, status enum: reserved|confirmed|ready|completed DEFAULT reserved, qr_token text, created_at)
All tables need created_at/updated_at timestamps. Seed 6 realistic producers (mix of verified and pending, Texas-based home bakers, jam makers, confectioners), 3-4 products each, and tasting slots across the next 7 days with varied capacity. Do not change the landing page or auth.

PROMPT 3 — Customer Onboarding

plain

Build customer onboarding at /customer/signup: multi-step form — step 1: name, email, password, Google option; step 2: dietary preference tags as selectable chips (Gluten-Free, Vegan, Nut-Free, Halal, Kosher, Vegetarian); step 3: location permission prompt with a friendly explainer ("We use your location to find verified producers near you") and a manual ZIP code fallback. Terracotta progress indicator, cream background, white cards. After completion route to /discover. Do not change the database or the landing page.

PROMPT 4 — Discovery (Map + List)

plain

Build the customer discovery page at /discover. Layout: top search bar, filter chips row (cuisine category, dietary tag, distance: <5mi / <10mi / <25mi), and a map/list toggle. Map view: producer markers with terracotta pins, sage "Verified" badge on verified producers, clicking a marker opens a bottom sheet card. List view: producer cards showing cover image, business name, cuisine categories, distance in miles, and verification badge — verified producers in sage, pending producers hidden from discovery entirely. Only producers with verification_status = 'verified' AND is_available_for_tastings = true appear. Use the seeded producer data. Filter chips actually filter the results. Responsive: on mobile the map is a bottom sheet with draggable height. Do not modify onboarding or auth.

PROMPT 5 — Producer Profile + Product Detail

plain

Build two pages. 
1) /producer/:id — producer profile: cover image, business name, sage "Verified Cottage Food Producer" badge with "Registration verified" subtitle, bio, address, and a product catalogue grid. Each product card: image, name, price, dietary tag chips, and if is_tasting_available is true show a terracotta "Book a Tasting" badge.
2) /product/:id — product detail: image gallery, name, description, category, price, dietary tags, and two actions: a primary terracotta "Book a Tasting" button (routes to /booking/:productId) and a secondary "Order Full Size" button showing the full_order_price. Do not change discovery or the database schema.

PROMPT 6 — Tasting Booking Flow

plain

Build the tasting booking page at /booking/:productId with a 3-step flow and a progress indicator:
Step 1 — Tasting mode: three selectable cards — "Pickup at Market" (free), "Home Pickup" (free), "Producer Delivery" (labeled "Concept preview"). Only home_pickup and market_pickup actually proceed in this POC.
Step 2 — Date & time: horizontal date selector for the next 7 days that have available slots, then a grid of time slots fetched from tasting_slots where is_available = true and booked_count < capacity. Booked-out slots show as disabled. Selecting a slot decrements remaining capacity.
Step 3 — Summary: product name, producer, tasting mode, date/time, then "Confirm Booking" button.
On confirm: create a booking with a unique booking_ref like "HT-XXXXXX", generate a qr_token, set status to 'reserved', increment the slot's booked_count, and route to /booking/confirm/:id. Toast notifications for success/error throughout. Do not change other pages.

PROMPT 7 — QR Confirmation + Booking History

plain

Build two pages.
1) /booking/confirm/:id — booking confirmation: large centered QR code (use a QR library component) inside a terracotta-accented rounded frame, booking reference number in monospace, producer name, date/time, tasting mode, location. Action buttons: "Add to Calendar" (generates an .ics download), "Share" (native share/copy link). Status badge shows "Reserved — awaiting producer confirmation" in amber. A status timeline stepper shows Reserved → Confirmed → Ready → Completed with Reserved active.
2) /my-bookings — customer bookings list: "Upcoming" and "Past" tabs, each booking card showing product image, producer name, date/time, QR thumbnail, status badge, and the status timeline. When a booking status is 'confirmed' or later, show a terracotta "Convert to Full Order" button that opens a mock checkout modal showing the full order price with the tasting fee credited as a discount line, and a "Place Order" button that marks the booking 'completed' via a toast. Include an empty state with an illustration-style icon and "No tastings booked yet — discover producers near you" with a CTA to /discover. Do not modify the booking flow or database schema.

PROMPT 8 — Producer Onboarding + Verification

plain

Build the producer journey start. /producer/signup: account creation (business name, email, password, phone, bio) then routes to /producer/verify.
/producer/verify — verification submission page: document upload cards (drag-and-drop) for State Cottage Food Permit, Food Handler Card, and Business ID, with a progress tracker (Account → Documents → Under Review). On submit, set verification_status to 'pending', show an amber "Under Review — usually within 2 business days" state, and route to /producer/dashboard. Verification status must gate discovery: only 'verified' producers appear in /discover. Keep the cream/terracotta theme. Do not change customer pages.

PROMPT 9 — Producer Dashboard + Product Management

plain

Build the producer dashboard at /producer/dashboard with a sidebar layout (Dashboard, Products, Availability, Bookings, Settings). Dashboard content: welcome header with business name, stat cards row — Upcoming Tastings count, Total Bookings, Tasting Conversion Rate (mock % of bookings that converted), and a verification status badge (sage Verified / amber Pending / red Needs Attention). Below: a "Pending Requests" alert card if any bookings exist with status 'reserved', and a recent bookings feed.
/producer/products — product management: grid of the producer's products with edit/delete actions, and a "Add Product" button opening a modal form (name, description, category dropdown, price, full order price, image upload, dietary tag chips, "Available as tasting" toggle switch creating is_tasting_available). Toast on save. Responsive: sidebar collapses to hamburger on mobile. Do not change customer-facing pages.

PROMPT 10 — Availability + Booking Requests

plain

Build two producer pages.
1) /producer/availability — simple slot manager: a 7-day calendar strip, and a "Create Tasting Slot" form (select product, date, time, capacity 1–50). Below, a list of existing slots for the selected day with booked/total capacity shown (e.g., "7/12 booked") and a toggle to mark each slot available/unavailable.
2) /producer/bookings — booking requests: "Incoming Requests" section listing bookings with status 'reserved' showing customer name, product, date/time, tasting mode, and terracotta "Accept & Confirm" / outline "Decline" buttons (accept sets status to 'confirmed'; customer must see this update). "Upcoming Confirmed" section below with status timeline and a QR-code scanner placeholder box labeled "Check-in scanner (demo)". Filter by status tabs. Do not modify dashboard or products.

PROMPT 11 — Polish Pass

plain

Polish pass on the whole app without changing any functionality:
- Add cream-colored loading skeletons to all lists and cards.
- Add empty states everywhere a list can be empty (bookings, products, slots, requests).
- Ensure all forms show inline validation errors in red below fields and disable submit while invalid.
- Verify responsive behavior: mobile (<768px) single column with bottom nav for customers; tablet 2-column grids; desktop full sidebar for producers, max-width 1280px container.
- Customer bottom navigation: Discover, My Bookings, Profile icons. Producer profile/settings page at /producer/settings with notification preference toggles and logout.
- All status changes (booking accepted, product saved, slot created) show toast confirmations.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a5251363-af06-4426-b53a-09fb27329b9f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
