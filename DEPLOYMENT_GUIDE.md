# Deployment Guide for Cyber Dravida LMS

This guide will help you deploy your Next.js + Express application to **cyberdravida.in**.

## 1. Prerequisites
- **cPanel Access** with "Setup Node.js App" feature.
- **Node.js**: Ensure your hosting supports Node.js (Version 18 or 20 recommended).

## 2. Prepare Your Files
We have updated `package.json` and `server/index.js` to allow the application to run as a single unit.

1.  **Delete** `node_modules` and `.next` folders from your local project (if they exist) to ensure a clean slate, or just ignore them when zipping.
2.  **Zip** the entire Project folder, **EXCLUDING**:
    -   `node_modules/`
    -   `.git/`
    -   `.next/` (It is better to build on the server)
    -   `.env` (You will set environment variables on the server)

    **Include** these important files:
    -   `package.json`
    -   `server/` directory
    -   `src/` directory
    -   `public/`
    -   `next.config.js`
    -   `server/database/lms.db` (If you want to keep your current data)

## 3. Upload to cPanel

1.  Log in to **cPanel**.
2.  Go to **File Manager**.
3.  Upload your **ZIP file** to the root folder (e.g., `public_html` or a subdirectory `lms`).
4.  **Extract** the files.

## 4. Setup Node.js Application

1.  Go to **Setup Node.js App** in cPanel.
2.  **Create Application**:
    -   **Node.js Version**: Select **18.x** or **20.x**.
    -   **Application Mode**: `Production`.
    -   **Application Root**: The path to your extracted files (e.g., `public_html`).
    -   **Application URL**: `cyberdravida.in` (leave empty for root domain).
    -   **Application Startup File**: `server/index.js` (IMPORTANT).
3.  Click **Create**.

## 5. Install Dependencies & Build

1.  Once the app is created, scroll down to the **"Detected configuration file"** section.
2.  Click **Run NPM Install**. Wait for it to complete.
3.  **Build the Frontend**:
    -   Currently, cPanel's simple UI might not have a button for "Build".
    -   You have two options:
        *   **Option A (Console)**:
            1.  Copy the "Enter to the virtual environment" command (at top of page).
            2.  Open **Terminal** in cPanel (or SSH).
            3.  Paste the command.
            4.  Run: `npm run build`
            5.  Wait for the build to finish.
        *   **Option B (Local Build)**:
            1.  Run `npm run build` on your computer.
            2.  Upload the `.next` folder to the server via File Manager.

## 6. Environment Variables

In the **Setup Node.js App** screen, click **Environment Variables** (or "Add Variable") and add:

- `NODE_ENV` = `production`
- `PORT` = (cPanel usually manages this, checking if they pass it automatically. If required, set to strictly what cPanel assigns, but `server/index.js` defaults to 3001. cPanel Phusion Passenger automatically handles the port binding for the `app.listen`, so you typically don't need to specify PORT explicitly, but setting `NODE_ENV` is crucial).
- `JWT_SECRET` = (Your secret key)
- `STRIPE_SECRET_KEY` = (Your Stripe Secret)
- `STRIPE_PUBLISHABLE_KEY` = (Your Stripe Public Key)
- `FRONTEND_URL` = `https://cyberdravida.in`

## 7. Restart
1.  Go back to **Setup Node.js App**.
2.  Click **Restart Application**.

## Troubleshooting

-   **500 Error**: Check `stderr.log` in your application root directory.
-   **Database**: Ensure `server/database/` folder has **Write Permissions** (755 or 777 usually needed just for the folder if the user matches, otherwise 777 is a quick fix for testing but 755 is safer).
-   **Images not loading**: Check `next.config.js` domain whitelist.

## Database Note
Your project currently uses a file-based database (`lms.db`). **Warning**: If you redeploy by deleting the folder, you will lose data. **Always backup** `server/database/lms.db` before uploading new code.
