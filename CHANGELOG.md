# Changelog

All notable changes to It's A Rock are documented in this file.

## [v0.4.0] - 2026-06-13

### Added

- **Completed checkbox** — Replaced the Project/Sent toggle with a clearer "Completed" checkbox in the new climb form
- **Smart date handling** — Redesigned the date fields with a calendar picker and conditional rendering. "Completed" date field only appears when the climb is marked completed
- **Status indicator dots** — Added colored dots to the left of grades on climbing tiles:
  - Green dot for completed climbs
  - Muted gray dot for incomplete climbs
- **Date display on tiles** — Each climb tile now shows the climb date right-aligned next to the grade (format: "Jun 13" for current year, "Jun 13 2025" for past years)
- **Location autocomplete** — The gym/location field is now a searchable dropdown that suggests previously used locations as you type
- **Photo picker from FAB** — The floating action button now provides quick access to camera and photo library. When a photo is selected from the FAB, the form hides the picker buttons

### Changed

- **Column density labels** — The grid density control now displays "Large" (2 columns), "Medium" (3 columns), and "Small" (4 columns) instead of just numbers, with a "Columns" label for clarity
- **Menu labels** — Long-press menu now shows "Mark as completed" and "Mark as incomplete" instead of "Mark as sent/project"

### Technical

- Added `formatShortDate()` utility for tile date formatting
- New `LocationPickerField` component with dropdown filtering and Zustand integration
- New `DatePickerModal` component with iOS `DatePickerIOS` integration
- Updated `FloatingAddButton` to handle photo selection via image picker with permission requests
- Enhanced `PhotoPickerField` with optional `hideButtonsWhenSelected` prop

---

## [v0.3.2] - 2026-06-13

### Fixed

- **Check for Updates button** — Fixed the button text to show "Up to date" when a version check completes with no newer version available (#56)

### Changed

- **History tab title** — Capitalized "All climbs" → "All Climbs" for consistency with other screen titles (#51)
- **My Climbing tab icon** — Changed from dumbbell icon to hand-right icon, better representing rock climbing (#49)

---

## [v0.3.1] - Earlier

See [releases](https://github.com/rajwalgautam/its-a-rock/releases) for older versions.
