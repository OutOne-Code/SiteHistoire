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
            body: JSON.stringify({
                name,
                email,
                subject,
                message
            })
        }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur d'envoi.");
    }

    return true;
}
