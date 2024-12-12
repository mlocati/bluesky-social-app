## Translatable strings for Bluesky

This (unofficial) repository is a bridge between the official [Bluesky repository](https://github.com/bluesky-social/social-app) and the unofficial [Transifex project](https://app.transifex.com/mlocati/bluesky-unofficial) thay may be used by translate Bluesky in a collaborative way.

This repository performs the following tasks:

### Maintain a .pot file

[A GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/update-pot-files.yml) running on a scheduled basis which keeps the [`pot` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/pot) up to date.

### Download .po files from Transifex

[Another GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/download-po-files.yml) downloads the .po files from Transifex and stores them in the [`po` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/po)

### Update branches for pull requests

[Another GitHub Action](https://github.com/mlocati/bluesky-social-app/actions/workflows/download-po-files.yml) downloads the .po files from Transifex and stores them in the [`po` directory](https://github.com/mlocati/bluesky-social-app/tree/transifex-bridge/po)

## Notifications

The GitHub Actions above notify updates/failures to [this Telegram group](https://t.me/ml_bluesky_pot).
