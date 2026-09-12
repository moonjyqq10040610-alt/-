export interface SceneBox { x: number; y: number; w: number; h: number; }
export interface CameraGeometry { width: number; height: number; sceneWidth: number; sceneHeight: number; sceneLeft: number; sceneTop: number; }
/** The actual room is transformed, so the object and its surroundings stay together. */
export function focusCamera(g: CameraGeometry, target: SceneBox) {
  if (g.width <= 0 || g.height <= 0 || g.sceneWidth <= 0 || g.sceneHeight <= 0 || target.w <= 0 || target.h <= 0) return { x: 0, y: 0, scale: 1 };
  const narrow = g.width < 650;
  const compact = g.height < 650;
  const heightShare = compact ? .43 : .57;
  const centerY = compact ? .32 : .39;
  const scale = Math.max(1, Math.min(6.5, Math.min(g.width * (narrow ? .8 : .58), 720) / (g.sceneWidth * target.w / 100), g.height * heightShare / (g.sceneHeight * target.h / 100)));
  const cx = g.sceneWidth * (target.x + target.w/2) / 100;
  const cy = g.sceneHeight * (target.y + target.h/2) / 100;
  return { scale, x: g.width * .5 - g.sceneLeft - cx * scale, y: g.height * centerY - g.sceneTop - cy * scale };
}
export function clockwiseDelta(previous: number, next: number) {
  let delta = next - previous;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}
export function advancePhoto(current: number, length: number) { return length ? (current + 1) % length : 0; }
