# Elaren Landing – Shopify theme

A Shopify landing-page theme for **Elaren** (shopelaren.com) and its Pumpkin Seed Regrowth Oil with
Caffeine Complex. The copy targets women over 35 experiencing hair loss in all its forms (female
pattern thinning, postpartum and menopausal shedding, traction alopecia, alopecia areata, stress
shedding) and is grounded in Elaren's own store data: real product names, prices, subscription
terms, verified customer reviews, the 30-day money-back guarantee and the hair-loss research
donation from the "Our Elaren Story" page.

The layout was recreated from the Frøya Organics landing page
<https://froyaorganics.com/pages/fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin>
(captured 2026-09-08). Every section is now a real, editable Shopify section: text, links, images,
videos and products are changed in the theme editor (Online Store → Themes → Customize), not in
code. The landing page is the home page (`templates/index.json`) and is also available as a page
template (`templates/page.froya-landing.json`).

## Editing the page in the theme editor

* **Text** – every heading, paragraph, label, button and badge is a section setting or a block
  setting. Click the section (or the item inside it) in the editor sidebar and edit the field.
* **Images** – every image has an *Image* picker. Until you upload one, the placeholder from the
  Frøya capture is shown (its URL sits in a "Fallback … URL" field on blocks, so you can also
  clear it). Recommended sizes are shown under each picker.
* **Hero on phones** – the hero is tall on a phone, so a landscape desktop photo gets cropped to
  about a third of its width. Upload a portrait crop (820 × 1100 px) as *Mobile background image*
  for the best result. Hero → *Mobile image framing* offers *Fill the hero* (crops; *Mobile focal
  point* chooses which part is kept) or *Whole photo at the top* (uncropped, with *Colour
  behind the text* filling the area under it). *Photo space under the text* keeps room below the
  last proof point so the person in a portrait shot stays visible under the copy, as on the reference.
* **Logo** – Header → Logo (plus a width slider). Used in the bar and the mobile menu.
* **Products** – the buy box, menu bestseller cards, review-card product tiles and cart-drawer
  add-ons list use product pickers. Prices, the subscribe & save plan, stock, variant and
  product images all come from the product, so update those in Products, not in the theme.
* **Bundles** – the quantity breaks are defined once, in Theme settings → *Bundle tiers*: up to four
  tiers, each with the bottles the shopper pays for, free bottles, a discount off the price per
  bottle, a name and a supply line, plus the product they belong to (*Bundled product*). The buy
  box shows them as cards: each Featured product → *Bundle tier* block picks a tier by number and
  adds the card's badge, gift line, perks, highlight and pre-selection (add, remove or reorder the
  blocks). The cart drawer reads the same settings, and `snippets/bundle-tier-price.liquid` prices
  the tiers for both, so the cards and the drawer cannot disagree. The theme only displays those
  prices: the real discount is applied at checkout by the Kaching Bundles app, so the tier
  quantities and discounts must match the quantity breaks configured there. `KACHING_DEAL` in
  `assets/main.js` repeats the two free-bottle tiers with Kaching's own bar and plan IDs (see
  below); change it too if the tiers change.
