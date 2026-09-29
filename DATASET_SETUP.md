# Kaggle All OK GUI Dataset Setup

This project uses the Kaggle UCI heart-disease table as the GUI roster.
Rows with `target = 0` are treated as **All OK** (no heart disease). The
record date is a constant (`2026-01-15 09:00:00`) and cannot be changed in
the API or the UI. Age, vitals, and all other clinical fields stay dynamic.

## 1. Dataset import from Kaggle

Official source: [johnsmith88/heart-disease-dataset](https://www.kaggle.com/datasets/johnsmith88/heart-disease-dataset)

### Option A — Kaggle account (recommended)

1. Create an API token at https://www.kaggle.com/settings (Download `kaggle.json`).
2. Place it at `%USERPROFILE%\.kaggle\kaggle.json` (Windows) or `~/.kaggle/kaggle.json` (macOS/Linux).
3. Install the client:

```bash
py -3 -m pip install kagglehub pandas
```

4. Import (re-download with `--force` if you already have a local copy):

```bash
cd backend
py -3 data/import_kaggle_dataset.py --force
```

The importer tries `kagglehub`, then the Kaggle CLI, then a public GitHub mirror of the same CSV.

### Option B — No Kaggle login

Run the same command. If `kaggle.json` is missing, the script downloads the public mirror automatically:

`https://raw.githubusercontent.com/kb22/Heart-Disease-Prediction/master/dataset.csv`

### Files written

| File | Role |
| --- | --- |
| `backend/data/kaggle_heart_disease.csv` | Raw Kaggle CSV |
| `backend/data/heart_disease.csv` | Normalized full table for ML |
| `backend/data/gui_all_ok_dataset.csv` | `target=0` rows + `record_date_fixed` for the GUI |

Confirm the static date:

```bash
py -3 -c "import pandas as pd; df=pd.read_csv('data/gui_all_ok_dataset.csv'); print(df['record_date_fixed'].unique()); print(df['target'].value_counts())"
```

You should see a single date (`2026-01-15 09:00:00`) and only `target=0`.

## 2. Seed the GUI database

```bash
cd backend
py -3 seed.py
```

This loads `gui_all_ok_dataset.csv`, sets every patient’s `created_at` to the static date, and leaves medical fields free to update later.

Default login after seed: `doctor@cardiocare.ai` / `doctor123`

## 3. Static date vs dynamic fields

Configuration lives in `backend/data/dataset_config.py`:

```python
STATIC_RECORD_DATE = datetime(2026, 1, 15, 9, 0, 0)
IMMUTABLE_DATE_FIELDS = frozenset({
    "created_at", "record_date", "record_date_fixed", "registration_date", "date",
})
```

Behavior:

- **Static:** `created_at` / record date is written once at import or registration. PUT requests drop date keys. The GUI date input is `readOnly` + `disabled`.
- **Dynamic:** name, age, sex, contact, and all 13 clinical features (`cp`, `trestbps`, `chol`, …) can be edited. `updated_at` changes when they do. Predictions recalculate from the current values.

Edit path in the GUI: **Patients → pencil icon**, or **Profile → Edit Dynamic Fields**.

## 4. Validation checks

```bash
cd backend
py -3 test_static_date_dynamic_fields.py
```

The test:

1. Reads the original record date and medical values.
2. Sends a PUT that includes a forged `1999-12-31` date plus new age / BP / cholesterol.
3. Asserts the date is unchanged and the other fields updated.
4. Asserts the All OK CSV has one date and only `target=0`.
5. Restores the original dynamic values.

## 5. Change the frozen date (optional)

Edit `STATIC_RECORD_DATE` in `backend/data/dataset_config.py`, then re-run:

```bash
py -3 data/import_kaggle_dataset.py
py -3 seed.py
py -3 test_static_date_dynamic_fields.py
```
