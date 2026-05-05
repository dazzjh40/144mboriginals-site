(function () {
    const GA_ID = "G-69V22F8BZN";
    const STORAGE_KEY = "mb_cookie_consent_v1";
    const CONSENT_VERSION = "2026-05-05";
    let analyticsLoaded = false;

    window.dataLayer = window.dataLayer || [];
    window.mbAnalyticsEnabled = false;
    window.gtag = window.gtag || function () {
        if (window.mbAnalyticsEnabled) {
            window.dataLayer.push(arguments);
        }
    };

    function getStoredChoice() {
        try {
            return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return null;
        }
    }

    function storeChoice(status) {
        const record = {
            status,
            version: CONSENT_VERSION,
            updatedAt: new Date().toISOString()
        };

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        } catch (error) {
            // If storage is unavailable, still respect the current session choice.
        }

        if (status === "accepted") {
            enableAnalytics();
        } else {
            disableAnalytics();
        }

        removeBanner();
    }

    function enableAnalytics() {
        if (analyticsLoaded) return;

        analyticsLoaded = true;
        window.mbAnalyticsEnabled = true;
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
        document.head.appendChild(script);

        window.gtag("js", new Date());
        window.gtag("config", GA_ID, {
            cookie_flags: "SameSite=Lax;Secure"
        });
    }

    function disableAnalytics() {
        window.mbAnalyticsEnabled = false;
        clearAnalyticsCookies();
    }

    function clearAnalyticsCookies() {
        document.cookie.split(";").forEach(cookie => {
            const name = cookie.split("=")[0].trim();
            if (/^_ga/.test(name) || name === "_gid" || name === "_gat" || name === "_gac") {
                expireCookie(name);
            }
        });
    }

    function expireCookie(name) {
        const domains = [window.location.hostname, "." + window.location.hostname, ".144mboriginals.com"];
        domains.forEach(domain => {
            document.cookie = name + "=; Max-Age=0; path=/; domain=" + domain + "; SameSite=Lax";
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + domain + "; SameSite=Lax";
        });
        document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax";
    }

    function removeBanner() {
        const existing = document.getElementById("cookie-consent");
        if (existing) existing.remove();
    }

    function showBanner(expanded) {
        removeBanner();

        const banner = document.createElement("section");
        banner.id = "cookie-consent";
        banner.className = "cookie-consent";
        banner.setAttribute("aria-label", "Cookie choices");
        banner.innerHTML = `
            <div class="cookie-consent__panel" role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title">
                <div class="cookie-consent__copy">
                    <h2 id="cookie-consent-title">Cookie choices</h2>
                    <p>We use essential storage to remember your cookie choice. With your permission, we use Google Analytics to understand visits and improve the site.</p>
                    <details ${expanded ? "open" : ""}>
                        <summary>More about analytics cookies</summary>
                        <p>Google Analytics may set cookies such as <strong>_ga</strong> and <strong>_ga_*</strong>. These help produce visitor statistics. They are not loaded unless you accept analytics cookies.</p>
                    </details>
                </div>
                <div class="cookie-consent__actions">
                    <button type="button" class="cookie-button cookie-button-secondary" data-cookie-reject>Reject analytics</button>
                    <button type="button" class="cookie-button cookie-button-primary" data-cookie-accept>Accept analytics</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        banner.querySelector("[data-cookie-accept]").addEventListener("click", () => storeChoice("accepted"));
        banner.querySelector("[data-cookie-reject]").addEventListener("click", () => storeChoice("rejected"));
    }

    function wirePreferenceLinks() {
        document.addEventListener("click", event => {
            const trigger = event.target.closest("[data-cookie-preferences]");
            if (!trigger) return;

            event.preventDefault();
            showBanner(true);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        wirePreferenceLinks();
        const choice = getStoredChoice();

        if (choice && choice.status === "accepted") {
            enableAnalytics();
            return;
        }

        if (choice && choice.status === "rejected") {
            disableAnalytics();
            return;
        }

        showBanner(false);
    });
})();