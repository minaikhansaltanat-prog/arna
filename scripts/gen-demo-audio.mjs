// Pre-recorded voice for the scripted demo (replaces the browser's speechSynthesis).
// Turns every demo line of content/demo-script.json into an MP3 with the ElevenLabs API:
//   apps/web/public/audio/demo/<lang>/<n>.mp3   (n = 1..5)  and  apps/web/src/lib/demo-audio.json (size and length of each file)
//
//   node scripts/gen-demo-audio.mjs models                         which models speak all ten site languages
//   node scripts/gen-demo-audio.mjs voices [--male]                voices of the account (id, name, labels)
//   node scripts/gen-demo-audio.mjs sample --model <id> --voices <id,id,id> [--lang kk] [--line 1]
//                                                                  one sentence in several voices, to listen and choose
//   node scripts/gen-demo-audio.mjs all --model <id> --voice <id> [--bitrate 96] [--langs kk,ru] [--force] [--dry-run]
//                                                                  (--dry-run only prints the characters / credits and size)
//   node scripts/gen-demo-audio.mjs import [--from content/audio-source] [--bitrate 96]
//                                                                  files made elsewhere (<lang>-<n>.mp3): re-encoded to mono, tags dropped, manifest written (no API key needed)
//
// The key comes from ELEVENLABS_API_KEY in .env.local (repo root or apps/web), which is git-ignored.
// The key is never printed, logged or written anywhere: only model ids, voice ids and file names are.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.elevenlabs.io";
const SITE_LANGS = ["ru", "kk", "en", "zh", "uz", "ky", "ko", "ja", "hi", "ar"];

// ---------------------------------------------------------------- key (from .env.local, never echoed)
function readKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  for (const f of [join(root, ".env.local"), join(root, "apps", "web", ".env.local")]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = /^\s*ELEVENLABS_API_KEY\s*=\s*(.*?)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  return "";
}
const KEY = readKey(); // only the commands that call the API need it (checked in api())

// ---------------------------------------------------------------- helpers
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
};

async function api(path, init = {}) {
  if (!KEY) {
    console.error("ELEVENLABS_API_KEY is not set. Put it in .env.local (git-ignored): ELEVENLABS_API_KEY=...");
    process.exit(1);
  }
  const res = await fetch(`${API}${path}`, { ...init, headers: { "xi-api-key": KEY, ...(init.headers ?? {}) } });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = typeof j.detail === "string" ? j.detail : (j.detail?.message ?? j.detail?.status ?? JSON.stringify(j.detail ?? j));
    } catch {}
    throw new Error(`ElevenLabs ${res.status} on ${path.split("?")[0]}: ${String(detail).slice(0, 300)}`);
  }
  return res;
}
const getJson = async (path) => (await api(path)).json();

const demo = JSON.parse(readFileSync(join(root, "content", "demo-script.json"), "utf8"));
const lineText = (lang, i) => demo.scripts[lang].lines[i];

const manifestPath = join(root, "apps", "web", "src", "lib", "demo-audio.json");
const audioDir = (lang) => join(root, "apps", "web", "public", "audio", "demo", lang);

