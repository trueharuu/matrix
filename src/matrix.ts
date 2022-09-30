import { inspect } from "node:util";
type ArrayLengthMutationKeys = "splice" | "push" | "pop" | "shift" | "unshift";
type FixedLengthArray<T, L extends number, TObj = [T, ...Array<T>]> = Pick<
  TObj,
  Exclude<keyof TObj, ArrayLengthMutationKeys>
> & {
  readonly length: L;
  [I: number]: T;
  [Symbol.iterator]: () => IterableIterator<T>;
};
export type MatrixContents<
  Rows extends number,
  Columns extends number
> = FixedLengthArray<FixedLengthArray<number, Columns>, Rows>;
export type MatrixLike<Rows extends number, Columns extends number> =
  | MatrixContents<Rows, Columns>
  | Matrix<Rows, Columns>;
export class Matrix<Rows extends number, Columns extends number> {
  public readonly data: MatrixContents<Rows, Columns>;
  constructor(data: MatrixLike<Rows, Columns>) {
    if (Array.isArray(data)) {
      this.data = data as never;
    } else {
      this.data = (data as Matrix<Rows, Columns>).data;
    }
  }

  public get rowCount(): Rows {
    return this.data.length;
  }

  public get columnCount(): Columns {
    return this.data.at(0)!.length;
  }

  public get(row: number, column: number) {
    if (!(row in this.data) || !(column in this.data[row]!)) {
      throw new RangeError("Out of bounds");
    }

    return this.data[row]![column]!;
  }

  public put(row: number, column: number, value: number) {
    if (!(row in this.data) || !(column in this.data[row]!)) {
      throw new RangeError("Out of bounds");
    }

    this.data[row]![column] = value;
    return this;
  }

  public forEach(
    callback: (value: number, x: number, y: number, self: this) => unknown
  ) {
    for (let x = 0; x < this.rowCount; x++) {
      for (let y = 0; y < this.columnCount; y++) {
        callback(this.get(x, y), x, y, this);
        continue;
      }
    }

    return this;
  }

  public map(
    callback: (value: number, x: number, y: number, self: this) => number
  ) {
    const id = Matrix.empty(this.rowCount, this.columnCount);
    this.forEach((value, x, y, self) => {
      id.put(x, y, callback(value, x, y, self));
    });
    return id;
  }

  public add(matrix: MatrixLike<Rows, Columns>): Matrix<Rows, Columns> {
    matrix = Matrix.from(matrix);

    if (
      this.rowCount !== matrix.rowCount ||
      this.columnCount !== matrix.columnCount
    ) {
      throw new RangeError("Matricies must be the same size");
    }

    const id = Matrix.empty(this.rowCount, this.columnCount);

    return id.map((value, x, y) => {
      return value + (matrix as Matrix<Rows, Columns>).get(x, y);
    });
  }

  public scalar(value: number) {
    const id = this;

    return id.map((content) => {
      return value * content;
    });
  }

  public row(row: number) {
    return this.data[row];
  }

  public column(column: number) {
    return this.data.map((x) => x[column]!);
  }

  public multiply<U extends number>(
    matrix: MatrixLike<Columns, U>
  ): Matrix<Rows, U> {
    matrix = Matrix.from(matrix);

    if (this.columnCount !== matrix.rowCount) {
      throw new RangeError("Matricies are ineligible for multiplication");
    }

    // https://stackoverflow.com/questions/27205018/multiply-2-matrices-in-javascript

    var ar = this.rowCount,
      ac = this.columnCount,
      bc = matrix.columnCount,
      m = new Array(ar); // initialize array of rows

    for (var r = 0; r < ar; ++r) {
      m[r] = new Array(bc); // initialize the current row
      for (var c = 0; c < bc; ++c) {
        m[r][c] = 0; // initialize the current cell
        for (var i = 0; i < ac; ++i) {
          m[r][c] += this.data[r]![i]! * matrix.data[i]![c]!;
        }
      }
    }

    return Matrix.from(m as never) as never;
  }

  public determinant(this: Matrix<Rows, Rows>) {
    if (this.rowCount !== this.columnCount) {
      throw new RangeError("Matrix must be square");
    }

    const size = this.rowCount;

    switch (size) {
      case 0:
        return NaN;
      case 1:
        return this.get(0, 0);

      case 2:
        return (
          this.get(0, 0) * this.get(1, 1) - this.get(0, 1) * this.get(1, 0)
        );

      default: {
        // @serendipity go ahead. i have no fucking clue.
        return 0;
      }
    }
  }

  public pow(this: Matrix<Rows, Rows>, amount: number) {
    if (this.rowCount !== this.columnCount) {
      throw new RangeError("Matricies must be square");
    }

    let id = this;

    while (--amount) {
      id = id.multiply(this);
    }

    return id;
  }

  public static from<Rows extends number, Columns extends number>(
    matrix: MatrixLike<Rows, Columns>
  ): Matrix<Rows, Columns> {
    return new this(matrix);
  }

  public static empty<Rows extends number, Columns extends number>(
    rows: Rows,
    columns: Columns
  ): Matrix<Rows, Columns> {
    return this.from<Rows, Columns>(
      new Array(rows).fill(new Array(columns).fill(0)) as never
    );
  }

  public static identity<U extends number>(size: U): Matrix<U, U> {
    const id = this.empty(size, size);
    return id.map((_, x, y) => (x === y ? 1 : 0));
  }

  public toString() {
    const hl = "┌";
    const hr = "┐";
    const ln = "│";
    const bl = "└";
    const br = "┘";

    let longest = "";
    this.forEach((value) => {
      if (value.toString().length > longest.length) {
        longest = value.toString();
      }
    });

    const rows = this.data.map(
      (x) =>
        `${ln} ` +
        x
          .map((v) =>
            v
              .toString()
              .padStart((v.toString().length + longest.length) / 2)
              .padEnd(longest.length)
          )
          .join(" ") +
        ` ${ln}`
    );

    return (
      `${hl} ${" ".repeat(
        longest.length * this.columnCount + this.columnCount - 1
      )} ${hr}\n` +
      rows.join("\n") +
      `\n${bl} ${" ".repeat(
        longest.length * this.columnCount + this.columnCount - 1
      )} ${br}\n`
    );
  }

  //ELEMENTARY ROW OPERATIONS
  //swaps row1 with row2
  permute(row1: number, row2: number) {
    const temp = this.row(row1);
    //@ts-ignore
    this.data[row1] = this.data[row2];
    //@ts-ignore
    this.data[row2] = temp;
  } 
  multiplyRow(row1: number, mul: number) {
     const row = this.row(row1)!;
     const updatedRow = row.map(r => r * mul);
     //@ts-ignore
     this.data[row1] = updatedRow;
  }
  //add to manipulated row the multiplication of another row
  addRow({ manipulated, row2: [r2, multiplyfact] }: { manipulated: number; row2 : [r2: number, mul: number]}) {
    const rowManipulated = this.row(manipulated)!;
    const byRowxFactor = this.row(r2)!.map(n => n * multiplyfact);
    for(let i = 0; i < byRowxFactor.length; i++) {
      rowManipulated[i] += byRowxFactor[i]!
    }
  }

  [inspect.custom]() {
    return this.toString();
  }

  get [Symbol.toStringTag]() {
    return this.toString();
  }
}
