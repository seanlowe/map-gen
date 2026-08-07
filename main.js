import { emitKeypressEvents } from 'readline';

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

// const print_grid = (grid) => {
//   for (let i = 0; i < max_rows; i++) {
//     for (let j = 0; j < max_columns; j++) {
//       if (grid[i][j]) {
//         process.stdout.write("X");
//       } else {
//         process.stdout.write(" ");
//       }
//     }
//     console.log('');
//   }
// }

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

const is_wall_or_border = (grid, i, j) => {
  return is_wall(grid, i, j) || is_border(grid, i, j);
}

const ensure_no_isolated_spaces = (grid) => {
  // this works for singular spaces but not for a multi-space area that is not connected to the rest of the grid
  // i.e.
  // XXXX
  // X  X
  // XXXX
  // because the inside spots are touching at least 1 space, they are left alone

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

const reveal_area = (grid_mask, [row, column]) => {
  let radius = 5;
  let starting_row = row - radius;
  let starting_column = column - radius;

  for (let i = starting_row; i < row + radius; i++) {
    for (let j = starting_column; j < column + radius; j++) {
      if (i >= 0 && i < grid_mask?.length && j >= 0 && j < grid_mask?.[0]?.length) {
        grid_mask[i][j] = true;
      }
    }
  }
}

const find_valid_starting_position = (grid) => {
  let starting_position = [
    /*   rows  */ Math.floor(5 + Math.random() * (grid.length - 5)),
    /* columns */ Math.floor(5 + Math.random() * (grid[0].length - 5))
  ];

  // check if starting position is valid
  if (is_wall(grid, starting_position[0], starting_position[1])) {
    return find_valid_starting_position(grid);
  }

  return starting_position;
}

const generate_grid_mask = (grid) => {
  let grid_mask = [];
  for (let i = 0; i < grid.length; i++) {
    grid_mask[i] = [];
    for (let j = 0; j < grid[0].length; j++) {
      grid_mask[i][j] = false;
    }
  }

  return grid_mask;
}

const print_grid_and_player = (grid, grid_mask, player_position) => {
  let print_string = '';
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (i == player_position[0] && j == player_position[1]) {
        print_string += "@";
      } else {
        if (grid_mask[i][j]) {
          print_string += grid[i][j];
        } else {
          print_string += "#";
        }
      }
    }
    print_string += "\n";
  }
  console.log(print_string);
}

const do_loop = (grid, grid_mask, player_position) => {
  console.clear();
  reveal_area(grid_mask, player_position);
  print_grid_and_player(grid, grid_mask, player_position);
}

const up_keys = ['up', 'w'];
const down_keys = ['down', 's'];
const left_keys = ['left', 'a'];
const right_keys = ['right', 'd'];

const handle_input = (str, key) => {
  if (str == 'q') {
    process.exit(0);
  }

  let [row, column] = player_position;

  const { name: key_name } = key

  // w / up (decrease x position -- 0 is top)
  if (up_keys.includes(key_name) && !is_wall_or_border(grid, row - 1, column)) {
    row--;
  }

  // s / down (increase x position)
  if (down_keys.includes(key_name) && !is_wall_or_border(grid, row + 1, column)) {
    row++;
  }

  // a / left (decrease y position -- 0 is far left)
  if (left_keys.includes(key_name) && !is_wall_or_border(grid, row, column - 1)) {
    column--;
  }

  // d / right (increase y position)
  if (right_keys.includes(key_name) && !is_wall_or_border(grid, row, column + 1)) {
    column++;
  }

  player_position = [row, column];

  do_loop(grid, grid_mask, player_position);
}

emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
} else {
  console.error("Error: process.stdin is not a TTY. Raw mode cannot be set.");
  process.exit(1);
}

process.stdin.on('keypress', (str, key) => handle_input(str, key));

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

var grid_mask = generate_grid_mask(new_grid);

var player_position = find_valid_starting_position(new_grid)

do_loop(new_grid, grid_mask, player_position);
