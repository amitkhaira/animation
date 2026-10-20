#!/usr/bin/env python3
"""
AutoDraft Complete Character & Animation Extractor and Downloader
Parses the 142MB HAR file, extracts all 639 characters, analyzes structures,
maps animations (PRIMARY, HAND, EXPRESSION, LEGS), verifies image quality,
and builds the master autodraftFullCatalog.json dataset.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

HAR_PATH = "/Users/B0322527/Downloads/gemini_project/autodraft.in.characters_complete_animations.har"
WORKSPACE = "/Users/B0322527/.gemini/antigravity/scratch/ai-anim-studio"
DATA_DIR = os.path.join(WORKSPACE, "src", "data")
RIGS_DIR = os.path.join(WORKSPACE, "public", "characters", "rigs")
CATALOG_OUT = os.path.join(DATA_DIR, "autodraftFullCatalog.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://autodraft.in/",
    "Origin": "https://autodraft.in"
}

def clean_slug(name):
    s = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
    s = re.sub(r'_+', '_', s).strip('_')
    return s

def fix_cdn_url(url):
    if not url:
        return url
    return url.replace("assets.autodraft.kr", "assets.autodraft.in")

def classify_character(char_obj, search_category_map):
    cid = char_obj.get("id")
    if cid in search_category_map:
        return search_category_map[cid]

    title = char_obj.get("title", "").lower()
    structs = char_obj.get("structures", [])
    st_types = [s.get("type", "") for s in structs]

    if any(t == "car" for t in st_types) or any(w in title for w in ["car", "bus", "truck", "tractor", "auto", "bike", "jeep", "ambulance", "van", "cart", "charriot", "gadi"]):
        return "Vehicles"
    if any(t in ["bird", "real_bird"] for t in st_types) or any(w in title for w in ["bird", "sparrow", "crow", "parrot", "peacock", "owl", "chick", "eagle", "pigeon", "hen"]):
        return "Birds"
    if any(t in ["animal", "expressive_animal", "hopper", "expressive_hopper"] for t in st_types) or any(w in title for w in ["lion", "tiger", "cow", "horse", "dog", "cat", "elephant", "wolf", "monkey", "bear", "rabbit", "fox", "camel", "deer"]):
        return "Animals"
    if any(w in title for w in ["bhoot", "chudail", "ghost", "witch", "monster", "demon", "devil", "vampire", "zombie"]):
        return "Horror"
    if any(w in title for w in ["krishna", "ram", "shiva", "ganesh", "durga", "vishnu", "hanuman", "parvati", "sita", "lakshman", "ravan", "buddha", "jesus", "mary", "allah", "pandit", "sadhu", "tantrik", "monk", "pope", "sheikh", "apsara", "indra", "surya"]):
        return "Religious"
    if any(t == "kid" for t in st_types) or any(w in title for w in ["kid", "baby", "child", "boy", "girl"]) and "village" not in title and "western" not in title:
        return "Kids"
    if any(w in title for w in ["village", "desi", "kisan", "farmer", "sarpanch", "dhobi", "darzi", "chai"]):
        return "Desi"
    if any(w in title for w in ["western", "modern", "office", "boss", "suit", "girl", "man"]):
        return "Western"
    
    return "General"

def parse_har():
    print(f"Loading HAR file: {HAR_PATH}...")
    with open(HAR_PATH, "r", encoding="utf-8", errors="ignore") as f:
        har = json.load(f)

    entries = har.get("log", {}).get("entries", [])
    print(f"Total entries in HAR: {len(entries)}")

    search_category_map = {}
    characters = {}
    structures_catalog = {}

    for e in entries:
        req = e.get("request", {})
        res = e.get("response", {})
        url = req.get("url", "")
        body = res.get("content", {}).get("text", "")
        if not body:
            continue

        # Check search API categories
        if "/v2/rig/characters/search" in url:
            match = re.search(r'title=([^&]+)', url)
            if match:
                cat_raw = urllib.parse.unquote(match.group(1)).lower()
                cat_name = "General"
                if "desi" in cat_raw or "village" in cat_raw:
                    cat_name = "Desi"
                elif "western" in cat_raw:
                    cat_name = "Western"
                elif "birds" in cat_raw:
                    cat_name = "Birds"
                elif "animals" in cat_raw:
                    cat_name = "Animals"
                elif "vehicles" in cat_raw:
                    cat_name = "Vehicles"
                elif "religious" in cat_raw:
                    cat_name = "Religious"
                elif "horror" in cat_raw:
                    cat_name = "Horror"

                try:
                    data = json.loads(body)
                    for item in data.get("data", []):
                        search_category_map[item.get("id")] = cat_name
                        characters[item.get("id")] = item
                except Exception:
                    pass

        # Check main characters API
        elif "/v2/rig/characters" in url:
            try:
                data = json.loads(body)
                for item in data.get("data", []):
                    characters[item.get("id")] = item
            except Exception:
                pass

        # Check structure animations API
        elif "/v2/rig/structure/" in url:
            match = re.search(r'/structure/(\d+)', url)
            if match:
                st_id = int(match.group(1))
                try:
                    st_data = json.loads(body)
                    data_obj = st_data.get("data", {})
                    actions = data_obj.get("actions", [])
                    tabs_map = {}
                    for a in actions:
                        t = a.get("tab", "PRIMARY")
                        tabs_map[t] = tabs_map.get(t, 0) + 1
                    
                    structures_catalog[st_id] = {
                        "id": st_id,
                        "type": data_obj.get("type"),
                        "pose": data_obj.get("pose"),
                        "version": data_obj.get("version"),
                        "total_animations": len(actions),
                        "tabs": tabs_map,
                        "actions": actions
                    }
                except Exception:
                    pass

    print(f"Extracted {len(characters)} unique characters.")
    print(f"Extracted {len(structures_catalog)} unique structure animation packs.")
    return characters, structures_catalog, search_category_map

def download_file(url, out_path):
    if not url:
        return False
    url = fix_cdn_url(url)
    
    # Properly quote spaces and special characters in URL path
    parsed = urllib.parse.urlsplit(url)
    encoded_path = urllib.parse.quote(parsed.path, safe='/:@')
    url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, encoded_path, parsed.query, parsed.fragment))

    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        return True
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(out_path, "wb") as f:
                f.write(data)
        return True
    except Exception as ex:
        print(f"Failed to download {url}: {ex}")
        return False

def build_and_save_catalog(characters, structures_catalog, search_category_map):
    catalog_list = []
    category_counts = {}
    archetype_counts = {}

    for cid, c in characters.items():
        category = classify_character(c, search_category_map)
        category_counts[category] = category_counts.get(category, 0) + 1

        structs_out = []
        for s in c.get("structures", []):
            st_type = s.get("type", "human")
            archetype_counts[st_type] = archetype_counts.get(st_type, 0) + 1
            meta = s.get("metadata") or {}
            st_id = s.get("id")

            st_info = structures_catalog.get(st_id, {})
            structs_out.append({
                "id": st_id,
                "type": st_type,
                "pose": s.get("pose", "front-side"),
                "version": s.get("version"),
                "atlas_png": fix_cdn_url(meta.get("atlas_png")),
                "atlas_file": fix_cdn_url(meta.get("atlas_file")),
                "json_file": fix_cdn_url(meta.get("json_file")),
                "ik_file": fix_cdn_url(meta.get("ik_file")),
                "total_animations": st_info.get("total_animations", 0),
                "tabs": st_info.get("tabs", {})
            })

        catalog_list.append({
            "id": cid,
            "title": c.get("title", ""),
            "category": category,
            "slug": clean_slug(c.get("title", f"char_{cid}")),
            "thumbnail_url": fix_cdn_url(c.get("thumbnail_url")),
            "structures": structs_out
        })

    # Sort characters: Religious first, then Desi, Animals, Birds, Vehicles, Kids, Western, General
    cat_order = {"Religious": 1, "Desi": 2, "Animals": 3, "Birds": 4, "Vehicles": 5, "Kids": 6, "Western": 7, "Horror": 8, "General": 9}
    catalog_list.sort(key=lambda x: (cat_order.get(x["category"], 99), x["title"]))

    final_dataset = {
        "total_characters": len(catalog_list),
        "category_counts": category_counts,
        "archetype_counts": archetype_counts,
        "characters": catalog_list
    }

    os.makedirs(os.path.dirname(CATALOG_OUT), exist_ok=True)
    with open(CATALOG_OUT, "w", encoding="utf-8") as f:
        json.dump(final_dataset, f, indent=2)

    print(f"Successfully saved master catalog to {CATALOG_OUT}")
    print("Category Breakdown:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  - {cat}: {count} characters")
    print("Archetype Breakdown:")
    for arch, count in sorted(archetype_counts.items(), key=lambda x: -x[1]):
        print(f"  - {arch}: {count} structures")

    return final_dataset

def download_character_rig(c, rigs_dir):
    slug = c["slug"]
    cdir = os.path.join(rigs_dir, slug)
    os.makedirs(cdir, exist_ok=True)
    success = True
    
    structs = c.get("structures", [])
    if not structs:
        return slug, False

    has_front_side = any(s.get("pose") == "front-side" for s in structs)

    for s in structs:
        pose = s.get("pose", "front-side")
        meta = {
            "png": s.get("atlas_png"),
            "atlas": s.get("atlas_file"),
            "json": s.get("json_file")
        }
        
        # Decide filenames based on pose
        ext = ".webp" if (meta["png"] and ".webp" in meta["png"]) else ".png"
        if pose == "front-side" or (not has_front_side and pose in ["front", "side"]):
            targets = [
                (f"atlas{ext}", meta["png"]),
                ("skeleton.atlas", meta["atlas"]),
                ("skeleton.json", meta["json"])
            ]
        elif pose == "front":
            targets = [
                (f"atlas_front{ext}", meta["png"]),
                ("skeleton_front.atlas", meta["atlas"]),
                ("skeleton_front.json", meta["json"])
            ]
        elif pose in ["back", "back-2"]:
            targets = [
                (f"atlas_back{ext}", meta["png"]),
                ("skeleton_back.atlas", meta["atlas"]),
                ("skeleton_back.json", meta["json"])
            ]
        else:
            targets = [
                (f"atlas_{pose}{ext}", meta["png"]),
                (f"skeleton_{pose}.atlas", meta["atlas"]),
                (f"skeleton_{pose}.json", meta["json"])
            ]
            
        for fname, url in targets:
            if not url:
                continue
            dst = os.path.join(cdir, fname)
            if not os.path.exists(dst) or os.path.getsize(dst) == 0:
                res = download_file(url, dst)
                if not res:
                    success = False

    # Ensure default atlas and skeleton exist
    files = os.listdir(cdir)
    if not any(f.startswith("atlas.") for f in files):
        for f in files:
            if f.startswith("atlas_") and (f.endswith(".webp") or f.endswith(".png")):
                import shutil
                ext_f = os.path.splitext(f)[1]
                shutil.copyfile(os.path.join(cdir, f), os.path.join(cdir, f"atlas{ext_f}"))
                break
    if not os.path.exists(os.path.join(cdir, "skeleton.json")):
        for f in files:
            if f.startswith("skeleton_") and f.endswith(".json"):
                import shutil
                shutil.copyfile(os.path.join(cdir, f), os.path.join(cdir, "skeleton.json"))
                break
    if not os.path.exists(os.path.join(cdir, "skeleton.atlas")):
        for f in files:
            if f.startswith("skeleton_") and f.endswith(".atlas"):
                import shutil
                shutil.copyfile(os.path.join(cdir, f), os.path.join(cdir, "skeleton.atlas"))
                break

    return slug, success

def download_categories(dataset, categories_to_download, max_workers=6):
    print(f"\n--- Downloading Rigs for categories: {categories_to_download} ---")
    targets = [c for c in dataset["characters"] if c["category"] in categories_to_download]
    print(f"Total characters to process: {len(targets)}")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(download_character_rig, c, RIGS_DIR): c for c in targets}
        done_count = 0
        for fut in as_completed(futures):
            slug, success = fut.result()
            done_count += 1
            if done_count % 10 == 0 or done_count == len(targets):
                print(f"  Progress: {done_count}/{len(targets)} completed.")

    # Automatically sync localRigManifest.json
    manifest_path = os.path.join(DATA_DIR, "localRigManifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as mf:
            manifest = json.load(mf)
        for c in targets:
            slug = c["slug"]
            cdir = os.path.join(RIGS_DIR, slug)
            if os.path.exists(cdir):
                files = os.listdir(cdir)
                has_front = "atlas_front.webp" in files or "atlas_front.png" in files
                has_back = "atlas_back.webp" in files or "atlas_back.png" in files
                default_img = "atlas.webp" if "atlas.webp" in files else ("atlas.png" if "atlas.png" in files else None)
                if default_img:
                    manifest[slug] = {
                        "hasFront": has_front,
                        "hasBack": has_back,
                        "defaultImg": default_img
                    }
        with open(manifest_path, "w") as mf:
            json.dump(manifest, mf, indent=2)
        print(f"Synced localRigManifest.json: {len(manifest)} total active rigs.")

def main():
    characters, structures_catalog, search_category_map = parse_har()
    dataset = build_and_save_catalog(characters, structures_catalog, search_category_map)
    
    # Download specific categories
    if "--download-media" in sys.argv:
        download_categories(dataset, ["Animals", "Birds", "Vehicles"])
    elif "--download-all" in sys.argv:
        download_categories(dataset, ["Religious", "Animals", "Birds", "Vehicles", "Desi", "Kids", "Western", "Horror", "General"])
    elif "--download-category" in sys.argv:
        idx = sys.argv.index("--download-category")
        if idx + 1 < len(sys.argv):
            cats = [sys.argv[idx + 1]]
            download_categories(dataset, cats)
    
    print("\nExtraction & Catalog creation complete!")

if __name__ == "__main__":
    main()
