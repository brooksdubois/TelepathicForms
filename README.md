## Usage

```bash
$ bun install
$ bun run dev
```

Note: Use Bun for this repo. I will expect `bun install` and `bun run dev` whenever you make changes here.

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Core Tenet: Telepathic Wiring (No Central Authority)

This repo intentionally avoids a single, centralized form state controller. Each field is its own runtime node with observable state streams, and fields influence each other through a small wiring substrate. The graph only routes signals and batches writes; it does not own canonical form state or impose "boss logic." Any changes should preserve this decentralized, observable wiring model.

## Available Scripts

In the project directory, you can run:

### `bun run dev`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `bun run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
