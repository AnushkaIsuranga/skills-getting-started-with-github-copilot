from copy import deepcopy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities dict before/after each test to keep tests isolated."""
    orig = deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(deepcopy(orig))


def test_get_activities():
    client = TestClient(app_module.app)
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # basic sanity: data should be a dict and contain known activity
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    client = TestClient(app_module.app)
    activity = "Chess Club"
    email = "test.user@example.com"

    # Signup
    signup_url = f"/activities/{quote(activity)}/signup?email={quote(email)}"
    res = client.post(signup_url)
    assert res.status_code == 200
    body = res.json()
    assert "Signed up" in body.get("message", "")

    # Verify participant present
    res = client.get("/activities")
    data = res.json()
    assert email in data[activity]["participants"]

    # Unregister
    del_url = f"/activities/{quote(activity)}/participants?email={quote(email)}"
    res = client.delete(del_url)
    assert res.status_code == 200
    body = res.json()
    assert "Unregistered" in body.get("message", "")

    # Verify participant removed
    res = client.get("/activities")
    data = res.json()
    assert email not in data[activity]["participants"]


def test_signup_duplicate_fails():
    client = TestClient(app_module.app)
    activity1 = "Chess Club"
    activity2 = "Programming Class"
    email = "duplicate@example.com"

    # Signup to first activity
    res = client.post(f"/activities/{quote(activity1)}/signup?email={quote(email)}")
    assert res.status_code == 200

    # Attempt to signup to second activity should fail because email is already signed up somewhere
    res = client.post(f"/activities/{quote(activity2)}/signup?email={quote(email)}")
    assert res.status_code == 400
    body = res.json()
    assert "already signed up" in body.get("detail", "").lower()