* **Subscription cadence follows the bundle** – with Subscribe & save on, 1 bottle renews every
  month (Kaching Plan #1, `1039991141`), Buy 2 Get 1 Free every 3 months (Plan #2, `1052770661`) and
  Buy 3 Get 3 Free every 6 months (Plan #3, `1052803429`). The mapping sits next to the Kaching bars
  in `assets/main.js` (`KACHING_DEAL`): the buy box takes the plan from the selected tier, and the
  cart moves any subscription onto the plan its bottle count calls for, so the drawer's switch and
  quantity changes land on the right cadence too. The *Subscription plan ID* settings on the buy box
  and the cart drawer now only matter for single bottles. Every plan must stay attached to the serum
  and carry the MicroStamp free gift in Kaching Subscriptions.
* **Reviews / videos** – Review slider and Video reviews are block lists: add, remove, reorder,
  upload a photo/video and poster, or paste an mp4 URL.
* **Lists** – benefits, science steps, research bars, hair-loss pillars/badges, how-to steps,
  ingredient legend, footer links, menu links and blog links are all blocks (add/remove/reorder).
* **Menu (single page)** – Header → *Menu style*. *Single page* replaces the shop/bestsellers/more mega
  menus and the long mobile drawer with the *Section link* blocks: each one scrolls to a section of
  the landing page (benefits, reviews, science, results, story, guarantee, how to use, FAQ or a custom
  element id). The bar shows the first few links (*Section links in the bar*), shared evenly either
  side of the logo together with *Track Order*; the mobile drawer lists them all as numbered rows
  with the note and the testimonial.
  *Full store menu* brings the original mega menus back. Every other link on the page (guarantee
  buttons, "Shop now" on review and video cards, the cart drawer's product links, the footer's
  "About" column) also scrolls to a section instead of leaving the page; only the
  policies and *Manage Subscription* in the footer, and the checkout, lead off it. A link such as
  `/#faq` from another page lands on the home page and scrolls to that section.
* **FAQ** – a numbered accordion at the bottom of the page in the "Backed by science" style. Each
  question is a block (question + rich-text answer); *Open the first question by default* and the
  closing "still wondering?" line are settings. Menu and footer "FAQ" links scroll here.
* **Email popup** – Header group → *Email popup (gift)*. A *Photo* fills the left side (the top on
  phones) beside the sign-up: full screen on phones, a split card on desktop. It opens after a delay
  and, on desktop, when the cursor leaves the page. The email posts to Shopify's customer form with
  the tags `newsletter` and `popup`; then the popup reveals the *Discount code* and attaches it to the
  visitor's cart, so checkout takes it off automatically. The gift is always the same code, only the
  framing is a mystery. The code itself lives in Discounts: `EXTRA10` is a 10% order code that
  combines with product discounts, so it stacks on the Kaching bundle price. Every line of copy, the
  photo, the delay and how many days the popup stays hidden after a close or a sign-up are settings;
  the popup only opens in the editor when the section is selected.
* **Backed by science photo** – the landscape photo beside the steps is a *Photo* picker (with a
  fallback URL until one is uploaded); it stays in view while the steps scroll on desktop.
* **Offer colours** – Theme settings → *Offer colours*: one gold → orange → mauve gradient shared by
  every offer, so a deal looks the same wherever it appears: the hero's promo pill (Hero → *Pill
  colour*: offer gradient or a solid colour, plus an optional gift icon) and the scrolling offer
  banner.
* **Scrolling offer banner** – Benefits strip → *Scrolling offer banner*: a band under the benefits
  that keeps repeating the offer ("BUY 2 GET 1 FREE + FREE GIFT WITH SUBSCRIPTION"), on the soft or
  full offer gradient. A tap scrolls to the buy box (*Link*). It pauses on hover and stands still
  for visitors who ask their device for reduced motion. Empty the text to hide it.
* **Mobile menu quotes** – Header → *Mobile quote* blocks: short review quotes listed under the
  testimonial in the mobile menu, each with the reviewer's name and age as the review gives them.
* **Announcement bar** – Header group → Announcement bar: message and countdown text sizes
  (message, label before the timer, numbers and unit labels are separate sliders, with a mobile
  size for the message) and *Position*: a desktop layout (message left / countdown left / both
  centered in either order / stacked in either order) and a mobile layout (stacked or side by side,
  in either order).
* **Buy-box header** – the star-rating line (Featured product → Rating line) sits above the product
  name, as on Frøya's page, and the whole line scrolls to the review wall ("Real women, real hair,
  real reviews"); *Scrolls to* takes another element id. The old two-label line under the name is
  still available (*Labels under the name*) and empty by default. The cart no longer repeats the
  selling plan's own name ("Delivery: every month | 10% off") under a subscription line: the
  Subscribe & save switch shows the state.
* **Add-to-cart button** – Featured product → Button & stock → *Price on the button*: label only
  (the bundle total already sits in the price line and on the selected bundle card), label with the
  bundle total (the landing page's choice), or label with the total and the regular price struck
  through. The
  "-" separator is added automatically when a price is shown. The *Savings line* renders as a pill
  directly above the button ("🎉 Congrats! You’re saving $7.00") and follows the selected bundle
  and the Subscribe & save switch; the two static info lines under the plan are still available as
  *Info line 1 / 2* but are empty by default now that the pill carries that spot.
* **Low-stock notice** – Featured product → Button & stock → *Number shown*: *Tracked inventory*
  reads the variant's real stock and only shows at or below the threshold; *A fixed number* shows
  the figure typed below on every visit. The store tracks more than 2,000 units of the serum, so the
  landing page uses the fixed number; switch back to tracked inventory once real stock is low.
* **Rounded prices** – Theme settings → Currency format → *Round prices to whole amounts* (off by
  default) shows every price the storefront prints as a whole amount, in whatever currency the
  shopper sees: $34.99 as $35, the Buy 2, Get 1 Free bundle's $69.98 as $70, $23.33 a bottle as $23.
  Each figure is rounded to the nearest whole amount on its own, so a total and its saving can be a
  dollar off what the rounded figures add up to; the free express shipping gap is rounded up
  instead, so "$16 away" is never a cent short. Only the display changes: every price in the buy
  box, bundle cards, cart drawer (lines, nudge, upgrade card, add-ons, totals), product pages and
  cart page goes through `snippets/money.liquid`, while the cart, Kaching and checkout still charge
  the exact prices, and the account's order history and gift card balances keep showing the amounts
  as charged. Prices typed into text settings (such as "US$4.99" in the FAQ) are not changed.
* **Typography** – the Pangram and Apercu Mono fonts are served from this store's own Files (see the
  `@font-face` rules in `assets/critical.css`). Weight 400 maps to the Regular face and 600/700 to the
  Bold face; an earlier mapping pointed regular text at the Light file, which is why paragraphs looked
  thin. Secondary copy uses the same black as body text (`--brand-muted` equals `--brand-ink`); only
  struck-through prices keep a grey (`--brand-strike`).
* **Sliders** – the logo & quote, review and video sliders can be swiped: the track follows the
  finger (or mouse), snaps to the nearest slide and a long or fast swipe moves several slides, so
  the whole set can be run through right-to-left. The dots still work.
* **Hair-loss fit quiz** – three questions, one result screen that says how well Elaren fits the
  *kind* of hair loss the visitor has (never a probability). *Question* blocks are asked in sidebar
  order; each *Answer* block names the question it belongs to and the hair-loss type it points to;
  each *Result* block is the screen for one type, with what to expect, what the research measured
  and a button that scrolls to the buy box with a bundle tier pre-selected. Precedence: a "See a
  doctor first" answer always wins, then "Traction", then whichever of pattern / shedding got more
  answers. Clicking a Result block in the editor previews that screen.
* **Order tracking** – one delivery hub at `/pages/track-order` (template `page.track-order`,
  section *Track your order*), built from the landing page's pieces: a cream hero with the heading
  (italic words get the accent), ticked *Highlight* blocks and the tracking-number card; the
  delivery timeline as numbered circles on a line; the FAQ accordion; and a cream help card whose
  button emails *Email address*. Shoppers type a tracking number and it opens in a new tab: a
  *Carrier* block whose prefix matches opens that carrier (YunExpress for `YT…` numbers by default),
  and any other number opens the universal tracker set in Theme settings → *Order tracking*
  (17TRACK by default). That fallback matters because US shipments are recorded under the carrier
  "yanyun" with no tracking link, so without it those customers only get a number they can't click.
  The highlights, timeline steps and delivery questions are blocks. `/pages/track-order?tracking=YT…`
  opens the page with the number already filled in, so the shipping confirmation email can link
  straight to it. The page is linked from the header (*Track Order*, the last link before the cart
  on desktop and a row in the mobile menu; Header → *Order tracking link*), the footer and the
  account page. The account order page shows a placed → shipped → on its way tracker and every
  tracking number with a *Track* button.
* **Products with their own page (capsules)** – most product pages send visitors to the home page
  (Theme settings → *Send product pages to the home page*), because the serum is sold from the buy
  box there. A product assigned to its own product template keeps its page instead: the Pumpkin
  Seed Oil Capsules use `templates/product.capsules.json` (Products → the product → *Theme
  template* → `capsules`), built from the *Product (compact)* section
  (`sections/main-product-compact.liquid`): photo gallery with thumbnails, size buttons with their
  prices, quantity, *Add to cart* (adds in place and opens the cart drawer, like the buy box), a
  short intro, ticked perks, *Expandable detail* blocks and a *Pairs with* card that sends shoppers
  to the serum's buy box. A size with a compare-at price shows a *Save {percent}%* tag next to its
  price, and the *Deal note* setting puts a line above the button for an automatic discount. The
  note is only text: the capsules' Buy 2, Get 1 Free is a Shopify automatic discount (Discounts),
  not part of the Kaching bundle tiers, so change both together. Any other product moved onto a
  custom template behaves the same way. In the cart drawer, line items and add-on cards for these
  products link to their page; everything else still scrolls to the buy box.
* **Serum comparison advertorial** – a long-form "we compared 10 pumpkin seed hair serums"
  review article for paid traffic, template `page.serum-comparison` (create a page in Online
  Store → Pages and choose that template). Its layout follows an editorial review page: warm
  off-white background, coral accents, Instrument Serif headings and Poppins text (loaded from
  Google Fonts by `assets/advertorial.css`). It is built from the `adv-*` sections: *Article
  header* (masthead, eyebrow, headline, byline, lead photo; by default it hides the store's
  announcement bar and menu on this page, while the cart drawer keeps working), *Article text*
  (story box, key-insight banner, heading, paragraph, photo, button and footnote blocks),
  *Criteria cards*, *#1 pick* (feature chips one per line, spec rows written `Label | Value`),
  *Rest of the field* (one card per product with "what it gets right" and "falls short"
  lists, plus "Still reading?" button and honourable-mention blocks; cards without a photo show a
  soft placeholder tile until one is uploaded), *Side-by-side table* (one row per product with an
  optional small photo; `yes`, `no`, `yes: text`, `no: text` or `~ text` in each cell), *Reader reviews*, *Closing pick*,
  *Disclaimer* (by default it also hides the store footer so the page ends there) and *Reader
  offer bar*, which appears once the reader scrolls past the header. As on the reference page,
  every button links to the store home page (https://shopelaren.com/). The landing page's buy
  box is still in the template but hidden; if it is shown again and the buttons link to `#shop`,
  they scroll to it and the offer bar hides while it is on screen. The other nine serums are
  named products. What the page says about each one comes from the brand's own site or retailer
  listings as of October 2026, and the page no longer shows that date, so check prices and
  labels before reusing it later. Their photos are in Shopify Files (`adv-…`) and are picked per
  card in *Rest of the field* and per row in *Side-by-side table*, where the Elaren row uses the
  product's own photo. The masthead says "Advertorial", and the copy speaks as "we" rather than
  inventing a personal test.
* **Support email** – Theme settings → *Customer support*. support@shopelaren.com is the only
  address the storefront shows. The policy pages (`/policies/…`: refund, terms, privacy, contact)
  come from Settings → Policies, where Shopify's templates insert the store's own email and a link
  can show one address but open another, so on those pages the theme points every email link at
  *Support email* and replaces the store email in the text with it. Empty the setting to show the
  policies exactly as written. The footer, FAQ and the Track your order help card keep their own
  email text.
* **Cart drawer** – Header group → Cart drawer: title, free express shipping goal, empty state,
  subscribe toggle label, add-on products, checkout label, country/currency selector and trust
  badges. The header CART button opens it and every add-to-cart button adds in place and opens it.
  * **Free express shipping goal.** Standard shipping is always free; Express Shipping ($4.99) is
    free from US$50 (*Free express shipping from (USD)*, which must match the free-over amount on
    the Express Shipping rate in Settings → Shipping). The bar at the top compares that with the
    order total after discounts - so EXTRA10 counts - and reads "You’re $15.01 away from FREE
    express shipping" with "Standard shipping is always free" under it, then "You’ve unlocked FREE
    express shipping ✓" on a full bar. Shoppers in another currency see the threshold converted
    with the exchange rate Shopify gives the storefront (`Shopify.currency.rate`); Liquid has no
    rate, so `assets/main.js` (`expressGoal`) does the comparison after every redraw and prints
    the amount in the store's money format, copied from a price the section renders.
  * **Add-ons** use the *Products to recommend* list, minus anything in the cart or sold out, and
    follow the goal. Below it, the products that reach it on their own lead, cheapest first, each
    marked "Unlocks free express shipping", under "Add one to get FREE express shipping" (an order
    code's share is taken off first, so with EXTRA10 the $19.99 brush no longer reaches a $18.51
    gap). Otherwise they run cheapest first under "Complete your routine". Once the goal is met and
    the one-time bottles are exactly a tier with a bigger one above (3 bottles today), an upgrade
    card leads: "Upgrade to 6-month supply · +$34.99 for 3 more bottles · $17.50 a bottle", whose
    button tops the bundle up. It stays out while a next-tier nudge is showing. Cards show the
    price of the variant their button adds.
  * **One row per bundle.** The Bundled product (Theme settings → Bundle tiers) shows as one row
    per bundle however the cart splits it: once a tier applies, Shopify lists the free bottles as a
    $0 line and the paid ones as another (each with its own key), and a subscription is laid out
    for Kaching as two tagged lines. The grey line under the title reads "supply · tier" (a tier's
    own supply line for its bottle count, otherwise *Supply line for other bottle counts*; the tier
    is the discount's own title from the cart). The price is the row total and, with a tier
    applied, every bottle at the one-time price is struck through next to a "1 FREE" tag. The
    quantity buttons move the bundle's total by one and the bin empties the row: bottles go in
    with `/cart/add.js` and come off with `/cart/change.js` by line key, and the cart is read again
    after every write because the keys change (`/cart/update.js` by variant would only change the
    first of the split lines). Every other line shows its line total, with the unit price under it
    once there is more than one.
  * **Next-tier nudge.** Under a one-time bundle row, when the next tier up costs the same as the
    bottles in the cart or less (2 bottles cost what 3 do, 4 what 6 do, 5 cost more than 6), a
    line says so ("Add 1 more bottle — it’s free", "Add 1 more and pay $34.99 less") with a button
    that tops the row up to that tier, keeping its plan and properties. The copy is built from the
    tiers and the prices `snippets/bundle-tier-price.liquid` predicts (an order code such as
    EXTRA10 scales the saving to what the total really drops by); the row itself always shows the
    cart's own prices. There is no nudge on a subscription: there the bottle count also sets how
    often it renews (`KACHING_DEAL`), which the button would change without saying so. Screen
    readers hear a new nudge through a live region that stays put while the drawer is redrawn.
  * **Payment logos** sit under the checkout button, above the trust badges. They come from the
    payment methods switched on in Settings → Payments (`shop.enabled_payment_types`), so a method
    added there (iDEAL, Klarna…) shows up without a theme change. The drawer has no accelerated
    checkout buttons; Shop Pay stays off as a drawer button.
  * The line's **Subscribe & save switch acts on the whole product**, not on the one line it sits
    on. A "Buy 2, Get 1 Free" bundle goes into the cart as three bottles on one line and Kaching
    Bundles then splits the free bottle onto its own $0 line; the switch gathers every line of that
    variant back into one line of the full quantity, with or without the plan, so the quantity
    break still applies after switching. The "Save …" figure next to the switch is what the plan
    takes off everything the shopper is currently paying for that product (the free bottle counts
    for nothing, a discounted bottle for less).
  * **Free subscription gift** – pick the gift product the buy box advertises (Featured product →
    Free subscription gift). The drawer adds one unit, tagged with a `_free_gift` line property, as
    soon as a line on the drawer's *Subscription plan ID* is in the cart (from the buy box or the
    switch) and removes it when the last such line goes; a shopper who takes the gift out
    themselves is not handed it again until they opt into the plan afresh. The gift line shows
    "FREE GIFT", the same quantity buttons as every other line, and "FREE" once its price is $0.
    **Only the first one is free:** extra units are charged. Once the discount covers one unit,
    Shopify splits the gift into a $0 line (labelled "FREE GIFT" plus *Note when extras are added*)
    and a line for the paid extras; the buttons on either change the gift's total. Switching the
    subscription off removes the free one and keeps any paid extras as a normal line.
    **The theme does not price the gift**: it is free through the free gift set up in Kaching
    Subscriptions (every plan → free gift: Elaren MicroStamp Pro, quantity 1). Kaching's discount
    only zeroes a line tagged the way Kaching's own widget tags its gifts, so the drawer adds a
    hidden `__kaching_subs_gift` property naming the subscription line's plan
    (`{"sellingPlan":"1039991141"}`). Without it the gift is charged in full; a MicroStamp added
    any other way (e.g. from the add-ons) has no tag and is charged, and a gift tagged for a plan
    that is no longer in the cart is charged too. Gift lines already in a cart without the tag are
    re-tagged on the next page view or cart change. A Shopify
    Buy X get Y discount is not a substitute: it can't tell a subscription from a one-time purchase,
    so anyone adding the MicroStamp from the add-ons next to the serum would get it free too.

## Before you publish

* **Subscription gift.** The MicroStamp Pro is set up as a free gift (quantity 1) on all three
  Kaching Subscriptions plans. Keep the Kaching Subscriptions app embed **off**: it brings its own
  widget and its own gift-adding cart script, which would compete with the theme's. If the gift
  ever shows full price again, check the free gift still exists on the plan the drawer pins.
* **Create the tracking page.** In Online Store → Pages, add a page with the handle `track-order`
  and choose the template `page.track-order`. The header, footer and account links go to
  `/pages/track-order`; if you use another handle, update Theme settings → *Order tracking* and the
  footer link. Check the "ships within 1–2 business days" line (a highlight and a timeline step)
  against your real handling time.
* **Imagery and video are still Frøya's placeholders** until you upload your own (product shots,
  before/after photos, press logos, review videos). Alt text already describes each slot.
* **Testimonials are real Elaren reviews** pulled from the store's review app (43 serum reviews,
  22 capsule reviews). The video slots are labelled "Verified Elaren customer / Video review" as
  placeholders until you have your own video reviews.
