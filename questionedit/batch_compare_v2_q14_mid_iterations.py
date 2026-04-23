#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path("/home/carl/MYGObti/questionedit")
EVAL_SCRIPT = ROOT / "eval_question_v2.py"
PLAN_PATH = ROOT / "plans" / "v2-modification-plan.md"
REPORTS_DIR = ROOT / "reports"

VERSION_SPECS = {
    "C": {
        "label": "C",
        "source": ROOT / "candidates" / "questionnewV2_1C.md",
        "report": REPORTS_DIR / "V2_1C-EVAL-REPORT.md",
        "json": REPORTS_DIR / "V2_1C-EVAL-SUMMARY.json",
        "changes": "冻结版 C：保留 Q18 补丁，并以当前 Q14 中间档位为基线",
    },
    "C1": {
        "label": "C1",
        "source": ROOT / "candidates" / "questionnewV2_1C1.md",
        "report": REPORTS_DIR / "V2_1C1-EVAL-REPORT.md",
        "json": REPORTS_DIR / "V2_1C1-EVAL-SUMMARY.json",
        "changes": "只把 Q14.B 从 -0.2 微调到 -0.1",
    },
    "C2": {
        "label": "C2",
        "source": ROOT / "candidates" / "questionnewV2_1C2.md",
        "report": REPORTS_DIR / "V2_1C2-EVAL-REPORT.md",
        "json": REPORTS_DIR / "V2_1C2-EVAL-SUMMARY.json",
        "changes": "只把 Q14.D 从 +0.4 微调到 +0.5",
    },
}

