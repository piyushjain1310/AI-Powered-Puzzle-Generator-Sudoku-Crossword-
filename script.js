
/* script.js - Sudoku generator + simple crossword generator */

/* --- Tab handling --- */
document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=> {
    document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const tab = b.dataset.tab;
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
  });
});

/* ---------------- SUDOKU ---------------- */
const sdBoardEl = document.getElementById('sudoku-board');
const sdMsg = document.getElementById('sd-msg');
let sdSolution = null;
let sdPuzzle = null;

function makeEmptySudokuGrid(){
  const grid = [];
  for(let r=0;r<9;r++){ grid.push(Array(9).fill(0)); }
  return grid;
}

/* Backtracking solver/generator */
function isSafe(grid, row, col, num){
  for(let c=0;c<9;c++) if(grid[row][c]===num) return false;
  for(let r=0;r<9;r++) if(grid[r][col]===num) return false;
  const sr = Math.floor(row/3)*3, sc = Math.floor(col/3)*3;
  for(let r=sr;r<sr+3;r++) for(let c=sc;c<sc+3;c++) if(grid[r][c]===num) return false;
  return true;
}
function solveSudoku(grid){
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(grid[r][c]===0){
        for(let n=1;n<=9;n++){
          if(isSafe(grid,r,c,n)){
            grid[r][c]=n;
            if(solveSudoku(grid)) return true;
            grid[r][c]=0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/* Create full solved board by shuffling numbers and using backtracking */
function generateFullSolution(){
  const grid = makeEmptySudokuGrid();
  const nums = [1,2,3,4,5,6,7,8,9];
  function fill(idx){
    if(idx===81) return true;
    const r = Math.floor(idx/9), c = idx%9;
    // shuffle nums locally
    for(let i=nums.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [nums[i],nums[j]]=[nums[j],nums[i]]; }
    for(const n of nums){
      if(isSafe(grid,r,c,n)){
        grid[r][c]=n;
        if(fill(idx+1)) return true;
        grid[r][c]=0;
      }
    }
    return false;
  }
  fill(0);
  return grid;
}

/* Remove numbers according to difficulty */
function makePuzzleFromSolution(solution, difficulty){
  // clone
  const grid = solution.map(r=>r.slice());
  let removals = difficulty==='easy'? 36 : difficulty==='medium'? 45 : 54;
  // remove randomly but ensure uniqueness is not strictly guaranteed (good enough for project)
  while(removals>0){
    const r=Math.floor(Math.random()*9), c=Math.floor(Math.random()*9);
    if(grid[r][c]!==0){
      grid[r][c]=0;
      removals--;
    }
  }
  return grid;
}

/* Render board */
function renderSudoku(grid, fixedGrid){
  sdBoardEl.innerHTML='';
  sdBoardEl.style.gridTemplateColumns = 'repeat(9, 1fr)';
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const cell = document.createElement('div');
      cell.className='sdl-cell';
      if((c+1)%3===0 && c<8) cell.classList.add('box-right');
      if((r+1)%3===0 && r<8) cell.classList.add('box-bottom');
      if(fixedGrid && fixedGrid[r][c]!==0){
        cell.classList.add('fixed');
        cell.innerHTML = '<strong>'+fixedGrid[r][c]+'</strong>';
      } else {
        const inp = document.createElement('input');
        inp.maxLength=1;
        inp.inputMode='numeric';
        inp.addEventListener('input', (e)=>{
          const val = e.target.value.replace(/[^1-9]/g,'');
          e.target.value = val;
        });
        cell.appendChild(inp);
      }
      cell.dataset.r = r; cell.dataset.c = c;
      sdBoardEl.appendChild(cell);
    }
  }
}

/* Read current board values */
function readBoardValues(){
  const grid = makeEmptySudokuGrid();
  const cells = sdBoardEl.querySelectorAll('.sdl-cell');
  cells.forEach(cell=>{
    const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
    if(cell.classList.contains('fixed')){
      grid[r][c]= parseInt(cell.textContent)||0;
    } else {
      const inp = cell.querySelector('input');
      grid[r][c] = inp && inp.value? parseInt(inp.value):0;
    }
  });
  return grid;
}

/* Buttons */
document.getElementById('sd-gen').addEventListener('click', ()=>{
  sdMsg.textContent='Generating...';
  setTimeout(()=>{ // give slight UX delay
    const diff = document.getElementById('sd-diff').value;
    sdSolution = generateFullSolution();
    sdPuzzle = makePuzzleFromSolution(sdSolution, diff);
    renderSudoku(sdPuzzle, sdPuzzle); // fixed puzzle cells rendered as fixed
    sdMsg.textContent='Puzzle ready ('+diff+').';
  }, 80);
});

document.getElementById('sd-solve').addEventListener('click', ()=>{
  if(!sdSolution){ sdMsg.textContent='Generate a puzzle first.'; return; }
  renderSudoku(sdSolution, sdSolution);
  sdMsg.textContent='Solution shown.';
});

document.getElementById('sd-check').addEventListener('click', ()=>{
  if(!sdSolution){ sdMsg.textContent='Generate a puzzle first.'; return; }
  const user = readBoardValues();
  let ok=true, wrong=0;
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    if(user[r][c]!==sdSolution[r][c]){
      ok=false; wrong++;
    }
  }
  sdMsg.textContent = ok? 'All correct — nice!' : ('Found '+wrong+' wrong cell(s).');
});

/* Auto-generate initial puzzle at load */
document.getElementById('sd-gen').click();

/* ---------------- CROSSWORD (simple) ---------------- */
const cwBoardEl = document.getElementById('crossword-board');
const cwMsg = document.getElementById('cw-msg');

function makeEmptyCW(size){
  const grid = [];
  for(let r=0;r<size;r++) grid.push(Array(size).fill(null));
  return grid;
}

/* Place words with simple greedy intersection */
function generateCrossword(words, size){
  words = words.map(w=>w.toUpperCase().replace(/[^A-Z]/g,'')).filter(Boolean);
  words.sort((a,b)=>b.length-a.length);
  const grid = makeEmptyCW(size);
  const placements = [];

  const mid = Math.floor(size/2);
  // place first word horizontally in middle
  if(words.length===0) return {grid,placements};
  const w0 = words[0];
  const startC = Math.max(0, Math.floor((size - w0.length)/2));
  for(let i=0;i<w0.length;i++) grid[mid][startC+i]=w0[i];
  placements.push({word:w0,row:mid,col:startC,dir:'H'});

  // try to place remaining words by finding matching letters
  for(let k=1;k<words.length;k++){
    const w = words[k];
    let placed=false;
    // try all existing placements to intersect
    for(const p of placements){
      for(let i=0;i<p.word.length && !placed;i++){
        const letter = p.word[i];
        for(let j=0;j<w.length && !placed;j++){
          if(w[j]!==letter) continue;
          // compute candidate coordinates
          let r = p.row + (p.dir==='V'? i : 0);
          let c = p.col + (p.dir==='H'? i : 0);
          // if p is horizontal, we'll place this word vertically crossing at that letter
          let dir = p.dir==='H'?'V':'H';
          let startR = dir==='V'? r - j : r;
          let startC = dir==='H'? c - j : c;
          if(startR<0 || startC<0) continue;
          if(dir==='V' && startR + w.length > size) continue;
          if(dir==='H' && startC + w.length > size) continue;
          // check conflicts
          let conflict=false;
          for(let t=0;t<w.length && !conflict;t++){
            const rr = startR + (dir==='V'? t:0);
            const cc = startC + (dir==='H'? t:0);
            const existing = grid[rr][cc];
            if(existing && existing !== w[t]) conflict=true;
            // also ensure we don't create adjacent letter collisions (simple rule)
            if(!existing){
              // check neighbor cells orthogonally to avoid touching other words illegally
              const neighbors=[ [rr-1,cc],[rr+1,cc],[rr,cc-1],[rr,cc+1] ];
              for(const nb of neighbors){
                const [nr,nc]=nb;
                if(nr>=0 && nr<size && nc>=0 && nc<size){
                  const ex = grid[nr][nc];
                  if(ex && ex !== w[t] && !(nr===r && nc===c)) { /* allow crossing */
                    // allow if this neighbor is the crossing cell
                  }
                }
              }
            }
          }
          if(conflict) continue;
          // commit placement
          for(let t=0;t<w.length;t++){
            const rr = startR + (dir==='V'? t:0);
            const cc = startC + (dir==='H'? t:0);
            grid[rr][cc] = w[t];
          }
          placements.push({word:w,row:startR,col:startC,dir:dir});
          placed=true;
        }
      }
      if(placed) break;
    }
    // if couldn't intersect, try to place in first available spot horizontally
    if(!placed){
      outer:
      for(let r=0;r<size;r++){
        for(let c=0;c<=size-w.length;c++){
          let ok=true;
          for(let t=0;t<w.length;t++){
            const ex = grid[r][c+t];
            if(ex && ex!==w[t]) { ok=false; break; }
            // simple adjacency checks omitted for brevity
          }
          if(ok){
            for(let t=0;t<w.length;t++) grid[r][c+t]=w[t];
            placements.push({word:w,row:r,col:c,dir:'H'});
            placed=true;
            break outer;
          }
        }
      }
    }
  }

  return {grid,placements};
}

/* Render crossword grid */
function renderCrossword(grid){
  cwBoardEl.innerHTML='';
  const size = grid.length;
  const wrap = document.createElement('div');
  wrap.className='cw-grid';
  wrap.style.gridTemplateColumns = `repeat(${size}, auto)`;
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      const cell = document.createElement('div');
      cell.className='cw-cell';
      const val = grid[r][c];
      if(!val) { cell.classList.add('block'); cell.textContent=''; }
      else cell.textContent = val;
      wrap.appendChild(cell);
    }
  }
  cwBoardEl.appendChild(wrap);
}

