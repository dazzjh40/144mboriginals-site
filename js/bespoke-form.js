document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("bespoke-request-form");
    const status = document.getElementById("bespoke-form-status");
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    if (!form || !status) return;

    function setStatus(message, type) {
        status.textContent = message;
        status.classList.remove("is-success", "is-error");
        if (type) status.classList.add(type);
    }

    function setFieldValue(name, value) {
        const field = form.elements[name];
        if (field && !field.value && value) field.value = value;
    }

    function prefillVersionRequest() {
        const params = new URLSearchParams(window.location.search);

        if (params.get("source") !== "version-finder") return;

        const year = params.get("year") || "";
        const version = params.get("version") || "";
        const product = params.get("product") || "T-shirt";
        const wording = params.get("wording") || `Born in ${year}, Version ${version} Stable Build`;
        const sourceUrl = `${window.location.origin}/version.html${year ? `?year=${encodeURIComponent(year)}` : ""}`;
        const message = [
            "I used the Version Finder and would like to request a birthday version design.",
            "",
            year ? `Birth year: ${year}` : "",
            version ? `Calculated version: ${version}` : "",
            wording ? `Suggested wording: ${wording}` : "",
            `Product idea: ${product}`,
            `Source page: ${sourceUrl}`
        ].filter(line => line !== "").join("\n");

        setFieldValue("product_type", product);
        setFieldValue("quantity", "1 item");
        setFieldValue("message", message);
        setFieldValue("extra_details", "Please let me know whether this version design can be made and which colours or product options would work best.");
    }

    prefillVersionRequest();

    form.addEventListener("submit", async event => {
        const action = form.getAttribute("action") || "";

        event.preventDefault();

        if (!action.startsWith("https://formspree.io/f/") || action.includes("YOUR_FORM_ID")) {
            setStatus("Form setup needs checking before this request can be sent.", "is-error");
            return;
        }

        setStatus("Sending your request...", "");
        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(action, {
                method: "POST",
                body: new FormData(form),
                headers: {
                    Accept: "application/json"
                }
            });
            let result = null;

            try {
                result = await response.json();
            } catch (error) {
                result = null;
            }

            if (!response.ok) {
                const formspreeErrors = Array.isArray(result && result.errors)
                    ? result.errors.map(error => error.message).filter(Boolean).join(" ")
                    : "";
                throw new Error(formspreeErrors || "Form submission failed");
            }

            form.reset();
            setStatus("Thanks. Your bespoke request has been sent.", "is-success");

            if (typeof gtag === "function") {
                gtag("event", "bespoke_form_submit", {
                    page_location: window.location.pathname
                });
            }

            window.location.assign(form.dataset.thankYouUrl || "thank-you.html");
        } catch (error) {
            const message = error && error.message && error.message !== "Form submission failed"
                ? error.message
                : "Sorry, the form could not be sent. Please try again or email info@144mboriginals.com.";
            setStatus(message, "is-error");
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
