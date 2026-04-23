import { AXIS_DEFINITIONS } from "@mygobti/quiz-core";

export function normalizeAxis(value: number): number {
  return ((Math.tanh(value / 3) + 1) / 2) * 100;
}

export function toPercent(score: number): string {
  return `${Math.round(((score + 1) / 2) * 100)}%`;
}

export function formatAxisValue(value: number): string {
  return value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

export function describeAxis(axisId: string, value: number): string {
  const axis = AXIS_DEFINITIONS.find((item) => item.id === axisId);

  if (!axis) {
    return "维度读取中";
  }

  const leaningLabel = value >= 0 ? axis.highLabel : axis.lowLabel;
  const intensity = Math.abs(value);

  if (intensity >= 2.4) {
    return `非常偏向${leaningLabel}`;
  }

  if (intensity >= 1.2) {
    return `明显偏向${leaningLabel}`;
  }

  return `略偏向${leaningLabel}`;
}

export function describeAxisGap(distance: number): string {
  if (distance <= 0.5) {
    return "几乎重合";
  }

  if (distance <= 1.2) {
    return "有一点偏差";
  }

  if (distance <= 2) {
    return "差异明显";
  }

  return "完全不是一挂";
}
