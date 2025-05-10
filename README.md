# Towing Company Site Template

A modern, DRY, and easily replicable static site template for towing companies, designed for rapid customization and deployment to any city.

---

## 🚀 Features
- **Dynamic placeholder replacement**: All `{{...}}` placeholders in HTML are replaced at build/dev time using values from `site.config.json` (via a Vite plugin).
- **Dynamic testimonials**: Testimonials on all pages use randomized city names from your service area list—no hardcoded testimonial cities.
- **Automatic entry points**: All `.html` files in the project root and subdirectories are included in the build automatically—no manual config needed.
- **Config-driven**: All business, location, and service data is managed in a single `site.config.json` file.
- **Modern dev workflow**: Hot reload, instant updates, and easy static builds with Vite.
- **Automated city site generator**: Use `generate-city-site.js` to create a new city-specific site with all info, service areas, and testimonials set up for you.

---

## 🛠️ Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- (Optional) [Python 3](https://www.python.org/) or [live-server](https://www.npmjs.com/package/live-server) for static preview
- (Optional) [GitHub CLI](https://cli.github.com/) for automatic repository creation

---

## ⚡ Quick Start

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Set up your logo:**
   Run the interactive logo setup script:
   ```sh
   npm run setup-logo
   ```
   - You will be asked: `Will you be using your own icon/logo file? (yes/no):`
     - If you answer **no**: The site will use the default tow truck logo (`images/logo.png` and `images/logo.webp`) and overlay the city name on the logo.
     - If you answer **yes**: You must manually swap out `images/logo.png` and `images/logo.webp` with your own logo files. **No city name overlay will be shown.**
   - The script updates `site.config.json` with your choice.

3. **Create a new city site:**
   Use the automated generator in either interactive or command-line mode:

   **Interactive Mode:**
   ```sh
   node generate-city-site.js
   ```
   The script will prompt you for:
   - City name and state
   - Business name and phone number
   - Address details (optional)
   - Confirmation for directory overwrites

   **Command-line Mode:**
   ```sh
   node generate-city-site.js --city "Eleva" --state "WI" --business-name "Eleva Towing" --phone "555-123-4567" --street "123 Main St" --zip "54738"
   ```

   The generator will:
   - Fetch coordinates for the city
   - Generate service areas within a 60-mile radius
   - Create a new site with proper configuration
   - Build and validate the site
   - Create a GitHub repository (if GitHub CLI is available)
   - Start the development server

4. **Start the development server (hot reload, merged data)**
   ```sh
   npm run dev
   ```
   - Open the URL shown in your terminal (e.g., http://localhost:5173/).
   - All placeholders will be replaced with values from `site.config.json`.

5. **Build for production**
   ```sh
   npm run build
   ```
   - Outputs static files to the `dist/` directory.

6. **Preview the static build**
   - With Python:
     ```sh
     cd dist
     python3 -m http.server 8000
     ```
   - Or with live-server:
     ```sh
     cd dist
     npx live-server --port=8080 --no-browser
     ```
   - Open the given URL in your browser.

---

## 🧩 How It Works
- **site.config.json**: All dynamic content (city, business name, phone, services, etc.) is defined here. Use only placeholders in your HTML—never hardcode city, state, or business info.
- **Vite plugin**: At build and dev time, a custom plugin replaces all `{{...}}` placeholders in HTML files (including subdirectories) with values from `site.config.json`.
- **Testimonials**: Use the `{{testimonials_section}}` placeholder in your HTML. The build process injects a testimonials section with randomized city names from your service areas, ensuring variety and realism.
- **No manual merging**: You do not need to run a separate build script for placeholder replacement.
- **Add/remove pages**: Any `.html` file you add (in root or subfolders) is automatically included in the build.
- **Script handling**: All script tags are automatically processed to include `type="module"` for proper ES module support.

---

## 🧑‍💻 Developer Checklist
- [ ] **No hardcoded city, state, or business info in HTML**—use placeholders everywhere (e.g., `{{address.city}}`, `{{address.state}}`, `{{business.name}}`).
- [ ] **Testimonials use `{{testimonials_section}}`**—do not hardcode testimonial city names.
- [ ] **Service areas use `{{service_areas}}`**—do not hardcode city lists in HTML.
- [ ] **All config is in `site.config.json`**—never in HTML.
- [ ] **Run `npm run build` and check `dist/` for unmerged placeholders.**
- [ ] **Use the generator script for new city sites.**

---

## 🧪 Testing
- **Automated Testing**: Use Jest tests in the `test/` folder to validate testimonial city randomization and placeholder replacement.
- **Placeholder Verification**: The test script automatically checks for any unmerged `{{...}}` placeholders in the built files.
- **Build Verification**: Ensures all necessary files are generated and properly configured.

---

## 📦 Deploying
- Deploy the contents of `dist/` to any static host (GitHub Pages, Netlify, Vercel, S3, etc.).
- The site is fully static and requires no backend.

---

## 📝 Notes
- The site generator script (`generate-city-site.js`) supports both interactive and command-line modes.
- Service areas are automatically generated within a 60-mile radius of the main city.
- Large cities (Boston, New York, Chicago, Los Angeles) use an 80-mile radius for service areas.
- The build process is now unified and developer-friendly—just use Vite!

---

## Logo Strategies

- **Default Logo (with city overlay):**
  - The site will use the default tow truck logo (`images/logo.png` and `images/logo.webp`).
  - The city name will be overlaid on the logo.
  - Choose this by answering **no** to the setup question.

- **Custom Logo (no overlay):**
  - You must manually swap out `images/logo.png` and `images/logo.webp` with your own logo files.
  - No city name overlay will be shown.
  - Choose this by answering **yes** to the setup question.

- **Switching Logo Types:**
  - You can re-run `npm run setup-logo` at any time to change your logo strategy.

## Troubleshooting Logo Issues

- **Logo not showing up?**
  - Make sure you have run `npm run setup-logo` and followed the prompts.
  - If using a custom logo, ensure you have replaced `images/logo.png` and `images/logo.webp` with your own files.
  - If you see warnings about missing logo files, re-run the setup script.

- **Changed your mind?**
  - Just run `npm run setup-logo` again to switch between logo modes.

- **Build errors about logo imports?**
  - Make sure you have the latest code and have run the setup script at least once.

## Other Scripts

- `npm run build` — Build the site for production
- `npm run dev` — Start the development server
- `npm run setup-logo` — Interactive logo setup (see above)
- `node generate-city-site.js` — Create a new city site (interactive mode)
- `node generate-city-site.js --city "City" --state "ST"` — Create a new city site (command-line mode)

---

For questions or improvements, open an issue or PR. Happy towing! 🚗💨
