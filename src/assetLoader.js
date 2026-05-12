const IMAGE_SPECS = {
  atomD: './assets/atom_d.png',
  atomT: './assets/atom_t.png',
  atomLi6: './assets/atom_li6.png',
  hazardTungsten: './assets/hazard_tungsten.png',
  boostNbi: './assets/boost_nbi.png',
  hudHe4: './assets/hud_he4.png',
  backgroundTokamak: './assets/background_tokamak.png',
};

const assetLoaders = import.meta.glob([
  './assets/atom_d.png',
  './assets/atom_t.png',
  './assets/atom_li6.png',
  './assets/hazard_tungsten.png',
  './assets/boost_nbi.png',
  './assets/hud_he4.png',
  './assets/background_tokamak.png',
], {
  query: '?url',
  import: 'default',
});

const images = new Map();

export async function preloadAssets() {
  await Promise.all(Object.entries(IMAGE_SPECS).map(async ([key, path]) => {
    const loadUrl = assetLoaders[path];
    if (!loadUrl) {
      images.set(key, null);
      return;
    }

    const url = await loadUrl();
    const img = new Image();
    const loaded = await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });

    images.set(key, loaded ? img : null);
  }));
}

export function getImage(key) {
  return images.get(key) || null;
}

export function hasImage(key) {
  return Boolean(getImage(key));
}
