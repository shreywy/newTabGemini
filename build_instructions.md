# Build Instructions for Gemini New Tab

**GitHub Repository:** [https://github.com/shreywy/newTabGemini](https://github.com/shreywy/newTabGemini)

This extension uses Tailwind CSS (v3) to generate the styling. The CSS is compiled from `input.css` into the final `build.css` file used by the extension.

## 1. Prerequisites
* **Operating System:** Windows, macOS, or Linux (Tested on Windows 10/11)
* **Node.js:** Version 14.0 or higher
* **NPM:** Installed with Node.js

## 2. Installation
1.  Unzip the source code archive.
2.  Open a terminal (Command Prompt, PowerShell, or Terminal) in the root of the unzipped folder.
3.  Install the dependencies (TailwindCSS, PostCSS, Autoprefixer):

```bash
npm install
```

## 3. Building the Extension
To compile the CSS, run the build script defined in `package.json`:

```bash
npm run build
```

**Note:** This script runs in **watch mode** (`--watch`).

  * You will see a message: `Rebuilding... Done in Xms.`
  * Once you see "Done", the `build.css` file has been successfully generated.
  * You can stop the script by pressing `Ctrl + C`.

## 4\. Final Verification

After the build completes, the `build.css` file in the root directory will contain the compiled CSS. The extension can now be loaded into Firefox.

## 5\. File Structure

  * `manifest.json` - Extension manifest (Manifest V2)
  * `input.css` - Source CSS with Tailwind directives
  * `build.css` - Output compiled CSS (Generated)
  * `tailwind.config.js` - Tailwind configuration
  * `index.html` - New Tab entry point
  * `script.js` - Main logic