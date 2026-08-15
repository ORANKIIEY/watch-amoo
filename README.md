# watchamoo

```
watch-amoo/
├── frontend/     # Next.js UI + /api routes (one localhost)
└── backend/      # Email helpers (+ optional standalone Express)
```

## Run (one localhost)

```bash
npm install
cp backend/.env.example backend/.env   # add RESEND_API_KEY
npm run dev
```

Open **http://localhost:3000** only — pages and email API both run there.

## Email (OTP)

Put keys in `backend/.env`:

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=watchamoo <onboarding@resend.dev>
```

## Optional

`npm run dev:backend` still starts Express on `:4000` if you want the API separate.
