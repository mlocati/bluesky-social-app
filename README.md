## Unofficial bridge between Bluesky repo and unofficial Transifex project

This (unofficial) repository serves as a bridge between the official [Bluesky repository](https://github.com/bluesky-social/social-app) and the unofficial [Transifex project](https://app.transifex.com/mlocati/bluesky-unofficial), which may be used to translate Bluesky collaboratively.

This repository performs the following tasks:

### Maintain .pot files

[A GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/update-pot-files.yml), running on a scheduled basis, keeps the [`pot` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/pot) up to date. Transifex is configured to automatically update its translatable resources by periodically downloading these .pot files.

### Download .po files from Transifex

[Another GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/download-po-files.yml) periodically downloads the .po files from Transifex and stores them in the [`po` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/po).

### Update branches for pull requests

[Yet another GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/update-pr-branch.yml) creates or updates branches in this repository, which can be used for pull requests in the [official repository](https://github.com/bluesky-social/social-app), using the files in the [`po` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/po). This action is triggered manually.

## Notifications

The GitHub Actions mentioned above notify updates or failures to [this Telegram group](https://t.me/ml_bluesky_pot).
