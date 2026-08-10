import { emitKeypressEvents } from 'readline';
import { generate_perlin_grid } from './perlin.js';

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

// for printing the output of "generate_grid" directly
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

// const print_grid2 = (grid) => {
//   let to_print = '';
//   for (let i = 0; i < grid.length; i++) {
//     for (let j = 0; j < grid[0].length; j++) {
//       to_print += grid[i][j]
//     }
//     to_print += "\n";
//   }
//   console.log(to_print);
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

const embed_perlin_grid_in_border = (grid) => {
  let new_grid = [];
  let horizontal_border = [...new Array(grid[0].length).fill("_")];
  let top_border = [".", ...horizontal_border, "."]
  let bottom_border = ["|", ...horizontal_border, "|"]

  new_grid.push(top_border);

  for (let i = 0; i < grid.length; i++) {
    let new_row = ["|"];
    for (let j = 0; j < grid[0].length; j++) {
      new_row.push(grid[i][j] <= 0.5 ? " " : "X");
    }
    new_row.push("|");
    new_grid.push(new_row);
  }

  new_grid.push(bottom_border);

  return new_grid;
}

const is_wall_or_border = (grid, i, j) => {
  let is_wall = grid[i][j] == "X";
  let is_border = i == 0 || i == grid.length - 1 || j == 0 || j == grid[0].length - 1;
  return is_wall || is_border;
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
      if (is_wall_or_border(grid, i, j)) {
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
      if (up >= 0 && !is_wall_or_border(grid, up, j)) {
        touching_spaces++;
      }

      // check down
      if (down < grid.length && !is_wall_or_border(grid, down, j)) {
        touching_spaces++;
      }

      // check left
      if (left >= 0 && !is_wall_or_border(grid, i, left)) {
        touching_spaces++;
      }

      // check right
      if (right < grid[0].length && !is_wall_or_border(grid, i, right)) {
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
  // reveal area in a circular area around the starting position
  //
  //        ####21A12####
  //        ##4321B1234##
  //        654321C123456
  //        654321x123456
  //        6543211123456
  //        ##432111234##
  //        ####21112####
  //
  // radius 3 for Y
  // radius 6 for X

  let x_radius = 6;
  let y_radius = 3;

  let starting_row = row - y_radius;
  let starting_column = column - x_radius;

  // new thought
  // 2 + (abs(edge_row - current_row) * 2) for number of spaces to clear based on distance from edge of radius
  // total distance is x_radius * 2 + 1
  // so for number of spaces to not clear it would be total distance / 2 on the beginning and end
  // 
  // top edge    row would be row 47
  // center      row would be row 50
  // bottom edge row would be row 53
  // (47 - 47) * 2 + 2 = 2
  // (48 - 47) * 2 + 2 = 4
  // (49 - 47) * 2 + 2 = 6
  // center row has full x radius
  // (51 - 53) * 2 + 2 = 6
  // (52 - 53) * 2 + 2 = 4
  // (53 - 53) * 2 + 2 = 2
  // these are places to clear calculated per quadrant, and the Y axis is always rendered so it would be row_result * 2 + 1
  let ending_row = row + y_radius;
  let ending_column = column + x_radius;
  for (let i = starting_row; i <= ending_row; i++) {
    if (i < 0 || i >= grid_mask?.length) {
      // no need to try to reveal areas that are out of bounds
      continue;
    }

    let distance_from_edge = -1;
    if (i == row) {
      distance_from_edge = y_radius
    } else {
      distance_from_edge = i < row ? Math.abs(i - starting_row) : Math.abs(i - ending_row);
    }

    const length_to_clear = (distance_from_edge * 2) + 2;
    const padded_uncleared_spaces_one_side = x_radius - length_to_clear;

    let new_row = [];
    append_n_times(new_row, padded_uncleared_spaces_one_side, false, 0);
    append_n_times(new_row, length_to_clear * 2, true, new_row.length);
    append_n_times(new_row, padded_uncleared_spaces_one_side, false, new_row.length);

    // can't just splice in the new row because it will overwrite whether or not something has been revealed previously
    // so instead, loop over the columns in the current row and check old value versus new value, then set the new value
    for (let j = starting_column; j < ending_column; j++) {
      const is_valid_position = i >= 0 && i < grid_mask?.length && j >= 0 && j < grid_mask?.[0]?.length;
      const should_be_revealed = grid_mask[i][j] || new_row[j - starting_column];
      if (is_valid_position && should_be_revealed) {
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
  if (is_wall_or_border(grid, starting_position[0], starting_position[1])) {
    return find_valid_starting_position(grid);
  }

  return starting_position;
}

const find_valid_starting_position_perlin = (grid) => {
  var coordinates = [];

  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[i].length; j++) {
      if (grid[i][j] <= 0.5) {
        coordinates.push([i, j]);
      }
    }
  }

  return coordinates[Math.floor(Math.random() * coordinates.length)];
}

const append_n_times = (receiving_arr, num_to_append, value_to_append, where_to_append) => {
  if (num_to_append < 0) {
    return receiving_arr
  }

  receiving_arr.splice(where_to_append, 0, ...Array(num_to_append).fill(value_to_append));

  return receiving_arr;
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

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
} else {
  console.error("Error: process.stdin is not a TTY. Raw mode cannot be set.");
  process.exit(1);
}

process.stdin.on('keypress', (str, key) => handle_input(str, key)); // relies on the grid variable being named "grid"

// var grid = combine_grid(
//   combine_grid(generate_grid(), generate_grid()),
//   generate_grid()
// );
// make a border around the grid
// grid = embed_grid_in_border(grid);
// ensure there are no entries in the grid that are not walls that are not touching any other non-walls
// var new_grid = ensure_no_isolated_spaces(grid);
// var grid_mask = generate_grid_mask(new_grid);
// var player_position = find_valid_starting_position(new_grid)
// do_loop(new_grid, grid_mask, player_position);

// perlin
var grid = generate_perlin_grid();
grid = embed_perlin_grid_in_border(grid);
var grid_mask = generate_grid_mask(grid);
var player_position = find_valid_starting_position_perlin(grid);
do_loop(grid, grid_mask, player_position);
