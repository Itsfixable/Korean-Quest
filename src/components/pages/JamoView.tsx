"use client";

import { useState } from "react";
import "@/styles/pages/jamo.css";

const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];
const JONGSEONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const S_BASE = 0xac00;
const V_COUNT = 21;
const T_COUNT = 28;
const N_COUNT = V_COUNT * T_COUNT;

function compose(cho: string, jung: string, jong = "") {
  const L = CHOSEONG.indexOf(cho);
  const V = JUNGSEONG.indexOf(jung);
  const T = JONGSEONG.indexOf(jong);
  if (L < 0 || V < 0 || T < 0) throw new Error("Invalid jamo");
  return String.fromCharCode(S_BASE + L * N_COUNT + V * T_COUNT + T);
}

export default function JamoView() {
  const [selCho, setSelCho] = useState(CHOSEONG[0]);
  const [selJung, setSelJung] = useState(JUNGSEONG[0]);
  const [selJong, setSelJong] = useState(JONGSEONG[0]);
  const [output, setOutput] = useState("—");
  const [meta, setMeta] = useState("");

  const handleCompose = () => {
    try {
      const ch = compose(selCho, selJung, selJong);
      setOutput(ch);
      setMeta(
        `U+${ch.codePointAt(0)?.toString(16).toUpperCase()} • ${selCho}+${selJung}${selJong ? `+${selJong}` : ""}`,
      );
    } catch (e) {
      setOutput("⚠️");
      setMeta(e instanceof Error ? e.message : "Invalid jamo");
    }
  };

  return (
    <section className="card jamo-builder">
      <h1>Build a Syllable</h1>
      <p className="muted">Pick 초성/중성/종성 to form a valid Hangul block.</p>

      <div className="jamo-row">
        <label>
          초성
          <select id="selCho" value={selCho} onChange={(e) => setSelCho(e.target.value)}>
            {CHOSEONG.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          중성
          <select id="selJung" value={selJung} onChange={(e) => setSelJung(e.target.value)}>
            {JUNGSEONG.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          종성
          <select id="selJong" value={selJong} onChange={(e) => setSelJong(e.target.value)}>
            {JONGSEONG.map((c) => (
              <option key={c || "empty"} value={c}>
                {c || "(none)"}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" id="btnCompose" type="button" onClick={handleCompose}>
          Compose
        </button>
      </div>

      <div className="jamo-output" id="syllableOut" aria-live="polite">
        {output}
      </div>
      <p className="muted" id="syllableMeta">
        {meta}
      </p>
    </section>
  );
}
