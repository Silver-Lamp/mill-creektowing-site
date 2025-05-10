// vite.config.js
import { defineConfig } from "file:///Users/sandonjurowski/Desktop/_SilverLamp/towing-template-site/node_modules/vite/dist/node/index.js";
import { viteStaticCopy } from "file:///Users/sandonjurowski/Desktop/_SilverLamp/towing-template-site/node_modules/vite-plugin-static-copy/dist/index.js";
import fs2 from "fs";

// scripts/generate-logo.js
import sharp from "file:///Users/sandonjurowski/Desktop/_SilverLamp/towing-template-site/node_modules/sharp/lib/index.js";
import fs from "fs";
import path from "path";
async function generateDefaultLogo(cityName, outputDir) {
  try {
    const width = 512;
    const height = 512;
    const svgLogo = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background circle -->
        <circle cx="${width / 2}" cy="${height / 2}" r="${width / 2.2}" fill="#1a4789"/>
        
        <!-- Tow truck icon -->
        <path d="M384 96H256V144C256 152.8 248.8 160 240 160H208C199.2 160 192 152.8 192 144V96H128C119.2 96 112 88.84 112 80V48C112 39.16 119.2 32 128 32H384C392.8 32 400 39.16 400 48V80C400 88.84 392.8 96 384 96zM381.2 160H384V264C384 277.3 373.3 288 360 288H352V320C352 337.7 337.7 352 320 352H288C270.3 352 256 337.7 256 320V288H224C206.3 288 192 273.7 192 256V224C192 206.3 206.3 192 224 192H256V160H192V192H160C142.3 192 128 177.7 128 160V128H96C78.33 128 64 113.7 64 96V64C64 46.33 78.33 32 96 32H128V64H96V96H128V128H160V96H192V128H224V96H256V128H288V96H320V128H352V96H384V128H352V160H381.2z" fill="white" transform="scale(0.7) translate(150, 150)"/>
        
        <!-- TOWING text -->
        <text
          x="50%"
          y="75%"
          text-anchor="middle"
          style="
            font-family: 'Arial Black', sans-serif;
            font-weight: 900;
            font-size: 48px;
            fill: white;
            text-transform: uppercase;
            letter-spacing: 1px;
          "
        >TOWING</text>
      </svg>
    `;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    await sharp(Buffer.from(svgLogo)).resize(256, 256).toFile(path.join(outputDir, "logo.png"));
    await sharp(Buffer.from(svgLogo)).resize(256, 256).webp().toFile(path.join(outputDir, "logo.webp"));
    console.log("Generated default logo with city name overlay");
    return true;
  } catch (error) {
    console.error("Error generating default logo:", error);
    throw error;
  }
}

// vite.config.js
import { spawnSync } from "child_process";
var siteConfig = JSON.parse(fs2.readFileSync("site.config.json", "utf8"));
var testimonialsTemplate = fs2.readFileSync("templates/testimonials.html", "utf8");
function getNestedValue(obj, path2) {
  return path2.split(".").reduce((prev, curr) => {
    return prev ? prev[curr] : void 0;
  }, obj);
}
function processEachBlocks(content) {
  let result = content;
  const eachRegex = /#each\s+([^\s]+)([\s\S]*?)\/each/g;
  result = result.replace(eachRegex, (match, arrayPath, template) => {
    let array;
    if (arrayPath === "service_areas" || arrayPath === "service_area") {
      array = siteConfig.service_areas || siteConfig.service_area;
    } else {
      array = getNestedValue(siteConfig, arrayPath);
    }
    if (!array || !Array.isArray(array)) {
      console.warn(`Warning: No array found for ${arrayPath}`);
      return "";
    }
    if ((arrayPath === "service_areas" || arrayPath === "service_area") && template.includes("<li>")) {
      return array.map((item) => `<li>${item}</li>`).join("\n");
    }
    return array.map((item) => {
      let itemTemplate = template.trim();
      itemTemplate = itemTemplate.replace(/\{\{this\}\}/g, item);
      return itemTemplate;
    }).join("\n");
  });
  return result;
}
function processServiceAreas(content) {
  const areas = siteConfig.service_areas || siteConfig.service_area;
  if (!areas || !Array.isArray(areas)) {
    return content;
  }
  const midPoint = Math.ceil(areas.length / 2);
  const column1 = areas.slice(0, midPoint);
  const column2 = areas.slice(midPoint);
  const serviceAreasHtml = `
    <div class="service-areas-columns">
      <div class="service-areas-column">
        ${column1.map((area) => `<div class="service-area-item">${area}</div>`).join("\n")}
      </div>
      <div class="service-areas-column">
        ${column2.map((area) => `<div class="service-area-item">${area}</div>`).join("\n")}
      </div>
    </div>
  `;
  let result = content.replace(/\{\{service_areas\}\}/g, serviceAreasHtml);
  result = result.replace(/\{\{service_area\}\}/g, serviceAreasHtml);
  if (!content.includes("{{#each service_areas}}<li>") && !content.includes("{{#each service_area}}<li>")) {
    result = result.replace(/#each\s+service_areas?[\s\S]*?\/each/g, "");
  }
  return result;
}
function processServicesSection() {
  if (!siteConfig.services_section || !siteConfig.services_options) {
    return "";
  }
  const { title } = siteConfig.services_section;
  return `
    <section class="services">
      <h2>${title}</h2>
      <p>Car breakdowns are a hassle, and they never seem to happen at a convenient time. Luckily, our towing services in {{location_name}}, {{address.state}} are always available to assist you in your time of need. We understand how frustrating it can be to be stuck on the side of the road, so we prioritize getting to you quickly and efficiently.</p>
      <ul class="service-list">
        <li><a href="tow-truck-service.html">Towing Service</a></li>
        <li><a href="emergency-towing.html">Emergency Towing</a></li>
        <li><a href="roadside-assistance.html">Roadside Assistance</a></li>
        <li><a href="auto-wrecking-and-flatbed-towing.html">Auto Wrecking & Flatbed Towing</a></li>
      </ul>
    </section>
  `;
}
function processTestimonials(content) {
  if (!siteConfig.testimonials) return content;
  let result = content;
  result = result.replace(/\{\{(?:testimonials\.)?testimonial([1-3])\.(text|author|city|state)\}\}/g, (match, num, field) => {
    const testimonial = siteConfig.testimonials[`testimonial${num}`];
    return testimonial ? testimonial[field] : "";
  });
  result = processEachBlocks(result);
  result = replacePlaceholders(result);
  result = result.replace("{{services_section}}", processServicesSection());
  const servicesOptionsHtml = `
    <option value="tow-truck">Tow Truck</option>
    <option value="car-towing">Car Towing</option>
    <option value="tow-truck-service">Tow Truck Service</option>
    <option value="emergency">Emergency Towing</option>
    <option value="roadside">Roadside Assistance</option>
    <option value="flatbed">Auto Wrecking And Flatbed Towing</option>
    <option value="other">Other</option>
  `;
  result = result.replace("{{services_options}}", servicesOptionsHtml);
  result = processServiceAreas(result);
  result = result.replace(/(<!-- Testimonials Section -->[\s\S]*?<\/section>)[\s\S]*?(<!-- Testimonials Section -->[\s\S]*?<\/section>)/, "$1");
  return result;
}
function replacePlaceholders(content) {
  let result = content;
  let lastResult;
  do {
    lastResult = result;
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = getNestedValue(siteConfig, key.trim());
      if (value === void 0) {
        if (key === "services_options") {
          return `
            <option value="tow-truck">Tow Truck</option>
            <option value="car-towing">Car Towing</option>
            <option value="tow-truck-service">Tow Truck Service</option>
            <option value="emergency">Emergency Towing</option>
            <option value="roadside">Roadside Assistance</option>
            <option value="flatbed">Auto Wrecking And Flatbed Towing</option>
            <option value="other">Other</option>
          `;
        }
        console.warn(`Warning: No value found for placeholder ${key}`);
        return match;
      }
      if (key === "services_section") {
        return processServicesSection();
      }
      if (key === "service_areas" || key === "service_area") {
        return match;
      }
      if (key === "footer_map_embed_url") {
        return value || "";
      }
      return typeof value === "object" ? JSON.stringify(value) : value;
    });
  } while (result !== lastResult);
  return result;
}
function htmlPlugin() {
  return {
    name: "html-plugin",
    enforce: "pre",
    async buildStart() {
      try {
        if (siteConfig.useCustomLogo) {
          if (fs2.existsSync("images/logo-custom.png")) {
            console.log("Using existing custom logo");
          } else {
            console.warn('Custom logo not found. Please run "node scripts/setup-logo.js" to set up your logo.');
          }
        } else {
          await generateDefaultLogo(siteConfig.location_name, "images");
        }
      } catch (error) {
        console.error("Error handling logo:", error);
      }
      const htmlFiles = fs2.readdirSync(".").filter((file) => file.endsWith(".html"));
      for (const file of htmlFiles) {
        const content = fs2.readFileSync(file, "utf8");
        const processedContent = processTestimonials(content);
        fs2.writeFileSync(file, processedContent);
      }
    },
    transform(code, id) {
      if (id.endsWith(".html")) {
        let result = processTestimonials(code);
        result = result.replace(/<script([^>]*)>/g, (match, attrs) => {
          attrs = attrs.replace(/\s+(type|async|defer)=["'][^"']*["']/g, "");
          if (attrs.includes("application/ld+json")) {
            return `<script type="application/ld+json"${attrs}>`;
          }
          if (attrs.includes("src=")) {
            return `<script type="module" async${attrs}>`;
          }
          return `<script type="module" async${attrs}>`;
        });
        result = processServiceAreas(result);
        result = replacePlaceholders(result);
        return {
          code: result,
          map: null
        };
      }
    }
  };
}
function ensureLogoSetup() {
  const configPath = "site.config.json";
  let config;
  try {
    config = JSON.parse(fs2.readFileSync(configPath, "utf8"));
  } catch (e) {
    throw new Error("Could not read site.config.json");
  }
  if (typeof config.useCityOverlay === "undefined") {
    console.log("\n--- Logo setup required ---");
    const result = spawnSync("node", ["scripts/setup-logo.js"], { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error("Logo setup failed.");
    }
  }
}
ensureLogoSetup();
var vite_config_default = defineConfig({
  plugins: [
    htmlPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: "images/*",
          dest: "images"
        }
      ]
    })
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "index.html",
        "auto-wrecking-and-flatbed-towing": "auto-wrecking-and-flatbed-towing.html",
        "car-towing": "car-towing.html",
        "emergency-towing": "emergency-towing.html",
        "roadside-assistance": "roadside-assistance.html",
        "tow-truck": "tow-truck.html",
        "tow-truck-service": "tow-truck-service.html"
      },
      output: {
        manualChunks: void 0,
        assetFileNames: "[name].[ext]",
        chunkFileNames: "[name].js",
        entryFileNames: "[name].js"
      }
    },
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    minify: false,
    sourcemap: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic2NyaXB0cy9nZW5lcmF0ZS1sb2dvLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NhbmRvbmp1cm93c2tpL0Rlc2t0b3AvX1NpbHZlckxhbXAvdG93aW5nLXRlbXBsYXRlLXNpdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYW5kb25qdXJvd3NraS9EZXNrdG9wL19TaWx2ZXJMYW1wL3Rvd2luZy10ZW1wbGF0ZS1zaXRlL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zYW5kb25qdXJvd3NraS9EZXNrdG9wL19TaWx2ZXJMYW1wL3Rvd2luZy10ZW1wbGF0ZS1zaXRlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5JztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGdlbmVyYXRlRGVmYXVsdExvZ28sIGNvcHlDdXN0b21Mb2dvIH0gZnJvbSAnLi9zY3JpcHRzL2dlbmVyYXRlLWxvZ28uanMnO1xuaW1wb3J0IHsgc3Bhd25TeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbi8vIFJlYWQgc2l0ZSBjb25maWdcbmNvbnN0IHNpdGVDb25maWcgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnc2l0ZS5jb25maWcuanNvbicsICd1dGY4JykpO1xuXG4vLyBSZWFkIHRlc3RpbW9uaWFscyB0ZW1wbGF0ZVxuY29uc3QgdGVzdGltb25pYWxzVGVtcGxhdGUgPSBmcy5yZWFkRmlsZVN5bmMoJ3RlbXBsYXRlcy90ZXN0aW1vbmlhbHMuaHRtbCcsICd1dGY4Jyk7XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgbmVzdGVkIHZhbHVlXG5mdW5jdGlvbiBnZXROZXN0ZWRWYWx1ZShvYmosIHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguc3BsaXQoJy4nKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHtcbiAgICByZXR1cm4gcHJldiA/IHByZXZbY3Vycl0gOiB1bmRlZmluZWQ7XG4gIH0sIG9iaik7XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBwcm9jZXNzICNlYWNoIGJsb2Nrc1xuZnVuY3Rpb24gcHJvY2Vzc0VhY2hCbG9ja3MoY29udGVudCkge1xuICBsZXQgcmVzdWx0ID0gY29udGVudDtcbiAgY29uc3QgZWFjaFJlZ2V4ID0gLyNlYWNoXFxzKyhbXlxcc10rKShbXFxzXFxTXSo/KVxcL2VhY2gvZztcbiAgXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKGVhY2hSZWdleCwgKG1hdGNoLCBhcnJheVBhdGgsIHRlbXBsYXRlKSA9PiB7XG4gICAgLy8gVHJ5IGJvdGggc2VydmljZV9hcmVhcyBhbmQgc2VydmljZV9hcmVhIGtleXNcbiAgICBsZXQgYXJyYXk7XG4gICAgaWYgKGFycmF5UGF0aCA9PT0gJ3NlcnZpY2VfYXJlYXMnIHx8IGFycmF5UGF0aCA9PT0gJ3NlcnZpY2VfYXJlYScpIHtcbiAgICAgIGFycmF5ID0gc2l0ZUNvbmZpZy5zZXJ2aWNlX2FyZWFzIHx8IHNpdGVDb25maWcuc2VydmljZV9hcmVhO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcnJheSA9IGdldE5lc3RlZFZhbHVlKHNpdGVDb25maWcsIGFycmF5UGF0aCk7XG4gICAgfVxuICAgIFxuICAgIGlmICghYXJyYXkgfHwgIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFdhcm5pbmc6IE5vIGFycmF5IGZvdW5kIGZvciAke2FycmF5UGF0aH1gKTtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgXG4gICAgLy8gU3BlY2lhbCBoYW5kbGluZyBmb3Igc2VydmljZSBhcmVhcyBpbiBsaXN0IGZvcm1hdFxuICAgIGlmICgoYXJyYXlQYXRoID09PSAnc2VydmljZV9hcmVhcycgfHwgYXJyYXlQYXRoID09PSAnc2VydmljZV9hcmVhJykgJiYgdGVtcGxhdGUuaW5jbHVkZXMoJzxsaT4nKSkge1xuICAgICAgcmV0dXJuIGFycmF5Lm1hcChpdGVtID0+IGA8bGk+JHtpdGVtfTwvbGk+YCkuam9pbignXFxuJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIERlZmF1bHQgaGFuZGxpbmcgZm9yIG90aGVyIGFycmF5c1xuICAgIHJldHVybiBhcnJheS5tYXAoaXRlbSA9PiB7XG4gICAgICBsZXQgaXRlbVRlbXBsYXRlID0gdGVtcGxhdGUudHJpbSgpO1xuICAgICAgLy8gUmVwbGFjZSB7e3RoaXN9fSB3aXRoIHRoZSBhY3R1YWwgaXRlbVxuICAgICAgaXRlbVRlbXBsYXRlID0gaXRlbVRlbXBsYXRlLnJlcGxhY2UoL1xce1xce3RoaXNcXH1cXH0vZywgaXRlbSk7XG4gICAgICByZXR1cm4gaXRlbVRlbXBsYXRlO1xuICAgIH0pLmpvaW4oJ1xcbicpO1xuICB9KTtcbiAgXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBwcm9jZXNzIHNlcnZpY2UgYXJlYXNcbmZ1bmN0aW9uIHByb2Nlc3NTZXJ2aWNlQXJlYXMoY29udGVudCkge1xuICAvLyBUcnkgYm90aCBzZXJ2aWNlX2FyZWFzIGFuZCBzZXJ2aWNlX2FyZWEga2V5c1xuICBjb25zdCBhcmVhcyA9IHNpdGVDb25maWcuc2VydmljZV9hcmVhcyB8fCBzaXRlQ29uZmlnLnNlcnZpY2VfYXJlYTtcbiAgaWYgKCFhcmVhcyB8fCAhQXJyYXkuaXNBcnJheShhcmVhcykpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuICBcbiAgLy8gU3BsaXQgdGhlIGFycmF5IGludG8gdHdvIGNvbHVtbnNcbiAgY29uc3QgbWlkUG9pbnQgPSBNYXRoLmNlaWwoYXJlYXMubGVuZ3RoIC8gMik7XG4gIGNvbnN0IGNvbHVtbjEgPSBhcmVhcy5zbGljZSgwLCBtaWRQb2ludCk7XG4gIGNvbnN0IGNvbHVtbjIgPSBhcmVhcy5zbGljZShtaWRQb2ludCk7XG4gIFxuICBjb25zdCBzZXJ2aWNlQXJlYXNIdG1sID0gYFxuICAgIDxkaXYgY2xhc3M9XCJzZXJ2aWNlLWFyZWFzLWNvbHVtbnNcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzZXJ2aWNlLWFyZWFzLWNvbHVtblwiPlxuICAgICAgICAke2NvbHVtbjEubWFwKGFyZWEgPT4gYDxkaXYgY2xhc3M9XCJzZXJ2aWNlLWFyZWEtaXRlbVwiPiR7YXJlYX08L2Rpdj5gKS5qb2luKCdcXG4nKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNlcnZpY2UtYXJlYXMtY29sdW1uXCI+XG4gICAgICAgICR7Y29sdW1uMi5tYXAoYXJlYSA9PiBgPGRpdiBjbGFzcz1cInNlcnZpY2UtYXJlYS1pdGVtXCI+JHthcmVhfTwvZGl2PmApLmpvaW4oJ1xcbicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIGA7XG4gIFxuICAvLyBSZXBsYWNlIGJvdGggdGhlIHt7c2VydmljZV9hcmVhc319IGFuZCB7e3NlcnZpY2VfYXJlYX19IHBsYWNlaG9sZGVyc1xuICBsZXQgcmVzdWx0ID0gY29udGVudC5yZXBsYWNlKC9cXHtcXHtzZXJ2aWNlX2FyZWFzXFx9XFx9L2csIHNlcnZpY2VBcmVhc0h0bWwpO1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSgvXFx7XFx7c2VydmljZV9hcmVhXFx9XFx9L2csIHNlcnZpY2VBcmVhc0h0bWwpO1xuICBcbiAgLy8gRG9uJ3QgcmVtb3ZlICNlYWNoIGJsb2NrcyBmb3Igc2VydmljZSBhcmVhcyBpbiBsaXN0IGZvcm1hdFxuICBpZiAoIWNvbnRlbnQuaW5jbHVkZXMoJ3t7I2VhY2ggc2VydmljZV9hcmVhc319PGxpPicpICYmICFjb250ZW50LmluY2x1ZGVzKCd7eyNlYWNoIHNlcnZpY2VfYXJlYX19PGxpPicpKSB7XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoLyNlYWNoXFxzK3NlcnZpY2VfYXJlYXM/W1xcc1xcU10qP1xcL2VhY2gvZywgJycpO1xuICB9XG4gIFxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvY2VzcyBzZXJ2aWNlcyBzZWN0aW9uXG5mdW5jdGlvbiBwcm9jZXNzU2VydmljZXNTZWN0aW9uKCkge1xuICBpZiAoIXNpdGVDb25maWcuc2VydmljZXNfc2VjdGlvbiB8fCAhc2l0ZUNvbmZpZy5zZXJ2aWNlc19vcHRpb25zKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIFxuICBjb25zdCB7IHRpdGxlIH0gPSBzaXRlQ29uZmlnLnNlcnZpY2VzX3NlY3Rpb247XG4gIFxuICByZXR1cm4gYFxuICAgIDxzZWN0aW9uIGNsYXNzPVwic2VydmljZXNcIj5cbiAgICAgIDxoMj4ke3RpdGxlfTwvaDI+XG4gICAgICA8cD5DYXIgYnJlYWtkb3ducyBhcmUgYSBoYXNzbGUsIGFuZCB0aGV5IG5ldmVyIHNlZW0gdG8gaGFwcGVuIGF0IGEgY29udmVuaWVudCB0aW1lLiBMdWNraWx5LCBvdXIgdG93aW5nIHNlcnZpY2VzIGluIHt7bG9jYXRpb25fbmFtZX19LCB7e2FkZHJlc3Muc3RhdGV9fSBhcmUgYWx3YXlzIGF2YWlsYWJsZSB0byBhc3Npc3QgeW91IGluIHlvdXIgdGltZSBvZiBuZWVkLiBXZSB1bmRlcnN0YW5kIGhvdyBmcnVzdHJhdGluZyBpdCBjYW4gYmUgdG8gYmUgc3R1Y2sgb24gdGhlIHNpZGUgb2YgdGhlIHJvYWQsIHNvIHdlIHByaW9yaXRpemUgZ2V0dGluZyB0byB5b3UgcXVpY2tseSBhbmQgZWZmaWNpZW50bHkuPC9wPlxuICAgICAgPHVsIGNsYXNzPVwic2VydmljZS1saXN0XCI+XG4gICAgICAgIDxsaT48YSBocmVmPVwidG93LXRydWNrLXNlcnZpY2UuaHRtbFwiPlRvd2luZyBTZXJ2aWNlPC9hPjwvbGk+XG4gICAgICAgIDxsaT48YSBocmVmPVwiZW1lcmdlbmN5LXRvd2luZy5odG1sXCI+RW1lcmdlbmN5IFRvd2luZzwvYT48L2xpPlxuICAgICAgICA8bGk+PGEgaHJlZj1cInJvYWRzaWRlLWFzc2lzdGFuY2UuaHRtbFwiPlJvYWRzaWRlIEFzc2lzdGFuY2U8L2E+PC9saT5cbiAgICAgICAgPGxpPjxhIGhyZWY9XCJhdXRvLXdyZWNraW5nLWFuZC1mbGF0YmVkLXRvd2luZy5odG1sXCI+QXV0byBXcmVja2luZyAmIEZsYXRiZWQgVG93aW5nPC9hPjwvbGk+XG4gICAgICA8L3VsPlxuICAgIDwvc2VjdGlvbj5cbiAgYDtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHByb2Nlc3MgdGVzdGltb25pYWxzXG5mdW5jdGlvbiBwcm9jZXNzVGVzdGltb25pYWxzKGNvbnRlbnQpIHtcbiAgaWYgKCFzaXRlQ29uZmlnLnRlc3RpbW9uaWFscykgcmV0dXJuIGNvbnRlbnQ7XG4gIFxuICBsZXQgcmVzdWx0ID0gY29udGVudDtcbiAgXG4gIC8vIFJlcGxhY2UgdGVzdGltb25pYWwgcGxhY2Vob2xkZXJzIHdpdGggYm90aCBmb3JtYXRzXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9cXHtcXHsoPzp0ZXN0aW1vbmlhbHNcXC4pP3Rlc3RpbW9uaWFsKFsxLTNdKVxcLih0ZXh0fGF1dGhvcnxjaXR5fHN0YXRlKVxcfVxcfS9nLCAobWF0Y2gsIG51bSwgZmllbGQpID0+IHtcbiAgICBjb25zdCB0ZXN0aW1vbmlhbCA9IHNpdGVDb25maWcudGVzdGltb25pYWxzW2B0ZXN0aW1vbmlhbCR7bnVtfWBdO1xuICAgIHJldHVybiB0ZXN0aW1vbmlhbCA/IHRlc3RpbW9uaWFsW2ZpZWxkXSA6ICcnO1xuICB9KTtcbiAgXG4gIC8vIFByb2Nlc3MgI2VhY2ggYmxvY2tzIGluIHRoZSBjb250ZW50XG4gIHJlc3VsdCA9IHByb2Nlc3NFYWNoQmxvY2tzKHJlc3VsdCk7XG4gIFxuICAvLyBSZXBsYWNlIGFsbCByZW1haW5pbmcgcGxhY2Vob2xkZXJzIGluIHRoZSBjb250ZW50XG4gIHJlc3VsdCA9IHJlcGxhY2VQbGFjZWhvbGRlcnMocmVzdWx0KTtcbiAgXG4gIC8vIFJlcGxhY2Ugc2VydmljZXMgc2VjdGlvbiBwbGFjZWhvbGRlclxuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSgne3tzZXJ2aWNlc19zZWN0aW9ufX0nLCBwcm9jZXNzU2VydmljZXNTZWN0aW9uKCkpO1xuICBcbiAgLy8gUmVwbGFjZSBzZXJ2aWNlcyBvcHRpb25zIHBsYWNlaG9sZGVyIHdpdGggaGFyZGNvZGVkIG9wdGlvbnNcbiAgY29uc3Qgc2VydmljZXNPcHRpb25zSHRtbCA9IGBcbiAgICA8b3B0aW9uIHZhbHVlPVwidG93LXRydWNrXCI+VG93IFRydWNrPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cImNhci10b3dpbmdcIj5DYXIgVG93aW5nPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cInRvdy10cnVjay1zZXJ2aWNlXCI+VG93IFRydWNrIFNlcnZpY2U8L29wdGlvbj5cbiAgICA8b3B0aW9uIHZhbHVlPVwiZW1lcmdlbmN5XCI+RW1lcmdlbmN5IFRvd2luZzwvb3B0aW9uPlxuICAgIDxvcHRpb24gdmFsdWU9XCJyb2Fkc2lkZVwiPlJvYWRzaWRlIEFzc2lzdGFuY2U8L29wdGlvbj5cbiAgICA8b3B0aW9uIHZhbHVlPVwiZmxhdGJlZFwiPkF1dG8gV3JlY2tpbmcgQW5kIEZsYXRiZWQgVG93aW5nPC9vcHRpb24+XG4gICAgPG9wdGlvbiB2YWx1ZT1cIm90aGVyXCI+T3RoZXI8L29wdGlvbj5cbiAgYDtcbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoJ3t7c2VydmljZXNfb3B0aW9uc319Jywgc2VydmljZXNPcHRpb25zSHRtbCk7XG4gIFxuICAvLyBQcm9jZXNzIHNlcnZpY2UgYXJlYXNcbiAgcmVzdWx0ID0gcHJvY2Vzc1NlcnZpY2VBcmVhcyhyZXN1bHQpO1xuICBcbiAgLy8gUmVtb3ZlIGFueSBkdXBsaWNhdGUgdGVzdGltb25pYWxzIHNlY3Rpb25zXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC8oPCEtLSBUZXN0aW1vbmlhbHMgU2VjdGlvbiAtLT5bXFxzXFxTXSo/PFxcL3NlY3Rpb24+KVtcXHNcXFNdKj8oPCEtLSBUZXN0aW1vbmlhbHMgU2VjdGlvbiAtLT5bXFxzXFxTXSo/PFxcL3NlY3Rpb24+KS8sICckMScpO1xuICBcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHJlcGxhY2UgcGxhY2Vob2xkZXJzXG5mdW5jdGlvbiByZXBsYWNlUGxhY2Vob2xkZXJzKGNvbnRlbnQpIHtcbiAgbGV0IHJlc3VsdCA9IGNvbnRlbnQ7XG4gIGxldCBsYXN0UmVzdWx0O1xuICBcbiAgLy8gS2VlcCByZXBsYWNpbmcgdW50aWwgbm8gbW9yZSBjaGFuZ2VzIGFyZSBtYWRlXG4gIGRvIHtcbiAgICBsYXN0UmVzdWx0ID0gcmVzdWx0O1xuICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9cXHtcXHsoW159XSspXFx9XFx9L2csIChtYXRjaCwga2V5KSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE5lc3RlZFZhbHVlKHNpdGVDb25maWcsIGtleS50cmltKCkpO1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gU3BlY2lhbCBoYW5kbGluZyBmb3Igc2VydmljZXNfb3B0aW9uc1xuICAgICAgICBpZiAoa2V5ID09PSAnc2VydmljZXNfb3B0aW9ucycpIHtcbiAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInRvdy10cnVja1wiPlRvdyBUcnVjazwvb3B0aW9uPlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNhci10b3dpbmdcIj5DYXIgVG93aW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwidG93LXRydWNrLXNlcnZpY2VcIj5Ub3cgVHJ1Y2sgU2VydmljZTwvb3B0aW9uPlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImVtZXJnZW5jeVwiPkVtZXJnZW5jeSBUb3dpbmc8L29wdGlvbj5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJyb2Fkc2lkZVwiPlJvYWRzaWRlIEFzc2lzdGFuY2U8L29wdGlvbj5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJmbGF0YmVkXCI+QXV0byBXcmVja2luZyBBbmQgRmxhdGJlZCBUb3dpbmc8L29wdGlvbj5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJvdGhlclwiPk90aGVyPC9vcHRpb24+XG4gICAgICAgICAgYDtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLndhcm4oYFdhcm5pbmc6IE5vIHZhbHVlIGZvdW5kIGZvciBwbGFjZWhvbGRlciAke2tleX1gKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3Qgc3RyaW5naWZ5IG9iamVjdHMgZm9yIHNlcnZpY2VzX3NlY3Rpb25cbiAgICAgIGlmIChrZXkgPT09ICdzZXJ2aWNlc19zZWN0aW9uJykge1xuICAgICAgICByZXR1cm4gcHJvY2Vzc1NlcnZpY2VzU2VjdGlvbigpO1xuICAgICAgfVxuICAgICAgLy8gRG9uJ3QgcHJvY2VzcyBzZXJ2aWNlX2FyZWFzIGhlcmUgYXMgaXQncyBoYW5kbGVkIHNlcGFyYXRlbHlcbiAgICAgIGlmIChrZXkgPT09ICdzZXJ2aWNlX2FyZWFzJyB8fCBrZXkgPT09ICdzZXJ2aWNlX2FyZWEnKSB7XG4gICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgIH1cbiAgICAgIC8vIEhhbmRsZSBmb290ZXIgbWFwIFVSTFxuICAgICAgaWYgKGtleSA9PT0gJ2Zvb3Rlcl9tYXBfZW1iZWRfdXJsJykge1xuICAgICAgICByZXR1cm4gdmFsdWUgfHwgJyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IHZhbHVlO1xuICAgIH0pO1xuICB9IHdoaWxlIChyZXN1bHQgIT09IGxhc3RSZXN1bHQpO1xuICBcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gQ3VzdG9tIHBsdWdpbiB0byBoYW5kbGUgSFRNTCBwcm9jZXNzaW5nXG5mdW5jdGlvbiBodG1sUGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdodG1sLXBsdWdpbicsXG4gICAgZW5mb3JjZTogJ3ByZScsXG4gICAgYXN5bmMgYnVpbGRTdGFydCgpIHtcbiAgICAgIC8vIEdlbmVyYXRlIG9yIGNvcHkgbG9nbyBiYXNlZCBvbiBjb25maWdcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzaXRlQ29uZmlnLnVzZUN1c3RvbUxvZ28pIHtcbiAgICAgICAgICAvLyBJZiB1c2luZyBjdXN0b20gbG9nbywgY2hlY2sgaWYgaXQgZXhpc3RzXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoJ2ltYWdlcy9sb2dvLWN1c3RvbS5wbmcnKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1VzaW5nIGV4aXN0aW5nIGN1c3RvbSBsb2dvJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ3VzdG9tIGxvZ28gbm90IGZvdW5kLiBQbGVhc2UgcnVuIFwibm9kZSBzY3JpcHRzL3NldHVwLWxvZ28uanNcIiB0byBzZXQgdXAgeW91ciBsb2dvLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBHZW5lcmF0ZSBkZWZhdWx0IGxvZ28gd2l0aCBjaXR5IG5hbWVcbiAgICAgICAgICBhd2FpdCBnZW5lcmF0ZURlZmF1bHRMb2dvKHNpdGVDb25maWcubG9jYXRpb25fbmFtZSwgJ2ltYWdlcycpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBoYW5kbGluZyBsb2dvOicsIGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgLy8gUHJvY2VzcyBIVE1MIGZpbGVzXG4gICAgICBjb25zdCBodG1sRmlsZXMgPSBmcy5yZWFkZGlyU3luYygnLicpLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgoJy5odG1sJykpO1xuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGh0bWxGaWxlcykge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsICd1dGY4Jyk7XG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZENvbnRlbnQgPSBwcm9jZXNzVGVzdGltb25pYWxzKGNvbnRlbnQpO1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIHByb2Nlc3NlZENvbnRlbnQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgdHJhbnNmb3JtKGNvZGUsIGlkKSB7XG4gICAgICBpZiAoaWQuZW5kc1dpdGgoJy5odG1sJykpIHtcbiAgICAgICAgLy8gUHJvY2VzcyB0ZXN0aW1vbmlhbHMgZmlyc3RcbiAgICAgICAgbGV0IHJlc3VsdCA9IHByb2Nlc3NUZXN0aW1vbmlhbHMoY29kZSk7XG4gICAgICAgIFxuICAgICAgICAvLyBQcm9jZXNzIHNjcmlwdCB0YWdzXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC88c2NyaXB0KFtePl0qKT4vZywgKG1hdGNoLCBhdHRycykgPT4ge1xuICAgICAgICAgIC8vIFJlbW92ZSBhbnkgZXhpc3RpbmcgdHlwZSwgYXN5bmMsIG9yIGRlZmVyIGF0dHJpYnV0ZXNcbiAgICAgICAgICBhdHRycyA9IGF0dHJzLnJlcGxhY2UoL1xccysodHlwZXxhc3luY3xkZWZlcik9W1wiJ11bXlwiJ10qW1wiJ10vZywgJycpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgdHlwZXMgb2Ygc2NyaXB0c1xuICAgICAgICAgIGlmIChhdHRycy5pbmNsdWRlcygnYXBwbGljYXRpb24vbGQranNvbicpKSB7XG4gICAgICAgICAgICByZXR1cm4gYDxzY3JpcHQgdHlwZT1cImFwcGxpY2F0aW9uL2xkK2pzb25cIiR7YXR0cnN9PmA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChhdHRycy5pbmNsdWRlcygnc3JjPScpKSB7XG4gICAgICAgICAgICAvLyBFeHRlcm5hbCBzY3JpcHRzIHNob3VsZCBiZSBhc3luY1xuICAgICAgICAgICAgcmV0dXJuIGA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBhc3luYyR7YXR0cnN9PmA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIElubGluZSBzY3JpcHRzIHNob3VsZCBiZSBhc3luY1xuICAgICAgICAgIHJldHVybiBgPHNjcmlwdCB0eXBlPVwibW9kdWxlXCIgYXN5bmMke2F0dHJzfT5gO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIFByb2Nlc3Mgc2VydmljZSBhcmVhc1xuICAgICAgICByZXN1bHQgPSBwcm9jZXNzU2VydmljZUFyZWFzKHJlc3VsdCk7XG4gICAgICAgIFxuICAgICAgICAvLyBQcm9jZXNzIGFsbCByZW1haW5pbmcgcGxhY2Vob2xkZXJzXG4gICAgICAgIHJlc3VsdCA9IHJlcGxhY2VQbGFjZWhvbGRlcnMocmVzdWx0KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29kZTogcmVzdWx0LFxuICAgICAgICAgIG1hcDogbnVsbFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuLy8gSGVscGVyOiBFbnN1cmUgbG9nbyBzZXR1cCBpcyBydW4gaWYgbmVlZGVkXG5mdW5jdGlvbiBlbnN1cmVMb2dvU2V0dXAoKSB7XG4gIGNvbnN0IGNvbmZpZ1BhdGggPSAnc2l0ZS5jb25maWcuanNvbic7XG4gIGxldCBjb25maWc7XG4gIHRyeSB7XG4gICAgY29uZmlnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgJ3V0ZjgnKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCByZWFkIHNpdGUuY29uZmlnLmpzb24nKTtcbiAgfVxuICBpZiAodHlwZW9mIGNvbmZpZy51c2VDaXR5T3ZlcmxheSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zb2xlLmxvZygnXFxuLS0tIExvZ28gc2V0dXAgcmVxdWlyZWQgLS0tJyk7XG4gICAgY29uc3QgcmVzdWx0ID0gc3Bhd25TeW5jKCdub2RlJywgWydzY3JpcHRzL3NldHVwLWxvZ28uanMnXSwgeyBzdGRpbzogJ2luaGVyaXQnIH0pO1xuICAgIGlmIChyZXN1bHQuc3RhdHVzICE9PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xvZ28gc2V0dXAgZmFpbGVkLicpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBSdW4gbG9nbyBzZXR1cCBiZWZvcmUgYW55dGhpbmcgZWxzZVxuZW5zdXJlTG9nb1NldHVwKCk7XG5cbi8vIEV4cG9ydCB0aGUgVml0ZSBjb25maWd1cmF0aW9uXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgaHRtbFBsdWdpbigpLFxuICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogJ2ltYWdlcy8qJyxcbiAgICAgICAgICBkZXN0OiAnaW1hZ2VzJ1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfSlcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDoge1xuICAgICAgICBtYWluOiAnaW5kZXguaHRtbCcsXG4gICAgICAgICdhdXRvLXdyZWNraW5nLWFuZC1mbGF0YmVkLXRvd2luZyc6ICdhdXRvLXdyZWNraW5nLWFuZC1mbGF0YmVkLXRvd2luZy5odG1sJyxcbiAgICAgICAgJ2Nhci10b3dpbmcnOiAnY2FyLXRvd2luZy5odG1sJyxcbiAgICAgICAgJ2VtZXJnZW5jeS10b3dpbmcnOiAnZW1lcmdlbmN5LXRvd2luZy5odG1sJyxcbiAgICAgICAgJ3JvYWRzaWRlLWFzc2lzdGFuY2UnOiAncm9hZHNpZGUtYXNzaXN0YW5jZS5odG1sJyxcbiAgICAgICAgJ3Rvdy10cnVjayc6ICd0b3ctdHJ1Y2suaHRtbCcsXG4gICAgICAgICd0b3ctdHJ1Y2stc2VydmljZSc6ICd0b3ctdHJ1Y2stc2VydmljZS5odG1sJ1xuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHVuZGVmaW5lZCxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdbbmFtZV0uW2V4dF0nLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ1tuYW1lXS5qcycsXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJ1xuICAgICAgfVxuICAgIH0sXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDAsXG4gICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcbiAgICBtaW5pZnk6IGZhbHNlLFxuICAgIHNvdXJjZW1hcDogdHJ1ZVxuICB9XG59KTsgIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FuZG9uanVyb3dza2kvRGVza3RvcC9fU2lsdmVyTGFtcC90b3dpbmctdGVtcGxhdGUtc2l0ZS9zY3JpcHRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2FuZG9uanVyb3dza2kvRGVza3RvcC9fU2lsdmVyTGFtcC90b3dpbmctdGVtcGxhdGUtc2l0ZS9zY3JpcHRzL2dlbmVyYXRlLWxvZ28uanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NhbmRvbmp1cm93c2tpL0Rlc2t0b3AvX1NpbHZlckxhbXAvdG93aW5nLXRlbXBsYXRlLXNpdGUvc2NyaXB0cy9nZW5lcmF0ZS1sb2dvLmpzXCI7aW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVEZWZhdWx0TG9nbyhjaXR5TmFtZSwgb3V0cHV0RGlyKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgd2lkdGggPSA1MTI7XG4gICAgY29uc3QgaGVpZ2h0ID0gNTEyO1xuICAgIFxuICAgIC8vIENyZWF0ZSBhIGNvbXBsZXRlIFNWRyBsb2dvIHdpdGggY2l0eSBuYW1lIG92ZXJsYXlcbiAgICBjb25zdCBzdmdMb2dvID0gYFxuICAgICAgPHN2ZyB3aWR0aD1cIiR7d2lkdGh9XCIgaGVpZ2h0PVwiJHtoZWlnaHR9XCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICAgICAgICA8IS0tIEJhY2tncm91bmQgY2lyY2xlIC0tPlxuICAgICAgICA8Y2lyY2xlIGN4PVwiJHt3aWR0aC8yfVwiIGN5PVwiJHtoZWlnaHQvMn1cIiByPVwiJHt3aWR0aC8yLjJ9XCIgZmlsbD1cIiMxYTQ3ODlcIi8+XG4gICAgICAgIFxuICAgICAgICA8IS0tIFRvdyB0cnVjayBpY29uIC0tPlxuICAgICAgICA8cGF0aCBkPVwiTTM4NCA5NkgyNTZWMTQ0QzI1NiAxNTIuOCAyNDguOCAxNjAgMjQwIDE2MEgyMDhDMTk5LjIgMTYwIDE5MiAxNTIuOCAxOTIgMTQ0Vjk2SDEyOEMxMTkuMiA5NiAxMTIgODguODQgMTEyIDgwVjQ4QzExMiAzOS4xNiAxMTkuMiAzMiAxMjggMzJIMzg0QzM5Mi44IDMyIDQwMCAzOS4xNiA0MDAgNDhWODBDNDAwIDg4Ljg0IDM5Mi44IDk2IDM4NCA5NnpNMzgxLjIgMTYwSDM4NFYyNjRDMzg0IDI3Ny4zIDM3My4zIDI4OCAzNjAgMjg4SDM1MlYzMjBDMzUyIDMzNy43IDMzNy43IDM1MiAzMjAgMzUySDI4OEMyNzAuMyAzNTIgMjU2IDMzNy43IDI1NiAzMjBWMjg4SDIyNEMyMDYuMyAyODggMTkyIDI3My43IDE5MiAyNTZWMjI0QzE5MiAyMDYuMyAyMDYuMyAxOTIgMjI0IDE5MkgyNTZWMTYwSDE5MlYxOTJIMTYwQzE0Mi4zIDE5MiAxMjggMTc3LjcgMTI4IDE2MFYxMjhIOTZDNzguMzMgMTI4IDY0IDExMy43IDY0IDk2VjY0QzY0IDQ2LjMzIDc4LjMzIDMyIDk2IDMySDEyOFY2NEg5NlY5NkgxMjhWMTI4SDE2MFY5NkgxOTJWMTI4SDIyNFY5NkgyNTZWMTI4SDI4OFY5NkgzMjBWMTI4SDM1MlY5NkgzODRWMTI4SDM1MlYxNjBIMzgxLjJ6XCIgZmlsbD1cIndoaXRlXCIgdHJhbnNmb3JtPVwic2NhbGUoMC43KSB0cmFuc2xhdGUoMTUwLCAxNTApXCIvPlxuICAgICAgICBcbiAgICAgICAgPCEtLSBUT1dJTkcgdGV4dCAtLT5cbiAgICAgICAgPHRleHRcbiAgICAgICAgICB4PVwiNTAlXCJcbiAgICAgICAgICB5PVwiNzUlXCJcbiAgICAgICAgICB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiXG4gICAgICAgICAgc3R5bGU9XCJcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnQXJpYWwgQmxhY2snLCBzYW5zLXNlcmlmO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDkwMDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogNDhweDtcbiAgICAgICAgICAgIGZpbGw6IHdoaXRlO1xuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAxcHg7XG4gICAgICAgICAgXCJcbiAgICAgICAgPlRPV0lORzwvdGV4dD5cbiAgICAgIDwvc3ZnPlxuICAgIGA7XG5cbiAgICAvLyBFbnN1cmUgb3V0cHV0IGRpcmVjdG9yeSBleGlzdHNcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMob3V0cHV0RGlyKSkge1xuICAgICAgZnMubWtkaXJTeW5jKG91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCBTVkcgdG8gUE5HXG4gICAgYXdhaXQgc2hhcnAoQnVmZmVyLmZyb20oc3ZnTG9nbykpXG4gICAgICAucmVzaXplKDI1NiwgMjU2KSAgLy8gUmVzaXplIHRvIGEgcmVhc29uYWJsZSBzaXplIGZvciB3ZWIgdXNlXG4gICAgICAudG9GaWxlKHBhdGguam9pbihvdXRwdXREaXIsICdsb2dvLnBuZycpKTtcblxuICAgIC8vIENvbnZlcnQgU1ZHIHRvIFdlYlBcbiAgICBhd2FpdCBzaGFycChCdWZmZXIuZnJvbShzdmdMb2dvKSlcbiAgICAgIC5yZXNpemUoMjU2LCAyNTYpICAvLyBSZXNpemUgdG8gYSByZWFzb25hYmxlIHNpemUgZm9yIHdlYiB1c2VcbiAgICAgIC53ZWJwKClcbiAgICAgIC50b0ZpbGUocGF0aC5qb2luKG91dHB1dERpciwgJ2xvZ28ud2VicCcpKTtcblxuICAgIGNvbnNvbGUubG9nKCdHZW5lcmF0ZWQgZGVmYXVsdCBsb2dvIHdpdGggY2l0eSBuYW1lIG92ZXJsYXknKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIGRlZmF1bHQgbG9nbzonLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUN1c3RvbUxvZ28oY3VzdG9tTG9nb1BhdGgsIG91dHB1dERpcikge1xuICB0cnkge1xuICAgIC8vIEVuc3VyZSBvdXRwdXQgZGlyZWN0b3J5IGV4aXN0c1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXREaXIpKSB7XG4gICAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICAvLyBSZWFkIHRoZSBjdXN0b20gbG9nb1xuICAgIGNvbnN0IGN1c3RvbUxvZ28gPSBhd2FpdCBzaGFycChjdXN0b21Mb2dvUGF0aCk7XG4gICAgXG4gICAgLy8gUmVzaXplIGFuZCBzYXZlIGFzIFBOR1xuICAgIGF3YWl0IGN1c3RvbUxvZ29cbiAgICAgIC5yZXNpemUoMjU2LCAyNTYsIHsgZml0OiAnY29udGFpbicsIGJhY2tncm91bmQ6IHsgcjogMCwgZzogMCwgYjogMCwgYWxwaGE6IDAgfSB9KVxuICAgICAgLnRvRmlsZShwYXRoLmpvaW4ob3V0cHV0RGlyLCAnbG9nby1jdXN0b20ucG5nJykpO1xuXG4gICAgLy8gUmVzaXplIGFuZCBzYXZlIGFzIFdlYlBcbiAgICBhd2FpdCBjdXN0b21Mb2dvXG4gICAgICAucmVzaXplKDI1NiwgMjU2LCB7IGZpdDogJ2NvbnRhaW4nLCBiYWNrZ3JvdW5kOiB7IHI6IDAsIGc6IDAsIGI6IDAsIGFscGhhOiAwIH0gfSlcbiAgICAgIC53ZWJwKClcbiAgICAgIC50b0ZpbGUocGF0aC5qb2luKG91dHB1dERpciwgJ2xvZ28tY3VzdG9tLndlYnAnKSk7XG5cbiAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2VkIGN1c3RvbSBsb2dvJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyBjdXN0b20gbG9nbzonLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuZXhwb3J0IHsgZ2VuZXJhdGVEZWZhdWx0TG9nbywgY29weUN1c3RvbUxvZ28gfTsgIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0VyxTQUFTLG9CQUFvQjtBQUN6WSxTQUFTLHNCQUFzQjtBQUMvQixPQUFPQSxTQUFROzs7QUNGeVgsT0FBTyxXQUFXO0FBQzFaLE9BQU8sUUFBUTtBQUNmLE9BQU8sVUFBVTtBQUVqQixlQUFlLG9CQUFvQixVQUFVLFdBQVc7QUFDdEQsTUFBSTtBQUNGLFVBQU0sUUFBUTtBQUNkLFVBQU0sU0FBUztBQUdmLFVBQU0sVUFBVTtBQUFBLG9CQUNBLEtBQUssYUFBYSxNQUFNO0FBQUE7QUFBQSxzQkFFdEIsUUFBTSxDQUFDLFNBQVMsU0FBTyxDQUFDLFFBQVEsUUFBTSxHQUFHO0FBQUE7QUFBQTtBQUFBO0FBQUE7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
