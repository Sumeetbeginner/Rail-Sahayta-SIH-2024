import csv
import json

# File paths
input_csv = "staffdata.csv"  # Replace with your CSV file path
output_json = "staff_data.json"

# Read CSV and transform to JSON
data = []
with open(input_csv, mode='r', encoding='utf-8') as file:
    csv_reader = csv.DictReader(file)
    for row in csv_reader:
        transformed_data = {
            "name": row.get("name"),
            "email" : row.get("email"),
            "password": row.get("password"),
            "dept": row.get("dept"),
            "trainNo": row.get("trainNo"),
            "compAssigned": [],  # Initialize as empty array
            "compSolved": [],    # Initialize as empty array
            "avgRating": row.get("avgRating"),      # Default average rating
            "dutyShift": row.get("dutyShift"),
            "cookiesId": [],    # Initialize as empty array
            "isWorking" : 1,
        }
        data.append(transformed_data)

# Save JSON for MongoDB insertion
with open(output_json, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=4)

print(f"JSON data saved to {output_json}")
