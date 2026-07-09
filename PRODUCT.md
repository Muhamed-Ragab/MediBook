# Product

## Register

product

## Users

Three distinct user groups, each with different context and needs:

- **Patients** — booking medical appointments. Often stressed or unwell, on mobile or desktop. Primary task: find an available doctor and book a slot in under 2 minutes.
- **Doctors** — managing their schedule. In a clinic between patients, on desktop or tablet. Primary task: view upcoming appointments and update availability.
- **Admins** — overseeing the system. At a desk. Primary task: manage users, specialties, and monitor appointments.

## Product Purpose

MediBook is a medical appointment booking system that connects patients with doctors. It replaces phone-based booking with a self-service platform. Success looks like: a patient can find a doctor by specialty, see real availability, and book a confirmed slot — without a phone call or back-and-forth.

## Brand Personality

**Trustworthy, Calm, Professional.**

- **Trustworthy** — medical data and scheduling are serious. The interface earns trust through predictability, clear data, and no surprises.
- **Calm** — healthcare is stressful enough. The UI recedes, never adds anxiety. Clean layouts, restrained motion, generous whitespace.
- **Professional** — this is a tool for real medical practices. Avoids the playful or the overly casual. Feels built for healthcare professionals and their patients.

Voice: direct, clear, warm but not saccharine. Error messages explain what happened and what to do next.

## Anti-references

No specific anti-references. Avoid the general AI design patterns listed in the impeccable bans.

## Design Principles

1. **Trust through clarity** — every state is legible (pending, confirmed, cancelled). No ambiguous buttons, no hidden information. Patients should never wonder "did my appointment go through?"
2. **Calm by default** — one primary action per screen. Generous whitespace. No urgent colors or flashing elements. The booking flow has no more than 3 steps.
3. **Role-appropriate depth** — patients see a simple search→book flow. Doctors see an efficient schedule manager. Admins see full CRUD. Same brand, different interface depth.
4. **Prevent errors, don't just handle them** — double-booking is blocked at the UI (hide booked slots), not just the API. Cancel actions require confirmation. Destructive actions are reversible where possible.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum.
- All status changes communicated via both color and text (not color alone).
- Focus indicators visible on all interactive elements.
- Reduced motion respected for all transitions.
- Forms show clear error messages with suggestions.
