# Forkast

A meal-planning web app that turns the worst question of the day, "what am I eating tonight?", into a plan and a shopping list.

Built as a progressive web app for a shared household: one person creates a "table", everyone else joins with a six-character code, and the plan, the recipes and the shopping list stay in sync across their phones. You can add a dish by typing it in, or by photographing a recipe and letting the app read it.

The interface ships in Polish and English. Language is a property of the table, not of the phone, so everyone who joins the same table reads the same language; it is chosen on first open and can be changed in Settings.

**Live:** [forkastapp.netlify.app](https://forkastapp.netlify.app) · **Status:** in use by real households, not a demo

---

## What it does

- **Plans meals** from dishes the household already likes, rather than from a generic recipe database
- **Generates the shopping list** from the plan, with quantities added up across dishes
- **Reads recipes from photos** through Gemini's vision API, so adding a dish takes a photo rather than ten minutes of typing
- **Tracks the pantry**, excluded ingredients and dietary restrictions per person at the table
- **Works offline**, because a shopping list you can't open in a supermarket basement is not a shopping list
- **Installs like an app** on iOS and Android via the web app manifest

## How it's built

| | |
|---|---|
| Front end | Alpine.js and Tailwind, both loaded as browser builds |
| Data | Firebase Realtime Database |
| AI | Google Gemini, called through a Netlify edge function |
| Hosting | Netlify |
| Build step | None |

No bundler, no framework CLI, no `npm install`. Netlify publishes the files exactly as they sit in the repository, so a deployment is a commit. That constraint was deliberate: I'm a recruiter who codes, not a professional engineer, and a stack with nothing to build is a stack that stays alive.

## Engineering notes

A few decisions in here were made the hard way, and the code comments record why. The comments are in Polish; here are the ones worth knowing about in English.

**Firebase loads dynamically, not as a static import.** The SDK lives on `gstatic.com` and the service worker only caches our own domain, so offline that file simply isn't there. With a static import, a failed fetch kills the entire screen module: Alpine never boots, `x-cloak` never lifts, and a real user gets a white screen with no buttons. With a dynamic import the worst case is `null`, and the screen still shows what's in the phone's memory. The rule that came out of it: nothing from outside our own domain gets to be a precondition for a screen rendering.

**The Gemini model name is a list, not a constant.** Model names change between API versions, and the same name can work on one version and 404 on another. The function tries them in order and the first one that answers wins, with an environment variable taking priority so switching models is a settings change rather than a redeploy.

**Rate limiting is per household, per day, enforced server-side.** The function's URL is public, and behind it sits my API key. Without a limit, anyone who got hold of the link, which travels by WhatsApp and gets forwarded, would have free Gemini access. The counter is incremented before the AI call, not after: better to count a request that failed than to miss one that went through.

**The origin check has a documented weakness.** It verifies that requests come from our own page, which anyone can forge from outside a browser. An earlier version was worse: the condition skipped the whole check when the `Origin` header was absent, and `curl` sends no `Origin` by default, so the layer described as "forgeable" was in practice bypassable. It now also accepts a matching `Referer`, because WhatsApp's in-app browser is unpredictable about which headers it sends. This is a speed bump, not a lock, and it's labelled as one in the code.

## Why it exists

I build my own tools. My day job is technical recruitment, where most of my workflow now runs on AI agents I wrote myself. Forkast is the same instinct pointed at a domestic problem: my household kept having the same argument at 6pm, so I built the thing that ended it.

It's also how I learned what shipping actually costs. Not the first version, which took a weekend, but the white screen at a friend's house, the API limits, the person who never copies and pastes anything and for whom an entire feature was therefore dead. Those are the parts that changed the code.

## License

MIT. Take what's useful.
