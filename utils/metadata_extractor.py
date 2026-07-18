import re

def extract_metadata(text):

    experience = 0
    name = ""
    location = ""

    lines = text.split("\n")

    # Name
    for line in lines:
        if line.strip():
            name = line.strip()

            # Remove Email part if present
            if "Email:" in name:
                name = name.split("Email:")[0].strip()

            # Remove Location part if present
            if "Location:" in name:
                name = name.split("Location:")[0].strip()

            break

    # Experience
    match = re.search(
        r"(\d+)\s*years",
        text,
        re.IGNORECASE
    )

    if match:
        experience = int(match.group(1))

    # Location
    location_match = re.search(
        r"Location:\s*([A-Za-z ]+)",
        text,
        re.IGNORECASE
    )

    if location_match:
        location = location_match.group(1).strip()

        # Stop before common next sections
        for stop_word in [
            "Professional",
            "Summary",
            "Skills",
            "Experience",
            "Projects"
        ]:
            if stop_word in location:
                location = location.split(stop_word)[0].strip()

    return {
        "name": name,
        "experience": experience,
        "location": location
    }