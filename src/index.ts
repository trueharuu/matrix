import { Matrix } from "./matrix";

const m = new Matrix<2, 2>([
  [1, 2],
  [3, 4],
]);
//supposed to start at index 1 btw for rows and columns :troll:
console.log(m)
m.permute(0,1)
console.log(m)
m.multiplyRow(1,4)
console.log(m)
m.addRow({ manipulated: 0, row2: [1, -2] })
console.log(m)