#!/usr/bin/env python3
"""
Build High-Performance Compact Character & Animation System
Reduces 188MB redundant data to 270KB deduplicated profile architecture.
"""

import os
import json
import re

WORKSPACE = "/Users/B0322527/.gemini/antigravity/scratch/ai-anim-studio"
DATA_DIR = os.path.join(WORKSPACE, "src", "data")
RIGS_DIR = os.path.join(WORKSPACE, "public", "characters", "rigs")
CATALOG_PATH = os.path.join(DATA_DIR, "autodraftFullCatalog.json")

PROFILES_OUT = os.path.join(DATA_DIR, "characterProfiles.json")
CHAR_TO_PROFILE_OUT = os.path.join(DATA_DIR, "characterToProfile.json")
ALL_CHARS_OUT = os.path.join(DATA_DIR, "autodraftAllCharacters.json")
OLD_ACTION_MAP = os.path.join(DATA_DIR, "characterActionMap.json")

def sort_key_for_action(anim_name):
    low = anim_name.lower()
    primary_order = [
        "idle", "walk", "run", "talking", "flying", "fly", "drive", "accelerate",
        "dance", "namaskar", "namaste", "sitting", "attack", "roar", "eating",
        "drinking", "greeting", "happy", "angry"
    ]
    for idx, p in enumerate(primary_order):
        if low == p or low.startswith(p + "_") or low.startswith(p + " "):
            return (0, idx, anim_name)
    return (1, 0, anim_name)

def main():
    # Remove old bulky action map
    if os.path.exists(OLD_ACTION_MAP):
        os.remove(OLD_ACTION_MAP)
        print("Removed bulky 188MB characterActionMap.json")

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    characters = catalog.get("characters", [])
    print(f"Loaded {len(characters)} characters.")

    profile_to_id = {}
    profiles = {}
    char_to_profile = {}
    all_characters_data = []

    for c in characters:
        cid = str(c["id"])
        slug = c["slug"]
        title = c["title"]
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
        skel_path = os.path.join(cdir, "skeleton.json")
        
        available_angles = ["3/4 FRONT"]
        if os.path.exists(os.path.join(cdir, "skeleton_front.json")):
            available_angles.append("FRONT")
        if os.path.exists(os.path.join(cdir, "skeleton_back.json")):
            available_angles.append("3/4 BACK")

        # Extract animation names
        anims = []
        if os.path.exists(skel_path):
            try:
                with open(skel_path, "r", encoding="utf-8") as sf:
                    sk = json.load(sf)
                anims = list(sk.get("animations", {}).keys())
                anims.sort(key=sort_key_for_action)
            except Exception as e:
                print(f"Error reading {skel_path}: {e}")

        # Store profile
        anims_tuple = tuple(anims)
        if anims_tuple not in profile_to_id:
            pid = f"prof_{len(profiles)}"
            profile_to_id[anims_tuple] = pid
            profiles[pid] = anims
        pid = profile_to_id[anims_tuple]

        char_to_profile[slug] = pid
        char_to_profile[cid] = pid
        norm_name = re.sub(r'[^a-z0-9]', '', title.lower())
        char_to_profile[norm_name] = pid

        local_avatar = f"/characters/{cid}.webp"
        if not os.path.exists(os.path.join(WORKSPACE, "public", "characters", f"{cid}.webp")):
            local_avatar = c.get("thumbnail_url") or f"/characters/rigs/{slug}/atlas.webp"

        all_characters_data.append({
            "id": cid,
            "name": title,
            "slug": slug,
            "category": category,
            "tags": [category, stype, title.lower()],
            "structureType": stype,
            "avatarUrl": local_avatar,
            "availableAngles": available_angles,
            "structures": structs
        })

    with open(PROFILES_OUT, "w", encoding="utf-8") as pf:
        json.dump(profiles, pf, indent=2)

    with open(CHAR_TO_PROFILE_OUT, "w", encoding="utf-8") as cf:
        json.dump(char_to_profile, cf, indent=2)

    with open(ALL_CHARS_OUT, "w", encoding="utf-8") as af:
        json.dump(all_characters_data, af, indent=2)

    print(f"Successfully generated compact architecture:")
    print(f"  {PROFILES_OUT}: {len(profiles)} distinct profiles ({os.path.getsize(PROFILES_OUT)/1024:.1f} KB)")
    print(f"  {CHAR_TO_PROFILE_OUT}: {len(char_to_profile)} character mappings ({os.path.getsize(CHAR_TO_PROFILE_OUT)/1024:.1f} KB)")
    print(f"  {ALL_CHARS_OUT}: {len(all_characters_data)} characters ({os.path.getsize(ALL_CHARS_OUT)/1024:.1f} KB)")

if __name__ == "__main__":
    main()
