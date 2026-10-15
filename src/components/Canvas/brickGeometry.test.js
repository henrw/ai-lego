import { reflowBricks, snapPosition, findDock, connectorPoints, beamStuds, clipControlPoint } from "./brickGeometry";

const brick = (uid, x, y, stage = "task") => ({ uid, stage, position: { x, y }, height: 220 });
it("aligns positions to the stud pitch without moving beyond the board", () => {
  expect(snapPosition({ x: 51, y: 89 })).toEqual({ x: 60, y: 80 });
  expect(snapPosition({ x: -30, y: -5 })).toEqual({ x: 0, y: 0 });
});
it("docks side clips in either direction with a directed lifecycle link", () => {
  const cards = [brick("fixed", 180, 60), brick("moving", 600, 300)];
  expect(findDock("moving", { x: 460, y: 80 }, cards)).toMatchObject({ position: { x: 440, y: 60 }, link: { start: "fixed", end: "moving" } });
  const other = [brick("fixed", 500, 60), brick("moving", 600, 300)];
  expect(findDock("moving", { x: 250, y: 80 }, other)).toMatchObject({ position: { x: 240, y: 60 }, link: { start: "moving", end: "fixed" } });
});
it("does not clip far away, into occupied space, or to a note", () => {
  const cards = [brick("fixed", 180, 60), brick("moving", 600, 300)];
  expect(findDock("moving", { x: 600, y: 300 }, cards)).toBeNull();
  expect(findDock("moving", { x: 440, y: 60 }, [...cards, brick("occupied", 460, 60)])).toBeNull();
  expect(findDock("moving", { x: 440, y: 60 }, [brick("note", 180, 60, "note"), cards[1]])).toBeNull();
});
it("routes backward connections around the brick bodies and places studs on the beam", () => {
  const points = connectorPoints(brick("start", 500, 60), brick("end", 180, 340));
  expect(points[0]).toEqual({ x: 740, y: 130 });
  expect(points.at(-1)).toEqual({ x: 180, y: 410 });
  expect(points[2].y).toBeGreaterThan(280);
  expect(points[2].y).toBeLessThan(340);
  expect(beamStuds(points).every(point => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
});
it("places short-link disconnect controls in the gap between bricks", () => {
  expect(clipControlPoint(connectorPoints(brick("start", 180, 60), brick("end", 440, 60)))).toEqual({ x: 430, y: 130 });
});
it.each([
  [brick("a", 180, 60), brick("b", 740, 340)],
  [brick("a", 500, 60), brick("b", 180, 340)],
  [brick("a", 180, 60), brick("b", 440, 60)],
])("aligns every beam bend, stud and clasp to the baseplate centers", (start, end) => {
  const points = connectorPoints(start, end);
  const onGrid = value => (value - 10) % 20 === 0;
  points.slice(1, -1).forEach(point => {
    expect(onGrid(point.x)).toBe(true);
    expect(onGrid(point.y)).toBe(true);
  });
  const studs = beamStuds(points);
  studs.forEach(point => {
    expect(onGrid(point.x)).toBe(true);
    expect(onGrid(point.y)).toBe(true);
  });
  expect(new Set(studs.map(point => `${point.x},${point.y}`)).size).toBe(studs.length);
  const clasp = clipControlPoint(points);
  expect(onGrid(clasp.x)).toBe(true);
  expect(onGrid(clasp.y)).toBe(true);
});

it('routes a connector preview to the pointer and snaps it to a hovered block socket',()=>{
 const { connectorDragPoints, connectorPoints } = require('./brickGeometry');
 const start={position:{x:180,y:60},height:110};
 const point={x:630,y:280};
 expect(connectorDragPoints(start,point).at(-1)).toEqual(point);
 const target={position:{x:740,y:320},height:110};
 expect(connectorDragPoints(start,point,target)).toEqual(connectorPoints(start,target));
});

it("reflows expanded rows, cascades to later rows, and restores collapsed positions", () => {
  const original = [brick('a', 0, 0), brick('b', 260, 0), brick('c', 0, 280), brick('d', 260, 280), brick('e', 0, 560)];
  const expanded = reflowBricks(original.map(c => c.uid === 'b' ? { ...c, height: 600 } : c));
  expect(expanded.map(c => c.position.y)).toEqual([0, 0, 620, 620, 860]);
  expect(reflowBricks(original).map(c => c.position.y)).toEqual([0, 0, 280, 280, 560]);
  expect(original[2].position.y).toBe(280);
});
it("keeps unrelated columns in place and accounts for wide notes", () => {
  const cards = [{ ...brick('a', 0, 0), height: 600 }, brick('b', 520, 280)];
  expect(reflowBricks(cards)[1].position.y).toBe(280);
  expect(reflowBricks([{ ...cards[0], stage: 'note', width: 700 }, cards[1]])[1].position.y).toBe(620);
});

it("routes a tall source above its body then through the destination row gap", () => {
  const start = { ...brick('model', 1280, 60), height: 510 };
  const end = brick('train', 100, 340);
  const points = connectorPoints(start, end, [start, end, brick('data', 700, 60)]);
  expect(points).toHaveLength(8);
  expect(points[2].y).toBeLessThan(start.position.y);
  expect(points[4].y).toBeLessThan(end.position.y);
  expect(points[4].y).toBeGreaterThan(280);
  expect(points.at(-1)).toEqual({x:100,y:410});
});
