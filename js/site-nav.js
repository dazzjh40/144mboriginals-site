document.addEventListener("DOMContentLoaded", async () => {
    const navPlaceholder = document.getElementById("nav-placeholder");
    if (!navPlaceholder) return;

    try {
        const response = await fetch("nav.html");

        if (!response.ok) {
            throw new Error(`Failed to load nav.html: ${response.status}`);
        }

        navPlaceholder.innerHTML = await response.text();

        const currentPage = location.pathname.split("/").pop() || "index.html";

        document.querySelectorAll(".nav a").forEach(link => {
            if (link.getAttribute("href") === currentPage) {
                link.classList.add("active");
            }
        });

        const navToggle = document.getElementById("nav-toggle");
        const siteNav = document.getElementById("site-nav");

        if (navToggle && siteNav) {
            navToggle.addEventListener("click", () => {
                const isOpen = siteNav.classList.toggle("nav-open");
                navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
            });
        }

    } catch (error) {
        console.error("Navigation load error:", error);
    }
});