SAYOSAKI_PAIR = "长崎爽世 vs 丰川祥子"
RISK_PAIRS = [
    "若叶睦 vs 高松灯",
    "三角初华 vs 椎名立希",
    "千早爱音 vs 高松灯",
]
FOCUS_ROLES = ["长崎爽世", "丰川祥子"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compare historical C-stage Q14 micro-iterations without treating them as the current D mainline."
    )
    parser.add_argument("--seed", type=int, default=20260415)
    parser.add_argument("--monte-carlo", type=int, default=100_000)
    parser.add_argument("--noise-trials", type=int, default=1_200)
    parser.add_argument("--pair-trials", type=int, default=800)
    parser.add_argument(
        "--output-markdown",
        default=str(REPORTS_DIR / "V2_1C-Q14-MID-COMPARISON.md"),
    )
    parser.add_argument(
        "--output-json",
        default=str(REPORTS_DIR / "V2_1C-Q14-MID-COMPARISON.json"),
    )
    args = parser.parse_args()

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    evaluations = {}
    for version_key, spec in VERSION_SPECS.items():
        run_eval(spec, args)
        evaluations[version_key] = json.loads(spec["json"].read_text(encoding="utf-8"))

    comparison = build_comparison(evaluations, args)
    Path(args.output_markdown).write_text(render_markdown(comparison, args), encoding="utf-8")
    Path(args.output_json).write_text(
        json.dumps(comparison, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Comparison report written to {args.output_markdown}")
    print(f"Comparison json written to {args.output_json}")


def run_eval(spec: dict[str, object], args: argparse.Namespace) -> None:
    cmd = [
        sys.executable,
        str(EVAL_SCRIPT),
        "--source",
        str(spec["source"]),
        "--plan",
        str(PLAN_PATH),
        "--output-report",
        str(spec["report"]),
        "--output-json",
        str(spec["json"]),
        "--seed",
        str(args.seed),
        "--monte-carlo",
        str(args.monte_carlo),
        "--noise-trials",
        str(args.noise_trials),
        "--pair-trials",
        str(args.pair_trials),
    ]
    subprocess.run(cmd, check=True)


def build_comparison(evaluations: dict[str, dict], args: argparse.Namespace) -> dict:
    base = evaluations["C"]
    base_pair = base["pairAnalysis"][SAYOSAKI_PAIR]
    base_recovery = {role: base["targeted"][role]["noisyRecoveryRate"] for role in FOCUS_ROLES}

    versions = {}
    scores = {"C": 0.0}
    for key, result in evaluations.items():
        sayosaki = result["pairAnalysis"][SAYOSAKI_PAIR]
        recovery = {role: result["targeted"][role]["noisyRecoveryRate"] for role in FOCUS_ROLES}
        trigger_rate = result["monteCarlo"]["tieBreakerTriggerRate"]
        flip_rate = result["monteCarlo"]["tieBreakerFlipRateWithinTriggered"]
        distribution = result["monteCarlo"]["finalDistribution"]
        disappearing = sorted([role for role, share in distribution.items() if share < 0.05])
        magnets = sorted([role for role, share in distribution.items() if share > 0.20])
        min_role, min_share = min(distribution.items(), key=lambda item: item[1])
        max_role, max_share = max(distribution.items(), key=lambda item: item[1])

        other_pairs = {}
        regressions = []
        for pair in RISK_PAIRS:
            info = result["pairAnalysis"][pair]
            base_info = base["pairAnalysis"][pair]
            pair_delta = info["pairOnlyAccuracy"] - base_info["pairOnlyAccuracy"]
            full_delta = info["fullModelAccuracy"] - base_info["fullModelAccuracy"]
            noticeable = pair_delta < -0.03 or full_delta < -0.03
            if noticeable:
                regressions.append(pair)
            other_pairs[pair] = {
                "pairOnlyAccuracy": info["pairOnlyAccuracy"],
                "pairOnlyDeltaVsC": pair_delta,
                "fullModelAccuracy": info["fullModelAccuracy"],
                "fullModelDeltaVsC": full_delta,
                "noticeableRegression": noticeable,
            }

        versions[key] = {
            "label": VERSION_SPECS[key]["label"],
            "changes": VERSION_SPECS[key]["changes"],
            "sayosaki": {
                "pairOnlyAccuracy": sayosaki["pairOnlyAccuracy"],
                "pairOnlyDeltaVsC": sayosaki["pairOnlyAccuracy"] - base_pair["pairOnlyAccuracy"],
                "fullModelAccuracy": sayosaki["fullModelAccuracy"],
                "fullModelDeltaVsC": sayosaki["fullModelAccuracy"] - base_pair["fullModelAccuracy"],
                "tieBreakerTriggerRate": sayosaki["tieBreakerTriggerRate"],
            },
            "focusRecovery": {
                role: {
                    "rate": recovery[role],
                    "deltaVsC": recovery[role] - base_recovery[role],
                }
                for role in FOCUS_ROLES
            },
            "tieBreakerHealth": {
                "overallTriggerRate": trigger_rate,
                "flipRateWithinTriggered": flip_rate,
            },
            "distribution": {
                "minShareRole": min_role,
                "minShare": min_share,
                "maxShareRole": max_role,
                "maxShare": max_share,
                "disappearingRolesBelow5Percent": disappearing,
                "magnetRolesAbove20Percent": magnets,
            },
            "otherRiskPairs": other_pairs,
            "noticeableRegressions": regressions,
        }

        if key != "C":
            score = (
                (sayosaki["pairOnlyAccuracy"] - base_pair["pairOnlyAccuracy"]) * 100
                + (recovery["长崎爽世"] - base_recovery["长崎爽世"]) * 100
                + (recovery["丰川祥子"] - base_recovery["丰川祥子"]) * 100
                + (sayosaki["fullModelAccuracy"] - base_pair["fullModelAccuracy"]) * 40
                - len(regressions) * 3
            )
            if disappearing or magnets:
                score -= 5
            if not (0.08 <= trigger_rate <= 0.12):
                score -= 3
            scores[key] = round(score, 6)

    recommended = max(scores, key=scores.get)
    rationale = build_rationale(versions, recommended)

    return {
        "meta": {
            "seed": args.seed,
            "monteCarlo": args.monte_carlo,
            "noiseTrials": args.noise_trials,
            "pairTrials": args.pair_trials,
            "reportMode": "historical_c_stage_comparison",
            "currentMainline": "D",
            "doNotUseAsCurrentMainlineDecision": True,
        },
        "versions": versions,
        "candidateScores": scores,
        "recommendedVersion": recommended,
        "recommendationReason": rationale,
    }


def build_rationale(versions: dict[str, dict], recommended: str) -> str:
    if recommended == "C":
        return "两次 `0.1` 级中间档位微调都明显伤到了目标对，冻结版 `C` 仍然最好。"
    row = versions[recommended]
    if row["noticeableRegressions"]:
        return "虽然仍有副作用，但综合目标对提升幅度后它仍然最值得继续跟。"
    return "它在不引入明显副作用的前提下，对 `爽世 vs 祥子` 和双角色回收的改善最实。"


def render_markdown(comparison: dict, args: argparse.Namespace) -> str:
    versions = comparison["versions"]
    recommended = comparison["recommendedVersion"]
    lines = []
    lines.append("# V2.1C 历史 Q14 中间档位微调对比")
    lines.append("")
    lines.append("## 使用边界")
    lines.append("")
    lines.append("- 本报告只用于复盘 `C / C1 / C2` 的历史试验，不代表当前主线应回退到 `C`。")
    lines.append("- 当前主线仍是 `D`，这里的输出只说明 `C` 阶段内部谁更优。")
    lines.append("")
    lines.append("## 历史对比结论")
    lines.append("")
    lines.append(f"- 在 `C` 阶段历史比较里，最优候选是 **{recommended}**。{comparison['recommendationReason']}")
    lines.append(
        f"- 评估配置：固定随机种子 `{args.seed}`，Monte Carlo `{args.monte_carlo:,}`，轻噪声 `{args.noise_trials}` 次/角色，pair-focused `{args.pair_trials}` 次/角色。"
    )
    lines.append("")
    lines.append("## 本轮改动")
    lines.append("")
    for key in ["C", "C1", "C2"]:
        lines.append(f"- `{key}`：{versions[key]['changes']}")
    lines.append("")
    lines.append("## 紧凑对比表")
    lines.append("")
    lines.append("| 版本 | 爽世/祥子 pair-only | 相对 C | full-model | 爽世轻噪声 | 祥子轻噪声 | tie 触发率 | 其他高风险明显恶化数 |")
    lines.append("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |")
    for key in ["C", "C1", "C2"]:
        row = versions[key]
        lines.append(
            f"| {row['label']} | {row['sayosaki']['pairOnlyAccuracy']:.4%} | {row['sayosaki']['pairOnlyDeltaVsC']:+.4%} | {row['sayosaki']['fullModelAccuracy']:.4%} | {row['focusRecovery']['长崎爽世']['rate']:.4%} | {row['focusRecovery']['丰川祥子']['rate']:.4%} | {row['tieBreakerHealth']['overallTriggerRate']:.4%} | {len(row['noticeableRegressions'])} |"
        )
    lines.append("")
    lines.append("## 逐版判断")
    lines.append("")
    for key in ["C", "C1", "C2"]:
        row = versions[key]
        lines.append(f"### {row['label']}")
        lines.append("")
        lines.append(
            f"- `爽世 vs 祥子`：pair-only `{row['sayosaki']['pairOnlyAccuracy']:.4%}`，相对 C `{row['sayosaki']['pairOnlyDeltaVsC']:+.4%}`；full-model `{row['sayosaki']['fullModelAccuracy']:.4%}`。"
        )
        lines.append(
            f"- 轻噪声回收：爽世 `{row['focusRecovery']['长崎爽世']['rate']:.4%}`，祥子 `{row['focusRecovery']['丰川祥子']['rate']:.4%}`。"
        )
        lines.append(
            f"- tie-breaker：总体触发 `{row['tieBreakerHealth']['overallTriggerRate']:.4%}`，触发后 flip `{row['tieBreakerHealth']['flipRateWithinTriggered']:.4%}`。"
        )
        lines.append(
            f"- 全局分布：最低 `{row['distribution']['minShareRole']} {row['distribution']['minShare']:.4%}`，最高 `{row['distribution']['maxShareRole']} {row['distribution']['maxShare']:.4%}`。"
        )
        if row["noticeableRegressions"]:
            lines.append(f"- 明显恶化：{', '.join(row['noticeableRegressions'])}。")
        else:
            lines.append("- 其他高风险角色对没有出现明显恶化。")
        lines.append("")
    lines.append("## 附注")
    lines.append("")
    lines.append("- 单版本详细报告同步输出到 `V2_1C1-EVAL-*`、`V2_1C2-EVAL-*`。")
    lines.append("- 本报告由 `batch_compare_v2_q14_mid_iterations.py` 自动生成。")
    lines.append("- 它只用于历史复盘，不应作为当前 `D` 主线的继续实验指令。")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    main()
