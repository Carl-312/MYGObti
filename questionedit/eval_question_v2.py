#!/usr/bin/env python3
from __future__ import annotations

import argparse
import itertools
import json
import math
import random
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


AXIS_ORDER = ["emotionExpression", "socialStrategy", "selfRecognition"]
ROLE_FOCUS = ["长崎爽世", "丰川祥子", "若叶睦", "高松灯"]
RISK_PAIRS = [
    ("长崎爽世", "丰川祥子"),
    ("若叶睦", "高松灯"),
    ("三角初华", "椎名立希"),
    ("千早爱音", "高松灯"),
]


@dataclass(frozen=True)
class Character:
    name: str
    title: str
    anchor: tuple[float, float, float]
    latent_anchor: float
    description: str


@dataclass(frozen=True)
class Option:
    id: str
    text: str
    delta: tuple[float, float, float]
    latent_delta: float | None


@dataclass(frozen=True)
class Question:
    id: str
    qtype: str
    primary_axis: str | None
    latent_trait: str | None
    scene: str
    options: tuple[Option, ...]


@dataclass(frozen=True)
class EvaluationResult:
    answers: dict[str, str]
    user_vector: tuple[float, float, float]
    latent_score: float
    base_scores: dict[str, float]
    final_scores: dict[str, float]
    base_ranking: list[tuple[str, float]]
    final_ranking: list[tuple[str, float]]
    tie_break_triggered: bool
    tie_break_lambda: float | None
    tie_break_pair: tuple[str, str] | None
    tie_break_flipped: bool
    response_inconsistency: bool


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate questionnewV2.md")
    parser.add_argument(
        "--source",
        default="/home/carl/MYGObti/questionedit/questionnewV2.md",
        help="Path to the V2 markdown file.",
    )
    parser.add_argument(
        "--plan",
        default="/home/carl/MYGObti/questionedit/plans/v2-modification-plan.md",
        help="Path to the V2 modification plan markdown file.",
    )
    parser.add_argument(
        "--output-report",
        default="/home/carl/MYGObti/questionedit/reports/V2-EVAL-REPORT.md",
        help="Path to the generated markdown report.",
    )
    parser.add_argument(
        "--output-json",
        default="/home/carl/MYGObti/questionedit/reports/V2-EVAL-SUMMARY.json",
        help="Path to the generated JSON summary.",
    )
    parser.add_argument(
        "--monte-carlo",
        type=int,
        default=100_000,
        help="Number of Monte Carlo samples.",
    )
    parser.add_argument(
        "--noise-trials",
        type=int,
        default=1_200,
        help="Noise trials per role for targeted recovery tests.",
    )
    parser.add_argument(
        "--pair-trials",
        type=int,
        default=800,
        help="Noise trials per role for pair-focused separability tests.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=20260415,
        help="Random seed for reproducibility.",
    )
    args = parser.parse_args()

    rng = random.Random(args.seed)
    source_path = Path(args.source)
    plan_path = Path(args.plan)
    report_path = Path(args.output_report)
    json_path = Path(args.output_json)

    dataset = load_dataset(source_path)
    plan_excerpt = extract_plan_excerpt(plan_path)

    static_analysis = analyze_static_structure(dataset)
    monte_carlo = run_monte_carlo(dataset, args.monte_carlo, rng)
    targeted = run_targeted_recovery(dataset, args.noise_trials, rng)
    pair_analysis = run_pair_risk_analysis(dataset, args.pair_trials, rng, targeted)
    risk_ranking = rank_role_risks(dataset, monte_carlo, targeted)
    verdict = build_verdict(dataset, monte_carlo, targeted, pair_analysis)

    summary = {
        "seed": args.seed,
        "source": str(source_path),
        "plan": str(plan_path),
        "monteCarloSamples": args.monte_carlo,
        "noiseTrialsPerRole": args.noise_trials,
        "pairTrialsPerRole": args.pair_trials,
        "static": static_analysis,
        "monteCarlo": monte_carlo,
        "targeted": targeted,
        "pairAnalysis": pair_analysis,
        "riskRanking": risk_ranking,
        "verdict": verdict,
    }
    json_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    report = render_report(
        dataset=dataset,
        plan_excerpt=plan_excerpt,
        static_analysis=static_analysis,
        monte_carlo=monte_carlo,
        targeted=targeted,
        pair_analysis=pair_analysis,
        risk_ranking=risk_ranking,
        verdict=verdict,
        args=args,
    )
    report_path.write_text(report, encoding="utf-8")
    print(f"Report written to {report_path}")
    print(f"Summary written to {json_path}")


