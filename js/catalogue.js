(function () {
    function formatPrice(item) {
        try {
            return new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: item.currency || "GBP"
            }).format(item.price || 0);
        } catch (error) {
            return `${item.currency || "GBP"} ${item.price || ""}`;
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function option(value) {
        return `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`;
    }

    function renderCard(item) {
        const image = item.image || "logo.png";
        const productCategory = item.category || item.type;
        const tags = [item.collection, productCategory].filter(Boolean);

        return `
            <article class="catalogue-card">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" loading="lazy">
                <div class="catalogue-card__body">
                    <div class="catalogue-card__meta">
                        ${tags.map(tag => `<span class="catalogue-pill">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.excerpt)}</p>
                    <div class="catalogue-card__price">${escapeHtml(formatPrice(item))}</div>
                    <a class="small-button" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Find on Etsy</a>
                </div>
            </article>
        `;
    }

    document.addEventListener("DOMContentLoaded", () => {
        const data = window.CATALOGUE_DATA;
        const grid = document.getElementById("catalogue-grid");
        const summary = document.getElementById("catalogue-summary");
        const search = document.getElementById("catalogue-search");
        const collection = document.getElementById("catalogue-collection");
        const type = document.getElementById("catalogue-type");

        if (!data || !grid || !summary || !search || !collection || !type) return;

        collection.insertAdjacentHTML("beforeend", data.collections.map(option).join(""));
        type.insertAdjacentHTML("beforeend", (data.categories || data.types || []).map(option).join(""));

        function matches(item) {
            const query = search.value.trim().toLowerCase();
            const collectionValue = collection.value;
            const typeValue = type.value;
            const productCategory = item.category || item.type;
            const haystack = [
                item.title,
                item.collection,
                item.category,
                item.type,
                item.excerpt,
                ...(item.tags || [])
            ].join(" ").toLowerCase();

            return (!query || haystack.includes(query)) &&
                (collectionValue === "all" || item.collection === collectionValue) &&
                (typeValue === "all" || productCategory === typeValue);
        }

        function render() {
            const items = data.items.filter(matches);
            summary.textContent = `${items.length} of ${data.count} items shown. Catalogue generated from ${data.source}.`;
            grid.innerHTML = items.length
                ? items.map(renderCard).join("")
                : `<p>No catalogue items match those filters.</p>`;
        }

        [search, collection, type].forEach(control => {
            control.addEventListener("input", render);
            control.addEventListener("change", render);
        });

        render();
    });
})();
