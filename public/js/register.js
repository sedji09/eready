document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm_password").value;

  if (password !== confirmPassword) {
    showAlert("error", "Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showAlert("error", "Password must be at least 6 characters");
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password, confirmPassword })
    });

    const data = await response.json();

    if (data.success) {
      showAlert("success", data.message || "Registration successful! Redirecting...");
      setTimeout(() => {
        window.location.href = data.redirect || "/dashboard";
      }, 2000);
    } else {
      showAlert("error", data.message || "Registration failed");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showAlert("error", "An error occurred. Please try again.");
  }
});

function showAlert(type, message) {
  const alertContainer = document.getElementById("alert-container");
  const alertClass = type === "success" ? "alert-success" : "alert-error";
  
  alertContainer.innerHTML = `
    <div class="alert ${alertClass}">
      ${message}
    </div>
  `;

  setTimeout(() => alertContainer.innerHTML = "", 5000);
}
