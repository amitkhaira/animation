#!/usr/bin/env python3
"""
Build Complete Character & Native Animation System
Extracts exact animations from every downloaded character's Spine skeleton.json,
builds characterActionMap.json, and synchronizes autodraftAllCharacters.json.
"""

import os
import json
import re

WORKSPACE = "/Users/B0322527/.gemini/antigravity/scratch/ai-anim-studio"
DATA_DIR = os.path.join(WORKSPACE, "src", "data")
RIGS_DIR = os.path.join(WORKSPACE, "public", "characters", "rigs")
CATALOG_PATH = os.path.join(DATA_DIR, "autodraftFullCatalog.json")
ACTION_MAP_OUT = os.path.join(DATA_DIR, "characterActionMap.json")
ALL_CHARS_OUT = os.path.join(DATA_DIR, "autodraftAllCharacters.json")

def format_label(anim_name):
    clean = anim_name.replace("_", " ").strip()
    clean = re.sub(r'\s+', ' ', clean)
    return clean

def categorize_action(anim_name):
    low = anim_name.lower()
    if any(w in low for w in ["walk", "run", "fly", "flying", "drive", "accelerate", "coasting", "drifting", "jump", "jumping", "crawl", "hop"]):
        return "movement"
    if any(w in low for w in ["angry", "smile", "crying", "cry", "happy", "laugh", "sad", "fear", "surprised", "astonished", "evil", "roar"]):
        return "emotion"
    if any(w in low for w in ["talk", "talking", "lipsing", "idle", "eyeblink", "stand", "rest", "breathe", "look"]):
        return "basic"
    return "action"

def sort_key_for_action(anim_name, stype):
    low = anim_name.lower()
    # High priority actions at top
    primary_order = [
        "idle", "walk", "run", "talking", "flying", "fly", "drive", "accelerate",
        "dance", "namaskar", "namaste", "sitting", "attack", "roar", "eating",
        "drinking", "greeting", "happy", "angry"
    ]
    for idx, p in enumerate(primary_order):
        if low == p or low.startswith(p + "_") or low.startswith(p + " "):
            return (0, idx, anim_name)
    return (1, 0, anim_name)

def extract_actions_from_skeleton(skel_path, stype):
    if not os.path.exists(skel_path):
        return []
    try:
        with open(skel_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        anims = list(data.get("animations", {}).keys())
        
        # Sort animations
        anims.sort(key=lambda a: sort_key_for_action(a, stype))

        action_items = []
        for a in anims:
            label = format_label(a)
            cat = categorize_action(a)
            action_items.append({
                "id": a,
                "label": label,
                "category": cat,
                "durationSeconds": 2.0
            })
        return action_items
    except Exception as e:
        print(f"Error parsing {skel_path}: {e}")
        return []

def main():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        full_catalog = json.load(f)

    characters = full_catalog.get("characters", [])
    print(f"Loaded {len(characters)} characters from catalog.")

    action_map = {}
    enhanced_characters = []

    for c in characters:
        cid = str(c.get("id"))
        slug = c.get("slug")
        title = c.get("title")
        category = c.get("category", "General")
        structs = c.get("structures", [])
        
        stype = "human"
        if structs:
            stype = structs[0].get("type", "human")
        elif category == "Vehicles":
            stype = "car"
        elif category == "Birds":
            stype = "bird"
        elif category == "Animals":
            stype = "animal"
        elif category == "Kids":
            stype = "kid"

        cdir = os.path.join(RIGS_DIR, slug)
        
        # Available angles
        available_angles = ["3/4 FRONT"]
        if os.path.exists(os.path.join(cdir, "skeleton_front.json")):
            available_angles.append("FRONT")
        if os.path.exists(os.path.join(cdir, "skeleton_back.json")):
            available_angles.append("3/4 BACK")

        # Extract actions for each angle
        char_actions_by_angle = {}
        
        # 3/4 FRONT / Default
        default_actions = extract_actions_from_skeleton(os.path.join(cdir, "skeleton.json"), stype)
        char_actions_by_angle["3/4 FRONT"] = default_actions

        # FRONT
        if "FRONT" in available_angles:
            front_actions = extract_actions_from_skeleton(os.path.join(cdir, "skeleton_front.json"), stype)
            char_actions_by_angle["FRONT"] = front_actions if front_actions else default_actions
        else:
            char_actions_by_angle["FRONT"] = default_actions

        # 3/4 BACK
        if "3/4 BACK" in available_angles:
            back_actions = extract_actions_from_skeleton(os.path.join(cdir, "skeleton_back.json"), stype)
            char_actions_by_angle["3/4 BACK"] = back_actions if back_actions else default_actions
        else:
            char_actions_by_angle["3/4 BACK"] = default_actions

        # Register in action_map under slug and ID and title
        action_map[slug] = char_actions_by_angle
        action_map[cid] = char_actions_by_angle
        norm_name = re.sub(r'[^a-z0-9]', '', title.lower())
        action_map[norm_name] = char_actions_by_angle

        # Local avatar url check
        local_avatar = f"/characters/{cid}.webp"
        if not os.path.exists(os.path.join(WORKSPACE, "public", "characters", f"{cid}.webp")):
            local_avatar = c.get("thumbnail_url") or f"/characters/rigs/{slug}/atlas.webp"

        # Build CharacterItem
        char_item = {
            "id": cid,
            "name": title,
            "slug": slug,
            "category": category,
            "tags": [category, stype, title.lower()],
            "structureType": stype,
            "avatarUrl": local_avatar,
            "availableAngles": available_angles,
            "structures": structs
        }
        enhanced_characters.append(char_item)

    # Save characterActionMap.json
    print(f"Saving character action map to {ACTION_MAP_OUT}...")
    with open(ACTION_MAP_OUT, "w", encoding="utf-8") as f:
        json.dump(action_map, f, indent=2)

    # Save autodraftAllCharacters.json
    print(f"Saving {len(enhanced_characters)} characters to {ALL_CHARS_OUT}...")
    with open(ALL_CHARS_OUT, "w", encoding="utf-8") as f:
        json.dump(enhanced_characters, f, indent=2)

    print("\n--- SUMMARY ---")
    print(f"Total Characters: {len(enhanced_characters)}")
    print(f"Total Unique Keys in Action Map: {len(action_map)}")

    # Sample verification
    samples = ["charriot_1", "horse", "crow", "krishna", "lion", "turtle", "rabbit", "western_girl10"]
    for s in samples:
        if s in action_map:
            acts = action_map[s]["3/4 FRONT"]
            print(f"  {s:15} -> {len(acts)} actions: {[a['id'] for a in acts[:6]]}")

if __name__ == "__main__":
    main()
