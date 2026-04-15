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
    "baseline": {
        "label": "baseline",
        "source": ROOT / "questionnewV2.md",
        "report": REPORTS_DIR / "V2_1-baseline-EVAL-REPORT.md",
        "json": REPORTS_DIR / "V2_1-baseline-EVAL-SUMMARY.json",
        "changes": "基线，不做额外修改",
    },
    "A": {
        "label": "A",
        "source": ROOT / "candidates" / "questionnewV2_1A.md",
        "report": REPORTS_DIR / "V2_1A-EVAL-REPORT.md",
        "json": REPORTS_DIR / "V2_1A-EVAL-SUMMARY.json",
        "changes": "仅把 priorityPair lambda 从 0.12 调到 0.14",
    },
    "B": {
        "label": "B",
        "source": ROOT / "candidates" / "questionnewV2_1B.md",
        "report": REPORTS_DIR / "V2_1B-EVAL-REPORT.md",
        "json": REPORTS_DIR / "V2_1B-EVAL-SUMMARY.json",
        "changes": "继承 A，并只重写 Q18 的题面与 latentDelta",
    },
    "C": {
        "label": "C",
        "source": ROOT / "candidates" / "questionnewV2_1C.md",
        "report": REPORTS_DIR / "V2_1C-EVAL-REPORT.md",
        "json": REPORTS_DIR / "V2_1C-EVAL-SUMMARY.json",
        "changes": "继承 B，并只再改 1 道主轴题 Q14",
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
        description="Run baseline/A/B/C evaluation and generate a single comparison report."
    )
    parser.add_argument("--seed", type=int, default=20260415)
    parser.add_argument("--monte-carlo", type=int, default=100_000)
    parser.add_argument("--noise-trials", type=int, default=1_200)
    parser.add_argument("--pair-trials", type=int, default=800)
    parser.add_argument(
        "--output-markdown",
        default=str(REPORTS_DIR / "V2_1-COMPARISON.md"),
    )
    parser.add_argument(
        "--output-json",
        default=str(REPORTS_DIR / "V2_1-COMPARISON.json"),
    )
    args = parser.parse_args()

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    evaluations = {}
    for version_key, spec in VERSION_SPECS.items():
        run_eval(spec, args)
        evaluations[version_key] = json.loads(spec["json"].read_text(encoding="utf-8"))

    comparison = build_comparison(evaluations, args)

    output_markdown = Path(args.output_markdown)
    output_json = Path(args.output_json)
    output_markdown.write_text(render_markdown(comparison, args), encoding="utf-8")
    output_json.write_text(
        json.dumps(comparison, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Comparison report written to {output_markdown}")
    print(f"Comparison json written to {output_json}")


def run_eval(spec: dict[str, object], args: argparse.Namespace) -> None:
    source = Path(spec["source"])
    output_report = Path(spec["report"])
    output_json = Path(spec["json"])
    cmd = [
        sys.executable,
        str(EVAL_SCRIPT),
        "--source",
        str(source),
        "--plan",
        str(PLAN_PATH),
        "--output-report",
        str(output_report),
        "--output-json",
        str(output_json),
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
    baseline = evaluations["baseline"]
    baseline_pair = baseline["pairAnalysis"][SAYOSAKI_PAIR]
    baseline_recovery = {
        role: baseline["targeted"][role]["noisyRecoveryRate"] for role in FOCUS_ROLES
    }
    baseline_other_pairs = {
        pair: baseline["pairAnalysis"][pair] for pair in RISK_PAIRS
    }

    versions = {}
    candidate_scores = {}
    for version_key, result in evaluations.items():
        sayosaki = result["pairAnalysis"][SAYOSAKI_PAIR]
        trigger_rate = result["monteCarlo"]["tieBreakerTriggerRate"]
        flip_rate = result["monteCarlo"]["tieBreakerFlipRateWithinTriggered"]
        distribution = result["monteCarlo"]["finalDistribution"]
        min_share_role, min_share = min(distribution.items(), key=lambda item: item[1])
        max_share_role, max_share = max(distribution.items(), key=lambda item: item[1])
        disappearing = sorted([role for role, share in distribution.items() if share < 0.05])
        magnets = sorted([role for role, share in distribution.items() if share > 0.20])
        recovery = {
            role: result["targeted"][role]["noisyRecoveryRate"] for role in FOCUS_ROLES
        }
        recovery_delta = {
            role: recovery[role] - baseline_recovery[role] for role in FOCUS_ROLES
        }

        other_pairs = {}
        other_pair_penalty = 0.0
        for pair in RISK_PAIRS:
            info = result["pairAnalysis"][pair]
            base_info = baseline_other_pairs[pair]
            pair_only_delta = info["pairOnlyAccuracy"] - base_info["pairOnlyAccuracy"]
            full_model_delta = info["fullModelAccuracy"] - base_info["fullModelAccuracy"]
            noticeable_regression = pair_only_delta < -0.03 or full_model_delta < -0.03
            if noticeable_regression:
                other_pair_penalty += 1.0
            other_pairs[pair] = {
                "pairOnlyAccuracy": info["pairOnlyAccuracy"],
                "fullModelAccuracy": info["fullModelAccuracy"],
                "pairOnlyDeltaVsBaseline": pair_only_delta,
                "fullModelDeltaVsBaseline": full_model_delta,
                "noticeableRegression": noticeable_regression,
            }

        pass_line = (
            version_key != "baseline"
            and sayosaki["pairOnlyAccuracy"] > baseline_pair["pairOnlyAccuracy"]
            and all(recovery_delta[role] > 0 for role in FOCUS_ROLES)
            and 0.08 <= trigger_rate <= 0.12
            and not disappearing
            and not magnets
        )

        versions[version_key] = {
            "label": VERSION_SPECS[version_key]["label"],
            "source": str(VERSION_SPECS[version_key]["source"]),
            "changes": VERSION_SPECS[version_key]["changes"],
            "sayosaki": {
                "pairOnlyAccuracy": sayosaki["pairOnlyAccuracy"],
                "pairOnlyDeltaVsBaseline": (
                    sayosaki["pairOnlyAccuracy"] - baseline_pair["pairOnlyAccuracy"]
                ),
                "fullModelAccuracy": sayosaki["fullModelAccuracy"],
                "fullModelDeltaVsBaseline": (
                    sayosaki["fullModelAccuracy"] - baseline_pair["fullModelAccuracy"]
                ),
                "tieBreakerTriggerRate": sayosaki["tieBreakerTriggerRate"],
            },
            "focusRecovery": {
                role: {
                    "rate": recovery[role],
                    "deltaVsBaseline": recovery_delta[role],
                }
                for role in FOCUS_ROLES
            },
            "tieBreakerHealth": {
                "overallTriggerRate": trigger_rate,
                "flipRateWithinTriggered": flip_rate,
            },
            "distribution": {
                "finalDistribution": distribution,
                "disappearingRolesBelow5Percent": disappearing,
                "magnetRolesAbove20Percent": magnets,
                "minShareRole": min_share_role,
                "minShare": min_share,
                "maxShareRole": max_share_role,
                "maxShare": max_share,
            },
            "otherRiskPairs": other_pairs,
            "passLine": pass_line,
            "verdict": result["verdict"]["verdict"],
        }

        if version_key == "baseline":
            continue

        tie_penalty = 0.0
        if trigger_rate < 0.08:
            tie_penalty += (0.08 - trigger_rate) * 20
        elif trigger_rate > 0.12:
            tie_penalty += (trigger_rate - 0.12) * 20
        if disappearing:
            tie_penalty += 1.5 * len(disappearing)
        if magnets:
            tie_penalty += 1.5 * len(magnets)

        score = (
            (sayosaki["pairOnlyAccuracy"] - baseline_pair["pairOnlyAccuracy"]) * 100
            + (recovery_delta["长崎爽世"] + recovery_delta["丰川祥子"]) * 100
            + (sayosaki["fullModelAccuracy"] - baseline_pair["fullModelAccuracy"]) * 40
            - other_pair_penalty * 2.0
            - tie_penalty
        )
        candidate_scores[version_key] = round(score, 6)

    passing_candidates = [
        key for key in ["A", "B", "C"] if versions[key]["passLine"]
    ]
    if passing_candidates:
        recommended = max(
            passing_candidates,
            key=lambda key: (
                versions[key]["sayosaki"]["pairOnlyAccuracy"],
                versions[key]["focusRecovery"]["长崎爽世"]["rate"]
                + versions[key]["focusRecovery"]["丰川祥子"]["rate"],
                -len(versions[key]["distribution"]["disappearingRolesBelow5Percent"]),
                -len(versions[key]["distribution"]["magnetRolesAbove20Percent"]),
            ),
        )
        recommendation_reason = "满足通过线，且在通过版本里对 `爽世 vs 祥子` 提升最稳。"
    else:
        recommended = max(candidate_scores, key=candidate_scores.get)
        recommendation_reason = "没有版本完全达线，按重点角色对提升、双角色回收改善与全局副作用综合后最值得继续迭代。"

    next_patch = build_next_patch(versions, recommended)

    return {
        "meta": {
            "seed": args.seed,
            "monteCarlo": args.monte_carlo,
            "noiseTrials": args.noise_trials,
            "pairTrials": args.pair_trials,
            "evaluator": str(EVAL_SCRIPT),
        },
        "versions": versions,
        "candidateScores": candidate_scores,
        "recommendedVersion": recommended,
        "recommendationReason": recommendation_reason,
        "nextPatchSuggestion": next_patch,
    }


def build_next_patch(versions: dict[str, dict], recommended: str) -> list[str]:
    chosen = versions[recommended]
    suggestions = []
    if chosen["tieBreakerHealth"]["overallTriggerRate"] < 0.08:
        suggestions.append("保留当前题面补丁，优先把 `enabledWhenTop2DiffBelow` 从 `0.08` 轻推到 `0.085` 试一次。")
    elif chosen["tieBreakerHealth"]["overallTriggerRate"] > 0.12:
        suggestions.append("保留当前题面补丁，优先把 `priorityPair lambda` 从 `0.14` 微回落到 `0.13` 复测。")

    if chosen["focusRecovery"]["长崎爽世"]["deltaVsBaseline"] <= 0:
        suggestions.append("下一轮仍优先补 `爽世`，建议只再微调 `Q14` 的中档选项，让“有分寸地打开一点”更稳定落在半开区间。")
    if chosen["focusRecovery"]["丰川祥子"]["deltaVsBaseline"] <= 0:
        suggestions.append("下一轮仍优先补 `祥子`，建议只再压低 `Q18` 的服务侧中档，使“兜底但不接管”与强服务更贴近。")

    if not suggestions:
        suggestions.append("下一轮先冻结当前补丁组合，只围绕 `Q14` 或 `Q18` 的单档位做 `0.1` 级微调，不要同时再开新题。")
    return suggestions


def render_markdown(comparison: dict, args: argparse.Namespace) -> str:
    versions = comparison["versions"]
    recommended = comparison["recommendedVersion"]
    lines = []
    lines.append("# V2.1 A/B/C 对比报告")
    lines.append("")
    lines.append("## 结论")
    lines.append("")
    lines.append(
        f"- 推荐继续推进：**{recommended}**。{comparison['recommendationReason']}"
    )
    lines.append(
        f"- 评估配置：固定随机种子 `{args.seed}`，Monte Carlo `{args.monte_carlo:,}`，轻噪声 `{args.noise_trials}` 次/角色，pair-focused `{args.pair_trials}` 次/角色。"
    )
    lines.append("")
    lines.append("## 版本改动")
    lines.append("")
    for key in ["A", "B", "C"]:
        lines.append(f"- `{key}`：{versions[key]['changes']}")
    lines.append("")
    lines.append("## 核心对比表")
    lines.append("")
    lines.append("| 版本 | 爽世/祥子 pair-only | 相对 baseline | full-model | 爽世轻噪声 | 祥子轻噪声 | 总体 tie 触发率 | 触发后 flip rate | 最低占比 | 最高占比 |")
    lines.append("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |")
    for key in ["baseline", "A", "B", "C"]:
        row = versions[key]
        lines.append(
            f"| {row['label']} | {row['sayosaki']['pairOnlyAccuracy']:.4%} | {row['sayosaki']['pairOnlyDeltaVsBaseline']:+.4%} | {row['sayosaki']['fullModelAccuracy']:.4%} | {row['focusRecovery']['长崎爽世']['rate']:.4%} | {row['focusRecovery']['丰川祥子']['rate']:.4%} | {row['tieBreakerHealth']['overallTriggerRate']:.4%} | {row['tieBreakerHealth']['flipRateWithinTriggered']:.4%} | {row['distribution']['minShareRole']} {row['distribution']['minShare']:.4%} | {row['distribution']['maxShareRole']} {row['distribution']['maxShare']:.4%} |"
        )
    lines.append("")
    lines.append("## 其他高风险角色对")
    lines.append("")
    lines.append("| 版本 | 睦/灯 pair-only | 初华/立希 pair-only | 爱音/灯 pair-only | 明显恶化数 |")
    lines.append("| --- | ---: | ---: | ---: | ---: |")
    for key in ["baseline", "A", "B", "C"]:
        row = versions[key]
        regressions = sum(
            1 for info in row["otherRiskPairs"].values() if info["noticeableRegression"]
        )
        lines.append(
            f"| {row['label']} | {row['otherRiskPairs']['若叶睦 vs 高松灯']['pairOnlyAccuracy']:.4%} | {row['otherRiskPairs']['三角初华 vs 椎名立希']['pairOnlyAccuracy']:.4%} | {row['otherRiskPairs']['千早爱音 vs 高松灯']['pairOnlyAccuracy']:.4%} | {regressions} |"
        )
    lines.append("")
    lines.append("## 逐版判断")
    lines.append("")
    for key in ["baseline", "A", "B", "C"]:
        row = versions[key]
        bad_distribution = row["distribution"]["disappearingRolesBelow5Percent"] + row["distribution"]["magnetRolesAbove20Percent"]
        status = "通过线" if row["passLine"] else "未过线"
        lines.append(f"### {row['label']}")
        lines.append("")
        lines.append(
            f"- `爽世 vs 祥子`：pair-only `{row['sayosaki']['pairOnlyAccuracy']:.4%}`，相对 baseline `{row['sayosaki']['pairOnlyDeltaVsBaseline']:+.4%}`；full-model `{row['sayosaki']['fullModelAccuracy']:.4%}`。"
        )
        lines.append(
            f"- 轻噪声回收：爽世 `{row['focusRecovery']['长崎爽世']['rate']:.4%}`，祥子 `{row['focusRecovery']['丰川祥子']['rate']:.4%}`。"
        )
        lines.append(
            f"- tie-breaker 健康度：总体触发 `{row['tieBreakerHealth']['overallTriggerRate']:.4%}`，触发后 flip `{row['tieBreakerHealth']['flipRateWithinTriggered']:.4%}`。"
        )
        if bad_distribution:
            lines.append(f"- 全局分布风险：{', '.join(bad_distribution)}。")
        else:
            lines.append("- 全局分布没有出现 `<5%` 近消失角色，也没有出现 `>20%` 吸星角色。")
        regressions = [
            pair for pair, info in row["otherRiskPairs"].items() if info["noticeableRegression"]
        ]
        if regressions:
            lines.append(f"- 其他高风险对有明显恶化：{', '.join(regressions)}。")
        else:
            lines.append("- 其他高风险角色对没有出现明确的结构性恶化。")
        lines.append(f"- 判定：`{status}`。")
        lines.append("")
    lines.append("## 下一轮最小补丁建议")
    lines.append("")
    for suggestion in comparison["nextPatchSuggestion"]:
        lines.append(f"- {suggestion}")
    lines.append("")
    lines.append("## 附注")
    lines.append("")
    lines.append("- 单版本详细报告已同时输出到 `reports/V2_1*-EVAL-REPORT.md` 与对应 JSON。")
    lines.append("- 本对比报告由 `batch_compare_v2_candidates.py` 自动生成。")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    main()