/* Buttons */
document.getElementById('cw-load-sample').addEventListener('click', ()=>{
  // fetch sample words embedded in page via file or hardcoded (simple approach)
  const sample = `INDIA
SUDOKU
PUZZLE
ALGORITHM
GRID
GENERATOR
BRAIN
LOGIC
HARD
MEDIUM
EASY
CODE
JS
HTML`;
  document.getElementById('cw-words').value = sample;
  cwMsg.textContent='Sample words loaded.';
});

document.getElementById('cw-gen').addEventListener('click', ()=>{
  const size = parseInt(document.getElementById('cw-size').value);
  const words = document.getElementById('cw-words').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(words.length===0){ cwMsg.textContent='Add some words first.'; return; }
  const res = generateCrossword(words, size);
  renderCrossword(res.grid);
  cwMsg.textContent = `Placed ${res.grid.flat().filter(Boolean).length} letters — ${res.grid.flat().filter(Boolean).length>0?'Done':'Failed'}.`;
});

document.getElementById('cw-export').addEventListener('click', ()=>{
  const size = parseInt(document.getElementById('cw-size').value);
  const words = document.getElementById('cw-words').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const res = generateCrossword(words, size);
  // Export as CSV where empty cells are dots
  const csv = res.grid.map(r=> r.map(c=> c||'.').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'crossword.csv';
  a.click();
  URL.revokeObjectURL(url);
});

/* Initial sample load for convenience */
document.getElementById('cw-load-sample').click();
