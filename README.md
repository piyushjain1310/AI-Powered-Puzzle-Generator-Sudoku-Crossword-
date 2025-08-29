# Puzzle AI — Frontend (Sudoku & Crossword)

This project provides a single-page frontend that generates:
- **Sudoku** puzzles (Easy / Medium / Hard) with a solver and check button.
- A **simple Crossword** generator that places provided words with basic intersections.

## Files included
- `index.html` — main page
- `styles.css` — styling
- `script.js` — all JavaScript logic
- `samples/words.txt` — sample words list

## Notes & limitations
- Sudoku generator uses a backtracking approach to create a complete board and removes numbers per difficulty. The puzzle uniqueness is not strictly enforced — acceptable for a training project but can be improved by implementing uniqueness checks.
- Crossword generator is a simple greedy placement algorithm — it attempts intersections but is not a full-featured crossword engine. Good for demos and small word-sets.
- All logic runs in the browser — no backend needed.

## Ideas to improve (next steps)
- Add validation to ensure the Sudoku puzzle has a unique solution.
- Improve crossword placement using simulated annealing or constraint solving to optimize intersections and reduce isolated words.
- Add clues and interactive fill-in functionality for the crossword.
- Add difficulty presets with hints and timer for Sudoku.
- Package as a Chrome app or Electron app for distribution.

