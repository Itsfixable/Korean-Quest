"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { asset } from "@/lib/asset";
import "@/styles/pages/adventure.css";
import "@/styles/pages/adventure-enhancements.css";

const STORE_KEY = "kq_node_adv_progress_v1";
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

// Shared zigzag layout (percent of the stage) used for every world's 4 islands.
// Island 1 sits below the title block so it never overlaps the heading text.
const ISLAND_LAYOUT: { x: number; y: number }[] = [
  { x: 62, y: 34 },
  { x: 37, y: 51 },
  { x: 61, y: 66 },
  { x: 38, y: 81 },
];

// Maps 1 & 2 share the day scroll; map 3 uses the night scroll.
const WORLD_BG: Record<number, string> = {
  1: "/favicon/adventure/bg/adventureBg1.png",
  2: "/favicon/adventure/bg/adventureBg1.png",
  3: "/favicon/adventure/bg/adventureBg2.png",
};

function buildIslandPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    const midY = (prev.y + cur.y) / 2;
    d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
  }
  return d;
}

// The island art sits in the lower-center of a tall, mostly-transparent PNG
// frame (props like gate posts reach up into the empty top). Connecting the
// trail to each island's box center would route it through that airy top and
// show it "over" the island. Dropping the trail anchors down onto the grass
// makes the line meet the solid island body, so it tucks behind it.
const PATH_ANCHOR_Y_OFFSET = 6;
const ISLAND_PATH = buildIslandPath(
  ISLAND_LAYOUT.map((point) => ({ x: point.x, y: point.y + PATH_ANCHOR_Y_OFFSET })),
);

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
  const [activeWorldId, setActiveWorldId] = useState(1);
  const [topic, setTopic] = useState<Topic>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState("");
  const [turnHint, setTurnHint] = useState("Answer to attack!");
  const [timerKey, setTimerKey] = useState(0);
  const [timerDuration, setTimerDuration] = useState(3800);
  const [timerPaused, setTimerPaused] = useState(false);
  const [lockedChoices, setLockedChoices] = useState(false);
  const [choiceClass, setChoiceClass] = useState<Record<string, "correct" | "wrong" | undefined>>({});
  const [toast, setToast] = useState("");
  const [strike, setStrike] = useState<{ target: "enemy" | "player"; amount: number; crit: boolean; key: number } | null>(
    null,
  );
  // The level the bunny marker is currently standing on, plus whether it's
  // mid-walk to the next node (drives the walking bob animation).
  const [bunnyLevel, setBunnyLevel] = useState<number | null>(null);
  const [bunnyWalking, setBunnyWalking] = useState(false);
  // The level node currently hovered, so the bunny standing on it can lift in
  // sync with the island's hover animation.
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);

  const timerTimeoutRef = useRef<number | null>(null);
  const questionStartRef = useRef<number>(0);
  const questionDurationRef = useRef<number>(3800);
  const answerTimeoutRef = useRef<number | null>(null);
  const strikeTimeoutRef = useRef<number | null>(null);
  const battleRef = useRef<BattleState | null>(null);
  const questionRef = useRef<Question | null>(null);

  const triggerStrike = (target: "enemy" | "player", amount: number, crit: boolean) => {
    if (strikeTimeoutRef.current) window.clearTimeout(strikeTimeoutRef.current);
    setStrike({ target, amount, crit, key: Date.now() });
    strikeTimeoutRef.current = window.setTimeout(() => setStrike(null), 850);
  };

  useEffect(() => {
    setHydrated(true);
    const loadedProgress = loadProgress();
    setProgress(loadedProgress);
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

  useEffect(
    () => () => {
      if (timerTimeoutRef.current) window.clearTimeout(timerTimeoutRef.current);
      if (answerTimeoutRef.current) window.clearTimeout(answerTimeoutRef.current);
      if (strikeTimeoutRef.current) window.clearTimeout(strikeTimeoutRef.current);
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

  const nextPlayableLevel = activeWorld.levels.find(
    (level) => level <= progress.unlocked && !progress.cleared[level],
  );
  const bgSrc = WORLD_BG[activeWorld.id] ?? WORLD_BG[1];
  const isNight = activeWorld.id === 3;

  // Keep the bunny marker on the current node. When the next playable level
  // advances (after clearing one) and we're back on the map, walk it over.
  // Start the bob the moment it begins sliding so it wiggles *as* it walks.
  useEffect(() => {
    if (!hydrated || battle) return;
    const levels: readonly number[] = activeWorld.levels;
    const target = nextPlayableLevel ?? levels[levels.length - 1];
    if (bunnyLevel === target) return;
    if (bunnyLevel == null || !levels.includes(bunnyLevel)) {
      setBunnyLevel(target);
      return;
    }
    setBunnyWalking(true);
    const moveT = window.setTimeout(() => setBunnyLevel(target), 60);
    return () => window.clearTimeout(moveT);
  }, [hydrated, battle, nextPlayableLevel, activeWorld, bunnyLevel]);

  // Stop the walking bob once the slide finishes. Kept in its own effect (keyed
  // only on `bunnyWalking`) so the bunnyLevel change mid-walk can't cancel the
  // timer and leave the bunny wiggling forever after it arrives.
  useEffect(() => {
    if (!bunnyWalking) return;
    const stopT = window.setTimeout(() => setBunnyWalking(false), 1250);
    return () => window.clearTimeout(stopT);
  }, [bunnyWalking]);

  const showAdventureToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const stopSpeedBar = () => {
    if (timerTimeoutRef.current) window.clearTimeout(timerTimeoutRef.current);
    timerTimeoutRef.current = null;
    setTimerPaused(true);
  };

  const nextQuestion = (battleState: BattleState) => {
    setLockedChoices(false);
    setChoiceClass({});
    const q = makeQuestion(battleState.topic);
    setQuestion(q);
    setFeedback("");
    setTurnHint("Answer quickly for bonus damage.");
    questionRef.current = q;

    if (timerTimeoutRef.current) window.clearTimeout(timerTimeoutRef.current);
    const total = difficultyDurations(battleState.difficulty);
    questionDurationRef.current = total;
    questionStartRef.current = performance.now();

    // restart the countdown bar: bump the key to remount the fill so the
    // CSS drain animation replays from full, and unpause it.
    setTimerDuration(total);
    setTimerPaused(false);
    setTimerKey((k) => k + 1);

    timerTimeoutRef.current = window.setTimeout(() => {
      handleAnswer(false, null, true);
    }, total);
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
      const elapsed = performance.now() - questionStartRef.current;
      const remainingPct = clamp(100 - (elapsed / questionDurationRef.current) * 100, 0, 100);
      const crit = remainingPct >= 68 ? 3 : 0;
      const combo = Math.min(Math.max(0, streak - 1), 4);
      const damage = dmgFor(battleState.difficulty) + combo + crit;
      const nextState = {
        ...battleState,
        streak,
        enemyHP: clamp(battleState.enemyHP - damage, 0, battleState.enemyHPMax),
      };
      setBattle(nextState);
      battleRef.current = nextState;
      triggerStrike("enemy", damage, crit > 0);
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
      triggerStrike("player", damage, false);
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
        <p>Pick a node to start a battle. Correct answers power up your attacks — miss and the monster strikes back!</p>

        <div id="mapGrid" className="kq-treasure-map">
          <section className="kq-treasure-adventure">
            <div
              className={`kq-island-stage ${isNight ? "is-night" : ""} ${
                isWorldUnlocked(activeWorld.id) ? "" : "locked"
              }`}
            >
              <img className="kq-stage-bg" src={asset(bgSrc)} alt="" aria-hidden="true" />

              <div className="kq-stage-title">
                <nav className="kq-world-nav" aria-label="Select a map">
                  {WORLDS.map((world) => {
                    const unlocked = isWorldUnlocked(world.id);
                    const complete = isWorldComplete(world.id);
                    const active = world.id === activeWorld.id;
                    const badge = !unlocked ? "🔒" : complete ? "✓" : world.id;
                    return (
                      <button
                        key={world.id}
                        type="button"
                        className={`kq-world-tab ${active ? "is-active" : ""} ${unlocked ? "" : "is-locked"} ${
                          complete ? "is-complete" : ""
                        }`}
                        disabled={!unlocked}
                        aria-current={active ? "true" : undefined}
                        onClick={() => unlocked && setActiveWorldId(world.id)}
                      >
                        <span className="kq-world-tab-badge">{badge}</span>
                        <span className="kq-world-tab-name">{world.title}</span>
                      </button>
                    );
                  })}
                </nav>
                <p className="kq-stage-eyebrow">✨ Adventure 🌸</p>
                <h2>Level {activeWorld.id}</h2>
                <p className="kq-stage-world">{activeWorld.title}</p>
                <p className="kq-stage-desc">
                  Answer questions and battle your way through Korean!
                </p>
              </div>

              <svg className="kq-island-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d={ISLAND_PATH} />
              </svg>

              {activeWorld.levels.map((level, index) => {
                const boss = BOSS_LEVELS.has(level);
                const cleared = Boolean(progress.cleared[level]);
                const locked = level > progress.unlocked;
                const pos = ISLAND_LAYOUT[index];
                const isStart = level === nextPlayableLevel;
                const label = boss ? `Boss ${level}` : `Level ${level}`;
                return (
                  <div
                    key={index}
                    className={`kq-island-node ${cleared ? "done" : ""} ${locked ? "locked" : ""} ${
                      boss ? "boss" : ""
                    }`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, animationDelay: `${index * 0.35}s` }}
                  >
                    <button
                      type="button"
                      className="kq-island-btn"
                      disabled={locked}
                      onClick={() => startBattle(level)}
                      onMouseEnter={() => !locked && setHoverLevel(level)}
                      onMouseLeave={() => setHoverLevel((cur) => (cur === level ? null : cur))}
                      aria-label={label}
                    >
                      <img
                        className="kq-island-img"
                        src={asset(`/favicon/adventure/island/map${activeWorld.id}-${index + 1}.png`)}
                        alt=""
                      />
                      {locked && <span className="kq-island-lock">🔒</span>}
                      {isStart && <span className="kq-island-start">START!</span>}
                    </button>
                    <div className="kq-island-info">
                      <span className="kq-island-label">{label}</span>
                    </div>
                  </div>
                );
              })}

              {(() => {
                const bunnyIdx =
                  bunnyLevel != null
                    ? (activeWorld.levels as readonly number[]).indexOf(bunnyLevel)
                    : -1;
                if (bunnyIdx < 0) return null;
                const bunnyPos = ISLAND_LAYOUT[bunnyIdx];
                return (
                  <img
                    className={`kq-adventure-bunny ${bunnyWalking ? "is-walking" : ""} ${
                      !bunnyWalking && hoverLevel === bunnyLevel ? "is-hover" : ""
                    }`}
                    src={asset("/favicon/adventure/bunnyAvatarAdventure.png")}
                    alt=""
                    aria-hidden="true"
                    style={{ left: `${bunnyPos.x}%`, top: `${bunnyPos.y}%` }}
                  />
                );
              })()}
            </div>
          </section>
        </div>
      </section>

      <section id="battleCard" className="kq-battle" hidden={!battle}>
        {battle && (
          <div className={`kq-battle-shell ${battle.boss ? "is-boss" : ""}`}>
            <header className="kq-battle-head">
              <div className="kq-battle-title">
                <span className="kq-battle-kicker">
                  {battle.boss ? "⚔️ Boss Battle" : `Level ${battle.level}`}
                </span>
                <h2>{battle.enemy.name}</h2>
              </div>
              <button className="kq-battle-run" type="button" onClick={() => setBattle(null)}>
                Run
              </button>
            </header>

            <div className={`kq-battle-arena ${battle.boss ? "is-boss" : ""}`}>
              <div className="kq-fighter">
                <div
                  className={`kq-fighter-avatar kq-fighter-avatar--player ${
                    strike?.target === "player" ? "is-hit" : ""
                  }`}
                  role="img"
                  aria-label="You"
                >
                  🧑‍🎓
                  {strike?.target === "player" && (
                    <span key={strike.key} className="kq-dmg-pop">
                      -{strike.amount}
                    </span>
                  )}
                </div>
                <div className="kq-fighter-meta">
                  <div className="kq-fighter-row">
                    <span className="kq-fighter-name">You</span>
                    <span className="kq-fighter-hp">
                      {battle.playerHP}/{battle.playerHPMax}
                    </span>
                  </div>
                  <div className="kq-hpbar">
                    <i
                      className={`kq-hpbar-fill is-player ${
                        battle.playerHP / battle.playerHPMax <= 0.3 ? "is-low" : ""
                      }`}
                      style={{ width: `${clamp((battle.playerHP / battle.playerHPMax) * 100, 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="kq-battle-vs">
                <span>VS</span>
              </div>

              <div className="kq-fighter kq-fighter--enemy">
                <div
                  className={`kq-fighter-avatar kq-fighter-avatar--enemy ${battle.boss ? "is-boss" : ""} ${
                    strike?.target === "enemy" ? "is-hit" : ""
                  }`}
                  role="img"
                  aria-label={battle.enemy.name}
                >
                  {battle.boss && <span className="kq-fighter-crown">👑</span>}
                  {battle.enemy.sprite}
                  {strike?.target === "enemy" && (
                    <span key={strike.key} className={`kq-dmg-pop ${strike.crit ? "is-crit" : ""}`}>
                      -{strike.amount}
                      {strike.crit ? "!" : ""}
                    </span>
                  )}
                </div>
                <div className="kq-fighter-meta">
                  <div className="kq-fighter-row">
                    <span className="kq-fighter-name">{battle.enemy.name}</span>
                    <span className="kq-fighter-hp">
                      {battle.enemyHP}/{battle.enemyHPMax}
                    </span>
                  </div>
                  <div className="kq-hpbar">
                    <i
                      className={`kq-hpbar-fill is-enemy ${
                        battle.enemyHP / battle.enemyHPMax <= 0.3 ? "is-low" : ""
                      }`}
                      style={{ width: `${clamp((battle.enemyHP / battle.enemyHPMax) * 100, 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="kq-battle-q">
              <div className="kq-q-tagrow">
                <span className="kq-q-tag">{question?.title || "Question"}</span>
                {battle.streak > 1 && <span className="kq-q-streak">🔥 {battle.streak} streak</span>}
              </div>
              <p className="kq-q-prompt">{question?.prompt || "-"}</p>
              <div className="kq-q-choices">
                {(question?.choices || []).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={`kq-q-choice ${choiceClass[choice] || ""}`}
                    disabled={lockedChoices}
                    onClick={() => handleAnswer(choice === question?.answer, choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <div className="kq-q-timer" aria-hidden="true">
                <i
                  key={timerKey}
                  className={timerPaused ? "is-paused" : ""}
                  style={{ animationDuration: `${timerDuration}ms` }}
                />
              </div>
              <p className="kq-q-feedback">{feedback}</p>
              <p className="kq-q-hint">{turnHint}</p>
            </div>
          </div>
        )}
      </section>

      <div id="kqAdventureToast" className={`kq-adventure-toast ${toast ? "show" : ""}`}>
        {toast}
      </div>
    </div>
  );
}
