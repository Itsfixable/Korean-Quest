"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/adventure.css";
import "@/styles/pages/adventure-enhancements.css";

const STORE_KEY = "kq_node_adv_progress_v1";
const TREASURE_KEY = "kq_adventure_treasure_claimed_v1";
const BOSS_LEVELS = new Set([4, 8, 12]);

const HANGUL = [
  { char: "ㄱ", roman: "g/k" },
  { char: "ㄴ", roman: "n" },
  { char: "ㄷ", roman: "d/t" },
  { char: "ㅁ", roman: "m" },
  { char: "ㅂ", roman: "b/p" },
  { char: "ㅅ", roman: "s" },
  { char: "ㅏ", roman: "a" },
  { char: "ㅓ", roman: "eo" },
  { char: "ㅗ", roman: "o" },
  { char: "ㅣ", roman: "i" },
] as const;

const VOCAB = [
  { ko: "학교", en: "school" },
  { ko: "선생님", en: "teacher" },
  { ko: "학생", en: "student" },
  { ko: "책", en: "book" },
  { ko: "물", en: "water" },
  { ko: "사과", en: "apple" },
  { ko: "친구", en: "friend" },
  { ko: "집", en: "house" },
  { ko: "버스", en: "bus" },
  { ko: "공원", en: "park" },
  { ko: "도서관", en: "library" },
  { ko: "병원", en: "hospital" },
  { ko: "밥", en: "meal" },
  { ko: "커피", en: "coffee" },
  { ko: "오늘", en: "today" },
  { ko: "내일", en: "tomorrow" },
] as const;

const ENEMIES = [
  { name: "Slime", sprite: "🟢" },
  { name: "Mushling", sprite: "🍄" },
  { name: "Imp", sprite: "😈" },
  { name: "Kappa", sprite: "🐢" },
  { name: "Bat", sprite: "🦇" },
  { name: "Goblin", sprite: "👹" },
  { name: "Wisp", sprite: "✨" },
  { name: "Wolf", sprite: "🐺" },
  { name: "Drake", sprite: "🐉" },
  { name: "Sentinel", sprite: "🛡️" },
  { name: "Oni", sprite: "👺" },
  { name: "Tiger Spirit", sprite: "🐯" },
] as const;

const WORLDS = [
  { id: 1, title: "Hangul Hills", levels: [1, 2, 3, 4] },
  { id: 2, title: "Food Forest", levels: [5, 6, 7, 8] },
  { id: 3, title: "Greeting Kingdom", levels: [9, 10, 11, 12] },
] as const;

const TREASURE_REWARDS: Record<number, { coins: number; xp: number }> = {
  1: { coins: 500, xp: 80 },
  2: { coins: 750, xp: 120 },
  3: { coins: 1000, xp: 160 },
};

const TREASURE_LAYOUTS: Record<number, { x: number; y: number }[]> = {
  1: [
    { x: 55, y: 31 },
    { x: 38, y: 48 },
    { x: 63, y: 61 },
    { x: 42, y: 78 },
  ],
  2: [
    { x: 38, y: 31 },
    { x: 66, y: 45 },
    { x: 46, y: 63 },
    { x: 39, y: 79 },
  ],
  3: [
    { x: 62, y: 31 },
    { x: 40, y: 47 },
    { x: 67, y: 59 },
    { x: 43, y: 75 },
  ],
};

const TREASURE_PATHS: Record<number, string> = {
  1: "M55 31 C44 32 39 37 43 42 C48 48 31 48 38 54 C45 60 62 52 63 61 C64 68 48 67 47 72 C46 76 43 76 42 78",
  2: "M38 31 C48 34 58 34 66 45 C73 55 52 53 48 59 C43 66 32 67 39 74 C45 80 39 78 39 79",
  3: "M62 31 C54 38 43 37 40 47 C37 57 65 49 67 59 C70 70 49 65 45 70 C41 74 43 75 43 75",
};

