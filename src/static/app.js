document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = ""; // reset
    messageDiv.classList.add("message", type);
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 4000);
  }

  function createParticipantList(participants) {
    // Return a UL element with participants as list items
    const ul = document.createElement("ul");
    ul.className = "participants-list";
    if (!participants || participants.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No participants yet.";
      ul.appendChild(li);
      return ul;
    }
    participants.forEach((p) => {
      const li = document.createElement("li");
      // show as chip inside list item for visual appeal
      const span = document.createElement("span");
      span.className = "participant-chip";
      span.textContent = p;
      li.appendChild(span);
      ul.appendChild(li);
    });
    return ul;
  }

  function renderActivities(data) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(data).forEach(([name, info]) => {
      // Populate select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);

      // Build card
      const card = document.createElement("div");
      card.className = "activity-card";
      card.id = `activity-${name.replace(/\s+/g, "-").toLowerCase()}`;

      const title = document.createElement("h4");
      title.textContent = name;

      const desc = document.createElement("p");
      desc.textContent = info.description;

      const schedule = document.createElement("p");
      schedule.textContent = `Schedule: ${info.schedule}`;

      const capacity = document.createElement("p");
      capacity.textContent = `Capacity: ${info.participants.length}/${info.max_participants}`;

      // Participants section
      const participantsSection = document.createElement("div");
      participantsSection.className = "participants-section";

      const participantsHeader = document.createElement("h5");
      participantsHeader.textContent = `Participants (${info.participants.length})`;

      const participantsList = createParticipantList(info.participants);

      participantsSection.appendChild(participantsHeader);
      participantsSection.appendChild(participantsList);

      // Append elements to card
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(schedule);
      card.appendChild(capacity);
      card.appendChild(participantsSection);

      activitiesList.appendChild(card);
    });
  }

  async function loadActivities() {
    activitiesList.innerHTML = "<p>Loading activities...</p>";
    try {
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      renderActivities(data);
    } catch (err) {
      activitiesList.innerHTML = "<p class='error'>Could not load activities.</p>";
      console.error(err);
    }
  }

  signupForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    if (!email || !activity) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }
    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        showMessage(body.detail || "Sign up failed.", "error");
        return;
      }
      showMessage(body.message || "Signed up successfully!", "success");

      // Update the specific activity card participants list and capacity text
      const cardId = `activity-${activity.replace(/\s+/g, "-").toLowerCase()}`;
      const card = document.getElementById(cardId);
      if (card) {
        // Update capacity line (assumes it's the 4th <p>)
        const pElems = card.getElementsByTagName("p");
        if (pElems.length >= 3) {
          // Re-fetch activities to get accurate counts
          await loadActivities();
        }
      } else {
        // fallback: reload all activities
        await loadActivities();
      }

      signupForm.reset();
    } catch (err) {
      console.error(err);
      showMessage("An error occurred during sign up.", "error");
    }
  });

  // initial load
  loadActivities();
});
