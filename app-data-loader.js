// app-data-loader.js
// Loads all JSON and normalises categories while keeping your old gameData shape available.

(function () {
  const slugify = (s) =>
    (s || "").toString().toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  async function fetchJSON(path, fallback) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`${path} ${res.status}`);
      return await res.json();
    } catch {
      return fallback;
    }
  }

  async function loadGameDataFromJson() {
    const [config, story, clues, cats, characters, awards] = await Promise.all([
      fetchJSON("data/config.json", {}),
      fetchJSON("data/story.json", {}),
      fetchJSON("data/clues.json", { clues: [] }),
      fetchJSON("data/categories.json", { categories: [] }),
      fetchJSON("data/characters.json", { characters: [] }),
      fetchJSON("data/awards.json", { awardTiers: [] })
    ]);

    const categories = Array.isArray(cats.categories) ? cats.categories : [];
    categories.forEach((c, i) => {
      c.id = c.id || slugify(c.label || `category-${i+1}`);
      (c.items || []).forEach((it, j) => {
        it.id = it.id || slugify(it.name || `item-${j+1}`);
      });
    });

    // Maintain backward compatibility with your old code:
    const suspectsFallback = categories.find(c => c.label === 'Suspects')?.items || [];
    const objectsFallback  = categories.find(c => c.label === 'Locations')?.items || [];

    // Assemble the final gameData object
    return {
      config,
      storyScreens: story,
      clues: clues.clues,
      characters: characters.characters,
      awardTiers: awards.awardTiers,
      // keep legacy keys so existing renderers still work without UI changes
      suspects: suspectsFallback,
      objects: objectsFallback,
      // expose labels so headings can change dynamically
      labels: {
        primaryList: categories[0]?.label || "List A",
        secondaryList: categories[1]?.label || "List B"
      }
    };
  }

  // expose a loader used by index.html
  window.__loadGameData = loadGameDataFromJson;
})();