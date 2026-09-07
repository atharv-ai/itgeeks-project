#!/usr/bin/env python3
import os
import sys
import time
import json
import re
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.ai_extractor import extract_bill_from_images

# ANSI color codes for terminal reporting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

def find_dataset_pairs(test_dir: Path, truth_dir: Path) -> List[Tuple[Path, Path]]:
    """Locate all receipt image and truth JSON pairs."""
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    pairs: List[Tuple[Path, Path]] = []

    if not test_dir.exists():
        print(f"{RED}Error: Test dataset directory '{test_dir}' not found.{RESET}")
        return pairs

    # Scan for images in test_dir
    image_files = sorted([
        f for f in test_dir.iterdir()
        if f.suffix.lower() in image_extensions and not f.name.startswith(".")
    ])

    for img_path in image_files:
        # Match pattern e.g. 1000-receipt.jpg -> prefix 1000
        prefix_match = re.match(r"^(\d+)", img_path.stem)
        prefix = prefix_match.group(1) if prefix_match else img_path.stem

        # Try various naming schemes for truth file in truth_dir or test_dir
        candidate_names = [
            f"{prefix}-receipt_truth.json",
            f"{prefix}_truth.json",
            f"{img_path.stem}_truth.json",
            f"{prefix}-receipt.json",
            f"{prefix}.json",
        ]

        truth_file: Optional[Path] = None
        for name in candidate_names:
            candidate = truth_dir / name
            if candidate.exists():
                truth_file = candidate
                break
            candidate_test = test_dir / name
            if candidate_test.exists():
                truth_file = candidate_test
                break

        if truth_file:
            pairs.append((img_path, truth_file))
        else:
            print(f"{YELLOW}Warning: No truth JSON found for {img_path.name}{RESET}")

    return pairs

def extract_with_retry(
    image_bytes: bytes,
    cache_path: Optional[Path] = None,
    max_retries: int = 4,
) -> Dict[str, Any]:
    """Calls ai_extractor with local disk cache and automatic 429 rate limit backoff."""
    # Check cache first
    if cache_path and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    for attempt in range(1, max_retries + 1):
        try:
            result = extract_bill_from_images([image_bytes])
            if cache_path:
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2)
            return result
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "quota" in err_msg.lower():
                # Extract wait seconds if provided by Gemini
                wait_seconds = 32.0
                delay_match = re.search(r"retry in ([\d\.]+)s", err_msg, re.IGNORECASE)
                if delay_match:
                    try:
                        wait_seconds = float(delay_match.group(1)) + 2.0
                    except ValueError:
                        wait_seconds = 32.0
                print(f"\n  {YELLOW}⏳ Rate limit (429) hit. Pausing for {wait_seconds:.1f}s before retry ({attempt}/{max_retries})...{RESET}", flush=True)
                time.sleep(wait_seconds)
            else:
                if attempt == max_retries:
                    raise
                print(f"\n  {YELLOW}⚠️ Extraction error: {err_msg}. Retrying in 5s...{RESET}", flush=True)
                time.sleep(5.0)

    raise RuntimeError("Failed to extract bill after maximum retries.")