def load_dataset(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    characters = parse_character_table(text)
    payload = parse_embedded_json(text)
    questions = []
    question_by_id = {}
    option_by_question = {}
    for item in payload["questions"]:
        options = tuple(
            Option(
                id=option["id"],
                text=option["text"],
                delta=tuple(float(value) for value in option["delta"]),
                latent_delta=(
                    float(option["latentDelta"]) if "latentDelta" in option else None
                ),
            )
            for option in item["options"]
        )
        question = Question(
            id=item["id"],
            qtype=item["type"],
            primary_axis=item.get("primaryAxis"),
            latent_trait=item.get("latentTrait"),
            scene=item["scene"],
            options=options,
        )
        questions.append(question)
        question_by_id[question.id] = question
        option_by_question[question.id] = {option.id: option for option in options}

    latent_anchors = payload["meta"]["latentTraits"]["controlServiceOrientation"][
        "characterAnchors"
    ]
    normalized_characters = {}
    for name, character in characters.items():
        latent_anchor = float(latent_anchors[name])
        normalized_characters[name] = Character(
            name=name,
            title=character["title"],
            anchor=character["anchor"],
            latent_anchor=latent_anchor,
            description=character["description"],
        )

    return {
        "text": text,
        "meta": payload["meta"],
        "characters": normalized_characters,
        "questions": questions,
        "question_by_id": question_by_id,
        "option_by_question": option_by_question,
        "scored_questions": [
            question for question in questions if question.qtype in {"scored", "reverse_check"}
        ],
        "latent_questions": [question for question in questions if question.qtype == "latent"],
    }


def parse_character_table(text: str) -> dict[str, dict[str, Any]]:
    lines = text.splitlines()
    header_index = None
    for index, line in enumerate(lines):
        if "角色" in line and "情感表达" in line and "控制/服务 latent" in line:
            header_index = index
            break
    if header_index is None:
        raise ValueError("Character table not found in markdown.")

    rows = []
    for line in lines[header_index + 2 :]:
        if not line.strip().startswith("|"):
            break
        rows.append(line)

    characters: dict[str, dict[str, Any]] = {}
    for row in rows:
        cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
        if len(cells) < 7:
            continue
        name = clean_markdown(cells[0])
        characters[name] = {
            "title": clean_markdown(cells[1]),
            "anchor": (
                float(cells[2]),
                float(cells[3]),
                float(cells[4]),
            ),
            "latent_anchor": float(cells[5]),
            "description": clean_markdown(cells[6]),
        }
    if len(characters) != 8:
        raise ValueError(f"Expected 8 characters, got {len(characters)}.")
    return characters


def parse_embedded_json(text: str) -> dict[str, Any]:
    start = text.find("\n{")
    if start == -1:
        start = text.find("{")
    if start == -1:
        raise ValueError("Embedded JSON payload not found.")
    payload_text = text[start + 1 if text[start] == "\n" else start :]
    decoder = json.JSONDecoder()
    payload, _ = decoder.raw_decode(payload_text)
    return payload


def clean_markdown(value: str) -> str:
    value = re.sub(r"\s*\*\(隐藏\)\*", "", value)
    value = value.replace("*", "")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def extract_plan_excerpt(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    excerpt = {}
    for key in ["3D", "latent", "爽世 vs 祥子", "Q17", "Q18", "Q19"]:
        match = re.search(rf".{{0,80}}{re.escape(key)}.{{0,120}}", text)
        if match:
            excerpt[key] = match.group(0).strip()
    return excerpt


def analyze_static_structure(dataset: dict[str, Any]) -> dict[str, Any]:
    meta = dataset["meta"]
    scored_questions = dataset["scored_questions"]
    latent_questions = dataset["latent_questions"]
    axis_counts_q1_q16 = Counter()
    axis_counts_all_scored = Counter()
    delta_values = Counter()
    delta_abs_values = Counter()
    latent_delta_values = Counter()
    latent_pollution = []

    for question in scored_questions:
        if question.id != "Q20":
            axis_counts_q1_q16[question.primary_axis] += 1
        axis_counts_all_scored[question.primary_axis] += 1
        for option in question.options:
            for value in option.delta:
                delta_values[f"{value:+.1f}"] += 1
                delta_abs_values[f"{abs(value):.1f}"] += 1

    for question in latent_questions:
        for option in question.options:
            latent_delta_values[f"{option.latent_delta:+.1f}"] += 1
            if any(abs(value) > 1e-9 for value in option.delta):
                latent_pollution.append(
                    {
                        "questionId": question.id,
                        "optionId": option.id,
                        "delta": list(option.delta),
                    }
                )

    pair_rows = []
    characters = dataset["characters"]
    for left_name, right_name in itertools.combinations(sorted(characters), 2):
        left = characters[left_name]
        right = characters[right_name]
        pair_rows.append(
            {
                "pair": f"{left_name} vs {right_name}",
                "cosine": cosine(left.anchor, right.anchor),
            }
        )
    pair_rows.sort(key=lambda item: item["cosine"], reverse=True)

    latent_sayosaki = theoretical_latent_gain(dataset)

    return {
        "axisCountsQ1Q16": {axis: axis_counts_q1_q16[axis] for axis in AXIS_ORDER},
        "axisCountsAllScored": {axis: axis_counts_all_scored[axis] for axis in AXIS_ORDER},
        "deltaValues": dict(sorted(delta_values.items())),
        "deltaAbsValues": dict(sorted(delta_abs_values.items())),
        "latentDeltaValues": dict(sorted(latent_delta_values.items())),
        "latentPollution": latent_pollution,
        "rolePairCosines": pair_rows,
        "tieBreakerRule": meta["tieBreakerRule"],
        "latentSayosaki": latent_sayosaki,
    }


def theoretical_latent_gain(dataset: dict[str, Any]) -> dict[str, Any]:
    characters = dataset["characters"]
    sayo = characters["长崎爽世"]
    saki = characters["丰川祥子"]
    default_lambda = float(dataset["meta"]["tieBreakerRule"]["lambda"]["default"])
    priority_lambda = float(dataset["meta"]["tieBreakerRule"]["lambda"]["priorityPair"])
    crossover = (sayo.latent_anchor + saki.latent_anchor) / 2.0
    samples = []
    for latent_score in [-1.0, -0.8, -0.3, 0.0, 0.3, 0.8, 1.0]:
        sayo_match = 1 - abs(latent_score - sayo.latent_anchor)
        saki_match = 1 - abs(latent_score - saki.latent_anchor)
        samples.append(
            {
                "latentScore": latent_score,
                "爽世AdvantagePriorityLambda": priority_lambda * (sayo_match - saki_match),
                "爽世AdvantageDefaultLambda": default_lambda * (sayo_match - saki_match),
            }
        )
    max_gain = max(abs(row["爽世AdvantagePriorityLambda"]) for row in samples)
    return {
        "baseCosine": cosine(sayo.anchor, saki.anchor),
        "latentAnchorGap": abs(sayo.latent_anchor - saki.latent_anchor),
        "crossoverLatentScore": crossover,
        "samples": samples,
        "maxPriorityPairMarginGain": max_gain,
    }


def run_monte_carlo(dataset: dict[str, Any], sample_count: int, rng: random.Random) -> dict[str, Any]:
    final_counts = Counter()
    base_counts = Counter()
    top2_close = 0
    tie_break_count = 0
    flipped_count = 0
    pair_flip_counter = Counter()
    tie_pair_counter = Counter()
    sayosaki_trigger_count = 0
    sayosaki_improvements = []
    margin_records = []

    for _ in range(sample_count):
        answers = {
            question.id: rng.choice(question.options).id
            for question in dataset["questions"]
        }
        evaluation = evaluate_answers(dataset, answers)
        base_winner = evaluation.base_ranking[0][0]
        final_winner = evaluation.final_ranking[0][0]
        final_counts[final_winner] += 1
        base_counts[base_winner] += 1
        base_gap = evaluation.base_ranking[0][1] - evaluation.base_ranking[1][1]
        if base_gap < float(dataset["meta"]["tieBreakerRule"]["enabledWhenTop2DiffBelow"]):
            top2_close += 1
        if evaluation.tie_break_triggered:
            tie_break_count += 1
            pair_key = " vs ".join(evaluation.tie_break_pair)
            tie_pair_counter[pair_key] += 1
            if evaluation.tie_break_flipped:
                flipped_count += 1
                pair_flip_counter[pair_key] += 1
            if set(evaluation.tie_break_pair) == {"长崎爽世", "丰川祥子"}:
                sayosaki_trigger_count += 1
                base_pair_gap = abs(
                    evaluation.base_scores["长崎爽世"] - evaluation.base_scores["丰川祥子"]
                )
                final_pair_gap = abs(
                    evaluation.final_scores["长崎爽世"] - evaluation.final_scores["丰川祥子"]
                )
                sayosaki_improvements.append(final_pair_gap - base_pair_gap)
        margin_records.append(
            {
                "winner": final_winner,
                "runnerUp": evaluation.final_ranking[1][0],
                "gap": evaluation.final_ranking[0][1] - evaluation.final_ranking[1][1],
            }
        )

    top2_near_final = sum(1 for row in margin_records if row["gap"] < 0.08)
    final_distribution = {
        role: round(final_counts[role] / sample_count, 6)
        for role in sorted(dataset["characters"])
    }
    base_distribution = {
        role: round(base_counts[role] / sample_count, 6)
        for role in sorted(dataset["characters"])
    }
    pair_trigger_rates = {
        pair: round(tie_pair_counter[pair] / sample_count, 6)
        for pair in sorted(tie_pair_counter)
    }
    pair_flip_rates_within_pair = {
        pair: round(pair_flip_counter[pair] / tie_pair_counter[pair], 6)
        if tie_pair_counter[pair]
        else 0.0
        for pair in sorted(tie_pair_counter)
    }

    return {
        "sampleCount": sample_count,
        "baseDistribution": base_distribution,
        "finalDistribution": final_distribution,
        "top2DiffBelow008RateBase": round(top2_close / sample_count, 6),
        "top2DiffBelow008RateFinal": round(top2_near_final / sample_count, 6),
        "tieBreakerTriggerRate": round(tie_break_count / sample_count, 6),
        "tieBreakerFlipRateOverall": round(flipped_count / sample_count, 6),
        "tieBreakerFlipRateWithinTriggered": (
            round(flipped_count / tie_break_count, 6) if tie_break_count else 0.0
        ),
        "tieBreakPairCounts": dict(sorted(tie_pair_counter.items())),
        "tieBreakPairTriggerRates": pair_trigger_rates,
        "tieBreakPairFlipRatesWithinPair": pair_flip_rates_within_pair,
        "sayosakiTriggeredCount": sayosaki_trigger_count,
        "sayosakiAverageGapImprovement": (
            round(sum(sayosaki_improvements) / len(sayosaki_improvements), 6)
            if sayosaki_improvements
            else 0.0
        ),
    }


def run_targeted_recovery(
    dataset: dict[str, Any],
    noise_trials: int,
    rng: random.Random,
) -> dict[str, Any]:
    targeted = {}
    total_questions = len(dataset["questions"])
    for role_name, character in dataset["characters"].items():
        ideal_answers = build_ideal_answers(dataset, character)
        ideal_eval = evaluate_answers(dataset, ideal_answers)
        noise_counter = Counter()
        confusion_counter = Counter()
        top2_counter = Counter()
        triggered = 0
        flipped = 0
        for _ in range(noise_trials):
            noisy_answers = perturb_answers(dataset, ideal_answers, rng, total_questions)
            evaluation = evaluate_answers(dataset, noisy_answers)
            predicted = evaluation.final_ranking[0][0]
            noise_counter[predicted] += 1
            confusion_counter[evaluation.final_ranking[1][0]] += 1
            top2_counter[" vs ".join(sorted([predicted, evaluation.final_ranking[1][0]]))] += 1
            if evaluation.tie_break_triggered:
                triggered += 1
            if evaluation.tie_break_flipped:
                flipped += 1

        targeted[role_name] = {
            "idealAnswers": ideal_answers,
            "idealWinner": ideal_eval.final_ranking[0][0],
            "idealBaseWinner": ideal_eval.base_ranking[0][0],
            "idealUserVector": list(ideal_eval.user_vector),
            "idealLatentScore": ideal_eval.latent_score,
            "idealTop3": [
                {"role": role, "score": round(score, 6)}
                for role, score in ideal_eval.final_ranking[:3]
            ],
            "idealResponseInconsistency": ideal_eval.response_inconsistency,
            "noisyRecoveryRate": round(noise_counter[role_name] / noise_trials, 6),
            "noisyPredictionDistribution": {
                role: round(noise_counter[role] / noise_trials, 6)
                for role in sorted(dataset["characters"])
                if noise_counter[role]
            },
            "noisyRunnerUpDistribution": {
                role: round(confusion_counter[role] / noise_trials, 6)
                for role in sorted(dataset["characters"])
                if confusion_counter[role]
            },
            "tieBreakerTriggerRate": round(triggered / noise_trials, 6),
            "tieBreakerFlipRate": round(flipped / noise_trials, 6),
            "top2Pairs": {
                pair: round(count / noise_trials, 6)
                for pair, count in top2_counter.most_common(5)
            },
        }
    return targeted


def run_pair_risk_analysis(
    dataset: dict[str, Any],
    pair_trials: int,
    rng: random.Random,
    targeted: dict[str, Any],
) -> dict[str, Any]:
    results = {}
    for left_name, right_name in RISK_PAIRS:
        left_character = dataset["characters"][left_name]
        right_character = dataset["characters"][right_name]
        left_ideal = targeted[left_name]["idealAnswers"]
        right_ideal = targeted[right_name]["idealAnswers"]
        trial_rows = []
        for role_name, base_answers in [(left_name, left_ideal), (right_name, right_ideal)]:
            for _ in range(pair_trials):
                noisy_answers = perturb_answers(dataset, base_answers, rng, len(dataset["questions"]))
                evaluation = evaluate_answers(dataset, noisy_answers)
                trial_rows.append(
                    {
                        "truth": role_name,
                        "answers": noisy_answers,
                        "evaluation": evaluation,
                    }
                )

        pair_only_correct = 0
        pair_only_correct_base = 0
        full_cross_confusion = Counter()
        tie_triggered = 0
        for row in trial_rows:
            evaluation = row["evaluation"]
            pair_choice = rank_subset(
                evaluation,
                dataset,
                [left_name, right_name],
            )[0][0]
            pair_choice_base = sorted(
                [
                    (left_name, evaluation.base_scores[left_name]),
                    (right_name, evaluation.base_scores[right_name]),
                ],
                key=lambda item: (-item[1], item[0]),
            )[0][0]
            if pair_choice == row["truth"]:
                pair_only_correct += 1
            if pair_choice_base == row["truth"]:
                pair_only_correct_base += 1
            if evaluation.final_ranking[0][0] == opposite(row["truth"], left_name, right_name):
                full_cross_confusion[row["truth"]] += 1
            if evaluation.tie_break_triggered:
                tie_triggered += 1

        full_accuracy = sum(
            1 for row in trial_rows if row["evaluation"].final_ranking[0][0] == row["truth"]
        ) / len(trial_rows)
        pair_only_accuracy = pair_only_correct / len(trial_rows)
        pair_only_accuracy_base = pair_only_correct_base / len(trial_rows)
        contribution_rows = []
        full_pair_accuracy = pair_only_accuracy
        for question in dataset["questions"]:
            ablated_correct = 0
            for row in trial_rows:
                ablated = evaluate_answers(dataset, row["answers"], omit_questions={question.id})
                pair_choice = rank_subset(ablated, dataset, [left_name, right_name])[0][0]
                if pair_choice == row["truth"]:
                    ablated_correct += 1
            ablated_accuracy = ablated_correct / len(trial_rows)
            contribution_rows.append(
                {
                    "questionId": question.id,
                    "qtype": dataset["question_by_id"][question.id].qtype,
                    "accuracyDrop": round(full_pair_accuracy - ablated_accuracy, 6),
                }
            )
        contribution_rows.sort(key=lambda item: item["accuracyDrop"], reverse=True)

        results[f"{left_name} vs {right_name}"] = {
            "pair": [left_name, right_name],
            "anchorCosine": round(cosine(left_character.anchor, right_character.anchor), 6),
            "latentAnchorGap": round(abs(left_character.latent_anchor - right_character.latent_anchor), 6),
            "pairOnlyAccuracyBase": round(pair_only_accuracy_base, 6),
            "pairOnlyAccuracy": round(pair_only_accuracy, 6),
            "fullModelAccuracy": round(full_accuracy, 6),
            "fullModelCrossConfusion": {
                role: round(full_cross_confusion[role] / pair_trials, 6)
                for role in [left_name, right_name]
            },
            "tieBreakerTriggerRate": round(tie_triggered / len(trial_rows), 6),
            "topContributingQuestions": contribution_rows[:6],
            "needsPatch": pair_only_accuracy < 0.75 or full_accuracy < 0.7,
        }
    return results


def rank_role_risks(
    dataset: dict[str, Any],
    monte_carlo: dict[str, Any],
    targeted: dict[str, Any],
) -> list[dict[str, Any]]:
    pair_cosines = defaultdict(float)
    closest_role = {}
    for row in analyze_role_neighbors(dataset):
        pair_cosines[row["role"]] = row["closestCosine"]
        closest_role[row["role"]] = row["closestRole"]

    ranking = []
    final_distribution = monte_carlo["finalDistribution"]
    for role in dataset["characters"]:
        recovery = targeted[role]["noisyRecoveryRate"]
        share = final_distribution[role]
        risk_score = (
            0.5 * normalize_cosine(pair_cosines[role])
            + 0.35 * (1 - recovery)
            + 0.15 * abs(share - 0.125) / 0.125
        )
        ranking.append(
            {
                "role": role,
                "riskScore": round(risk_score, 6),
                "closestRole": closest_role[role],
                "closestCosine": round(pair_cosines[role], 6),
                "noisyRecoveryRate": recovery,
                "finalShare": share,
            }
        )
    ranking.sort(key=lambda item: item["riskScore"], reverse=True)
    return ranking


def build_verdict(
    dataset: dict[str, Any],
    monte_carlo: dict[str, Any],
    targeted: dict[str, Any],
    pair_analysis: dict[str, Any],
) -> dict[str, Any]:
    shares = monte_carlo["finalDistribution"]
    severe_issues = []
    moderate_issues = []

    disappearing = [role for role, share in shares.items() if share < 0.03]
    magnets = [role for role, share in shares.items() if share > 0.25]
    if disappearing:
        severe_issues.append(f"角色占比接近消失: {', '.join(disappearing)}")
    if magnets:
        severe_issues.append(f"角色占比过高: {', '.join(magnets)}")

    tie_rate = monte_carlo["tieBreakerTriggerRate"]
    if tie_rate < 0.01:
        moderate_issues.append("tie-breaker 触发偏少，latent 利用率有限")
    elif tie_rate > 0.18:
        severe_issues.append("tie-breaker 触发过多，主模型不稳")

    flip_within = monte_carlo["tieBreakerFlipRateWithinTriggered"]
    if flip_within < 0.1:
        moderate_issues.append("tie-breaker 改变结果偏少，latent 有一定浪费")
    elif flip_within > 0.75:
        severe_issues.append("tie-breaker 改变结果过于频繁，主模型过于依赖 latent")

    key_recovery_issues = [
        role
        for role in ROLE_FOCUS
        if targeted[role]["noisyRecoveryRate"] < 0.7
    ]
    if key_recovery_issues:
        severe_issues.append(f"重点角色轻噪声回收不足: {', '.join(key_recovery_issues)}")

    risky_pairs = [
        name for name, info in pair_analysis.items() if info["needsPatch"]
    ]
    if risky_pairs:
        moderate_issues.append(f"高风险角色对仍需补丁: {', '.join(risky_pairs)}")

    if severe_issues:
        verdict = "暂不合格，不建议直接冻结 V2。"
    elif moderate_issues:
        verdict = "基本合格，可继续迭代，但需要小补丁。"
    else:
        verdict = "合格，可继续迭代。"

    patch_suggestions = []
    if "长崎爽世 vs 丰川祥子" in risky_pairs:
        patch_suggestions.append("优先微调 `lambda` 到 0.13~0.14，并保留 `top2 diff < 0.08`。")
        patch_suggestions.append("优先检查 `Q17-Q19` 的档位对称性，避免 `+0.8/-0.8` 之外的中档过弱。")
    if any(name in risky_pairs for name in ["若叶睦 vs 高松灯", "千早爱音 vs 高松灯"]):
        patch_suggestions.append("补一题轻量的内敛但是否主动承受关系压力题，避免灯/睦/爱音都落在负向角落。")
    if any(info["finalShare"] > 0.2 for info in rank_role_risks(dataset, monte_carlo, targeted)[:2]):
        patch_suggestions.append("优先检查对应角色附近题目的 `0.3/0.7` 档位是否过于顺滑，必要时把一题 `0.7` 降到 `0.5~0.6`。")

    if not patch_suggestions:
        patch_suggestions.append("暂不建议推翻 3D+latent 方案，优先做参数级微调与单题补丁。")

    return {
        "verdict": verdict,
        "severeIssues": severe_issues,
        "moderateIssues": moderate_issues,
        "patchSuggestions": patch_suggestions,
    }


def evaluate_answers(
    dataset: dict[str, Any],
    answers: dict[str, str],
    omit_questions: set[str] | None = None,
) -> EvaluationResult:
    omit_questions = omit_questions or set()
    user_vector = [0.0, 0.0, 0.0]
    latent_values = []
    for question in dataset["questions"]:
        if question.id in omit_questions:
            continue
        option = dataset["option_by_question"][question.id][answers[question.id]]
        if question.qtype in {"scored", "reverse_check"}:
            user_vector = [
                user_vector[index] + option.delta[index]
                for index in range(3)
            ]
        elif question.qtype == "latent" and option.latent_delta is not None:
            latent_values.append(option.latent_delta)

    latent_score = sum(latent_values) / len(latent_values) if latent_values else 0.0
    base_scores = {
        name: cosine(tuple(user_vector), character.anchor)
        for name, character in dataset["characters"].items()
    }
    base_ranking = sorted(base_scores.items(), key=lambda item: (-item[1], item[0]))
    final_scores = dict(base_scores)
    tie_break_triggered = False
    tie_break_lambda = None
    tie_break_pair = None
    tie_break_flipped = False

    first, second = base_ranking[:2]
    threshold = float(dataset["meta"]["tieBreakerRule"]["enabledWhenTop2DiffBelow"])
    includes_any = set(dataset["meta"]["tieBreakerRule"]["onlyWhenTop2IncludesAnyOf"])
    if (
        first[1] - second[1] < threshold
        and ({first[0], second[0]} & includes_any)
    ):
        tie_break_triggered = True
        tie_break_pair = tuple(sorted([first[0], second[0]]))
        priority_pairs = {
            tuple(sorted(pair))
            for pair in dataset["meta"]["tieBreakerRule"]["priorityPairs"]
        }
        tie_break_lambda = float(
            dataset["meta"]["tieBreakerRule"]["lambda"][
                "priorityPair" if tie_break_pair in priority_pairs else "default"
            ]
        )
        for role_name in [first[0], second[0]]:
            latent_match = 1 - abs(
                latent_score - dataset["characters"][role_name].latent_anchor
            )
            final_scores[role_name] = base_scores[role_name] + tie_break_lambda * latent_match

    final_ranking = sorted(final_scores.items(), key=lambda item: (-item[1], item[0]))
    tie_break_flipped = final_ranking[0][0] != base_ranking[0][0]

    return EvaluationResult(
        answers=answers,
        user_vector=tuple(round(value, 10) for value in user_vector),
        latent_score=round(latent_score, 10),
        base_scores=base_scores,
        final_scores=final_scores,
        base_ranking=base_ranking,
        final_ranking=final_ranking,
        tie_break_triggered=tie_break_triggered,
        tie_break_lambda=tie_break_lambda,
        tie_break_pair=tie_break_pair,
        tie_break_flipped=tie_break_flipped,
        response_inconsistency=check_reverse_conflict(dataset, answers),
    )


def build_ideal_answers(dataset: dict[str, Any], character: Character) -> dict[str, str]:
    scored_questions = dataset["scored_questions"]
    latent_questions = dataset["latent_questions"]

    state_paths: dict[tuple[int, int, int], dict[str, str]] = {(0, 0, 0): {}}
    for question in scored_questions:
        next_states: dict[tuple[int, int, int], dict[str, str]] = {}
        for state, path in state_paths.items():
            for option in question.options:
                delta_int = tuple(int(round(value * 10)) for value in option.delta)
                new_state = tuple(state[index] + delta_int[index] for index in range(3))
                if new_state not in next_states:
                    next_states[new_state] = {**path, question.id: option.id}
        state_paths = next_states

    best_state = max(
        state_paths,
        key=lambda state: cosine(
            tuple(value / 10.0 for value in state),
            character.anchor,
        ),
    )
    answers = dict(state_paths[best_state])

    best_latent_answers = None
    best_latent_score = -math.inf
    for combo in itertools.product(*[question.options for question in latent_questions]):
        latent_values = [option.latent_delta for option in combo if option.latent_delta is not None]
        latent_score = sum(latent_values) / len(latent_values)
        latent_match = 1 - abs(latent_score - character.latent_anchor)
        if latent_match > best_latent_score:
            best_latent_score = latent_match
            best_latent_answers = {question.id: option.id for question, option in zip(latent_questions, combo)}
    if best_latent_answers is None:
        raise ValueError("Failed to build ideal latent answers.")
    answers.update(best_latent_answers)
    return answers


def perturb_answers(
    dataset: dict[str, Any],
    base_answers: dict[str, str],
    rng: random.Random,
    total_questions: int,
) -> dict[str, str]:
    answers = dict(base_answers)
    min_changes = max(1, math.ceil(total_questions * 0.15))
    max_changes = max(min_changes, math.floor(total_questions * 0.25))
    change_count = rng.randint(min_changes, max_changes)
    question_ids = rng.sample([question.id for question in dataset["questions"]], change_count)
    for question_id in question_ids:
        current = answers[question_id]
        options = [
            option.id
            for option in dataset["question_by_id"][question_id].options
            if option.id != current
        ]
        answers[question_id] = rng.choice(options)
    return answers


def rank_subset(
    evaluation: EvaluationResult,
    dataset: dict[str, Any],
    roles: list[str],
) -> list[tuple[str, float]]:
    scores = {role: evaluation.base_scores[role] for role in roles}
    top2 = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    if (
        len(roles) == 2
        and set(roles) == {"长崎爽世", "丰川祥子"}
        and top2[0][1] - top2[1][1] < float(dataset["meta"]["tieBreakerRule"]["enabledWhenTop2DiffBelow"])
    ):
        pair = tuple(sorted(roles))
        priority_pairs = {
            tuple(sorted(pair_item))
            for pair_item in dataset["meta"]["tieBreakerRule"]["priorityPairs"]
        }
        lambda_value = float(
            dataset["meta"]["tieBreakerRule"]["lambda"][
                "priorityPair" if pair in priority_pairs else "default"
            ]
        )
        for role in roles:
            scores[role] = evaluation.base_scores[role] + lambda_value * (
                1 - abs(evaluation.latent_score - dataset["characters"][role].latent_anchor)
            )
    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))


