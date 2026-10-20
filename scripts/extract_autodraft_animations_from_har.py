#!/usr/bin/env python3
"""
Extract Complete Tabbed Animations and Animated GIF Thumbnails from HAR
Builds officialStructureAnimations.json with exact AutoDraft metadata, tabs (PRIMARY, HAND, EXPRESSION, LEGS),
and direct CDN GIF thumbnail URLs.
"""

import os
import json
import re

HAR_PATH = "/Users/B0322527/Downloads/gemini_project/autodraft.in.characters_complete_animations.har"
WORKSPACE = "/Users/B0322527/.gemini/antigravity/scratch/ai-anim-studio"
DATA_DIR = os.path.join(WORKSPACE, "src", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "officialStructureAnimations.json")

def format_label(name):
    clean = name.replace("_", " ").strip()
    clean = re.sub(r'\s+', ' ', clean)
    return clean

def fix_thumb_url(url):
    if not url:
        return ""
    # Ensure working CDN domain
    return url.replace("assets.autodraft.kr", "assets.autodraft.in")

def main():
    print(f"Reading HAR from {HAR_PATH}...")
    with open(HAR_PATH, "r", encoding="utf-8", errors="ignore") as f:
        har = json.load(f)

    structures_by_id = {}
    structures_by_key = {}

    for e in har.get("log", {}).get("entries", []):
        url = e.get("request", {}).get("url", "")
        if "/v2/rig/structure/" in url:
            body = e.get("response", {}).get("content", {}).get("text", "")
            if body and "animations" in body:
                try:
                    data = json.loads(body).get("data", {})
                    sid = str(data.get("id"))
                    stype = data.get("type", "human")
                    spose = data.get("pose", "front-side")
                    anims_dict = data.get("animations", {})

                    # Normalize pose name
                    norm_pose = spose
                    if spose == "front":
                        norm_pose = "FRONT"
                    elif spose in ["front-side", "front_side", "side"]:
                        norm_pose = "3/4 FRONT"
                    elif spose in ["back", "back-2", "back_side"]:
                        norm_pose = "3/4 BACK"

                    processed_tabs = {}
                    all_actions_for_pose = []

                    for tab_name in ["PRIMARY", "HAND", "EXPRESSION", "LEGS"]:
                        raw_items = anims_dict.get(tab_name, [])
                        tab_actions = []
                        for item in raw_items:
                            title = item.get("title")
                            if not title:
                                continue
                            meta = item.get("metadata") or {}
                            thumb = fix_thumb_url(meta.get("thumbnail_url"))

                            action_obj = {
                                "id": title,
                                "label": format_label(title),
                                "category": tab_name.lower(),
                                "tab": tab_name,
                                "thumbnailUrl": thumb,
                                "durationSeconds": 2.0
                            }
                            tab_actions.append(action_obj)
                            all_actions_for_pose.append(action_obj)

                        if tab_actions:
                            processed_tabs[tab_name] = tab_actions

                    struct_data = {
                        "id": sid,
                        "type": stype,
                        "pose": spose,
                        "normPose": norm_pose,
                        "tabs": processed_tabs,
                        "allActions": all_actions_for_pose
                    }

                    structures_by_id[sid] = struct_data

                    # Store by archetype:pose key
                    archetype_key = f"{stype}:{norm_pose}"
                    if archetype_key not in structures_by_key or len(all_actions_for_pose) > len(structures_by_key[archetype_key]["allActions"]):
                        structures_by_key[archetype_key] = struct_data

                except Exception as ex:
                    print(f"Error parsing structure: {ex}")

    output_dataset = {
        "byId": structures_by_id,
        "byArchetype": structures_by_key
    }

    print(f"Extracted {len(structures_by_id)} structures by ID.")
    print(f"Extracted {len(structures_by_key)} archetypes by pose.")
    for k, v in structures_by_key.items():
        tabs_summary = {t: len(items) for t, items in v["tabs"].items()}
        print(f"  {k:25} -> Total: {len(v['allActions'])} actions | Tabs: {tabs_summary}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        json.dump(output_dataset, out, indent=2)

    print(f"Saved complete structure animations database to {OUTPUT_FILE} ({os.path.getsize(OUTPUT_FILE)/1024:.1f} KB)")

if __name__ == "__main__":
    main()