const MAP_DECORATIONS: Record<number, { src: string; x: number; y: number; size: number; delay: string }[]> = {
  1: [
    { src: "/favicon/adventure/tree1.png", x: 28, y: 26, size: 42, delay: "0s" },
    { src: "/favicon/adventure/skull1.png", x: 33, y: 36, size: 46, delay: ".4s" },
    { src: "/favicon/adventure/rock1.png", x: 67, y: 43, size: 34, delay: ".8s" },
    { src: "/favicon/adventure/tree2.png", x: 27, y: 63, size: 48, delay: "1.1s" },
    { src: "/favicon/adventure/wood1.png", x: 32, y: 84, size: 58, delay: ".6s" },
    { src: "/favicon/adventure/stone1.png", x: 70, y: 72, size: 34, delay: "1.4s" },
  ],
  2: [
    { src: "/favicon/adventure/tree1.png", x: 30, y: 28, size: 44, delay: ".2s" },
    { src: "/favicon/adventure/rock1.png", x: 68, y: 34, size: 36, delay: ".9s" },
    { src: "/favicon/adventure/skull2.png", x: 30, y: 68, size: 44, delay: ".5s" },
    { src: "/favicon/adventure/tree2.png", x: 70, y: 70, size: 50, delay: "1.2s" },
    { src: "/favicon/adventure/wood1.png", x: 36, y: 84, size: 56, delay: ".7s" },
  ],
  3: [
    { src: "/favicon/adventure/skull1.png", x: 30, y: 30, size: 48, delay: ".1s" },
    { src: "/favicon/adventure/tree1.png", x: 70, y: 34, size: 48, delay: ".5s" },
    { src: "/favicon/adventure/rock1.png", x: 38, y: 57, size: 34, delay: ".9s" },
    { src: "/favicon/adventure/skull2.png", x: 72, y: 70, size: 44, delay: "1.2s" },
    { src: "/favicon/adventure/tree2.png", x: 32, y: 82, size: 52, delay: ".4s" },
  ],
};

type Topic = "hangul" | "vocab" | "mixed";
type Difficulty = "easy" | "normal" | "hard";

type ProgressState = {
  unlocked: number;
  cleared: Record<number, boolean>;
};

type Question = {
  title: string;
  prompt: string;
  answer: string;
  choices: string[];
};

