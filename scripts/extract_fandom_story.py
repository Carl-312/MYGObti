#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Tag

BANNED_TEXT_PATTERNS = (
    re.compile(r"advertisement", re.IGNORECASE),
    re.compile(r"sponsored by", re.IGNORECASE),
    re.compile(r"follow us", re.IGNORECASE),
    re.compile(r"recent images", re.IGNORECASE),
    re.compile(r"^edit$", re.IGNORECASE),
    re.compile(r"^comments?$", re.IGNORECASE),
)


def clean_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split())


def text_of(node: Tag | None) -> str:
    if node is None:
        return ""
    return clean_text(node.get_text(" ", strip=True))


def is_meaningful_text(value: str) -> bool:
    if not value:
        return False
    return not any(pattern.search(value) for pattern in BANNED_TEXT_PATTERNS)


def slugify(value: str, fallback: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", clean_text(value).lower()).strip("-")
    return normalized or fallback


def dedupe_strings(values: list[str]) -> list[str]:
    deduped: list[str] = []
    for value in values:
        if value and value not in deduped:
            deduped.append(value)
    return deduped


def build_avatar_label(speaker: str) -> str:
    compact = re.sub(r"\s+", "", speaker)
    if len(compact) <= 2:
        return compact or "NA"
    return compact[:2].upper()


def get_root_story_container(soup: BeautifulSoup) -> Tag:
    root = soup.select_one(".mw-parser-output")
    if root is None:
        raise ValueError("Cannot find `.mw-parser-output` in source HTML.")
    return root


def extract_related_pages(root: Tag) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    tabs_table = root.find("table")
    if tabs_table is None:
        return items

    seen: set[tuple[str, str | None]] = set()
    for node in tabs_table.find_all(["a", "b"], recursive=True):
        label = text_of(node).replace("(You are here)", "").strip()
        if not is_meaningful_text(label):
            continue

        href = node.get("href") if node.name == "a" else None
        active = node.name == "b"
        key = (label, href)
        if key in seen:
            continue
        seen.add(key)
        items.append({"label": label, "href": href, "active": active})

    return items


def extract_intro(root: Tag) -> dict[str, str]:
    subtitle = ""
    intro = ""

    cover_title = root.find("center")
    if cover_title is not None:
        subtitle = text_of(cover_title)

    frame = root.find("div", class_="st-Frame")
    if frame is not None:
        intro = text_of(frame)

    return {
        "subtitle": subtitle,
        "intro": intro,
    }


def extract_chapter_labels(tabs_root: Tag) -> list[str]:
    caption = tabs_root.find("ul", class_="tabs__caption")
    if caption is None:
        return []

    labels: list[str] = []
    for node in caption.find_all(["li", "a", "span"], recursive=True):
        label = text_of(node)
        if label.startswith("Chapter "):
            labels.append(label)

    return dedupe_strings(labels)


def extract_episode_preview(content: Tag) -> dict[str, str]:
    preview = content.find("div", class_="episode-preview")
    if preview is None:
        return {
            "title": "",
            "summary": "",
            "imageAlt": "",
            "imageName": "",
            "imageKey": "",
            "imageHref": "",
        }

    header = preview.find("div", class_="episode-preview-header")
    title = ""
    summary = ""
    if header is not None:
        title = text_of(header.find("b"))
        summary = text_of(header.find("p"))
        if not title and not summary:
            title = text_of(header)
    else:
        title = text_of(preview)

    image = preview.find("img")
    link = preview.find("a", href=True)

    return {
        "title": title,
        "summary": summary,
        "imageAlt": clean_text(image.get("alt", "")) if image else "",
        "imageName": clean_text(image.get("data-image-name", "")) if image else "",
        "imageKey": clean_text(image.get("data-image-key", "")) if image else "",
        "imageHref": clean_text(link.get("href", "")) if link else "",
    }


def extract_storytext_fields(storytext: Tag) -> tuple[str, str]:
    fields = [
        text_of(node)
        for node in storytext.find_all("div", recursive=False)
        if is_meaningful_text(text_of(node))
    ]

    if len(fields) >= 2:
        return fields[0], fields[1]

    raw = text_of(storytext)
    if not raw:
        return "", ""

    return "", raw


def extract_character_identity(node: Tag, speaker: str) -> dict[str, Any] | None:
    anchor = node.find("a", href=True)
    image = node.find("img")
    label = clean_text((image.get("alt", "") if image else "")).replace("(icon)", "").strip()
    resolved_label = label or speaker

    if not resolved_label and anchor is None and image is None:
        return None

    image_href = ""
    if image is not None:
        image_href = clean_text(image.get("data-src", "") or image.get("src", ""))
        if image_href.startswith("data:image"):
            image_href = ""

    return {
        "key": slugify(resolved_label, "unknown-character"),
        "label": resolved_label or speaker or "Unknown",
        "avatarLabel": build_avatar_label(resolved_label or speaker or "Unknown"),
        "characterHref": clean_text(anchor.get("href", "")) if anchor else "",
        "imageAlt": clean_text(image.get("alt", "")) if image else "",
        "imageName": clean_text(image.get("data-image-name", "")) if image else "",
        "imageKey": clean_text(image.get("data-image-key", "")) if image else "",
        "imageHref": image_href,
    }


def make_dialogue_line(node: Tag) -> dict[str, Any] | None:
    storytext = node.find("div", class_="storytext")
    if storytext is None:
        return None

    speaker, text = extract_storytext_fields(storytext)
    if not is_meaningful_text(text):
        return None

    character = extract_character_identity(node, speaker)
    resolved_speaker = speaker or (
        character["label"] if character is not None and character["label"] else "Narration"
    )

    payload: dict[str, Any] = {
        "speaker": resolved_speaker,
        "speakerKey": slugify(resolved_speaker, "narration"),
        "text": text,
        "avatarLabel": (
            character["avatarLabel"]
            if character is not None and character.get("avatarLabel")
            else build_avatar_label(resolved_speaker)
        ),
        "isThought": text.startswith("(") and text.endswith(")"),
    }

    if character is not None:
        payload["character"] = character

    return payload


def extract_dialogue_lines(node: Tag) -> list[dict[str, Any]]:
    if "hidden" in node.get("class", []):
        candidates = [node]
    else:
        candidates = node.find_all("div", class_="hidden", recursive=False)

    lines: list[dict[str, Any]] = []
    for candidate in candidates:
        line = make_dialogue_line(candidate)
        if line is not None:
            lines.append(line)
    return lines


def add_group(
    groups: list[dict[str, Any]],
    scenes: list[dict[str, Any]],
    scene: dict[str, Any],
    title: str,
    kind: str,
    lines: list[dict[str, Any]],
    *,
    emphasis: str | None = None,
) -> None:
    if not lines:
        return

    group_id = f"{scene['id']}-group-{len(scene['dialogueGroupIds']) + 1:02d}"
    speakers = dedupe_strings([line["speaker"] for line in lines if line.get("speaker")])
    group: dict[str, Any] = {
        "id": group_id,
        "sceneId": scene["id"],
        "title": title,
        "kind": kind,
        "lineCount": len(lines),
        "speakers": speakers,
        "lines": lines,
    }
    if emphasis:
        group["emphasis"] = emphasis

    groups.append(group)
    scene["dialogueGroupIds"].append(group_id)
    scene["lineCount"] += len(lines)


def create_scene(
    scenes: list[dict[str, Any]],
    chapter_id: str,
    title: str,
    scene_type: str,
    *,
    marker: str = "",
) -> dict[str, Any]:
    scene: dict[str, Any] = {
        "id": f"{chapter_id}-scene-{len(scenes) + 1:02d}",
        "title": title,
        "sceneType": scene_type,
        "marker": marker,
        "lineCount": 0,
        "dialogueGroupIds": [],
    }
    scenes.append(scene)
    return scene


def add_scene_dialogue_groups(
    groups: list[dict[str, Any]],
    scenes: list[dict[str, Any]],
    scene: dict[str, Any],
    lines: list[dict[str, Any]],
) -> None:
    if not lines:
        return

    chunks: list[list[dict[str, Any]]] = []
    current_chunk: list[dict[str, Any]] = []
    for line in lines:
        if current_chunk and bool(line.get("isThought")) != bool(current_chunk[-1].get("isThought")):
            chunks.append(current_chunk)
            current_chunk = [line]
            continue
        current_chunk.append(line)

    if current_chunk:
        chunks.append(current_chunk)

    for index, chunk in enumerate(chunks, start=1):
        is_inner_voice = all(bool(line.get("isThought")) for line in chunk)
        if len(chunks) == 1:
            title = scene["title"]
        elif is_inner_voice:
            title = f"{scene['title']} inner voice"
        else:
            title = f"{scene['title']} beat {index:02d}"

        add_group(
            groups,
            scenes,
            scene,
            title,
            "inner-monologue" if is_inner_voice else "scene-dialogue",
            chunk,
        )


def extract_chapter_story_structure(
    content: Tag,
    chapter_id: str,
    preview_title: str,
    preview_summary: str,
) -> tuple[list[str], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    scene_markers: list[str] = []
    scenes: list[dict[str, Any]] = []
    groups: list[dict[str, Any]] = []
    dialogues: list[dict[str, Any]] = []
    current_scene: dict[str, Any] | None = None
    pending_scene_lines: list[dict[str, Any]] = []

    def flush_pending_scene_lines() -> None:
        nonlocal pending_scene_lines
        if current_scene is None or not pending_scene_lines:
            pending_scene_lines = []
            return
        add_scene_dialogue_groups(groups, scenes, current_scene, pending_scene_lines)
        pending_scene_lines = []

    children = [child for child in content.children if isinstance(child, Tag)]
    for child in children:
        if child.name == "br":
            continue
        if child.find("div", class_="episode-preview") is not None:
            continue
        if child.name == "div" and child.get("style", "").replace(" ", "") == "clear:both":
            continue

        if child.name == "center":
            marker = text_of(child)
            if not is_meaningful_text(marker):
                continue
            if preview_title and preview_title in marker:
                continue
            if preview_summary and preview_summary in marker:
                continue

            flush_pending_scene_lines()
            scene_markers.append(marker)
            current_scene = create_scene(
                scenes,
                chapter_id,
                marker,
                "scene",
                marker=marker,
            )
            continue

        if child.name == "i":
            flush_pending_scene_lines()
            current_scene = create_scene(scenes, chapter_id, "Opening Sequence", "flashback")
            lines = extract_dialogue_lines(child)
            add_group(
                groups,
                scenes,
                current_scene,
                "Cold open",
                "flashback",
                lines,
                emphasis="italic",
            )
            continue

        if child.name == "div" and "hidden" in child.get("class", []):
            if current_scene is None:
                current_scene = create_scene(scenes, chapter_id, "Story Beat", "scene")
            pending_scene_lines.extend(extract_dialogue_lines(child))

    flush_pending_scene_lines()
    for group in groups:
        dialogues.extend(group["lines"])

    return scene_markers, scenes, groups, dialogues


def extract_chapters(root: Tag) -> list[dict[str, Any]]:
    tabs_root = root.find("div", class_="tabs")
    if tabs_root is None:
        return []

    labels = extract_chapter_labels(tabs_root)
    contents = tabs_root.find_all("div", class_="tabs__content", recursive=False)
    total = max(len(labels), len(contents))
    chapters: list[dict[str, Any]] = []

    for index in range(total):
        label = labels[index] if index < len(labels) else f"Chapter {index + 1:02d}"
        content = contents[index] if index < len(contents) else None
        preview = extract_episode_preview(content) if content is not None else {
            "title": "",
            "summary": "",
            "imageAlt": "",
            "imageName": "",
            "imageKey": "",
            "imageHref": "",
        }
        chapter_id = f"chapter-{index + 1:02d}"

        if content is not None:
            scene_markers, scenes, dialogue_groups, dialogues = extract_chapter_story_structure(
                content,
                chapter_id,
                preview["title"],
                preview["summary"],
            )
        else:
            scene_markers, scenes, dialogue_groups, dialogues = [], [], [], []

        speakers = dedupe_strings([line["speaker"] for line in dialogues if line.get("speaker")])
        chapters.append(
            {
                "id": chapter_id,
                "label": label,
                "title": preview["title"],
                "summary": preview["summary"],
                "sceneMarkers": scene_markers,
                "scenes": scenes,
                "dialogueGroups": dialogue_groups,
                "dialogues": dialogues,
                "meta": {
                    "chapterNumber": index + 1,
                    "contentStatus": "full" if dialogues else "meta-only",
                    "previewImageAlt": preview["imageAlt"],
                    "previewImageName": preview["imageName"],
                    "previewImageKey": preview["imageKey"],
                    "previewImageHref": preview["imageHref"],
                    "lineCount": len(dialogues),
                    "sceneCount": len(scenes),
                    "dialogueGroupCount": len(dialogue_groups),
                    "speakerCount": len(speakers),
                    "speakers": speakers,
                },
            }
        )

    return chapters


def extract_story(html_path: Path) -> dict[str, Any]:
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    root = get_root_story_container(soup)

    page_title = text_of(soup.find("h1"))
    intro = extract_intro(root)

    return {
        "sourceFile": str(html_path),
        "title": page_title,
        "subtitle": intro["subtitle"],
        "intro": intro["intro"],
        "relatedPages": extract_related_pages(root),
        "chapters": extract_chapters(root),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract clean story data from a Fandom SingleFile HTML snapshot.",
    )
    parser.add_argument("input", type=Path, help="Path to the saved Fandom HTML file.")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Optional JSON output path. Prints to stdout when omitted.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    payload = extract_story(args.input)
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)

    if args.output is not None:
        args.output.write_text(serialized + "\n", encoding="utf-8")
    else:
        print(serialized)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
