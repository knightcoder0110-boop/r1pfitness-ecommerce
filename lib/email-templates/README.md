# Email templates

Branded HTML email templates for R1P Fitness, ready to paste into the
Klaviyo template editor (or any sender that accepts raw HTML).

## `vip-welcome.html`

The "you're in, welcome to the ohana" email sent to anyone who joins the
VIP list from the homepage site-lock screen.

### How it sends today

When a visitor enters their email on `/locked` and submits, the
`/api/subscribe` route adds them to the Klaviyo list configured by
`KLAVIYO_LIST_ID`. **A list subscription in Klaviyo is the standard
trigger for a Welcome flow** — once the flow is wired up in the Klaviyo
dashboard with this template attached, the email goes out automatically.

No new server code required.

### Wiring it up in Klaviyo (one-time, ~5 minutes)

1. Klaviyo dashboard → **Email Templates** → **Create Template** →
   **Code template**.
2. Paste the contents of `vip-welcome.html`. Save as
   `R1P · VIP Welcome`.
3. Klaviyo → **Flows** → **Create Flow** → **From Scratch**.
4. Trigger → **List**: pick the same list `KLAVIYO_LIST_ID` points at
   (`RAkrvT` in this repo).
5. Add an **Email** action → pick the `R1P · VIP Welcome` template.
6. Subject: `You're in, ohana — VIP password incoming.`
7. Preview text: `We're cooking something very special. You'll be first to know.`
8. Set the flow status to **Live**.

### Personalization tokens used

- `{{ first_name|default:'Ohana' }}` — falls back to "Ohana" when we
  don't yet have the visitor's first name (which is the case for the
  homepage VIP signup since we only collect email).
- `{% unsubscribe %}` — Klaviyo's standard unsubscribe link tag.

### Sending the drop-day VIP password

When the drop is ready, send a follow-up campaign to the same list with
the private launch password in the email body. The welcome email above
sets that expectation up front so members know to watch their inbox.

### Visual checklist

Before going live, send a preview to:

- An iCloud / Apple Mail account (light + dark)
- A Gmail account (web + iOS app)
- One Outlook account if available

The template is dark-themed by design (the brand is dark) and uses
inline styles, MSO conditionals, and table-based layout for maximum
client compatibility.
