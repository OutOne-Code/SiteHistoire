const overlay = document.getElementById("contact-overlay");
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("contact-status");
const submitBtn = document.getElementById("contact-submit");

function contactus() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.getElementById("contact-name").focus();
}

function closeContact() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
}

// Clic en dehors de la fenêtre : fermeture
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeContact();
});

// Touche Échap : fermeture
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeContact();
});

const SUPABASE_URL = "https://uhpzoscgqhoobiazpduh.supabase.co";
const SUPABASE_KEY = "sb_publishable_qmuCcL49ZYix-b_crz3J0Q_71d24M9K";

async function sendContactMessage(name, email, subject, message) {
    const response = await fetch(
        `${SUPABASE_URL}/functions/v1/contact`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY
            },
            body: JSON.stringify({ name, email, subject, message })
        }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur d'envoi.");
    }

    return true;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusEl.className = "";
    statusEl.textContent = "Envoi en cours…";
    submitBtn.disabled = true;

    try {
        await sendContactMessage(
            form.name.value.trim(),
            form.email.value.trim(),
            form.subject.value.trim(),
            form.message.value.trim()
        );
        statusEl.className = "success";
        statusEl.textContent = "Message envoyé, merci !";
        form.reset();
        setTimeout(() => {
            closeContact();
            statusEl.textContent = "";
            statusEl.className = "";
        }, 1500);
    } catch (err) {
        statusEl.className = "error";
        statusEl.textContent = err.message;
    } finally {
        submitBtn.disabled = false;
    }
});
