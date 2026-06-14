# Changelog

All notable changes to It's A Rock are documented in this file.

## [v0.4.2] - 2026-06-13

### Fixed

- **Location field auto-refill** — Location field no longer re-populates when clearing it with backspace, allowing smooth entry of new gym locations
- **Photo permissions** — Removed invasive media library write permission; camera now only requires camera permission

### Changed

- **Status indicators** — Active climbs now show with green dots, completed climbs with orange dots, providing clearer visual hierarchy

### Technical

- Enhanced `LocationPickerField` with ref-based initialization to prevent unwanted auto-population
- Updated photo handling to store cache files without media library dependency
- Removed `expo-media-library` imports from photo picker components

---

## [v0.4.1] - 2026-06-13

### Fixed

- **Photo picker modal dismiss** — Modal now properly closes when tapping outside the menu area, improving the interaction flow
- **Photos from FAB in form** — Photo taken via the floating action button now displays as a preview in the climb form with a change option, instead of showing empty camera/library buttons
- **Date picker display** — Date picker now shows "Today" when selecting the current date, removing confusion when browsing past climbs
- **Camera photo persistence** — Photos taken with the camera are now automatically saved to the device's media library

### Changed

- **Photo edit interface** — Photo editing menu now uses a bottom sheet modal instead of inline buttons, providing better UX and consistent behavior

### Technical

- Enhanced `PhotoPickerField` with modal-based edit menu and `pointerEvents="box-none"` for proper touch handling
- Integrated `expo-media-library` for automatic photo library saving
- Updated `FloatingAddButton` to pass photo URIs to the climb form
- Added `initialPhotoUri` parameter to `RouteForm` for seamless photo integration

---

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