* **Claims to confirm against the formula:** "no parabens, no silicones", "no water, no mineral
  oil", "3rd party tested", "cold-pressed", and the "precision applicator + scalp massager" in the
  what-you-get list (both are mentioned in customer reviews). The research figures quote published
  ingredient studies (Ibrahim 2021, Fischer 2014) and are footnoted as such, including who was
  studied: the pumpkin seed oil trial was topical oil in 60 women with female pattern hair loss,
  where 5% minoxidil foam did better; the caffeine figure is laboratory research on hair follicles
  from women's scalps (Fischer 2014, Br J Dermatol). The copy speaks only to women, so it quotes
  only research done on women: don't bring back the caffeine-vs-minoxidil trial (Dhurat 2017, 210
  men) or the "+40% hair count" figure (oral pumpkin seed oil capsules in men, Cho 2014).
* **Guarantee:** the copy promises a 30-day money-back guarantee and fuller hair in 30 days, which
  matches the 30-day return window on the store's refund policy page. The "Our Elaren Story" page
  still says 90 days – update it, or change the guarantee copy back in the theme editor.
* **One contact address: support@shopelaren.com.** The theme's text, links and policy pages only
  show that address, but Shopify's checkout shows the policies straight from the admin and
  Shopify's own pages and emails use the store's email settings, so correct these in the admin too:
  * Settings → Policies: the email links in the *Refund policy* (3), *Terms of service* (2) and
    *Contact information* (1) show support@shopelaren.com but open an old Gmail address – edit each
    link to `mailto:support@shopelaren.com`. The *Privacy policy* is generated from the store
    details, so its Contact paragraph prints the store's street address, the only place the store
    shows it: turn off the policy's automatic management and shorten the sentence to "…please email
    us at support@shopelaren.com." The theme itself never prints the store address.
  * Settings → Notifications → *Sender email*: the address customers see on order confirmations and
    other notifications and reply to – set it to support@shopelaren.com.
  * Settings → General → *Store contact details*: the store email, which customers can see on the
    store and policy pages and which Shopify's policy templates insert – set it to
    support@shopelaren.com too if that inbox should also receive Shopify's account emails.
