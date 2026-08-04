# Attribution — frame-chat-bubbles

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

`frame-quote-testimonial` is a formal pull-quote with a name and a title under
it. That is not how most proof arrives any more, and it is not how a question
worth answering usually gets asked. A chat reads as overheard rather than as
supplied, which is a different kind of credibility.

`messages` is "who:text", "|"-separated, where "me" aligns right and anything
else aligns left. Two names, not a role system: a third speaker on a phone-width
frame produces bubbles too narrow to read.

Nothing here imitates a specific product's interface. A frame that looks like a
real app's screenshot is a claim about where the message came from.

## Use

Slots: `title`, `messages`, `note` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
