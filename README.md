<img src="https://storage.googleapis.com/bigcommerce-developers/images/B2B-edition-1024x683.jpg" alt="B2B Edition Open Source Buyer Portal" title="B2B Edition Open Source Buyer Portal">

<br />
<br />

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bigcommerce/b2b-buyer-portal)
[![MIT License](https://img.shields.io/github/license/bigcommerce/catalyst)](LICENSE.md)
[![Lighthouse Report](https://github.com/bigcommerce/catalyst/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/bigcommerce/catalyst/actions/workflows/lighthouse.yml) [![Lint, Typecheck, gql.tada](https://github.com/bigcommerce/catalyst/actions/workflows/basic.yml/badge.svg)](https://github.com/bigcommerce/catalyst/actions/workflows/basic.yml)

</div>

**B2B Buyer Portal** is a monorepo frontend application designed for the BigCommerce B2B Edition Buyer portal. The B2B Buyer Portal is built using [Turborepo](https://turbo.build/), [TypeScript](https://www.typescriptlang.org/), and [React](https://react.dev/).

By choosing to build on top of our Open Source B2B Buyer Portal, you'll have access to build on our B2B buyer portal application backed by a robust set of SaaS APIs.
You can get straight to work building for your unique B2B business cases.

![-----------------------------------------------------](https://storage.googleapis.com/bigcommerce-developers/images/catalyst_readme_hr.png)

<p align="center">
 <a href="https://www.bigcommerce.com/solutions/b2b-ecommerce-platform/">🚀 B2B Edition</a> •
 <a href="https://developer.bigcommerce.com/community">🤗 BigCommerce Developer Community</a> •
 <a href="https://bundleb2b.stoplight.io/docs/openapi/quick-start">📝 B2B Edition API Reference</a> •
</p>

![-----------------------------------------------------](https://storage.googleapis.com/bigcommerce-developers/images/catalyst_readme_hr.png)

## Index

- [Index](#index)
- [☑ Prerequisites](#-prerequisites)
  - [Step 1: Ensure you have access to the B2B edition app](#step-1-ensure-you-have-access-to-the-b2b-edition-app)
  - [Step 2 (optional): Access storefront manager (Only for B2B Multi-storefront and headless stores)](#step-2-optional-access-storefront-manager-only-for-b2b-multi-storefront-and-headless-stores)
  - [Step 3: Enable B2B on Your Channel](#step-3-enable-b2b-on-your-channel)
  - [Step 4: Contact Us for Additional Support](#step-4-contact-us-for-additional-support)
- [🚀 Core Technologies](#-core-technologies)
- [📦 Workspaces](#-workspaces)
- [🛠 Tools and Libraries](#-tools-and-libraries)
- [🛠 System Setup](#-system-setup)
- [⚙ Getting Started](#-getting-started)
  - [Developing on Stencil](#developing-on-stencil)
  - [Developing for Headless](#developing-for-headless)
  - [Releases](#releases)
    - [WebDAV deployment configuration](#webdav-deployment-configuration)
  - [Common issues:](#common-issues)
- [🤝 Contribution](#-contribution)
- [📞 Contact \& Support](#-contact--support)
- [License](#license)

## ☑ Prerequisites

### Step 1: Ensure you have access to the B2B edition app

If you do not have access to the B2B edition app please reach out to your account or partner manager

### Step 2 (optional): Access storefront manager (Only for B2B Multi-storefront and headless stores)

After installing the B2B Edition App, go to the app's dashboard and select the 'Storefronts' section.

<img width="200" alt="b2bNav" src="public/images/b2bNav.png">
  
### Step 3: Enable B2B on Your Channel

Choose the channel where you wish to enable B2B functionality. Initially, B2B features can be activated on a single channel only.

<img width="480" alt="storefront-settings-b2b" src="public/images/storefront-settings.png">

### Step 4: Contact Us for Additional Support

For assistance with activating the remote buyer portal or to inquire about multi-storefront support, which allows you to utilize B2B features across multiple channels, please reach out to support, or raise an issue right here in this repository.

## 🚀 Core Technologies

- **Monorepo Management:** Turborepo
- **Type System:** TypeScript
- **Frontend Library:** React 18
- **Build Tool:** Vite

## 📦 Workspaces

- **Application:** `/apps/storefront` - A next-gen B2B Edition storefront application.
  - You can run multiple apps concurrently via turborepo [tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks).
- **Packages:**
  - `/packages/eslint-config-b3` - Shared ESLint configurations.
  - `/packages/tsconfig` - Shared TypeScript configurations.
  - `/packages/ui` - A collection of UI components built by B3.
  - `/packages/store` - A collection of shared store logic.
  - `/packages/b3global` - A collection of shared global logic.

## 🛠 Tools and Libraries

- **Linting:** ESLint
- **UI Framework:** MUI 5
- **Routing:** React Router 6

## 🛠 System Setup

- **Node:** Ensure you have Node.js version >=22.16.0.
- **Package Manager:** This project uses Yarn v1.22.17.

## ⚙ Getting Started

1. Installation of Node and Yarn.
   - For Node, we recommend using [nvm](https://github.com/nvm-sh/nvm).
   - Once Node is installed, you can install Yarn by using `npm i -g yarn`.
2. Clone the repository.
3. Install dependencies using `yarn`.
4. Copy environment variables: `cp apps/storefront/.env-example apps/storefront/.env`.
5. Update the values in `.env` with your specific values
6. Start the development server: `yarn dev`.
7. **Access to the store through the url i.e: https://my-store.mybigcommerce.com/ or https://my-store.com/ not http://localhost:3001**

> [!TIP]
>
> You will need to follow one of the following paths
> ([Developing on Stencil](#developing-on-stencil) or
> [Developing for Headless](#developing-for-headless)) so that the buyer portal scripts are
> configured and will be injected into the storefront pages.

### [Developing on Stencil](./docs/stencil.md)

Read the [Stencil Guide](./docs/stencil.md) when you are working on the BigCommerce Stencil storefront platform

### [Developing for Headless](./docs/headless.md)

Read the [Headless Guide](./docs/headless.md) when you are working on Catalyst, NextJS and other headless storefronts

### Releases

The [`deploy-ftp.yml`](./.github/workflows/deploy-ftp.yml) GitHub Actions workflow builds
`apps/storefront` and deploys the generated `dist/` directory over WebDAV when changes are pushed to:

- `staging`, which deploys through the `staging` GitHub Environment;
- `main`, which deploys through the `production` GitHub Environment.

The deployment mirrors the contents of `dist/` to the configured remote directory. Files that no
longer exist in `dist/` are therefore removed from the remote directory.

#### WebDAV deployment configuration

Create the `staging` and `production` environments under **Settings → Environments** in the GitHub
repository. Define the following values in each environment so that staging and production can use
different WebDAV credentials and destinations. The existing `FTP_*` names are retained for
compatibility, but the connection uses WebDAV over HTTPS:

| Type | Name | Example |
| --- | --- | --- |
| Secret | `FTP_SERVER` | `https://store-example.mybigcommerce.com/dav` |
| Secret | `FTP_USERNAME` | WebDAV account username |
| Secret | `FTP_PASSWORD` | WebDAV account password |
| Variable | `FTP_REMOTE_DIR` | `content/buyer-portal` |

`FTP_SERVER` must contain the complete HTTPS WebDAV endpoint, including `/dav`. `FTP_REMOTE_DIR`
must be relative to `/dav` and identify the specific folder to replace, for example
`content/buyer-portal`. BigCommerce exposes static files uploaded below WebDAV's `content` directory
at the storefront's public `/content/` URL. For safety, the workflow rejects destinations outside
`content` and paths containing `.` or `..` segments.

The storefront build also reads the following GitHub Environment variables. Configure them in both
environments with the values required by staging and production:

| Type | Name | Example |
| --- | --- | --- |
| Variable | `VITE_ASSETS_ABSOLUTE_PATH` | `https://store-example.mybigcommerce.com/content/buyer-portal/` |
| Variable | `VITE_B2B_URL` | Environment-specific B2B API URL |
| Variable | `VITE_DISABLE_BUILD_HASH` | `TRUE` or `FALSE` |
| Variable | `VITE_IS_LOCAL_ENVIRONMENT` | `FALSE` |
| Variable | `VITE_LOCAL_APP_CLIENT_ID` | Environment-specific client ID |

`VITE_ASSETS_ABSOLUTE_PATH` must be the public URL corresponding to `FTP_REMOTE_DIR` and must end
with a trailing `/`. For example, `content/buyer-portal` corresponds to
`https://store-example.mybigcommerce.com/content/buyer-portal/`. The workflow validates this match
before changing any remote files.

The local `apps/storefront/.env` file is ignored by Git and is used only for local development. Do
not upload it or commit it. Variables prefixed with `VITE_` are included in the client-side bundle
at build time and must never contain passwords, private API keys, or other sensitive values.

The deployment jobs for the same branch run sequentially to prevent concurrent uploads to the same
destination. A failed build or a missing/invalid FTP setting stops the workflow before the remote
directory is synchronized. During synchronization, the workflow reports the number and total size
of files and every uploaded path. The workflow uses the HTTP Digest authentication required by the
BigCommerce WebDAV endpoint. It moves the previous deployment to a backup, uploads the new files
directly to the public destination and restores the backup if an upload fails. Finally, it verifies
that the entry point, a JavaScript chunk and an asset are publicly reachable. Network operations use
explicit timeouts and retries, preventing an unreachable server from leaving the deployment silent
indefinitely.

The workflow run and its deployment status are available from the repository's **Actions** tab.

### Common issues:

- **Stencil CLI** We're working to bring full support to integrate buyer portal into [stencil-cli](https://developer.bigcommerce.com/docs/storefront/stencil). If you find any issues feel free to open an issue report.
- **Cross-Origin Issues:** If you encounter cross-origin issues, ensure you have the correct URLs in your `.env` file and verify that your store's origin URL is allowed. You can use a tunnel service like [ngrok](https://ngrok.com/) to expose your local server to the internet.
- **Environment Variables:** Ensure you have the correct environment variables set in your `.env` file. These variables are used to configure your application for different environments.
- **Header and Footer Scripts:** Ensure you have the correct header and footer scripts set in your BigCommerce store. These scripts are used to load your application into the storefront.
- **Build Errors:** If you encounter build errors, ensure you have the correct dependencies installed and that your project is set up correctly. You can run `yarn prepare` to ensure all dependencies are installed and up to date.

## 🤝 Contribution

For developers wishing to contribute, ensure all PRs meet the linting and commit message standards.

## 📞 Contact & Support

For queries, issues, or support please open an issue in this repository.

## License

MIT
