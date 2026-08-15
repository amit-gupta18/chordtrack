# Guitar Practice AI App — Architecture & Plan

## Guiding Principles
- Practice → Measure → Improve → Repeat
- No leaderboards, no social comparison, no pressure metrics
- Feels like a supportive teacher, not a scoreboard

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) |
| Backend | Express.js (Node) |
| Database | MongoDB (Mongoose ODM) |
| Real-time | WebSockets (Socket.IO) — needed for live audio feedback during a session |
| Audio | Web Audio API |
| Charts | Recharts |
| AI | LLM-based coaching layer, plus pitch/onset detection (Pitchfinder or similar) |

MongoDB fits well here because practice sessions, journal entries, and audio analysis results are naturally document-shaped (nested, variable fields) rather than strictly relational.

---

## System Architecture (High Level)

```
[React Frontend]
   ├─ Metronome (client-only, Web Audio API)
   ├─ Chord Transition Trainer (client-only during session)
   ├─ Live Audio Analyzer (mic → Web Audio API → WebSocket)
   ├─ Practice Journal (writes to backend)
   ├─ Analytics Dashboard (reads from backend)
   ├─ AI Insights / Coaching (reads from backend, LLM-generated)
   ↓ REST + WebSocket
[Express Backend]
   ├─ Auth (simple, single-user OK to start; can stub)
   ├─ Sessions API
   ├─ Journal API
   ├─ Analytics API
   ├─ Audio Analysis Service
   ├─ AI Coaching Service (LLM)
   ↓
[MongoDB]
   ├─ users
   ├─ sessions
   ├─ journalEntries
   ├─ audioAnalyses
```

The metronome and chord trainer timing stay client-side for accuracy; results get POSTed to the backend when a session ends. Live audio analysis streams over WebSocket while a session is in progress.

---

## Folder Structure

```
guitar-app/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Metronome/
│   │   │   ├── ChordTrainer/
│   │   │   ├── AudioAnalyzer/
│   │   │   ├── Journal/
│   │   │   ├── Dashboard/
│   │   │   └── Insights/
│   │   ├── hooks/
│   │   │   ├── useMetronome.js
│   │   │   ├── useTransitionSession.js
│   │   │   └── useAudioCapture.js
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Session.js
│   │   │   ├── JournalEntry.js
│   │   │   ├── AudioAnalysis.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── sessions.js
│   │   │   ├── journal.js
│   │   │   ├── analytics.js
│   │   │   └── insights.js
│   │   ├── services/
│   │   │   ├── audioAnalysis.js     # pitch/onset detection, chord matching
│   │   │   └── aiCoaching.js        # LLM calls
│   │   ├── controllers/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
└── README.md
```

---

## MongoDB Schema

### `users`
```js
{ _id, name: String, createdAt: Date }
```

### `sessions`
Covers chord-transition drills and general practice blocks.
```js
{
  _id,
  userId,
  type: "chordTransition" | "strumming" | "song" | "freePractice",
  chordPair: { from: String, to: String },   // e.g. { from: "A", to: "D" }
  bpm: Number,
  durationSeconds: Number,
  transitionsCompleted: Number,
  selfReport: {
    notesRangClearly: Boolean,
    fingersRelaxed: Boolean,
    usedAnchorFinger: Boolean,
    rhythmSteady: Boolean
  },
  createdAt: Date
}
```

### `journalEntries`
```js
{
  _id,
  userId,
  date: Date,
  exercises: [ { name: String, durationMinutes: Number } ],
  notes: String,
  streakDay: Number
}
```

### `audioAnalyses`
Linked to a session; produced by the Live Audio Analyzer.
```js
{
  _id,
  sessionId,
  expectedSequence: [String],       // e.g. ["A","D","A","D"]
  detectedSequence: [String],
  accuracy: Number,
  actualBpm: Number,
  targetBpm: Number,
  timingDrift: [Number],            // ms deviation per beat
  transitionDurationsMs: [Number],
  hesitationPoints: [Number],
  perStringDiagnosis: [
    {
      chord: String,                // e.g. "A"
      string: String,               // e.g. "G"
      issue: "silent" | "buzzing" | "wrongPitch" | "muted",
      likelyCause: String           // e.g. "ring finger likely muting adjacent string"
    }
  ],
  strumming: {
    expected: [String],             // ["Down","Down","Up","Up","Down","Up"]
    detected: [String]
  },
  aiFeedback: String,               // LLM-generated coaching text
  createdAt: Date
}
```

