def simulate(
    base_values,
    workload_change=0,
    recognition_change=0,
    growth_change=0,
    manager_change=0
):

    values = base_values.copy()

    values["workload"] = max(
        1,
        min(5, values["workload"] + workload_change)
    )

    values["recognition"] = max(
        1,
        min(5, values["recognition"] + recognition_change)
    )

    values["career_growth"] = max(
        1,
        min(5, values["career_growth"] + growth_change)
    )

    values["manager_support"] = max(
        1,
        min(5, values["manager_support"] + manager_change)
    )

    return values
