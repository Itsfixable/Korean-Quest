function adjustLearningPathPadding() {
  const section = document.getElementById("learningPathSection");
  if (!section) return;function setLearningPathArtHeight() {
  const section = document.getElementById("learningPathSection");
  if (!section) return;

  const isPhone = window.matchMedia("(max-width: 600px)").matches;

  // Only run on phone
  if (!isPhone) {
    section.style.removeProperty("--lp-art-height");
    return;
  }

  // Simple, reliable scaling: a fraction of viewport height with clamps
  const vh = window.innerHeight;
  const height = Math.max(220, Math.min(320, Math.round(vh * 0.34)));

  section.style.setProperty("--lp-art-height", `${height}px`);
}

window.addEventListener("load", setLearningPathArtHeight);
window.addEventListener("resize", setLearningPathArtHeight);

  if (window.innerWidth <= 950) {
    section.style.paddingBottom = "500px";
  } else {
    section.style.paddingBottom = "";
  }
}

window.addEventListener("load", adjustLearningPathPadding);
window.addEventListener("resize", adjustLearningPathPadding);