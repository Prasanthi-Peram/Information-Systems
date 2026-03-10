def evaluate_maintenance(prediction):

    health = prediction["health_score"]
    perf = prediction["performance_score"]

    issue = "None"
    criticality = "Low"

    if health < 60:
        issue = "Compressor issue suspected"
        criticality = "High"

    elif perf < 70:
        issue = "Refrigerant level check needed"
        criticality = "Medium"

    elif health < 80:
        issue = "Filter cleaning required"
        criticality = "Low"

    return issue, criticality