type BattleState = {
  level: number;
  boss: boolean;
  enemy: { name: string; sprite: string };
  enemyHPMax: number;
  enemyHP: number;
  playerHPMax: number;
  playerHP: number;
  topic: Topic;
  difficulty: Difficulty;
  streak: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function shuffle<T>(items: readonly T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomFrom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWorldForLevel(level: number) {
  if (level <= 4) return 1;
  if (level <= 8) return 2;
  return 3;
}

function loadProgress(): ProgressState {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return {
      unlocked: Math.max(1, Number(data?.unlocked) || 1),
      cleared: data?.cleared && typeof data.cleared === "object" ? data.cleared : {},
    };
  } catch {
    return { unlocked: 1, cleared: {} };
  }
}

function loadTreasureClaims(): Record<number, boolean> {
  try {
    return JSON.parse(localStorage.getItem(TREASURE_KEY) || "{}");
  } catch {
    return {};
  }
}

function difficultyDurations(level: Difficulty) {
  if (level === "hard") return 2600;
  if (level === "normal") return 3800;
  return 5200;
}

function dmgFor(level: Difficulty) {
  if (level === "hard") return 7;
  if (level === "normal") return 6;
  return 5;
}

function enemyDmgFor(level: Difficulty) {
  if (level === "hard") return 6;
  if (level === "normal") return 5;
  return 4;
}

function makeHangulQuestion(): Question {
  const promptType = Math.random() < 0.5 ? "sound" : "symbol";
  const picked = randomFrom(HANGUL);
  if (promptType === "sound") {
    const distractors = shuffle(HANGUL.filter((item) => item.roman !== picked.roman))
      .slice(0, 3)
      .map((item) => item.roman);
    return {
      title: "Hangul Sound Match",
      prompt: `What sound matches ${picked.char}?`,
      answer: picked.roman,
      choices: shuffle([picked.roman, ...distractors]),
    };
  }
  const distractors = shuffle(HANGUL.filter((item) => item.char !== picked.char))
    .slice(0, 3)
    .map((item) => item.char);
  return {
    title: "Hangul Symbol Match",
    prompt: `Which letter matches “${picked.roman}”?`,
    answer: picked.char,
    choices: shuffle([picked.char, ...distractors]),
  };
}

function makeVocabQuestion(): Question {
  const promptType = Math.random() < 0.5 ? "koToEn" : "enToKo";
  const picked = randomFrom(VOCAB);
  if (promptType === "koToEn") {
    const distractors = shuffle(VOCAB.filter((item) => item.en !== picked.en))
      .slice(0, 3)
      .map((item) => item.en);
    return {
      title: "Vocabulary Match",
      prompt: `What does “${picked.ko}” mean?`,
      answer: picked.en,
      choices: shuffle([picked.en, ...distractors]),
    };
  }
  const distractors = shuffle(VOCAB.filter((item) => item.ko !== picked.ko))
    .slice(0, 3)
    .map((item) => item.ko);
  return {
    title: "Vocabulary Match",
    prompt: `Which Korean word means “${picked.en}”?`,
    answer: picked.ko,
    choices: shuffle([picked.ko, ...distractors]),
  };
}

function makeQuestion(topic: Topic): Question {
  if (topic === "hangul") return makeHangulQuestion();
  if (topic === "vocab") return makeVocabQuestion();
  return Math.random() < 0.5 ? makeHangulQuestion() : makeVocabQuestion();
}

export default function AdventureView() {
  const addXP = useGameStore((s) => s.addXP);
  const addCoins = useGameStore((s) => s.addCoins);
  const markBattleWin = useGameStore((s) => s.markBattleWin);
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ unlocked: 1, cleared: {} });
  const [treasureClaims, setTreasureClaims] = useState<Record<number, boolean>>({});
  const [activeWorldId, setActiveWorldId] = useState(1);
  const [topic, setTopic] = useState<Topic>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState("");
  const [turnHint, setTurnHint] = useState("Answer to attack!");
  const [speedPercent, setSpeedPercent] = useState(100);
  const [lockedChoices, setLockedChoices] = useState(false);
  const [choiceClass, setChoiceClass] = useState<Record<string, "correct" | "wrong" | undefined>>({});
  const [toast, setToast] = useState("");

  const speedFrameRef = useRef<number | null>(null);
  const answerTimeoutRef = useRef<number | null>(null);
  const battleRef = useRef<BattleState | null>(null);
  const questionRef = useRef<Question | null>(null);

  useEffect(() => {
    setHydrated(true);
    const loadedProgress = loadProgress();
    setProgress(loadedProgress);
    setTreasureClaims(loadTreasureClaims());
    setActiveWorldId(getWorldForLevel(loadedProgress.unlocked));
  }, []);

  useEffect(() => {
    battleRef.current = battle;
  }, [battle]);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(TREASURE_KEY, JSON.stringify(treasureClaims));
  }, [hydrated, treasureClaims]);

  useEffect(
    () => () => {
      if (speedFrameRef.current) cancelAnimationFrame(speedFrameRef.current);
      if (answerTimeoutRef.current) window.clearTimeout(answerTimeoutRef.current);
    },
    [],
  );

  const isWorldComplete = (worldId: number) => {
    const world = WORLDS.find((w) => w.id === worldId);
    if (!world) return false;
    return world.levels.every((level) => progress.cleared[level]);
  };

  const isWorldUnlocked = (worldId: number) => {
    if (worldId === 1) return true;
    if (worldId === 2) return isWorldComplete(1);
    return isWorldComplete(2);
  };

  const activeWorld = useMemo(() => {
    const selected = WORLDS.find((w) => w.id === activeWorldId);
    if (selected && isWorldUnlocked(selected.id)) return selected;
    if (isWorldUnlocked(3)) return WORLDS[2];
    if (isWorldUnlocked(2)) return WORLDS[1];
    return WORLDS[0];
  }, [activeWorldId, progress]);

  const completedThisWorld = activeWorld.levels.filter((level) => progress.cleared[level]).length;
  const worldComplete = isWorldComplete(activeWorld.id);
  const treasureClaimed = Boolean(treasureClaims[activeWorld.id]);
  const rewards = TREASURE_REWARDS[activeWorld.id];

  const showAdventureToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const stopSpeedBar = () => {
    if (speedFrameRef.current) cancelAnimationFrame(speedFrameRef.current);
    speedFrameRef.current = null;
  };

  const nextQuestion = (battleState: BattleState) => {
    setLockedChoices(false);
    setChoiceClass({});
    const q = makeQuestion(battleState.topic);
    setQuestion(q);
    setFeedback("");
    setTurnHint("Answer quickly for bonus damage.");
    setSpeedPercent(100);
    questionRef.current = q;

    stopSpeedBar();
    const total = difficultyDurations(battleState.difficulty);
    const start = performance.now();

    const tick = (now: number) => {
      const pct = clamp(100 - ((now - start) / total) * 100, 0, 100);
      setSpeedPercent(pct);
      if (pct <= 0) {
        handleAnswer(false, null, true);
        return;
      }
      speedFrameRef.current = requestAnimationFrame(tick);
    };

    speedFrameRef.current = requestAnimationFrame(tick);
  };

  const finalizeBattle = (win: boolean, battleState: BattleState) => {
    stopSpeedBar();
    setLockedChoices(true);
    if (win) {
      const rewardXP = (battleState.boss ? 24 : 16) + Math.floor(battleState.level / 2) + Math.floor(battleState.streak / 2);
      const rewardCoins = (battleState.boss ? 18 : 10) + Math.floor(battleState.level / 3);
      addXP(rewardXP);
      addCoins(rewardCoins);
      markBattleWin(`Cleared ${battleState.boss ? `Boss ${battleState.level}` : `Level ${battleState.level}`}`, {
        boss: battleState.boss,
      });
      setProgress((prev) => ({
        unlocked: Math.min(12, Math.max(prev.unlocked, battleState.level + 1)),
        cleared: { ...prev.cleared, [battleState.level]: true },
      }));
      if (battleState.level <= 4 && activeWorldId === 1 && battleState.level === 4) setActiveWorldId(2);
      if (battleState.level <= 8 && activeWorldId === 2 && battleState.level === 8) setActiveWorldId(3);
      setFeedback(`✅ Victory! +${rewardXP} XP • +${rewardCoins} coins`);
      setTurnHint("Map updated — your next level is ready.");
    } else {
      setFeedback("💥 Defeat. Try an easier topic or go finish another level first.");
      setTurnHint("No worries — your progress is still saved.");
    }

    answerTimeoutRef.current = window.setTimeout(() => {
      setBattle(null);
      setQuestion(null);
      setChoiceClass({});
      setLockedChoices(false);
      setFeedback("");
      setTurnHint("Answer to attack!");
    }, 1300);
  };

  const handleAnswer = (correct: boolean, selectedChoice: string | null, timedOut = false) => {
    const battleState = battleRef.current;
    const currentQuestion = questionRef.current;
    if (!battleState || !currentQuestion || lockedChoices) return;
    stopSpeedBar();
    setLockedChoices(true);

    const classes: Record<string, "correct" | "wrong" | undefined> = {};
    classes[currentQuestion.answer] = "correct";
    if (selectedChoice && !correct) classes[selectedChoice] = "wrong";
    setChoiceClass(classes);

    if (correct) {
      const streak = battleState.streak + 1;
      const crit = speedPercent >= 68 ? 3 : 0;
      const combo = Math.min(Math.max(0, streak - 1), 4);
      const damage = dmgFor(battleState.difficulty) + combo + crit;
      const nextState = {
        ...battleState,
        streak,
        enemyHP: clamp(battleState.enemyHP - damage, 0, battleState.enemyHPMax),
      };
      setBattle(nextState);
      battleRef.current = nextState;
      setFeedback(`⚔️ Correct! You dealt ${damage} damage${crit ? " with a speed bonus" : ""}.`);
      setTurnHint("Keep the streak alive for bigger hits.");
      if (nextState.enemyHP <= 0) {
        finalizeBattle(true, nextState);
        return;
      }
    } else {
      const damage = enemyDmgFor(battleState.difficulty) + (timedOut ? 1 : 0);
      const nextState = {
        ...battleState,
        streak: 0,
        playerHP: clamp(battleState.playerHP - damage, 0, battleState.playerHPMax),
      };
      setBattle(nextState);
      battleRef.current = nextState;
      setFeedback(timedOut ? `⏳ Too slow. The enemy hit you for ${damage}.` : `❌ Not quite. The enemy hit you for ${damage}.`);
      setTurnHint(`Correct answer: ${currentQuestion.answer}`);
      if (nextState.playerHP <= 0) {
        finalizeBattle(false, nextState);
        return;
      }
    }

    answerTimeoutRef.current = window.setTimeout(() => {
      const liveBattle = battleRef.current;
      if (liveBattle) nextQuestion(liveBattle);
    }, 720);
  };

  const startBattle = (level: number) => {
    if (level > progress.unlocked) {
      showAdventureToast(`🔒 Clear Level ${level - 1} first.`);
      return;
    }
    if (progress.cleared[level]) {
      showAdventureToast("You already cleared this level!");
      return;
    }
    const enemy = ENEMIES[(level - 1) % ENEMIES.length];
    const boss = BOSS_LEVELS.has(level);
    const hp = 16 + Math.floor(level * 2.1);
    const playerHP = difficulty === "hard" ? 18 : difficulty === "normal" ? 20 : 22;
    const nextBattle: BattleState = {
      level,
      boss,
      enemy,
      enemyHPMax: hp,
      enemyHP: hp,
      playerHPMax: playerHP,
      playerHP: playerHP,
      topic,
      difficulty,
      streak: 0,
    };
    setBattle(nextBattle);
    battleRef.current = nextBattle;
    nextQuestion(nextBattle);
  };

  const startNextPlayableLevel = () => {
    const nextLevel = activeWorld.levels.find((level) => level <= progress.unlocked && !progress.cleared[level]);
    if (!nextLevel) {
      showAdventureToast("All nodes cleared! Claim the treasure chest.");
      return;
    }
    startBattle(nextLevel);
  };

  const claimWorldTreasure = () => {
    if (!isWorldComplete(activeWorld.id)) {
      showAdventureToast("Complete every node first to unlock the treasure!");
      return;
    }
    if (treasureClaims[activeWorld.id]) {
      showAdventureToast("You already claimed this treasure.");
      return;
    }
    setTreasureClaims((prev) => ({ ...prev, [activeWorld.id]: true }));
    addCoins(rewards.coins);
    addXP(rewards.xp);
    showAdventureToast(`🎁 Treasure claimed! +${rewards.coins} coins · +${rewards.xp} XP`);
  };

  if (!hydrated) return null;

  return (
    <div className="kq-adventure-page">
      <section id="mapCard" className="card" hidden={Boolean(battle)}>
        <header>
          <h1>Adventure Map</h1>
        </header>
        <div className="kq-adventure-controls">
          <select id="topicSelect" value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>
            <option value="hangul">Hangul (letters &amp; sounds)</option>
            <option value="vocab">Vocabulary</option>
            <option value="mixed">Mixed</option>
          </select>
          <select id="difficultySelect" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <p>Pick a node to start a battle. Correct answers power up your attacks - miss and the monster strikes back!</p>

        <div id="mapGrid" className="kq-treasure-map">
          <section className="kq-treasure-adventure">
            <div className="kq-map-tabs">
              {WORLDS.map((world) => (
                <button
                  key={world.id}
                  type="button"
                  className={`kq-map-tab ${activeWorld.id === world.id ? "active" : ""}`}
                  disabled={!isWorldUnlocked(world.id)}
                  onClick={() => {
                    if (!isWorldUnlocked(world.id)) return;
                    setActiveWorldId(world.id);
                  }}
                >
                  {isWorldUnlocked(world.id) ? "🗺️" : "🔒"} Level {world.id}
                </button>
              ))}
            </div>

            <div className="kq-map-board">
              <div className="kq-map-topbar">
                <button className="kq-map-back" type="button">
                  Encounter
                </button>
                <div className="kq-map-currency">
                  <span>🪙 {rewards.coins}</span>
                  <span>⭐ {completedThisWorld}</span>
                </div>
              </div>

              <div className={`kq-scroll-stage ${isWorldUnlocked(activeWorld.id) ? "" : "locked"}`}>
                <img className="kq-scroll-bg" src="/favicon/adventure/treasure-scroll.png" alt="" aria-hidden="true" />
                {(MAP_DECORATIONS[activeWorld.id] || []).map((obj, idx) => (
                  <img
                    key={`${obj.src}-${idx}`}
                    className="kq-map-decoration"
                    src={obj.src}
                    alt=""
                    aria-hidden="true"
                    style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: obj.size, animationDelay: obj.delay }}
                  />
                ))}
                <div className="kq-map-title">
                  <div>Level {activeWorld.id}</div>
                  <small>{activeWorld.title}</small>
                </div>
                <svg className="kq-dashed-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d={TREASURE_PATHS[activeWorld.id]} />
                </svg>
                <button className="kq-start-node" type="button" data-start onClick={startNextPlayableLevel}>
                  <span className="kq-start-label">START!</span>
                  <span className="kq-start-circle">▶</span>
                </button>
                {activeWorld.levels.map((level, index) => {
                  const enemy = ENEMIES[(level - 1) % ENEMIES.length];
                  const boss = BOSS_LEVELS.has(level);
                  const cleared = Boolean(progress.cleared[level]);
                  const locked = level > progress.unlocked;
                  const pos = TREASURE_LAYOUTS[activeWorld.id][index];
                  return (
                    <button
                      key={level}
                      type="button"
                      className={`kq-map-node ${cleared ? "done" : ""} ${locked ? "locked" : ""} ${boss ? "boss" : ""}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      disabled={locked}
                      onClick={() => startBattle(level)}
                    >
                      <span className="kq-node-circle">{cleared ? "✓" : boss ? "👑" : enemy.sprite}</span>
                      <span className="kq-node-label">{boss ? `Boss ${level}` : `Level ${level}`}</span>
                      <div className="kq-map-stars" aria-hidden="true">
                        <span>{cleared ? "⭐" : "☆"}</span>
                        <span>{cleared ? "⭐" : "☆"}</span>
                        <span>{cleared ? "⭐" : "☆"}</span>
                      </div>
                    </button>
                  );
                })}
                <button
                  className={`kq-treasure-chest ${worldComplete ? "ready" : ""} ${treasureClaimed ? "claimed" : ""}`}
                  type="button"
                  onClick={claimWorldTreasure}
                >
                  <span className="kq-x-mark">✕</span>
                  <span className="kq-chest-bubble">
                    <span className="kq-chest-icon">{treasureClaimed ? "✅" : "🧰"}</span>
                    <span className="kq-chest-label">{treasureClaimed ? "CLAIMED!" : "TREASURE!"}</span>
                    <small>
                      +{rewards.coins} coins · +{rewards.xp} XP
                    </small>
                  </span>
                </button>
              </div>

              <div className="kq-map-tip">
                <strong>Adventure Tip</strong>
                <span>Complete every node on the map to unlock the treasure chest bonus.</span>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="battleCard" className="card battle-card" hidden={!battle}>
        {battle && (
          <>
            <h2 id="encounterTitle">
              {battle.boss ? "Boss" : `Level ${battle.level}`} • {battle.enemy.name}
            </h2>
            <button id="exitBattleBtn" className="btn secondary" type="button" onClick={() => setBattle(null)}>
              Run
            </button>

            <div className="battle">
              <div>
                <div className="sprite" role="img" aria-label="Player">
                  🧑‍🎓
                </div>
                <div>YOU</div>
                <div className="bar">
                  <i id="playerHPBar" style={{ width: `${clamp((battle.playerHP / battle.playerHPMax) * 100, 0, 100)}%` }} />
                </div>
                <div id="playerHPText">
                  {battle.playerHP}/{battle.playerHPMax}
                </div>
              </div>

              <div>
                <div id="enemySprite" className="sprite" role="img" aria-label="Enemy">
                  {battle.enemy.sprite}
                </div>
                <div id="enemyName">{battle.enemy.name}</div>
                <div className="bar">
                  <i id="enemyHPBar" style={{ width: `${clamp((battle.enemyHP / battle.enemyHPMax) * 100, 0, 100)}%` }} />
                </div>
                <div id="enemyHPText">
                  {battle.enemyHP}/{battle.enemyHPMax}
                </div>
              </div>
            </div>

            <div className="qwrap">
              <h3 id="qTitle">{question?.title || "Question"}</h3>
              <p id="qPrompt">{question?.prompt || "-"}</p>
              <div id="qChoices">
                {(question?.choices || []).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={`btn kq-answer-btn ${choiceClass[choice] || ""}`}
                    disabled={lockedChoices}
                    onClick={() => handleAnswer(choice === question?.answer, choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <div className="progress">
                <i id="speedFill" style={{ width: `${speedPercent}%` }} />
              </div>
              <p id="qFeedback" className="muted">
                {feedback}
              </p>
              <p id="turnHint" className="muted">
                {turnHint}
              </p>
            </div>
          </>
        )}
      </section>

      <div id="kqAdventureToast" className={`kq-adventure-toast ${toast ? "show" : ""}`}>
        {toast}
      </div>
    </div>
  );
}
