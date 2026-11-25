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

// ===== Tri des articles du sommaire =====

const select = document.getElementById("classementArticles");
const articlesContainer = document.getElementById("articlesSummary");
const HISTORY_KEY = "articlesConsultes"; // { idArticle: timestamp de dernière consultation }

function lireHistorique() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
    } catch (err) {
        return {};
    }
}

function enregistrerConsultation(id) {
    const historique = lireHistorique();
    historique[id] = Date.now();
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historique));
    } catch (err) {
        // stockage indisponible : on ignore
    }
}

// Titre utilisé pour l'ordre alphabétique : texte affiché, sinon data-title, sinon id
function titreArticle(article) {
    const titreEl = article.querySelector(".articleSummaryTitle");
    return (titreEl && titreEl.textContent.trim()) || article.dataset.title || article.id;
}

function dateArticle(article) {
    const t = Date.parse(article.dataset.date);
    return Number.isNaN(t) ? 0 : t;
}

function trierArticles(critere) {
    const articles = Array.from(articlesContainer.children);
    const historique = lireHistorique();

    switch (critere) {
        case "older": // du plus ancien au plus récent
            articles.sort((a, b) => dateArticle(a) - dateArticle(b));
            break;

        case "newer": // du plus récent au plus ancien
            articles.sort((a, b) => dateArticle(b) - dateArticle(a));
            break;

        case "alpha":
            articles.sort((a, b) =>
                titreArticle(a).localeCompare(titreArticle(b), "fr", { sensitivity: "base" })
            );
            break;

        case "recentlySee": // dernier consulté en premier, jamais consultés à la fin
            articles.sort((a, b) => (historique[b.id] || 0) - (historique[a.id] || 0));
            break;

        default:
            return;
    }

    // appendChild déplace l'élément existant : on réinsère dans le nouvel ordre
    articles.forEach((article) => articlesContainer.appendChild(article));
}

select.addEventListener("change", (event) => {
    trierArticles(event.target.value);
});

// Mémorise la consultation d'un article au clic (délégation : marche aussi pour les articles ajoutés plus tard)
articlesContainer.addEventListener("click", (event) => {
    const article = event.target.closest(".articleSummary");
    if (!article) return;
    enregistrerConsultation(article.id);
    // Si on trie par "consultés récemment", on met la liste à jour immédiatement
    if (select.value === "recentlySee") trierArticles("recentlySee");
});

// Tri initial selon l'option sélectionnée au chargement
trierArticles(select.value);

// APPELER LES ARTICLES DEPUIS LE DEPOT JSON

async function chargerArticle(id) {
    const content = document.querySelector(".content");

    // Vide l'affichage précédent et affiche un état de chargement
    const ancien = document.getElementById("affichageArticle");
    if (ancien) ancien.remove();

    const div = document.createElement("div");
    div.id = "affichageArticle";
    div.className = "article-affichage";
    div.textContent = "Chargement...";
    content.appendChild(div);

    try {
        const rep = await fetch(`Articles/${encodeURIComponent(id)}.json`);
        if (!rep.ok) throw new Error("Article introuvable");
        const article = await rep.json();

        div.innerHTML = "";
        const titre = document.createElement("h1");
        titre.className = "article-affichage-titre";
        titre.textContent = article.titre;
        div.appendChild(titre);

        for (const bloc of article.contenu ?? []) {
            if (bloc.type === "sous-titre") {
                const h = document.createElement("h2");
                h.className = "article-affichage-sous-titre";
                h.textContent = bloc.texte;
                div.appendChild(h);
            } else if (bloc.type === "paragraphe") {
                const p = document.createElement("p");
                p.className = "article-affichage-paragraphe";
                p.textContent = bloc.texte;
                div.appendChild(p);
            } else if (bloc.type === "citation") {
                const q = document.createElement("blockquote");
                q.className = "article-affichage-citation";
                q.textContent = bloc.texte;
                if (bloc.auteur) {
                    const f = document.createElement("footer");
                    f.textContent = bloc.auteur;
                    q.appendChild(f);
                }
                div.appendChild(q);
            } else if (bloc.type === "image") {
                const fig = document.createElement("figure");
                fig.className = "article-affichage-figure";
                const img = document.createElement("img");
                img.src = bloc.src;
                img.alt = bloc.alt ?? "";
                fig.appendChild(img);
                if (bloc.legende) {
                    const cap = document.createElement("figcaption");
                    cap.textContent = bloc.legende;
                    fig.appendChild(cap);
                }
                div.appendChild(fig);
            }
        }
    } catch (err) {
        div.textContent = "Impossible de charger cet article.";
    }
}

// Un clic sur un bouton du sommaire charge l'article dont l'id correspond
document.querySelectorAll(".articleSummary").forEach(el => {
    el.querySelector(".articleSummaryButton")
      .addEventListener("click", () => chargerArticle(el.id));
});
