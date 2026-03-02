import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  autoIcons: {
    baseIconPath: "public/icon/128.svg",
    sizes: [16, 32, 48, 128],
  },
  manifest: {
    name: "Spacer — Spacing & Contrast Inspector",
    description:
      "Inspect spacing between elements and check color contrast accessibility on any page.",
    permissions: ["activeTab"],
  },
});
