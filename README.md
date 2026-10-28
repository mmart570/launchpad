# LaunchPad

LaunchPad is a platform that connects computer science students with real work orders posted by businesses. Students can gain practical experience, complete projects, and build a track record of their work.

## Technology Stack

- **Frontend:** React, JavaScript, and Vite
- **Backend:** Node.js and Express
- **Database:** MongoDB

## Prerequisites

Before getting started, install:

- [Node.js](https://nodejs.org/) (includes npm)
- [Git](https://git-scm.com/)
- Access to a MongoDB database when working with backend features that require it

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mmart570/launchpad.git
cd launchpad
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Start the frontend development server

```bash
npm run dev
```

Vite will print a local development URL in your terminal, typically `http://localhost:5173/`. Open the URL shown to view LaunchPad.

### 4. Set up the backend

Open a **second terminal** at the repository root:

```bash
cd server
npm install
```

The server folder includes a `.env.example` file. Review it for the environment variables required by the backend, then create a local `.env` file with appropriate development values. Do not commit `.env` or secrets to Git.

Start the backend using the script defined in `server/package.json`. To see the available scripts, run:

```bash
npm run
```

> **Note:** The exact backend start command and environment variable names have not yet been verified. Update this section once the server scripts and configuration are confirmed.

## Code Formatting

The project can use [Prettier](https://prettier.io/) to format supported source files consistently.

From the repository root, install Prettier if it is not already available:

```bash
npm install --save-dev prettier
```

If the repository root does not yet have a `package.json`, run `npm init -y` before installing it. Alternatively, use the Prettier installation already present in `client`.

Format supported files throughout the repository:

```bash
npx prettier --write .
```

Check formatting without modifying files:

```bash
npx prettier --check .
```

Review changes before committing:

```bash
git status --short
```

## Troubleshooting

**Blank page in the browser:** Check the browser's developer console and the Vite terminal for errors. Verify that `client/index.html` references `/src/main.jsx` and that component imports match file names exactly, including capitalization.

**Frontend does not start:** Confirm that commands are being run inside `client/` and that `npm install` completed successfully.

**Port already in use:** Open the exact local URL printed by Vite, since it may select a different port.

## Development Notes

- Keep individual pages in `client/src/pages/` rather than placing all page content in `App.jsx`.
- Put shared interface elements in `client/src/components/`.
- Follow the existing LaunchPad Figma design when implementing the UI.
- Keep sensitive configuration values out of version control.
