// X - create a 2d array
// X - chunk the array into grids
// X - for the corners of each grid, generate a random direction
// X - for each entry in the array that is not a grid corner, 
//     - add a "down" vector (pointing to zero) and a "left" vector (pointing to zero)
//     - calculate the dot product of both vectors with each vector of the corners that "contains" the entry
//         - dx cos(theta) where dx is the horizontal "displacement" from the corner to the point in question and theta is the angle of the other vector
//         - dy sin(theta) where dy is the vertical "displacement" from the corner to the point in question and theta is the angle of the other vector
//         - add these two values together
//         - repeat for each corner (tl, tr, bl, br)
//         - the dx/dy value can be calculated by subtracting the current coordinates from the corner coordinates. No need to divide to get percentage because we multiply by the gradient to get the dot product
// X - linearly interpolate the four values
//         - the dx/dy value is the displacement "percentage" so take the cell x/y and subtract that from corner x/y and divide by grid_width to get the percentage
//         - essentially this turns into combining the top two corners and the bottom two corners (interpolate horizontally)
//           where tl = top left, tr = top right, bl = bottom left, br = bottom right
//           formula is: (1 - dx)*number_1 + dx*number_2
//           where number_1 is the top/bottom left corner and number_2 is the top/bottom right corner
//         - interpolate between the two vertical numbers
//           formula is: (1 - dy)*top + dy*bottom

const GRID_WIDTH = 5;
const MAX_COLUMNS = 101;
const MAX_ROWS = 51;

// todo: rename x,y to columns and rows for consistency / better understanding later on when I don't remember exactly what I'm doing

const is_on_border = (entry) => entry > 0 && entry % GRID_WIDTH === 0;
const get_difference_for_border_entry = (entry) => {
  return is_on_border(entry) ? entry - GRID_WIDTH : entry - (entry % GRID_WIDTH);
}

const get_four_corners = (row, column) => {
  const row_above = get_difference_for_border_entry(row);
  const row_below = row_above + GRID_WIDTH;

  const column_left = get_difference_for_border_entry(column);
  const column_right = column_left + GRID_WIDTH;

  return [
    [row_above, column_left],
    [row_above, column_right],
    [row_below, column_left],
    [row_below, column_right],
  ];
};

const random_direction = () => {
  return Math.random() * 2 * Math.PI;
}

const get_corner_directions = (grid, corner_coordinates) => {
  let corner_directions = [];

  corner_coordinates.forEach(([x, y]) => {
    corner_directions.push(grid[x][y]);
  });

  return corner_directions;
}

const calculate_dot_product = ([corner_x, corner_y], corner_direction, x, y) => {
  // corner_x - x gives a vector from the point to the corner
  // rather than the corner to the point
  // horizontal displacement
  let dx = x - corner_x;
  // vertical displacement
  let dy = y - corner_y;

  let gradient_x = Math.cos(corner_direction)
  let gradient_y = Math.sin(corner_direction)

  // dot product is the displacement in the x direction times the x gradient
  // PLUS the displacement in the y direction times the y gradient
  return dx * gradient_x + dy * gradient_y;
}

const calculate_interpolation = (percentage, number_1, number_2) => {
  return (1 - percentage)*number_1 + percentage*number_2;
}

const generate_grid_corner_vectors = () => {
  let grid = [];
  // generate random directions for each grid corner
  for (let i = 0; i <= MAX_ROWS; i += GRID_WIDTH) {
    grid[i] = [];
    for (let j = 0; j <= MAX_COLUMNS; j += GRID_WIDTH) {
      grid[i][j] = random_direction();
    }
  }

  return grid;
}

export const generate_perlin_grid = () => {
  let grid = [];
  let grid_corners = generate_grid_corner_vectors();

  for (let i = 0; i < MAX_ROWS; i++) {
    // we will have set the rows on grid boundaries to exist already
    // so any that do not exist will be undefined and need setting
    if (grid[i] === undefined) {
      grid[i] = [];
    }

    for (let j = 0; j < MAX_COLUMNS; j++) {
      // if (i % GRID_WIDTH == 0 && j % GRID_WIDTH == 0) {
      //   // corner, should already have a vector, skip
      //   continue;
      // }

      const [
        top_left_corner,
        top_right_corner,
        bottom_left_corner,
        bottom_right_corner
      ] = get_four_corners(i, j);

      let top_left_direction     = grid_corners[top_left_corner[0]][top_left_corner[1]];
      let top_right_direction    = grid_corners[top_right_corner[0]][top_right_corner[1]];
      let bottom_left_direction  = grid_corners[bottom_left_corner[0]][bottom_left_corner[1]];
      let bottom_right_direction = grid_corners[bottom_right_corner[0]][bottom_right_corner[1]];

      const top_left     = calculate_dot_product(top_left_corner,     top_left_direction,     i, j)
      const top_right    = calculate_dot_product(top_right_corner,    top_right_direction,    i, j)
      const bottom_left  = calculate_dot_product(bottom_left_corner,  bottom_left_direction,  i, j)
      const bottom_right = calculate_dot_product(bottom_right_corner, bottom_right_direction, i, j)

      // convert current column / row to percentages of the distance 
      // between the top left corner and current location, scaled via GRID_WIDTH
      const tx = (j - top_left_corner[1]) / GRID_WIDTH;
      const ty = (i - top_left_corner[0]) / GRID_WIDTH;

      const top = calculate_interpolation(tx, top_left, top_right);
      const bottom = calculate_interpolation(tx, bottom_left, bottom_right);
      const noise_value = calculate_interpolation(ty, top, bottom);

      grid[i][j] = noise_value;
    }
  }

  return grid;
}


const grid = generate_perlin_grid();


for (let i = 0; i < MAX_ROWS; i++) {
  let row = "";

  for (let j = 0; j < MAX_COLUMNS; j++) {
    let entry = '';
    if (grid[i][j] <= 0.5) {
      entry = ".";
    } else {
      entry = "X";
    }

    row += entry;
  }

  console.log(row);
}
