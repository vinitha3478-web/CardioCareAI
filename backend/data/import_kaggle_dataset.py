"""
Download the Kaggle heart-disease dataset and prepare:
  1) Full feature table for ML training  (heart_disease.csv)
  2) All OK GUI table (target == 0) with a FIXED record date
"""
import os
import sys
import glob
import ssl
import urllib.request

import pandas as pd

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from data.dataset_config import (
    STATIC_RECORD_DATE_STR,
    KAGGLE_DATASET_SLUGS,
    KAGGLE_PUBLIC_MIRROR_URL,
    KAGGLE_COLUMN_MAP,
    REQUIRED_FEATURE_COLUMNS,
)

DATA_DIR = os.path.join(backend_dir, "data")
RAW_CSV = os.path.join(DATA_DIR, "kaggle_heart_disease.csv")
FULL_CSV = os.path.join(DATA_DIR, "heart_disease.csv")
GUI_CSV = os.path.join(DATA_DIR, "gui_all_ok_dataset.csv")


def _download_via_kagglehub(dest_csv):
    try:
        import kagglehub
    except ImportError:
        return False

    for slug in KAGGLE_DATASET_SLUGS:
        try:
            print(f"Trying kagglehub dataset: {slug}")
            path = kagglehub.dataset_download(slug)
            csv_files = glob.glob(os.path.join(path, "**", "*.csv"), recursive=True)
            if not csv_files:
                continue
            df = pd.read_csv(csv_files[0])
            os.makedirs(os.path.dirname(dest_csv), exist_ok=True)
            df.to_csv(dest_csv, index=False)
            print(f"Downloaded {slug} -> {dest_csv}")
            return True
        except Exception as exc:
            print(f"  kagglehub failed for {slug}: {exc}")
    return False


def _download_via_kaggle_cli(dest_csv):
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError:
        return False

    api = KaggleApi()
    try:
        api.authenticate()
    except Exception as exc:
        print(f"Kaggle CLI auth failed: {exc}")
        return False

    os.makedirs(DATA_DIR, exist_ok=True)
    for slug in KAGGLE_DATASET_SLUGS:
        try:
            print(f"Trying Kaggle CLI dataset: {slug}")
            api.dataset_download_files(slug, path=DATA_DIR, unzip=True)
            csv_files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
            if not csv_files:
                continue
            # Prefer a heart*.csv if present
            preferred = [p for p in csv_files if "heart" in os.path.basename(p).lower()]
            src = preferred[0] if preferred else csv_files[0]
            df = pd.read_csv(src)
            df.to_csv(dest_csv, index=False)
            print(f"Downloaded {slug} -> {dest_csv}")
            return True
        except Exception as exc:
            print(f"  Kaggle CLI failed for {slug}: {exc}")
    return False


def _download_via_public_mirror(dest_csv):
    print(f"Downloading Kaggle mirror CSV from:\n  {KAGGLE_PUBLIC_MIRROR_URL}")
    os.makedirs(os.path.dirname(dest_csv), exist_ok=True)
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(KAGGLE_PUBLIC_MIRROR_URL, context=ctx, timeout=60) as resp:
        payload = resp.read()
    with open(dest_csv, "wb") as handle:
        handle.write(payload)
    print(f"Saved raw dataset to {dest_csv}")
    return True


def download_kaggle_dataset(dest_csv=RAW_CSV, force=False):
    """
    Setup:
      Option A (official): pip install kagglehub
                           place kaggle.json in %USERPROFILE%\\.kaggle\\
      Option B (official): pip install kaggle  (same kaggle.json)
      Option C (no login): public GitHub mirror of the same Kaggle CSV
    """
    if os.path.exists(dest_csv) and not force:
        print(f"Using existing raw dataset: {dest_csv}")
        return dest_csv

    if _download_via_kagglehub(dest_csv):
        return dest_csv
    if _download_via_kaggle_cli(dest_csv):
        return dest_csv
    if _download_via_public_mirror(dest_csv):
        return dest_csv

    raise RuntimeError(
        "Could not download the Kaggle dataset. Configure kaggle.json or check network access."
    )


def normalize_kaggle_frame(df):
    df = df.rename(columns={k: v for k, v in KAGGLE_COLUMN_MAP.items() if k in df.columns})
    missing = [c for c in REQUIRED_FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    df = df[REQUIRED_FEATURE_COLUMNS].copy()
    df["target"] = df["target"].apply(lambda x: 1 if float(x) >= 1 else 0)
    return df


def process_kaggle_heart_dataset(csv_filepath=None, force_download=False):
    """
    Import Kaggle heart-disease data, stamp a STATIC date, and write the
    All OK subset used by the GUI.
    """
    csv_filepath = csv_filepath or RAW_CSV
    download_kaggle_dataset(csv_filepath, force=force_download)

    print(f"--- Importing Kaggle Heart Disease Dataset from: {csv_filepath} ---")
    df = pd.read_csv(csv_filepath)
    df = normalize_kaggle_frame(df)

    # Static date is attached to every row and must not be treated as a feature.
    df["record_date_fixed"] = STATIC_RECORD_DATE_STR

    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(FULL_CSV, index=False)

    all_ok = df[df["target"] == 0].copy()
    all_ok.to_csv(GUI_CSV, index=False)

    print(f"Full ML dataset: {FULL_CSV}  rows={len(df)}")
    print(f"GUI All OK dataset: {GUI_CSV}  rows={len(all_ok)}")
    print(f"Fixed record date on every row: {STATIC_RECORD_DATE_STR}")
    print(
        f"Target distribution: All OK (0)={int((df['target']==0).sum())} | "
        f"Risk (1)={int((df['target']==1).sum())}"
    )
    return df, all_ok


if __name__ == "__main__":
    force = "--force" in sys.argv
    process_kaggle_heart_dataset(force_download=force)
