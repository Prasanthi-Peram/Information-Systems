from datetime import timedelta


def compute_next_service(time_stamp, last_service, health_score, performance_score):

    # CRITICAL condition
    if health_score < 60:
        return time_stamp + timedelta(days=3)

    # WARNING condition
    if performance_score < 70:
        return time_stamp + timedelta(days=14)

    # NORMAL condition
    return last_service + timedelta(days=180)