const IMAGE_SPECS = {
  atomD: './assets/2x/atom_d.png',
  atomT: './assets/2x/atom_t.png',
  atomLi6: './assets/2x/atom_li6.png',
  hazardTungsten: './assets/2x/hazard_tungsten.png',
  boostNbi: './assets/2x/boost_nbi.png',
  hudHe4: './assets/2x/hud_he4.png',
  backgroundTokamak: './assets/2x/background_tokamak.png',
};

const assetLoaders = import.meta.glob('./assets/2x/*.png', {
  query: '?url',
  import: 'default',
});

const images = new Map();
const assetUrls = new Map();

export async function preloadAssets() {
  await Promise.all(Object.entries(IMAGE_SPECS).map(async ([key, path]) => {
    const url = await getAssetUrl(path);
    if (!url) {
      images.set(key, null);
      return;
    }
    const img = new Image();
    const loaded = await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });

    images.set(key, loaded ? img : null);
  }));
}

export async function getAssetUrl(path) {
  const loadUrl = assetLoaders[path];
  if (!loadUrl) return null;
  if (!assetUrls.has(path)) {
    assetUrls.set(path, loadUrl().catch(() => null));
  }
  return assetUrls.get(path);
}

export function getImage(key) {
  return images.get(key) || null;
}

export function hasImage(key) {
  return Boolean(getImage(key));
}
