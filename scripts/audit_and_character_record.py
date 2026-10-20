#!/usr/bin/env python3
"""
Comprehensive Character, Archetype, Animation & Download Audit
Analyzes all 639 characters, categorizes animation sets (showing differences like Turtle vs Lion),
and audits local rig download status (success, failure, missing).
"""

import os
import json
from collections import defaultdict

WORKSPACE = "/Users/B0322527/.gemini/antigravity/scratch/ai-anim-studio"
DATA_DIR = os.path.join(WORKSPACE, "src", "data")
RIGS_DIR = os.path.join(WORKSPACE, "public", "characters", "rigs")
CATALOG_PATH = os.path.join(DATA_DIR, "autodraftFullCatalog.json")
AUDIT_OUTPUT = os.path.join(DATA_DIR, "characterAuditReport.json")

def audit():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    characters = catalog.get("characters", [])
    print(f"Total characters in catalog: {len(characters)}")

    # 1. Category Breakdown
    category_summary = defaultdict(list)
    archetype_summary = defaultdict(list)
    
    for c in characters:
        category_summary[c["category"]].append(c)
        for s in c.get("structures", []):
            archetype_summary[s.get("type", "unknown")].append((c["slug"], s.get("pose")))

    # 2. Local Rig Download Status Audit
    rig_audit = {
        "success": [],
        "incomplete": [],
        "missing": []
    }

    local_rig_folders = set(os.listdir(RIGS_DIR)) if os.path.exists(RIGS_DIR) else set()

    for c in characters:
        slug = c["slug"]
        cdir = os.path.join(RIGS_DIR, slug)
        if slug not in local_rig_folders or not os.path.exists(cdir):
            rig_audit["missing"].append({
                "slug": slug,
                "title": c["title"],
                "category": c["category"],
                "reason": "Folder not downloaded yet"
            })
            continue

        # Check required files
        files = os.listdir(cdir)
        has_webp = any(f.endswith(".webp") or f.endswith(".png") for f in files)
        has_atlas = any(f.endswith(".atlas") for f in files)
        has_json = any(f.endswith(".json") for f in files)

        sizes = {}
        for f in files:
            p = os.path.join(cdir, f)
            if os.path.isfile(p):
                sizes[f] = os.path.getsize(p)

        # Check if all files > 0 bytes
        is_valid = has_webp and has_atlas and has_json and all(v > 0 for v in sizes.values())

        if is_valid:
            rig_audit["success"].append({
                "slug": slug,
                "title": c["title"],
                "category": c["category"],
                "files": list(sizes.keys()),
                "sizes": sizes
            })
        else:
            missing_parts = []
            if not has_webp: missing_parts.append("missing texture (.webp/.png)")
            if not has_atlas: missing_parts.append("missing .atlas")
            if not has_json: missing_parts.append("missing .json")
            for f, sz in sizes.items():
                if sz == 0: missing_parts.append(f"empty file {f}")
            rig_audit["incomplete"].append({
                "slug": slug,
                "title": c["title"],
                "category": c["category"],
                "reasons": missing_parts
            })

    # 3. Analyze Animations in Downloaded Rigs (Inspect skeleton.json)
    archetype_animations = defaultdict(dict)
    character_animations = {}

    for item in rig_audit["success"]:
        slug = item["slug"]
        cdir = os.path.join(RIGS_DIR, slug)
        json_file = os.path.join(cdir, "skeleton.json")
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as jf:
                    data = json.load(jf)
                    anims = list(data.get("animations", {}).keys())
                    character_animations[slug] = anims
            except Exception as e:
                pass

    # Group characters by identical animation sets
    animation_set_clusters = defaultdict(list)
    for slug, anims in character_animations.items():
        anims_tuple = tuple(sorted(anims))
        animation_set_clusters[anims_tuple].append(slug)

    print("\n--- CATEGORY BREAKDOWN ---")
    for cat, chars in sorted(category_summary.items(), key=lambda x: -len(x[1])):
        downloaded = sum(1 for c in chars if any(s["slug"] == c["slug"] for s in rig_audit["success"]))
        print(f"  {cat}: {len(chars)} total | {downloaded} downloaded & verified")

    print("\n--- DOWNLOAD AUDIT SUMMARY ---")
    print(f"  Fully Ready & Verified Rigs: {len(rig_audit['success'])}")
    print(f"  Incomplete/Failed Rigs: {len(rig_audit['incomplete'])}")
    print(f"  Missing / Pending Download: {len(rig_audit['missing'])}")

    print("\n--- ANIMATION CLUSTERS (Same vs Different) ---")
    print(f"Total distinct animation profiles identified locally: {len(animation_set_clusters)}")
    for anims_tuple, slugs in sorted(animation_set_clusters.items(), key=lambda x: -len(x[1])):
        sample = slugs[0]
        print(f"\nGroup size: {len(slugs)} characters (e.g. {slugs[:3]}...)")
        print(f"  Total Animations: {len(anims_tuple)}")
        print(f"  Sample Actions: {list(anims_tuple)[:8]}")

    # Specific Animal vs Bird vs Vehicle Comparison
    animal_samples = ["lion", "bear", "horse", "turtle", "rabbit", "dog_1", "cow_1", "elephant"]
    print("\n--- SPECIFIC COMPARISON IN ANIMALS & CREATURES ---")
    for a in animal_samples:
        if a in character_animations:
            anims = character_animations[a]
            print(f"  Character '{a}': {len(anims)} animations -> {anims[:10]}")

    report = {
        "total_characters": len(characters),
        "audit_counts": {
            "success": len(rig_audit["success"]),
            "incomplete": len(rig_audit["incomplete"]),
            "missing": len(rig_audit["missing"])
        },
        "category_counts": {k: len(v) for k, v in category_summary.items()},
        "category_ready_counts": {
            cat: sum(1 for c in chars if any(s["slug"] == c["slug"] for s in rig_audit["success"]))
            for cat, chars in category_summary.items()
        },
        "animation_profiles_count": len(animation_set_clusters),
        "rig_audit": rig_audit
    }

    with open(AUDIT_OUTPUT, "w", encoding="utf-8") as rf:
        json.dump(report, rf, indent=2)

    print(f"\nAudit report saved to: {AUDIT_OUTPUT}")

if __name__ == "__main__":
    audit()
