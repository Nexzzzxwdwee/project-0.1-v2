# Project 0.1 – Data Contracts (Pre-Supabase)

This document defines the current data structures used in Project 0.1.
These contracts are frozen and must be mirrored exactly during the
Supabase migration. No logic changes should be required.

---

## Preset

**Storage Key:**
`p01:presets`

**Type:**
`Record<string, Preset>`

**Preset:**
- `id: string` - Preset identifier (PresetId)
- `name: string` - Display name
- `habits: PresetItem[]` - Array of habit items
- `tasks: PresetItem[]` - Array of task items
- `updatedAt: number` - Unix timestamp (milliseconds) when preset was last modified

**PresetItem:**
- `id: string` - Stable presetItemId
- `text: string` - Item text content
- `time?: string` - Optional time string (for tasks only)

**Written by:**
- `/onboarding` - Creates initial preset on user onboarding
- `/habits` - Creates, updates, deletes presets

**Read by:**
- `/today` - Reads active preset to populate day plan
- `/habits` - Displays and manages presets

---

## Active Preset Pointer

**Storage Key:**
`p01:activePresetId`

**Type:**
`string | null`

**Description:**
Points to the currently active preset ID. Used to determine which preset to apply when syncing to day plans.

**Written by:**
- `/onboarding` - Sets initial active preset after creation
- `/habits` - Updates when user switches active preset

**Read by:**
- `/today` - Uses to determine which preset to sync
- `/habits` - Uses to determine which preset is currently active

---

## DayPlan

**Storage Key:**
`p01:dayPlan:<YYYY-MM-DD>`

**Type:**
`DayPlan`

**Fields:**
- `date: string` - Date in YYYY-MM-DD format
- `activePresetId: string | null` - Reference to preset used for this day
- `presetUpdatedAt: number | null` - Last applied preset.updatedAt timestamp
- `items: DayPlanItem[]` - Active items for the day
- `archived: DayPlanItem[]` - Items removed from preset (preserved)
- `isSealed: boolean` - Whether the day has been sealed

**DayPlanItem:**
- `id: string` - Stable ID
- `kind: 'habit' | 'task'` - Item type
- `text: string` - Item text content
- `time?: string` - Optional time string (for tasks only)
- `completed: boolean` - Completion status
- `source: 'preset' | 'manual'` - Item origin
- `presetId: string | null` - Reference to source preset
- `presetItemId: string | null` - Stable ID from preset for matching
- `userEdited: boolean` - Whether user manually edited text/time
- `createdAt: number` - Unix timestamp (milliseconds) when item was created

**Written by:**
- `/today` - Creates/updates day plan when items are toggled, added, or synced

**Read by:**
- `/today` - Displays and manages current day's plan

---

## DaySummary

**Storage Key:**
`p01:daySummary:<YYYY-MM-DD>`

**Type:**
`DaySummary`

**Fields:**
- `date: string` - Date in YYYY-MM-DD format
- `operatorPct: number` - Operator percentage (0-100, habits only)
- `operatorTotal: number` - Total operator habits
- `operatorDone: number` - Completed operator habits
- `isSealed: boolean` - Whether the day was sealed
- `sealedAt: number | null` - Unix timestamp (milliseconds) when day was sealed
- `totalScorePct: number` - Total score percentage (0-100 integer)
- `habitsPct: number` - Habits completion percentage (0-100 integer)
- `tasksPctCapped: number` - Tasks completion percentage (0-100 integer, capped at 2 tasks)
- `habitsTotal: number` - Total habits count
- `habitsDone: number` - Completed habits count
- `tasksTotal: number` - Total tasks count
- `tasksDone: number` - Completed tasks count
- `status: DayStatus` - Status enum: "Building" | "Strong" | "Elite" | "Unbroken"
- `xpEarned: number` - XP earned for this day (placeholder: equals totalScorePct)

**Written by:**
- `/today` - Creates/updates when day is sealed

**Read by:**
- `/history` - Displays historical day summaries
- `/weekly` - Aggregates weekly statistics from summaries

---

## UserProgress

**Storage Key:**
`p01:userProgress`

**Type:**
`UserProgress | null`

**Fields:**
- `xp: number` - Total accumulated XP
- `rank: string` - Current rank name
- `xpToNext: number` - XP needed for next rank
- `bestStreak: number` - All-time best streak count
- `currentStreak: number` - Current active streak count
- `lastSealedDate: string | null` - Date (YYYY-MM-DD) of last sealed day
- `updatedAt: number` - Unix timestamp (milliseconds) when progress was last updated

**Written by:**
- `/today` - Updates when day is sealed

**Read by:**
- `/rank` - Displays user rank and progression
- `/history` - Shows streak information
- `/weekly` - Shows best streak in weekly view

---

## JournalEntry

**Storage Key:**
`p01:journalEntries`

**Type:**
`JournalEntry[]`

**JournalEntry:**
- `id: string` - Stable unique ID
- `createdAt: number` - Unix timestamp (milliseconds) when entry was created
- `updatedAt: number` - Unix timestamp (milliseconds) when entry was last updated
- `date: string` - Date in YYYY-MM-DD format
- `content: string` - Entry text content

**Auxiliary Key:**
`p01:journalActiveEntryId`

**Type:**
`string | null`

**Description:**
Stores the ID of the currently active/selected journal entry.

**Written by:**
- `/journal` - Creates, updates, deletes entries; sets active entry

**Read by:**
- `/journal` - Displays entries and loads active entry

---

## Goal

**Storage Key:**
`p01:goals`

**Type:**
`Goal[]`

**Goal:**
- `id: string` - Stable unique ID
- `text: string` - Goal title/text
- `tag?: string` - Optional user-typed label (free text, not enum)
- `createdAt: number` - Unix timestamp (milliseconds) when goal was created
- `updatedAt: number` - Unix timestamp (milliseconds) when goal was last updated
- `done: boolean` - Completion status
- `doneAt: number | null` - Unix timestamp (milliseconds) when goal was marked done, or null if not done

**Written by:**
- `/goals` - Creates, updates, deletes goals

**Read by:**
- `/goals` - Displays active and completed goals

---

## Notes

- All IDs are stable strings generated via `generateId()` (uses `crypto.randomUUID()` with fallback to timestamp-based ID)
- All timestamps are Unix milliseconds (`Date.now()`)
- All data is currently stored in `localStorage` with `p01:` prefix
- No server-side logic exists yet (all operations are client-side)
- Supabase tables must mirror these shapes exactly during migration
- No behavioral changes allowed during migration (data contract is frozen)
- Storage helpers are in `src/lib/p01Storage.ts` (`getJSON`, `setJSON`, `listKeys`)
- Type definitions are in `src/lib/presets.ts` for preset-related types
- Type definitions for JournalEntry and Goal are in their respective page components

