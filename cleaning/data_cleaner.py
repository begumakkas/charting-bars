from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parent.parent.resolve()


# load data
try:
    raw_df = pd.read_csv(f"{ROOT}/www/data/Billboard100_Data.csv")
except FileNotFoundError:
    print("File not found. Check the path/filename.")
except Exception as e:
    print(f"Unexpected error while loading data: {e}")


# create decode mappings
gender_mapping = {
    0: "All Female",
    1: "All Male",
    2: "Female-Male Mixed",
    3: "At Least One Non-Binary",
}

race_mapping = {0: "Non-White", 1: "White", 2: "Mixed"}


def decode_column(df, existing_col: str, new_col: str, mapping):
    """Column decode function according to mapping."""
    df[new_col] = df[existing_col].map(mapping)
    return df


# apply decodings
songs_df = decode_column(raw_df, "Artist Male", "Artist_Gender", gender_mapping)
songs_df = decode_column(raw_df, "Songwriter Male", "Songwriter_Gender", gender_mapping)
songs_df = decode_column(raw_df, "Artist White", "Artist_Race", race_mapping)
songs_df = decode_column(raw_df, "Songwriter White", "Songwriter_Race", race_mapping)

# drop rows with missing gender/race information
songs_df.dropna(subset=["Artist_Gender"], inplace=True)
songs_df.dropna(subset=["Songwriter_Gender"], inplace=True)
songs_df.dropna(subset=["Artist_Race"], inplace=True)
songs_df.dropna(subset=["Songwriter_Race"], inplace=True)
songs_df.dropna(subset=["Happiness"], inplace=True)

# save as new csv
songs_df.to_csv(f"{ROOT}/www/data/Billboard100_cleaned.csv", index=False)
