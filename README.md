## Translatable strings for Bluesky

This (unofficial) repository is like a bridge between the official [Bluesky repository](https://github.com/bluesky-social/social-app) and the unofficial [Transifex project](https://app.transifex.com/mlocati/bluesky-unofficial) used by someone to translate Bluesky.

This repository performs the following tasks:

### Maintain a .pot file

[A GitHub Action](https://github.com/mlocati/bluesky-social-app-pot/actions/workflows/update-pot-files.yml) running on a scheduled  populates and keeps the [`pot`](https://github.com/mlocati/bluesky-social-app-pot/tree/main/pot) directory up to date.

### Download .po files from Transifex

[Another GitHub Action](https://github.com/mlocati/bluesky-social-app-pot/actions/workflows/download-po-files.yml) downloads the .po files from Transifex and stores them in this repository.