def check_reverse_conflict(dataset: dict[str, Any], answers: dict[str, str]) -> bool:
    q6 = dataset["option_by_question"]["Q6"][answers["Q6"]].delta[2]
    q20 = dataset["option_by_question"]["Q20"][answers["Q20"]].delta[2]
    return (q6 <= -0.7 and q20 >= 0.7) or (q20 <= -0.7 and q6 >= 0.7)


def analyze_role_neighbors(dataset: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for role_name, character in dataset["characters"].items():
        closest_role = None
        closest_cosine = -2.0
        for other_name, other_character in dataset["characters"].items():
            if other_name == role_name:
                continue
            score = cosine(character.anchor, other_character.anchor)
            if score > closest_cosine:
                closest_cosine = score
                closest_role = other_name
        rows.append(
            {
                "role": role_name,
                "closestRole": closest_role,
                "closestCosine": closest_cosine,
            }
        )
    rows.sort(key=lambda item: item["closestCosine"], reverse=True)
    return rows


def cosine(left: tuple[float, float, float], right: tuple[float, float, float]) -> float:
    dot = sum(left[index] * right[index] for index in range(3))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def normalize_cosine(value: float) -> float:
    return (value + 1.0) / 2.0


def opposite(role_name: str, left_name: str, right_name: str) -> str:
    return right_name if role_name == left_name else left_name


def render_report(
    dataset: dict[str, Any],
    plan_excerpt: dict[str, str],
    static_analysis: dict[str, Any],
    monte_carlo: dict[str, Any],
    targeted: dict[str, Any],
    pair_analysis: dict[str, Any],
    risk_ranking: list[dict[str, Any]],
    verdict: dict[str, Any],
    args: argparse.Namespace,
) -> str:
    lines = []
    lines.append("# V2 题库评估报告")
    lines.append("")
    lines.append("## 结论摘要")
    lines.append("")
    lines.append(f"- 明确判断：**{verdict['verdict']}**")
    lines.append(
        f"- 本次评估基于 `eval_question_v2.py`，固定随机种子 `{args.seed}`，Monte Carlo `{args.monte_carlo:,}` 份答卷，轻噪声回收 `{args.noise_trials}` 次/角色，pair-focused 测试 `{args.pair_trials}` 次/角色。"
    )
    lines.append(
        f"- 主模型仍是 `3D cosine`，latent 仅按 `top2 diff < {dataset['meta']['tieBreakerRule']['enabledWhenTop2DiffBelow']}` 且 top2 包含 `爽世/祥子` 时参与。"
    )
    lines.append(
        f"- `爽世 vs 祥子` 的 3D 锚点余弦为 `{static_analysis['latentSayosaki']['baseCosine']:.4f}`，理论 latent 分离最大可额外拉开 `{static_analysis['latentSayosaki']['maxPriorityPairMarginGain']:.4f}`。"
    )
    if verdict["severeIssues"]:
        for issue in verdict["severeIssues"]:
            lines.append(f"- 严重问题：{issue}")
    if verdict["moderateIssues"]:
        for issue in verdict["moderateIssues"]:
            lines.append(f"- 关注点：{issue}")
    lines.append("")
    lines.append("## 判定依据")
    lines.append("")
    lines.append("- 结构问题：看主轴覆盖、题量平衡、latent 是否污染主轴、角色锚点本身是否过近。")
    lines.append("- 参数问题：看 `top2 diff` 阈值、`lambda`、tie-breaker 触发率与翻转率。")
    lines.append("- 题面问题：看高风险角色对的题目消融结果，确认究竟是哪个题真在区分。")
    lines.append("")
    lines.append("## 静态结构分析")
    lines.append("")
    lines.append("### 主轴覆盖")
    lines.append("")
    lines.append("| 统计口径 | 情感表达 | 社交策略 | 自我认知 |")
    lines.append("| --- | ---: | ---: | ---: |")
    lines.append(
        f"| Q1-Q16 | {static_analysis['axisCountsQ1Q16']['emotionExpression']} | {static_analysis['axisCountsQ1Q16']['socialStrategy']} | {static_analysis['axisCountsQ1Q16']['selfRecognition']} |"
    )
    lines.append(
        f"| 含 Q20 额外计分 | {static_analysis['axisCountsAllScored']['emotionExpression']} | {static_analysis['axisCountsAllScored']['socialStrategy']} | {static_analysis['axisCountsAllScored']['selfRecognition']} |"
    )
    lines.append("")
    lines.append("### 档位分布")
    lines.append("")
    lines.append("| 类别 | 分布 |")
    lines.append("| --- | --- |")
    lines.append(
        f"| 主轴 `delta` 原值统计 | {format_compact_dict(static_analysis['deltaValues'])} |"
    )
    lines.append(
        f"| 主轴 `|delta|` 统计 | {format_compact_dict(static_analysis['deltaAbsValues'])} |"
    )
    lines.append(
        f"| latent `latentDelta` 统计 | {format_compact_dict(static_analysis['latentDeltaValues'])} |"
    )
    lines.append("")
    lines.append("### latent 污染检查")
    lines.append("")
    if static_analysis["latentPollution"]:
        lines.append("- 发现污染项：")
        for row in static_analysis["latentPollution"]:
            lines.append(
                f"- {row['questionId']}{row['optionId']} 的 3D `delta` 不为零：{row['delta']}"
            )
    else:
        lines.append("- `Q17-Q19` 的所有选项 `delta` 都是 `[0,0,0]`，latent 没有直接污染 3D 主轴。")
    lines.append("")
    lines.append("### 角色对 3D 余弦相似度 Top 12")
    lines.append("")
    lines.append("| 排名 | 角色对 | 3D 余弦 |")
    lines.append("| --- | --- | ---: |")
    for index, row in enumerate(static_analysis["rolePairCosines"][:12], start=1):
        lines.append(f"| {index} | {row['pair']} | {row['cosine']:.4f} |")
    lines.append("")
    lines.append("### `爽世 vs 祥子` 理论分离改善")
    lines.append("")
    lines.append("| latentScore | 爽世相对优势 (`λ=0.12`) | 爽世相对优势 (`λ=0.08`) |")
    lines.append("| ---: | ---: | ---: |")
    for row in static_analysis["latentSayosaki"]["samples"]:
        lines.append(
            f"| {row['latentScore']:+.1f} | {row['爽世AdvantagePriorityLambda']:+.4f} | {row['爽世AdvantageDefaultLambda']:+.4f} |"
        )
    lines.append("")
    lines.append(
        f"- 理论翻盘中点在 `latentScore = {static_analysis['latentSayosaki']['crossoverLatentScore']:+.2f}`。高于这个值更偏爽世，低于这个值更偏祥子。"
    )
    lines.append("")
    lines.append("## Monte Carlo / 近穷举分析")
    lines.append("")
    lines.append("- 假设：每题 4 个选项等概率、彼此独立，用来测试题库结构本身，而不是拟合真实玩家分布。")
    lines.append("")
    lines.append("### 最终结果分布")
    lines.append("")
    lines.append("| 角色 | base 占比 | final 占比 |")
    lines.append("| --- | ---: | ---: |")
    for role in sorted(dataset["characters"]):
        lines.append(
            f"| {role} | {monte_carlo['baseDistribution'][role]:.4%} | {monte_carlo['finalDistribution'][role]:.4%} |"
        )
    lines.append("")
    lines.append("### 关键比例")
    lines.append("")
    lines.append("| 指标 | 比例 |")
    lines.append("| --- | ---: |")
    lines.append(
        f"| `top2 diff < 0.08`（base） | {monte_carlo['top2DiffBelow008RateBase']:.4%} |"
    )
    lines.append(
        f"| `top2 diff < 0.08`（final） | {monte_carlo['top2DiffBelow008RateFinal']:.4%} |"
    )
    lines.append(
        f"| tie-breaker 触发率 | {monte_carlo['tieBreakerTriggerRate']:.4%} |"
    )
    lines.append(
        f"| tie-breaker 翻转率（总体） | {monte_carlo['tieBreakerFlipRateOverall']:.4%} |"
    )
    lines.append(
        f"| tie-breaker 翻转率（触发后） | {monte_carlo['tieBreakerFlipRateWithinTriggered']:.4%} |"
    )
    lines.append("")
    lines.append("| tie-break 角色对 | 触发次数 | 触发占总样本比 | 该角色对内翻转率 |")
    lines.append("| --- | ---: | ---: | ---: |")
    for pair, count in monte_carlo["tieBreakPairCounts"].items():
        lines.append(
            f"| {pair} | {count} | {monte_carlo['tieBreakPairTriggerRates'].get(pair, 0.0):.4%} | {monte_carlo['tieBreakPairFlipRatesWithinPair'].get(pair, 0.0):.4%} |"
        )
    lines.append("")
    lines.append(
        f"- `爽世/祥子` 在触发样本中的平均 pair gap 改善为 `{monte_carlo['sayosakiAverageGapImprovement']:+.4f}`。"
    )
    lines.append("")
    lines.append("## 定向角色回收测试")
    lines.append("")
    lines.append("- 理想作答者：对每个角色做精确离散搜索，找 3D 最接近其锚点的主轴选项组合，再给 latent 题选最接近其 latent 锚点的组合。")
    lines.append("- 轻噪声作答者：在理想答案上随机扰动 15%~25% 题目。")
    lines.append("")
    lines.append("| 角色 | 理想回收 | 轻噪声回收率 | tie-break 触发率 | 备注 |")
    lines.append("| --- | --- | ---: | ---: | --- |")
    for role in sorted(dataset["characters"]):
        row = targeted[role]
        note = "重点角色" if role in ROLE_FOCUS else ""
        if row["idealResponseInconsistency"]:
            note = (note + " / 理想答案触发 Q6-Q20 冲突").strip(" /")
        lines.append(
            f"| {role} | {row['idealWinner']} | {row['noisyRecoveryRate']:.4%} | {row['tieBreakerTriggerRate']:.4%} | {note or '-'} |"
        )
    lines.append("")
    lines.append("### 重点角色细看")
    lines.append("")
    for role in ROLE_FOCUS:
        row = targeted[role]
        lines.append(f"#### {role}")
        lines.append("")
        lines.append(
            f"- 理想答案最终角色：`{row['idealWinner']}`；轻噪声回收率：`{row['noisyRecoveryRate']:.4%}`。"
        )
        lines.append(
            f"- 理想向量：`{row['idealUserVector']}`；latentScore：`{row['idealLatentScore']:+.3f}`。"
        )
        lines.append(
            f"- 主要误判分布：{format_compact_dict(row['noisyPredictionDistribution'])}。"
        )
        lines.append(
            f"- 常见 top2 组合：{format_compact_dict(row['top2Pairs'])}。"
        )
        lines.append("")
    lines.append("## 高风险角色对区分测试")
    lines.append("")
    for pair_name, info in pair_analysis.items():
        lines.append(f"### {pair_name}")
        lines.append("")
        lines.append(
            f"- 3D 原始相似风险：锚点余弦 `{info['anchorCosine']:.4f}`；latent gap `{info['latentAnchorGap']:.2f}`。"
        )
        lines.append(
            f"- V2 实际可分性：pair-only 准确率从 `{info['pairOnlyAccuracyBase']:.4%}` 提升到 `{info['pairOnlyAccuracy']:.4%}`，full-model 准确率 `{info['fullModelAccuracy']:.4%}`。"
        )
        lines.append(
            f"- 交叉误判：`{info['pair'][0]} -> {info['pair'][1]}` 为 `{info['fullModelCrossConfusion'][info['pair'][0]]:.4%}`，`{info['pair'][1]} -> {info['pair'][0]}` 为 `{info['fullModelCrossConfusion'][info['pair'][1]]:.4%}`。"
        )
        lines.append(
            f"- tie-breaker 触发率：`{info['tieBreakerTriggerRate']:.4%}`。"
        )
        lines.append("- 真正提供区分贡献的题（按消融后准确率下降排序）：")
        for row in info["topContributingQuestions"]:
            lines.append(
                f"- `{row['questionId']}` (`{row['qtype']}`) 准确率下降 `{row['accuracyDrop']:+.4f}`"
            )
        if info["needsPatch"]:
            lines.append("- 判断：这一组仍建议补题或微调。")
        else:
            lines.append("- 判断：这一组已经达到可接受区分。")
        lines.append("")
    lines.append("## 风险角色排序")
    lines.append("")
    lines.append("- 说明：按“最近邻 3D 相似度 + 轻噪声回收率 + Monte Carlo 占比偏离”构成的启发式风险分数排序。")
    lines.append("")
    lines.append("| 排名 | 角色 | 风险分数 | 最近邻 | 最近邻余弦 | 轻噪声回收率 | 最终占比 |")
    lines.append("| --- | --- | ---: | --- | ---: | ---: | ---: |")
    for index, row in enumerate(risk_ranking, start=1):
        lines.append(
            f"| {index} | {row['role']} | {row['riskScore']:.4f} | {row['closestRole']} | {row['closestCosine']:.4f} | {row['noisyRecoveryRate']:.4%} | {row['finalShare']:.4%} |"
        )
    lines.append("")
    lines.append("## 是否合格可继续迭代")
    lines.append("")
    lines.append(f"**{verdict['verdict']}**")
    lines.append("")
    if verdict["patchSuggestions"]:
        lines.append("### 最小修改建议")
        lines.append("")
        for suggestion in verdict["patchSuggestions"]:
            lines.append(f"- {suggestion}")
        lines.append("")
    lines.append("## 结构 / 参数 / 题面分层诊断")
    lines.append("")
    lines.append("- 结构问题：")
    if static_analysis["axisCountsQ1Q16"]["emotionExpression"] != static_analysis["axisCountsQ1Q16"]["socialStrategy"] or static_analysis["axisCountsQ1Q16"]["socialStrategy"] != 5:
        lines.append("- 主轴覆盖并非完全均匀，需要重新平衡。")
    else:
        lines.append("- Q1-Q16 主轴覆盖是 `5 / 5 / 6`，整体仍在计划预期内。")
    if static_analysis["latentPollution"]:
        lines.append("- latent 题存在主轴污染，需要先清除。")
    else:
        lines.append("- latent 题不污染 3D 主轴，结构方向正确。")
    lines.append("- 参数问题：")
    lines.append(
        f"- 当前 tie-breaker 触发率 `{monte_carlo['tieBreakerTriggerRate']:.4%}`，翻转率 `{monte_carlo['tieBreakerFlipRateWithinTriggered']:.4%}`，这是判断 `lambda / 阈值` 是否合适的核心指标。"
    )
    lines.append(
        f"- `爽世/祥子` 的理论分离中点是 `{static_analysis['latentSayosaki']['crossoverLatentScore']:+.2f}`，如果后续实测偏向一侧，可以优先调 `lambda` 而不是改主轴。"
    )
    lines.append("- 题面问题：")
    lines.append("- 以 pair-focused 消融结果为准，优先改贡献低但本应区分关键角色的题，而不是全面重写题库。")
    lines.append("")
    if plan_excerpt:
        lines.append("## 与修改计划的对照")
        lines.append("")
        for key, snippet in plan_excerpt.items():
            lines.append(f"- `{key}`：{snippet}")
        lines.append("")
    lines.append("## 附注")
    lines.append("")
    lines.append("- 本报告由脚本自动生成，细节摘要文件同时写入 `V2-EVAL-SUMMARY.json`。")
    lines.append("- 若要复跑：`python /home/carl/MYGObti/questionedit/eval_question_v2.py`。")
    lines.append("")
    return "\n".join(lines)


def format_compact_dict(values: dict[str, float]) -> str:
    items = [f"`{key}`: {format_value(value)}" for key, value in values.items()]
    return "; ".join(items)


def format_value(value: float) -> str:
    if isinstance(value, int) or float(value).is_integer():
        return str(int(value))
    if abs(value) < 1:
        return f"{value:.4f}".rstrip("0").rstrip(".")
    return f"{value:.2f}".rstrip("0").rstrip(".")


if __name__ == "__main__":
    main()
