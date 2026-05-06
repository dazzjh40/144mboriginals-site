const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const csvPath = path.join(root, "EtsyListingsDownload.csv");
const outputPath = path.join(root, "js", "catalogue-data.js");

const COLLECTION_ORDER = [
    "Birthday Versions",
    "Dog Apparel",
    "Fishing",
    "Office & Everyday Humour",
    "Other Gifts",
    "Retro Tech",
    "Vanlife"
];

const CATEGORY_ORDER = [
    "T-Shirt",
    "Sweat Shirt",
    "Hoodie",
    "Mug",
    "Cup",
    "Journal",
    "Bag",
    "Backpack",
    "Laptop Sleeve",
    "Phone Case",
    "Cushion",
    "Cap",
    "Banner",
    "Flag"
];

function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (quoted) {
            if (char === '"' && next === '"') {
                value += '"';
                i += 1;
            } else if (char === '"') {
                quoted = false;
            } else {
                value += char;
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === ",") {
            row.push(value);
            value = "";
        } else if (char === "\n") {
            row.push(value.replace(/\r$/, ""));
            rows.push(row);
            row = [];
            value = "";
        } else {
            value += char;
        }
    }

    if (value.length || row.length) {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
    }

    return rows;
}

function normaliseSpace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function splitTags(value) {
    return String(value || "")
        .split(",")
        .map(tag => normaliseSpace(tag.replace(/_/g, " ")))
        .filter(Boolean);
}

function includesAny(text, patterns) {
    return patterns.some(pattern => pattern.test(text));
}

function inferCollection(row, tags) {
    const strongText = normaliseSpace([
        row.TITLE,
        row.TAGS,
        row.SKU
    ].join(" ")).toLowerCase();
    const text = normaliseSpace([
        row.TITLE,
        row.DESCRIPTION,
        row.TAGS,
        row.MATERIALS,
        row.SKU
    ].join(" ")).toLowerCase();

    if (includesAny(strongText, [
        /\b\d{4} birthday\b/,
        /\b\d{4}_birthday\b/,
        /\b\d{2}(st|nd|rd|th) birthday\b/,
        /\b\d{2}(st|nd|rd|th)_birthday\b/,
        /\bborn in\b/,
        /\bborn on\b/,
        /\bborn_in\b/,
        /\bstable build\b/,
        /\bversion shirt\b/,
        /\bversion_shirt\b/,
        /\bversion \d/
    ])) {
        return "Birthday Versions";
    }

    if (includesAny(text, [
        /\bdog\b/,
        /\bpet\b/,
        /\bboxer\b/,
        /\bstaffie\b/,
        /\bstaffordshire\b/,
        /\bbullmastiff\b/,
        /\bfrench bulldog\b/,
        /\bfrenchie\b/,
        /\bborder collie\b/,
        /\bchihuahua\b/,
        /\bdachshund\b/,
        /\blabrador\b/,
        /\bgolden retriever\b/,
        /\byorkshire terrier\b/,
        /\byorkie\b/,
        /\bpoodle\b/,
        /\brottweiler\b/,
        /\bschnauzer\b/,
        /\bspaniel\b/,
        /\bcockapoo\b/
    ])) {
        return "Dog Apparel";
    }

    if (includesAny(text, [
        /\bfishing\b/,
        /\bfisherman\b/,
        /\bangler\b/,
        /\banglers\b/,
        /\bangling\b/,
        /\bfish lover\b/,
        /\blake life\b/
    ])) {
        return "Fishing";
    }

    if (includesAny(text, [
        /\bvanlife\b/,
        /\bvan life\b/,
        /\bcampervan\b/,
        /\bcamper\b/,
        /\bvan build\b/,
        /\bcamping\b/,
        /\bfestival\b/
    ])) {
        return "Vanlife";
    }

    if (includesAny(text, [
        /\bretro tech\b/,
        /\btech humor\b/,
        /\btech humour\b/,
        /\bprogrammer\b/,
        /\bdeveloper\b/,
        /\bcoder\b/,
        /\bgeek\b/,
        /\bnerd\b/,
        /\bfloppy\b/,
        /\b1\.44mb\b/,
        /\bsystem\b/,
        /\bhardware\b/,
        /\bsoftware\b/,
        /\bcomputer\b/,
        /\bcritical update\b/,
        /\blow battery\b/,
        /\bartificial intelligence\b/,
        /\bai powered\b/,
        /\bit humor\b/,
        /\bit humour\b/
    ])) {
        return "Retro Tech";
    }

    if (includesAny(text, [
        /\boffice\b/,
        /\bwork\b/,
        /\bsarcastic\b/,
        /\bsarcasm\b/,
        /\bdry humor\b/,
        /\bdry humour\b/,
        /\bfunny\b/,
        /\bhumor\b/,
        /\bhumour\b/,
        /\bdad\b/,
        /\bgarage\b/,
        /\bmechanic\b/,
        /\bprocrastinat/
    ])) {
        return "Office & Everyday Humour";
    }

    return tags.length ? "Other Gifts" : "Other Gifts";
}

function makeExcerpt(description) {
    const clean = normaliseSpace(description)
        .replace(/^[-.: ]+/g, "")
        .replace(/\.:\s*/g, "");

    if (!clean) return "";
    return clean.length > 180 ? `${clean.slice(0, 177).trim()}...` : clean;
}

function rowToObject(headers, row) {
    return Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
}

function numeric(value) {
    const parsed = Number(String(value || "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function searchUrl(title) {
    const query = encodeURIComponent(normaliseSpace(title).split(" ").slice(0, 8).join(" "));
    return `https://www.etsy.com/shop/HandyEnough?search_query=${query}`;
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8")).filter(row => row.some(Boolean));
const headers = rows.shift().map(header => header.trim());
const items = rows.map((row, index) => {
    const record = rowToObject(headers, row);
    const tags = splitTags(record.TAGS);
    const category = normaliseSpace(record.CATEGORY) || "Other";
    const images = Array.from({ length: 10 }, (_, imageIndex) => {
        return normaliseSpace(record[`IMAGE${imageIndex + 1}`]);
    }).filter(Boolean);

    return {
        id: `etsy-${index + 1}`,
        title: normaliseSpace(record.TITLE),
        price: numeric(record.PRICE),
        currency: normaliseSpace(record.CURRENCY_CODE) || "GBP",
        quantity: numeric(record.QUANTITY),
        collection: inferCollection(record, tags),
        tags,
        image: images[0] || "",
        images,
        excerpt: makeExcerpt(record.DESCRIPTION),
        url: searchUrl(record.TITLE),
        category
    };
});

const collections = COLLECTION_ORDER.filter(collection => items.some(item => item.collection === collection));
const presentCategories = new Set(items.map(item => item.category).filter(Boolean));
const categories = [
    ...CATEGORY_ORDER.filter(category => presentCategories.has(category)),
    ...Array.from(presentCategories).filter(category => !CATEGORY_ORDER.includes(category)).sort()
];

const catalogue = {
    generatedAt: new Date().toISOString(),
    source: path.basename(csvPath),
    shopUrl: "https://www.etsy.com/shop/HandyEnough",
    count: items.length,
    collections,
    categories,
    items
};

fs.writeFileSync(outputPath, `window.CATALOGUE_DATA = ${JSON.stringify(catalogue, null, 2)};\n`);
console.log(`Generated ${path.relative(root, outputPath)} from ${path.basename(csvPath)}`);
console.log(collections.map(collection => {
    const count = items.filter(item => item.collection === collection).length;
    return `${collection}: ${count}`;
}).join("\n"));