def check_paper_math_anomaly(data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Specifically flags if the printed total on the paper was genuinely wrong.
    Compares sum of individual line item prices + taxes + service_charge - discounts
    against the printed total.
    """
    items = data.get("items", [])
    item_sum = sum(float(item.get("price", 0.0)) for item in items)
    subtotal = float(data.get("subtotal", 0.0))
    taxes = float(data.get("taxes", 0.0))
    service_charge = float(data.get("service_charge", 0.0))
    discounts = float(data.get("discounts", 0.0))
    total = float(data.get("total", 0.0))

    calc_total = subtotal + taxes + service_charge - discounts
    subtotal_diff = abs(item_sum - subtotal)
    total_diff = abs(calc_total - total)

    anomaly_notes = []
    if subtotal_diff > 0.05:
        anomaly_notes.append(
            f"Items sum (${item_sum:.2f}) != printed subtotal (${subtotal:.2f}), diff: ${subtotal_diff:.2f}"
        )
    if total_diff > 0.05:
        anomaly_notes.append(
            f"Expected total (subtotal+tax+fee-disc = ${calc_total:.2f}) != printed total (${total:.2f}), diff: ${total_diff:.2f}"
        )

    if anomaly_notes:
        return True, " | ".join(anomaly_notes)
    return False, "Math reconciles correctly"

def evaluate_dataset(
    test_dir: Path,
    truth_dir: Path,
    cache_dir: Optional[Path] = None,
    delay_between_calls: float = 12.0,
    specific_receipt: Optional[str] = None,
    limit: Optional[int] = None,
):
    pairs = find_dataset_pairs(test_dir, truth_dir)

    if specific_receipt:
        pairs = [p for p in pairs if specific_receipt in p[0].name]

    if limit and limit > 0:
        pairs = pairs[:limit]

    if not pairs:
        print(f"{RED}No matching receipt image/truth pairs found to evaluate.{RESET}")
        return

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    print(f"\n{BOLD}{CYAN}{'='*80}{RESET}")
    print(f"{BOLD}{CYAN}   RECEIPT EXTRACTION EVALUATION REPORT ({model_name} vs Ground Truth){RESET}")
    print(f"{BOLD}{CYAN}{'='*80}{RESET}")
    print(f"{DIM}Images Directory:       {test_dir}")
    print(f"Ground Truth Directory: {truth_dir}")
    print(f"Active Gemini Model:    {model_name}")
    print(f"Total Receipts to Test: {len(pairs)}{RESET}\n")

    results: List[Dict[str, Any]] = []

    for idx, (img_path, truth_path) in enumerate(pairs, 1):
        receipt_name = img_path.stem
        cache_path = (cache_dir / f"{receipt_name}.json") if cache_dir else None

        print(f"[{idx}/{len(pairs)}] Evaluating {BOLD}{img_path.name}{RESET} ...", end="", flush=True)

        # Load ground truth
        with open(truth_path, "r", encoding="utf-8") as f:
            truth_data = json.load(f)

        # Check if ground truth has an intrinsic paper math anomaly
        truth_has_anomaly, truth_anomaly_msg = check_paper_math_anomaly(truth_data)

        # Read image
        with open(img_path, "rb") as f:
            img_bytes = f.read()

        is_cached = cache_path and cache_path.exists()

        try:
            extracted = extract_with_retry(img_bytes, cache_path=cache_path)
        except Exception as e:
            print(f" {RED}[EXTRACTION FAILED]{RESET}")
            print(f"    Error: {e}")
            results.append({
                "receipt": img_path.name,
                "status": "FAIL",
                "subtotal_pass": False,
                "total_pass": False,
                "paper_anomaly": False,
                "details": str(e),
            })
            continue

        ext_subtotal = float(extracted.get("subtotal", 0.0))
        truth_subtotal = float(truth_data.get("subtotal", 0.0))
        subtotal_diff = abs(ext_subtotal - truth_subtotal)
        subtotal_pass = subtotal_diff <= 0.05

        ext_total = float(extracted.get("total", 0.0))
        truth_total = float(truth_data.get("total", 0.0))
        total_diff = abs(ext_total - truth_total)
        total_pass = total_diff <= 0.05

        # Check if extracted receipt data exhibits a printed total anomaly
        ext_has_anomaly, ext_anomaly_msg = check_paper_math_anomaly(extracted)
        has_paper_math_error = truth_has_anomaly or ext_has_anomaly
        paper_anomaly_desc = truth_anomaly_msg if truth_has_anomaly else ext_anomaly_msg

        overall_pass = subtotal_pass and total_pass
        status_label = f"{GREEN}PASS{RESET}" if overall_pass else f"{RED}FAIL{RESET}"

        cache_indicator = f" {DIM}(cached){RESET}" if is_cached else ""
        print(f" {status_label}{cache_indicator}")

        # Item counts
        ext_items_count = len(extracted.get("items", []))
        truth_items_count = len(truth_data.get("items", []))

        # Print detailed card
        sub_status = f"{GREEN}MATCH{RESET}" if subtotal_pass else f"{RED}DIFF: ${subtotal_diff:.2f}{RESET}"
        tot_status = f"{GREEN}MATCH{RESET}" if total_pass else f"{RED}DIFF: ${total_diff:.2f}{RESET}"
        print(f"  ├─ Subtotal:  Extracted ${ext_subtotal:.2f} | Truth ${truth_subtotal:.2f} ({sub_status})")
        print(f"  ├─ Total:     Extracted ${ext_total:.2f} | Truth ${truth_total:.2f} ({tot_status})")
        print(f"  ├─ Items:     Extracted {ext_items_count} items | Truth {truth_items_count} items")

        if has_paper_math_error:
            print(f"  └─ {YELLOW}{BOLD}⚠️ [PAPER MATH ANOMALY DETECTED]{RESET} {YELLOW}{paper_anomaly_desc}{RESET}")
        else:
            print(f"  └─ {DIM}Paper Arithmetic: Verified consistent{RESET}")

        results.append({
            "receipt": img_path.name,
            "status": "PASS" if overall_pass else "FAIL",
            "subtotal_pass": subtotal_pass,
            "total_pass": total_pass,
            "subtotal_diff": subtotal_diff,
            "total_diff": total_diff,
            "paper_anomaly": has_paper_math_error,
            "paper_anomaly_desc": paper_anomaly_desc if has_paper_math_error else None,
            "confidence": extracted.get("overall_confidence", 1.0),
        })

        # Apply rate-limit cooldown delay if a live API call was just performed
        if not is_cached and idx < len(pairs) and delay_between_calls > 0:
            time.sleep(delay_between_calls)

    # Final Summary Table
    print(f"\n{BOLD}{CYAN}{'='*80}{RESET}")
    print(f"{BOLD}                        EVALUATION SUMMARY REPORT{RESET}")
    print(f"{BOLD}{CYAN}{'='*80}{RESET}")
    print(f"{'Receipt File':<24} | {'Subtotal':<10} | {'Total':<10} | {'Paper Math':<15} | {'Status':<10}")
    print(f"{'-'*24}-+-{'-'*10}-+-{'-'*10}-+-{'-'*15}-+-{'-'*10}")

    total_count = len(results)
    pass_count = sum(1 for r in results if r["status"] == "PASS")
    subtotal_matches = sum(1 for r in results if r.get("subtotal_pass"))
    total_matches = sum(1 for r in results if r.get("total_pass"))
    anomalies_count = sum(1 for r in results if r.get("paper_anomaly"))

    for r in results:
        sub_str = f"{GREEN}PASS{RESET}" if r.get("subtotal_pass") else f"{RED}FAIL{RESET}"
        tot_str = f"{GREEN}PASS{RESET}" if r.get("total_pass") else f"{RED}FAIL{RESET}"
        anom_str = f"{YELLOW}WRONG PRINT{RESET}" if r.get("paper_anomaly") else f"{GREEN}CORRECT{RESET}"
        stat_str = f"{GREEN}{BOLD}PASS{RESET}" if r["status"] == "PASS" else f"{RED}{BOLD}FAIL{RESET}"
        print(f"{r['receipt']:<24} | {sub_str:<19} | {tot_str:<19} | {anom_str:<24} | {stat_str}")

    print(f"{'-'*80}")
    pass_rate = (pass_count / total_count * 100) if total_count > 0 else 0
    print(f"Total Evaluated:          {total_count}")
    print(f"Overall Passed (Both):    {GREEN if pass_count == total_count else YELLOW}{pass_count}/{total_count} ({pass_rate:.1f}%){RESET}")
    print(f"Subtotal Matches:         {subtotal_matches}/{total_count}")
    print(f"Total Matches:            {total_matches}/{total_count}")
    print(f"Paper Math Anomalies:     {YELLOW if anomalies_count > 0 else GREEN}{anomalies_count} flagged{RESET}")
    print(f"{BOLD}{CYAN}{'='*80}{RESET}\n")

def main():
    parser = argparse.ArgumentParser(description="Evaluate Gemini 3.8 Flash bill extraction against ground truth dataset.")
    parser.add_argument(
        "--test-dir",
        type=Path,
        default=backend_dir / "test_dataset",
        help="Path to folder containing test receipt images.",
    )
    parser.add_argument(
        "--truth-dir",
        type=Path,
        default=backend_dir / "ground_truth_dataset",
        help="Path to folder containing ground truth JSON files.",
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=backend_dir / "test_dataset" / ".eval_cache",
        help="Path to cache directory for extracted JSON results.",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Bypass cache and force fresh extractions from Gemini.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=13.0,
        help="Delay in seconds between Gemini API requests to respect RPM quota.",
    )
    parser.add_argument(
        "--receipt",
        type=str,
        default=None,
        help="Evaluate a single specific receipt (e.g. '1000').",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of receipts to evaluate (e.g. 3).",
    )

    args = parser.parse_args()
    cache_path = None if args.no_cache else args.cache_dir

    evaluate_dataset(
        test_dir=args.test_dir,
        truth_dir=args.truth_dir,
        cache_dir=cache_path,
        delay_between_calls=args.delay,
        specific_receipt=args.receipt,
        limit=args.limit,
    )

if __name__ == "__main__":
    main()
