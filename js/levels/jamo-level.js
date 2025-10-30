/* Unicode Hangul composition — full modern combos supported */
const CHOSEONG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const JUNGSEONG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];
const JONGSEONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const S_BASE = 0xac00,
  L_COUNT = 19,
  V_COUNT = 21,
  T_COUNT = 28,
  N_COUNT = V_COUNT * T_COUNT;

function compose(cho, jung, jong = "") {
  const L = CHOSEONG.indexOf(cho);
  const V = JUNGSEONG.indexOf(jung);
  const T = JONGSEONG.indexOf(jong);
  if (L < 0 || V < 0 || T < 0) throw new Error("Invalid jamo");
  return String.fromCharCode(S_BASE + L * N_COUNT + V * T_COUNT + T);
}

const selCho = document.getElementById("selCho");
const selJung = document.getElementById("selJung");
const selJong = document.getElementById("selJong");
const btn = document.getElementById("btnCompose");
const out = document.getElementById("syllableOut");
const meta = document.getElementById("syllableMeta");

CHOSEONG.forEach((c) => selCho.append(new Option(c, c)));
JUNGSEONG.forEach((c) => selJung.append(new Option(c, c)));
JONGSEONG.forEach((c) => selJong.append(new Option(c, c)));

btn.addEventListener("click", () => {
  try {
    const ch = compose(selCho.value, selJung.value, selJong.value);
    out.textContent = ch;
    meta.textContent = `U+${ch.codePointAt(0).toString(16).toUpperCase()} • ${
      selCho.value
    }+${selJung.value}${selJong.value ? "+" + selJong.value : ""}`;
  } catch (e) {
    out.textContent = "⚠️";
    meta.textContent = e.message;
  }
});
