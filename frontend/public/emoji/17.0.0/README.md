# Vendored Emojibase data

Version: `emojibase-data@17.0.0`, English locale. Retrieved 2026-09-26.

Unmodified upstream files:

- https://cdn.jsdelivr.net/npm/emojibase-data@17.0.0/en/data.json
- https://cdn.jsdelivr.net/npm/emojibase-data@17.0.0/en/messages.json
- https://cdn.jsdelivr.net/npm/emojibase-data@17.0.0/LICENSE

`LICENSE` contains the upstream MIT license. Emojibase derives localized labels and tags from Unicode CLDR: https://emojibase.dev/docs/datasets/.

The frontend serves this directory at `/emoji/17.0.0/`; backend reaction validation reads the same JSON files. To update, vendor both JSON files and the license under a new version directory, update the picker URL and backend path together, then run the emoji API/UI checks. Keep the old six reaction spellings compatible with stored records. Docker copies the full emoji directory into the runtime image.
