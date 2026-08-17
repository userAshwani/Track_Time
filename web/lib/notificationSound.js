"use client";

let sharedAudioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

export async function unlockNotificationAudio() {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      // Ignore autoplay policy failures until a later gesture.
    }
  }
}

function playTone(context, { frequency, startAt, duration = 0.22, volume = 0.18, type = "sine" }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export async function playNotificationChime() {
  const context = getAudioContext();
  if (!context) return;
  await unlockNotificationAudio();
  const now = context.currentTime;
  [
    { frequency: 784, startAt: now, duration: 0.16 },
    { frequency: 1046, startAt: now + 0.14, duration: 0.22 },
  ].forEach((tone) => playTone(context, tone));
}

export async function playTaskRing({ loops = 4 } = {}) {
  const context = getAudioContext();
  if (!context) return;
  await unlockNotificationAudio();
  const now = context.currentTime;

  for (let loop = 0; loop < loops; loop += 1) {
    const offset = loop * 0.78;
    [
      { frequency: 880, startAt: now + offset, duration: 0.18, volume: 0.22, type: "triangle" },
      { frequency: 1175, startAt: now + offset + 0.18, duration: 0.2, volume: 0.2, type: "triangle" },
      { frequency: 988, startAt: now + offset + 0.38, duration: 0.24, volume: 0.18, type: "sine" },
    ].forEach((tone) => playTone(context, tone));
  }

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate([220, 120, 220, 120, 320]);
  }
}

export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
