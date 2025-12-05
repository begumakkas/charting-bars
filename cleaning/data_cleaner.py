from pathlib import Path

import numpy as np
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
songs_df.dropna(subset=["Danceability"], inplace=True)

# create year column
year2_int = raw_df["Date"].str[-2:].astype(int)
raw_df["Year"] = np.where(year2_int > 25, 1900 + year2_int, 2000 + year2_int)

# save as new csv
songs_df.to_csv(f"{ROOT}/www/data/Billboard100_cleaned.csv", index=False)


############# Create Summary Table #############


def createRoleSummary(df, col: str, role: str, group: str):
    df_new = (
        df[[col]]
        .assign(group=group)
        .rename(columns={col: "category"})
        .assign(role=role)
    )

    return df_new


# convert data to long format
artist_race = createRoleSummary(songs_df, "Artist_Race", "Artist", "race")
artist_gender = createRoleSummary(songs_df, "Artist_Gender", "Artist", "gender")
songwriter_race = createRoleSummary(songs_df, "Songwriter_Race", "Songwriter", "race")
songwriter_gender = createRoleSummary(
    songs_df, "Songwriter_Gender", "Songwriter", "gender"
)

# stack all tables
combined_df = pd.concat(
    [artist_race, artist_gender, songwriter_race, songwriter_gender], ignore_index=True
)

summary = (
    combined_df.groupby(["group", "role", "category"])
    .size()  # counts
    .reset_index(name="count")
)

summary["percent"] = (
    summary["count"]
    / summary.groupby(["group", "role"])["count"].transform("sum")
    * 100
)

# save as new csv
summary.to_csv(f"{ROOT}/www/data/Billboard100_summary.csv", index=False)
