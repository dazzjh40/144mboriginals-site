document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("bespoke-request-form");
    const status = document.getElementById("bespoke-form-status");

    if (!form || !status) return;

    function setStatus(message, type) {
        status.textContent = message;
        status.classList.remove("is-success", "is-error");
        if (type) status.classList.add(type);
    }

    form.addEventListener("submit", async event => {
        const action = form.getAttribute("action") || "";

        if (action.includes("YOUR_FORM_ID")) {
            event.preventDefault();
            setStatus("Formspree setup needed: replace YOUR_FORM_ID in bespoke.html with your Formspree form ID.", "is-error");
            return;
        }

        event.preventDefault();
        setStatus("Sending your request...", "");

        try {
            const response = await fetch(action, {
                method: "POST",
                body: new FormData(form),
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Form submission failed");
            }

            form.reset();
            setStatus("Thanks. Your bespoke request has been sent.", "is-success");

            if (typeof gtag === "function") {
                gtag("event", "bespoke_form_submit", {
                    page_location: window.location.pathname
                });
            }
        } catch (error) {
            setStatus("Sorry, the form could not be sent. Please try again or email hello@144mboriginals.com.", "is-error");
        }
    });
});
