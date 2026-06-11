# ADAM Services

Website for ADAM Services — channels, crypto & Wish Money payments, services catalog, and admin panel.

## Features

- **Home** — channels, crypto payments (tap to copy), Wish Money payment details
- **Services** — four sections: Unban, Usernames, IG Verification, Followers/Views/Boosting (no public prices)
- **Telegram** — all orders go through [t.me/vacsuri](https://t.me/vacsuri)
- **Admin panel** — full site control at `/admin`

## Deploy to Netlify

1. Connect this repo to Netlify
2. Build settings (auto-detected from `netlify.toml`):
   - Publish directory: `.` (root)
   - Functions: `netlify/functions`
3. Set environment variable:
   - `ADMIN_PASSWORD` — your admin login password
4. Deploy

## Admin Panel

Visit `/admin` and sign in with your `ADMIN_PASSWORD`.

From the admin panel you can manage:

- Site title, tagline, footer
- Telegram link and purchase messages
- Channels
- Crypto payment methods
- Wish Money phone number and instructions
- All services and prices (prices are admin-only; not shown on the public services page)

## Local Development

```bash
npm install
npx netlify dev
```

Without Netlify Dev, open `index.html` via a static server — the site falls back to `data/default-config.json`.
