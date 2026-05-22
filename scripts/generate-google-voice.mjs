import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.GOOGLE_TTS_API_KEY;

const audioConfig = {
  audioEncoding: 'MP3',
  speakingRate: Number(process.env.GOOGLE_TTS_RATE || 1.04),
  pitch: Number(process.env.GOOGLE_TTS_PITCH || 0),
};

const LOCALES = {
  ja: {
    languageCode: 'ja-JP',
    voices: [
      process.env.GOOGLE_TTS_VOICE_JA,
      process.env.GOOGLE_TTS_VOICE,
      'ja-JP-Chirp3-HD-Achernar',
      'ja-JP-Chirp3-HD-Aoede',
      'ja-JP-Wavenet-B',
    ].filter(Boolean),
    cues: [
      ['iter', 'ITERの設計値を超えました。'],
      ['ignition', '点火フェーズに入りました。'],
      ['combo3', 'コンボ継続中です。'],
      ['combo5', '高出力コンボです。'],
      ['self-sustain', '自己点火燃焼、成功です。'],
    ],
  },
};

if (!apiKey) {
  throw new Error('GOOGLE_TTS_API_KEY is required. Example: $env:GOOGLE_TTS_API_KEY="..." ; npm run generate:voice');
}

const requestedLocales = getRequestedLocales();

for (const locale of requestedLocales) {
  const spec = LOCALES[locale];
  const outDir = resolve(__dirname, `../src/assets/audio/voice/${locale}`);
  await mkdir(outDir, { recursive: true });

  for (const [id, text] of spec.cues) {
    const { audioContent, voiceName } = await synthesizeWithFallback(spec, text, id);
    const file = resolve(outDir, `${id}.mp3`);
    await writeFile(file, Buffer.from(audioContent, 'base64'));
    console.log(`wrote ${file} (${voiceName})`);
  }
}

function getRequestedLocales() {
  const localeArg = process.argv.find((arg) => arg.startsWith('--locale='));
  if (!localeArg) return ['ja'];

  const locale = localeArg.split('=')[1];
  if (!LOCALES[locale]) {
    throw new Error(`Unsupported locale "${locale}". Expected one of: ${Object.keys(LOCALES).join(', ')}`);
  }
  return [locale];
}

async function synthesizeWithFallback(spec, text, id) {
  const errors = [];
  for (const voiceName of spec.voices) {
    try {
      const audioContent = await synthesize({
        text,
        languageCode: spec.languageCode,
        voiceName,
      });
      return { audioContent, voiceName };
    } catch (error) {
      errors.push(`${voiceName}: ${error.message}`);
    }
  }

  throw new Error(`Google TTS failed for ${id} (${spec.languageCode}):\n${errors.map((e) => `- ${e}`).join('\n')}`);
}

async function synthesize({ text, languageCode, voiceName }) {
  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${body}`);
  }

  const json = await response.json();
  if (!json.audioContent) throw new Error('no audioContent');
  return json.audioContent;
}