/** Length of an MP3 in seconds, from its frame headers (an ID3v2 tag and the Xing/Info header frame are skipped). */
function mp3Seconds(buf) {
  const KBPS = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
  const HZ = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  let p = 0;
  let samples = 0;
  let rate = 0;
  if (buf.toString("latin1", 0, 3) === "ID3") p = 10 + (((buf[6] & 127) << 21) | ((buf[7] & 127) << 14) | ((buf[8] & 127) << 7) | (buf[9] & 127));
  while (p + 4 <= buf.length) {
    const ver = (buf[p + 1] >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    const layer3 = ((buf[p + 1] >> 1) & 3) === 1;
    const bi = buf[p + 2] >> 4;
    const si = (buf[p + 2] >> 2) & 3;
    if (buf[p] === 0xff && (buf[p + 1] & 0xe0) === 0xe0 && ver !== 1 && layer3 && bi && bi !== 15 && si !== 3) {
      const mpeg1 = ver === 3;
      rate = HZ[ver][si];
      const size = Math.floor(((mpeg1 ? 144 : 72) * KBPS[mpeg1 ? 1 : 2][bi] * 1000) / rate) + ((buf[p + 2] >> 1) & 1);
      if (!/Xing|Info/.test(buf.toString("latin1", p, p + 40))) samples += mpeg1 ? 1152 : 576;
      p += size;
    } else p++;
  }
  if (!rate) throw new Error("not an MP3 file");
  return Number((samples / rate).toFixed(2));
}

function saveManifest(manifest, bitrate) {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const all = Object.entries(manifest).filter(([k]) => k !== "_meta").flatMap(([, v]) => v);
  const sum = all.reduce((a, f) => a + f.bytes, 0);
  console.log(`total ${(sum / 1048576).toFixed(2)} MB in ${all.length} files at ${bitrate} kbit/s mono`);
  if (sum > 3 * 1048576) console.log("WARNING: above 3 MB. Run again with a lower --bitrate and --force.");
}

// MP3 output formats of the API and their bitrate (kbit/s). All are constant bitrate, so size gives the length.
const BITRATE = { 32: "mp3_44100_32", 64: "mp3_44100_64", 96: "mp3_44100_96", 128: "mp3_44100_128", 192: "mp3_44100_192" };

// Voice settings differ per model: v3 only has three stability steps, v4 adds similarity, the older ones also style.
function voiceSettings(model) {
  if (model === "eleven_v3") return { stability: 0.5 };
  if (model === "eleven_v4") return { stability: 0.5, similarity_boost: 0.85 };
  return { stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true };
}

async function tts({ voice, model, text, lang, bitrate }) {
  const send = async (withLang) => {
    const body = { text, model_id: model, voice_settings: voiceSettings(model) };
    if (withLang) body.language_code = lang; // keeps Kyrgyz / Kazakh / Uzbek from being read as a neighbouring language
    const res = await api(`/v1/text-to-speech/${voice}?output_format=${BITRATE[bitrate]}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    return Buffer.from(await res.arrayBuffer());
  };
  try {
    return await send(true);
  } catch (e) {
    // a model that does not take language_code: retry once without it
    if (/language/i.test(String(e.message)) && /(400|422)/.test(String(e.message))) return send(false);
    throw e;
  }
}

// ---------------------------------------------------------------- commands
if (cmd === "models") {
  const models = (await getJson("/v1/models")).filter((m) => m.can_do_text_to_speech);
  const rows = models.map((m) => {
    const ids = new Set((m.languages ?? []).map((l) => l.language_id));
    const missing = SITE_LANGS.filter((c) => !ids.has(c));
    return { id: m.model_id, name: m.name, covers: SITE_LANGS.length - missing.length, missing, langs: ids.size, chars: m.maximum_text_length_per_request };
  });
  rows.sort((a, b) => b.covers - a.covers || b.langs - a.langs);
  for (const r of rows) {
    console.log(`${r.id.padEnd(28)} ${String(r.name).padEnd(24)} site languages ${r.covers}/10${r.missing.length ? " (missing: " + r.missing.join(", ") + ")" : ""}  total languages ${r.langs}`);
  }
} else if (cmd === "voices") {
  const out = [];
  let token = "";
  do {
    const j = await getJson(`/v2/voices?page_size=100${token ? `&next_page_token=${token}` : ""}`);
    out.push(...j.voices);
    token = j.has_more ? j.next_page_token : "";
  } while (token);
  const male = opt("male", false);
  for (const v of out) {
    const l = v.labels ?? {};
    if (male && (l.gender ?? "").toLowerCase() !== "male") continue;
    console.log(`${v.voice_id}  ${String(v.name).padEnd(22)} ${String(v.category).padEnd(13)} ${[l.gender, l.age, l.accent, l.descriptive, l.use_case].filter(Boolean).join(", ")}`);
  }
  console.log(`${out.length} voices`);
} else if (cmd === "sample") {
  const model = opt("model");
  const voices = String(opt("voices", "")).split(",").filter(Boolean);
  const lang = opt("lang", "kk");
  const line = Number(opt("line", 1)) - 1;
  if (!model || !voices.length) throw new Error("usage: sample --model <id> --voices <id,id,id> [--lang kk] [--line 1]");
  const dir = join(root, "content", "audio-samples");
  mkdirSync(dir, { recursive: true });
  const text = lineText(lang, line);
  console.log(`sample text (${lang}, line ${line + 1}): ${text}`);
  for (const [i, voice] of voices.entries()) {
    const info = await getJson(`/v1/voices/${voice}`);
    const name = String(info.name).replace(/[^\w-]+/g, "_");
    const buf = await tts({ voice, model, text, lang, bitrate: 128 });
    const file = join(dir, `${lang}-${i + 1}-${name}.mp3`);
    writeFileSync(file, buf);
    console.log(`wrote content/audio-samples/${lang}-${i + 1}-${name}.mp3  (${(buf.length / 1024).toFixed(0)} KB, voice ${voice})`);
  }
} else if (cmd === "all") {
  const model = opt("model");
  const voice = opt("voice");
  const bitrate = Number(opt("bitrate", 96));
  const langs = String(opt("langs", SITE_LANGS.join(","))).split(",");
  const force = Boolean(opt("force", false));
  if (!model || !voice || !BITRATE[bitrate]) throw new Error("usage: all --model <id> --voice <id> [--bitrate 32|64|96|128|192] [--langs kk,ru] [--force]");

  // pre-flight: ElevenLabs bills one credit per character; speech runs at roughly 13 characters a second
  const chars = langs.reduce((a, l) => a + demo.scripts[l].lines.reduce((b, t) => b + [...t].length, 0), 0);
  console.log(`to synthesize: ${chars} characters (about ${chars} credits), about ${((chars / 13) * bitrate * 125 / 1048576).toFixed(1)} MB at ${bitrate} kbit/s`);
  if (opt("dry-run", false)) process.exit(0);

  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
  manifest._meta = { model, voice, bitrate, format: BITRATE[bitrate], mono: true };
  for (const lang of langs) {
    const dir = audioDir(lang);
    mkdirSync(dir, { recursive: true });
    manifest[lang] = [];
    for (const [i, text] of demo.scripts[lang].lines.entries()) {
      const file = join(dir, `${i + 1}.mp3`);
      let buf;
      if (existsSync(file) && !force) buf = readFileSync(file);
      else {
        buf = await tts({ voice, model, text, lang, bitrate });
        writeFileSync(file, buf);
      }
      manifest[lang].push({ n: i + 1, bytes: buf.length, seconds: mp3Seconds(buf) });
      console.log(`${lang}/${i + 1}.mp3  ${(buf.length / 1024).toFixed(0)} KB  ~${manifest[lang][i].seconds}s`);
    }
  }
  saveManifest(manifest, bitrate);
} else if (cmd === "import") {
  // Voice files made elsewhere (the ElevenLabs site, a studio) as <from>/<lang>-<n>.mp3: re-encoded to mono, tags dropped, 1 dB of headroom
  const from = join(root, String(opt("from", "content/audio-source")));
  const bitrate = Number(opt("bitrate", 96));
  if (!BITRATE[bitrate]) throw new Error("usage: import [--from content/audio-source] [--bitrate 32|64|96|128|192]");
  const manifest = { _meta: { source: "import", bitrate, format: BITRATE[bitrate], mono: true } };
  for (const lang of SITE_LANGS) {
    mkdirSync(audioDir(lang), { recursive: true });
    manifest[lang] = [];
    for (let n = 1; n <= demo.scripts[lang].lines.length; n++) {
      const src = join(from, `${lang}-${n}.mp3`);
      if (!existsSync(src)) throw new Error(`missing ${lang}-${n}.mp3 in ${from}`);
      const out = join(audioDir(lang), `${n}.mp3`);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-id3v2_version", "0", "-af", "volume=-1dB", "-ac", "1", "-c:a", "libmp3lame", "-b:a", `${bitrate}k`, out]);
      const buf = readFileSync(out);
      manifest[lang].push({ n, bytes: buf.length, seconds: mp3Seconds(buf) });
      console.log(`${lang}/${n}.mp3  ${(buf.length / 1024).toFixed(0)} KB  ${manifest[lang][n - 1].seconds}s`);
    }
  }
  saveManifest(manifest, bitrate);
} else {
  console.log("commands: models | voices [--male] | sample --model --voices | all --model --voice [--bitrate] [--langs] [--force] | import [--from] [--bitrate]");
}
