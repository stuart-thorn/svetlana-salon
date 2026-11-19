# Canary Wharf Salon

Single-page website for Canary Wharf Salon. It's a pnpm + Turborepo monorepo, and the site is built with Vite, React, TypeScript and Tailwind CSS v4.

## Structure

```
apps/web     # the SPA (sections: Home, About us, Bookings, Contact)
packages/    # reserved for shared packages
```

Editable copy (services, prices, opening hours, contact details) lives in `apps/web/src/data/content.ts`.

## Scripts

```bash
pnpm install
pnpm dev        # start the dev server (http://localhost:5173)
pnpm build      # production build → apps/web/dist
pnpm typecheck
pnpm preview    # serve the production build
```

## Notes

- The booking form validates on the client and shows a confirmation. It is not connected to a backend yet.
- Photos are from Unsplash (credited in the footer).