Analytics (transition count over time, most-practiced chords, BPM progression) are **derived from `sessions`/`audioAnalyses`** via aggregation queries — no separate analytics collection needed.

---

## API Design

```
POST   /api/sessions              create a session (metronome/chord trainer result)
GET    /api/sessions              list sessions (filter by date/chordPair)
GET    /api/sessions/:id          get one session

POST   /api/journal               add a journal entry
GET    /api/journal               list entries
GET    /api/journal/streak        current streak

GET    /api/analytics/overview    transitions over time, most-practiced chords, BPM progression

GET    /api/insights              AI-generated trend evaluation: bottleneck chords, fatigue
                                   patterns, declining BPM streaks, technique habits worth fixing

WS     /audio-stream               live mic audio in, live pitch/BPM/chord-match feedback out;
                                    final result saved as an audioAnalyses doc
```

---

## Features

### 1. Metronome
Adjustable BPM (40–200), start/stop, visual beat indicator, tap tempo, time signatures (4/4, 3/4, 6/8). Pure frontend, Web Audio API.

### 2. Chord Transition Trainer
Pick chord 1, chord 2, BPM, duration (e.g. A↔D). Shows current chord, beat indicator, countdown, transition counter. After the session: self-report on note clarity, finger relaxation, anchor finger use, rhythm steadiness. Frontend session logic + POST to `/api/sessions`.

### 3. Live Audio Analyzer
Mic captures audio while playing. Web Audio API does pitch/onset detection, streamed over WebSocket to the backend for chord matching and rhythm analysis. Powers the "what went wrong and why" diagnosis below, plus real-time BPM/drift feedback.

### 4. Per-String Chord Diagnosis
When a chord is played incorrectly, identify *which specific string* failed and the *likely* technique cause — not just "wrong chord."

Pipeline:
1. Detect notes actually sounding during a chord hold
2. Compare against the expected note set for that chord shape
3. Classify the failure per string: silent (not pressed hard enough), buzzing (finger too close to fret), wrong pitch (wrong fret/finger), muted (adjacent finger touching it)
4. Map to a likely cause using a rules table of known fingering mistakes per chord shape
5. AI coaching layer turns this into plain language, e.g. *"Your G string wasn't ringing on the A chord — likely your ring finger is muting it. Try arching your fingers more."*

Honest limitation: steps 1–3 are solid signal-processing territory; step 4 is inference — audio alone can't always distinguish "wrong finger" from "not pressing hard enough," so this is phrased as a likely cause, not a certain diagnosis.

### 5. Rhythm & Transition Analysis
Actual BPM vs target, timing drift, transition duration, hesitation points — derived from the audio stream.

### 6. Strumming Pattern Detection
Compares expected strum pattern (e.g. Down-Down-Up-Up-Down-Up) against detected onsets and directions. Hardest audio feature — depends on the above being solid first.

### 7. Practice Journal
Daily practice time, exercises done, notes, streaks. CRUD against `/api/journal`.

### 8. Analytics Dashboard
Recharts visualizations: transition count over time, practice frequency, most-practiced chords, streak, BPM progression. Reads from `/api/analytics/overview`.

### 9. AI Insights / Coaching
LLM reads session, journal, and audio-analysis history and produces trend-level feedback — bottleneck chords, fatigue patterns, declining BPM streaks, habits worth fixing — plus per-session feedback fed by the per-string diagnosis. This is the layer that ties everything else together into actual coaching, not just numbers.

---

## Suggested Build Order

Mic-based features need a working audio pipeline before anything downstream of it makes sense, so:

1. **Mic capture + pitch detection** — foundation everything else depends on
2. **Chord matching** — detected notes vs expected note set → flags *that* something's wrong and *which string*
3. **Per-string diagnosis heuristics** — rules table mapping failure patterns to likely causes
4. **AI coaching layer** — LLM turns structured diagnosis + trend history into plain-language feedback
5. **Rhythm/transition timing analysis** — actual BPM, drift, hesitation points
6. **Strumming pattern detection** — hardest piece, done last
7. **Metronome, Chord Transition Trainer, Journal, Analytics Dashboard** — build in alongside/around the above as the UI shell that hosts them

Each piece should be shippable and testable on its own rather than building everything before anything works end-to-end.
