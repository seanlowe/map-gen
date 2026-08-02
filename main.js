// create 50x100 grid of cells and print them

const max_columns = 100;
const max_rows = 50;

const generate_grid = () => {
  let grid = [];

  // map over each row and column, randomly setting a cell to true or false (wall or not)
  for (let i = 0; i < max_rows; i++) {
    grid[i] = [];
    for (let j = 0; j < max_columns; j++) {
      grid[i][j] = Math.random() > 0.5;
    }
  }

  return grid;
}

const print_grid = (grid) => {
  for (let i = 0; i < max_rows; i++) {
    for (let j = 0; j < max_columns; j++) {
      if (grid[i][j]) {
        process.stdout.write("X");
      } else {
        process.stdout.write(" ");
      }
    }
    console.log('');
  }
}

const combine_grid = (grid_1, grid_2) => {
  const combined_grid = [];
  for (let i = 0; i < max_rows; i++) {
    combined_grid[i] = [];
    for (let j = 0; j < max_columns; j++) {
      // if either grid has a true value, set the combined grid to true
      combined_grid[i][j] = grid_1[i][j] && grid_2[i][j];
    }
  }

  return combined_grid;
}

const embed_grid_in_border = (grid) => {
  let grid_rows = grid.length;
  let grid_columns = grid[0].length;

  let embedded_grid = [];

  // map over each row and column, adding a border around the grid and copying grid values into
  // places 1 < i < grid_rows - 1 and 1 < j < grid_columns - 1
  let total_rows = grid_rows + 2;
  let total_columns = grid_columns + 2;
  for (let i = 0; i < total_rows; i++) {
    embedded_grid[i] = [];
    for (let j = 0; j < total_columns; j++) {

      // first row logic
      if (i == 0) {
        // first or last column on first row
        if (j == 0 || j == total_columns - 1) {
          embedded_grid[i][j] = '.';
        } else {
          // first row but any other column
          embedded_grid[i][j] = "_";
        }
      }
      // last row logic
      else if (i == total_rows - 1) {
        // for or last column on last row
        if (j == 0 || j == total_columns - 1) {
          embedded_grid[i][j] = '|';
        } else {
          // last row but any other column
          embedded_grid[i][j] = "_";
        }
      }
      // (all other) middle rows logic
      else {
        // first or last column on middle row
        if (j == 0 || j == total_columns - 1) {
          embedded_grid[i][j] = "|";
        } else {
          // middle row but any other column
          embedded_grid[i][j] = grid[i-1][j-1] ? "X" : " ";
        }
      }
    }
  }

  return embedded_grid;
}

const is_wall = (grid, i, j) => {
  return grid[i][j] == "X";
}

const is_border = (grid, i, j) => {
  return i == 0 || i == grid.length - 1 || j == 0 || j == grid[0].length - 1;
}

const print_embedded_grid = (grid) => {
  // console.log(grid.length);

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      process.stdout.write(grid[i][j]);
    }
    console.log('');
  }
}

const ensure_no_isolated_spaces = (grid) => {
  let new_grid = [];
  for (let i = 0; i < grid.length; i++) {
    new_grid[i] = [];
    for (let j = 0; j < grid[0].length; j++) {
      // if the cell is a wall or a border, copy it over and continue
      if (is_wall(grid, i, j) || is_border(grid, i, j)) {
        // console.log(`i: ${i}, j: ${j}`);
        // console.log(new_grid);
        new_grid[i][j] = grid[i][j];
        continue;
      }
  
      let up = i - 1;
      let down = i + 1;
      let left = j - 1;
      let right = j + 1;
      let touching_spaces = 0;
  
      // check up
      if (up >= 0 && !is_wall(grid, up, j) && !is_border(grid, up, j)) {
        touching_spaces++;
      }
  
      // check down
      if (down < grid.length && !is_wall(grid, down, j) && !is_border(grid, down, j)) {
        touching_spaces++;
      }

      // check left
      if (left >= 0 && !is_wall(grid, i, left) && !is_border(grid, i, left)) {
        touching_spaces++;
      }

      // check right
      if (right < grid[0].length && !is_wall(grid, i, right) && !is_border(grid, i, right)) {
        touching_spaces++;
      }

      // if the cell is not a wall and is not touching any other spaces, set it to a wall
      if (touching_spaces == 0) {
        new_grid[i][j] = "X";
      } else {
        new_grid[i][j] = " ";
      }
    }
  }

  return new_grid;
}

// var grid = generate_grid();
// var grid = combine_grid(generate_grid(), generate_grid());
var grid = combine_grid(
  combine_grid(generate_grid(), generate_grid()),
  generate_grid()
);

// make a border around the grid
grid = embed_grid_in_border(grid);

// ensure there are no entries in the grid that are not walls that are not touching any other non-walls
var new_grid = ensure_no_isolated_spaces(grid);
// this works for singular spaces but not for a multi-space area that is not connected to the rest of the grid
// i.e.
// XXXX
// X  X
// XXXX
// because the inside spots are touching at least 1 space, they are left alone

// print the grid
print_embedded_grid(new_grid);



// ideas for bigger whatever
// each 1 wall is actually 3 spaces
// while loop and move a player through the grid
// generate grids in batches (chunking)
// only display a small portion of the grid at a time