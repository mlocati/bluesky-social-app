## Unofficial bridge between Bluesky repo and unofficial Transifex project

This (unofficial) repository is a bridge between the official [Bluesky repository](https://github.com/bluesky-social/social-app) and the unofficial [Transifex project](https://app.transifex.com/mlocati/bluesky-unofficial) thay may be used by translate Bluesky in a collaborative way.

This repository performs the following tasks:

### Maintain .pot files

[A GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/update-pot-files.yml) running on a scheduled basis keeps the [`pot` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/pot) up to date. Transifex is configured so that its translatable resources are updated automatically by periodically downloading these .pot files.

### Download .po files from Transifex

[Another GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/download-po-files.yml) periodically downloads the .po files from Transifex and stores them in the [`po` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/po).

### Update branches for pull requests

[Yet nother GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/update-pr-branch.yml) creates or updates branches in this repository to be used for pull requests in the [official repository](https://github.com/bluesky-social/social-app), using the files in the [`po` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/po). This action is triggered manually.

## Notifications

The GitHub Actions above notify updates/failures to [this Telegram group](https://t.me/ml_bluesky_pot).
