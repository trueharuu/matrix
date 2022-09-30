import { Matrix } from "./matrix";

const m = new Matrix<2, 2>([
  [1, 2],
  [3, 4],
]);

console.log(m.pow(3).toString());