* **Currency and country.** Shopify only pre-selects a visitor's country automatically on Shopify
  Plus; on the store's Basic plan every visitor starts in the primary market's default country, and
  checkout only re-prices the order once it has a shipping address. So the theme does the detection
  itself: on a visitor's first page view `assets/main.js` asks Shopify which country it detects
  (`browsing_context_suggestions.json`, Shopify's own GeoIP) and submits the hidden localization
  form in `layout/theme.liquid`, which reloads the page in that country's currency. The cart keeps
  that currency through to checkout, which also pre-fills the address country. It runs once per
  browser (`localStorage` key `elaren:auto-localized`) and never after a shopper has picked a
  country in the cart or footer selector (`elaren:country-choice`); Theme settings → Localization
  turns it off. A VPN does not reliably change the result: VPN exit IPs are often registered to the
  provider's home country, so a UK exit node can still read as the US. To test another market,
  switch country with the selector in the cart drawer or the footer (or use Shopify's own market
  preview), not a VPN. The currency code next to the cart totals is on by default in Theme
  settings → Currency format, because most of the store's markets use the `$` symbol.
* **Subscription cadence lives on the variant, not the variant name.** The serum's variants
  (Monthly / Quarterly / Biannual) exist only to hang selling plans on; the buy box pins one plan
  with "Subscription plan ID" and never shows a variant picker. Cart lines therefore print the
  plan's own name and suppress a variant title the shopper never chose. Shopify's checkout has no
  such setting: it always prints the variant title, so a line still reads "… - Monthly" there until
  the product is restructured to a single default variant carrying all three plans.
* Links point at the connected store (`/products/...`, `/collections/all`, `/pages/about-us`,
  `/pages/contact`, `/policies/...`). `/pages/faq` and `/blogs/news` articles do not exist yet;
  select a blog in Header → Blog links once you publish articles.

## Connecting the theme

Online Store → Themes → Add theme → Connect from GitHub → pick this repository and the branch.
The theme folders Shopify needs (`layout`, `templates`, `sections`, `snippets`, `config`,
`locales`, a flat `assets`) all live at the repository root.

## What is in the repo

| Path | Purpose |
| --- | --- |
| `layout/theme.liquid` | Page shell: meta/fonts, the five stylesheets, `content_for_header`, the header section group (announcement bar, header, cart drawer), `content_for_layout`, the footer section group, scripts. |
| `sections/header-group.json`, `sections/footer-group.json` | Section groups with the default header/footer content (menu links, bestseller cards, blog links, footer links, cart-drawer badges and upsells). |
| `sections/froya-*.liquid` | The landing page, one editable section per block (settings + blocks in each `{% schema %}`): announcement bar, sticky header with mega menus and mobile drawer, cart drawer, hero, benefits strip, logo/quote slider, review slider, backed-by-science timeline, research results, featured product (gallery, ingredients modal, buy box with bundle tiers), founder story, hair-loss types & badges, review wall, guarantee, video reviews, how-to-use, ingredient quality, ingredient science, newsletter, footer. Markup keeps the captured page's class names so the verbatim CSS still applies. |
| `snippets/froya-image.liquid`, `snippets/froya-nav-card.liquid` | Image-picker-with-fallback helper and the menu bestseller card. |
| `snippets/bundle-tier-price.liquid`, `snippets/bundle-supply.liquid` | The price of a bottle count and its supply line under Theme settings → Bundle tiers, shared by the buy box and the cart drawer. |
| `snippets/money.liquid` | Prints every storefront price with the money filters, rounded to whole amounts when Theme settings → Currency format → *Round prices to whole amounts* is on. |
| `snippets/cart-drawer-nudge.liquid`, `snippets/cart-drawer-upgrade.liquid` | The cart drawer's next-tier nudge and upgrade card. |
| `sections/main-*.liquid` | Minimal, on-brand sections for the rest of the store: page, product, collection, collections list, cart, search, blog, article, 404, password, and the customer account pages. |
| `templates/*.json` | JSON templates wiring the sections above; `index.json` and `page.froya-landing.json` carry the landing page's default block content. |
| `assets/critical.css` | Verbatim copy of the inline `<head>` CSS from the live page (font faces, CSS variables, critical layout). |
| `assets/sections-inline.css` | Verbatim copy of every per-section inline `<style>` block from the live page. Section ids are preserved so these rules apply unchanged. |
| `assets/theme.css` | Reconstruction of the theme's external stylesheets that the capture did not include: base typography, buttons, header/mega menu/drawer, footer, plus a light layer for the supporting store templates. |
| `assets/sections.css` | Reconstruction of the landing-page component styles for desktop and mobile. |
| `assets/main.js` | Interactions: cart drawer (Ajax add/change/remove, one-row bundles, subscribe & save toggle, next-tier nudge, free express shipping goal and add-ons, re-rendered through the Section Rendering API), in-page add to cart from every product form, mega menus, mobile drawer, carousels (Blaze Slider), product gallery + thumbnails, ingredients modal, subscribe/one-time buy-box toggle, bundle tier selection (quantity + per-bottle and total prices), lazy video playback, science scroll-spy, animated result bars, smooth anchors, theme-editor re-initialisation. |
| `assets/blaze.css`, `assets/blaze-slider.min.js` | Blaze Slider 1.9.3 (MIT, <https://github.com/MananTank/blaze-slider>), the carousel library the live page uses, vendored unmodified. |
| `scripts/localize_assets.py` | Vendors every remote placeholder image/font/video into `assets/` and rewrites the references (Liquid and JSON get `asset_url`). |
| `tools/extract.py`, `tools/build.py` | Historical: the pipeline that produced the original static `froya-*` sections from a Chrome capture of the Frøya page. **Do not re-run it** – it would overwrite the editable Elaren sections. |

## Assets

Images, fonts and videos are still referenced from the Frøya store's CDN (`froyaorganics.com/cdn/…` and
`cdn.shopify.com/…`) exactly as the captured page references them (see "Before you publish"). Once
the Elaren assets are in place, this script vendors whatever is still remote into `assets/`. Run it
from a machine with normal internet access and commit the result:

```sh
python3 scripts/localize_assets.py                # downloads the placeholder files into assets/ and rewrites references
python3 scripts/localize_assets.py --skip-videos  # same, but leave the large mp4 files on the CDN
python3 scripts/localize_assets.py --dry-run
```

## Behaviour notes

* Header, mega menus, drawer, carousels, gallery, modal, buy-box toggle and videos are fully
  functional client-side, and every section re-initialises itself when the theme editor
  re-renders it.
* The buy box uses the product chosen in the section: first available variant, the first
  subscribe & save plan (price, discount and savings are computed from the selling plan),
  tracked inventory for the low-stock notice. Submitting adds through `/cart/add.js` and opens
  the cart drawer; the drawer changes quantities and removes lines through `/cart/change.js`,
  and adds or removes the free subscription gift after every cart change. The Subscribe & save
  switch moves a single line in place with `/cart/change.js` and `selling_plan`; anything more
  (a bundle split over two lines, Kaching's subscription layout, a Kaching tag that has to come
  off, which `/cart/change.js` cannot do) adds the new lines through `/cart/add.js` first and only
  then takes the old ones out with one positional `/cart/update.js` (positions, not keys: a
  discount-split line shares its key with the paid line). The cart is never emptied along the
  way, and a failure takes back whatever went in, so the shopper keeps the cart they had and sees
  why in the drawer. Cart changes run one at a time, a request that gets no answer within 20
  seconds fails instead of hanging, and the drawer is redrawn once per change (Section Rendering
  API), from the finished cart. The newsletter posts to Shopify's customer form. The supporting
  `main-*` sections use the connected store's own products, cart and customer accounts.
* Run `shopify theme check` (Shopify CLI) before publishing; the only remaining warnings are the
  remote placeholder images.
* Hidden/utility parts of the original page (Shopify pixels, cookie consent, chat widget, Klaviyo,
  Loox scripts, the legacy hidden header and mini-cart drawer) are intentionally omitted.
