/** Smooth breath energy; reject a single click and require sustained sound. */
export class BreathDetector {
  private energy = 0;
  private duration = 0;
  sample(rms: number, elapsedMs: number) {
    const safeRms = Number.isFinite(rms) ? Math.max(0, rms) : 0;
    const dt = Math.max(0, Math.min(50, elapsedMs));
    this.energy = this.energy * .72 + safeRms * .28;
    this.duration = this.energy > .075 ? this.duration + dt : Math.max(0, this.duration - dt * 2);
    return { intensity: Math.min(1, this.energy * 6), extinguished: this.duration > 450 };
  }
}
