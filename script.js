"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const views = {
    dashboard: $("#dashboardView"),
    workspace: $("#workspaceView"),
    settings: $("#settingsView")
};

const tools = {
    proposal: {
        title: "Proposal Writer",
        eyebrow: "CLIENT WORK",
        description: "Turn a client brief into a professional project proposal.",
        label: "Describe the project and what the client needs",
        placeholder: "e.g. A five-page website for a local bakery, including mobile design and a contact form...",
        resultType: "CLIENT PROPOSAL"
    },
    product: {
        title: "Product Listing",
        eyebrow: "ONLINE SELLING",
        description: "Create informative, persuasive descriptions for your products.",
        label: "Describe the product and its benefits",
        placeholder: "e.g. Handmade cotton tote bag, reusable, available in three colours, suitable for everyday shopping...",
        resultType: "PRODUCT LISTING"
    },
    marketing: {
        title: "Marketing Copy",
        eyebrow: "GROW YOUR BRAND",
        description: "Write engaging promotional content for your audience.",
        label: "Describe the offer, message or campaign",
        placeholder: "e.g. A weekend discount for a neighbourhood coffee shop launching a new menu...",
        resultType: "MARKETING COPY"
    },
    pricing: {
        title: "Pricing Assistant",
        eyebrow: "GET PAID FAIRLY",
        description: "Estimate a starting project price based on your time and costs.",
        label: "Describe the work and enter your estimated hours and hourly rate",
        placeholder: "e.g. Website design; hours: 20; rate: 800; costs: 2000",
        resultType: "PRICING ESTIMATE"
    }
};

let activeTool = "proposal";
let lastResult = "";
let lastResultType = "";
let lastResultMode = "";
let toastTimeout;

const defaultSettings = {
    url: "http://localhost:11434",
    model: "qwen2.5:3b"
};

let settings = { ...defaultSettings };

try {
    const saved = localStorage.getItem("hustlepilot-settings");
    if (saved) {
        const parsed = JSON.parse(saved);
        settings = {
            url: typeof parsed.url === "string" ? parsed.url : defaultSettings.url,
            model: typeof parsed.model === "string" ? parsed.model : defaultSettings.model
        };
    }
} catch {
    // Default settings are used if storage is unavailable.
}

function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

function showView(viewName) {
    Object.values(views).forEach((view) => view.classList.add("hidden"));

    if (viewName === "dashboard") {
        views.dashboard.classList.remove("hidden");
        $("#breadcrumbTitle").textContent = "Dashboard";
    } else if (viewName === "settings") {
        views.settings.classList.remove("hidden");
        $("#breadcrumbTitle").textContent = "Settings";
    } else {
        views.workspace.classList.remove("hidden");
        $("#breadcrumbTitle").textContent = tools[activeTool].title;
    }

    $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openTool(toolName) {
    if (!tools[toolName]) return;

    activeTool = toolName;
    const tool = tools[toolName];

    $("#workspaceEyebrow").textContent = tool.eyebrow;
    $("#workspaceTitle").textContent = tool.title;
    $("#workspaceDescription").textContent = tool.description;
    $("#detailsLabel").textContent = tool.label;
    $("#projectDetails").placeholder = tool.placeholder;
    $("#resultType").textContent = tool.resultType;

    $$(".nav-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.view === toolName);
    });

    showView("workspace");
}

$$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
        const destination = button.dataset.view;

        if (destination === "dashboard") {
            $$(".nav-item").forEach((item) => {
                item.classList.toggle("active", item.dataset.view === "dashboard");
            });
            showView("dashboard");
        } else {
            openTool(destination);
        }
    });
});

$("#backButton").addEventListener("click", () => {
    showView("dashboard");
});

$("#settingsBackButton").addEventListener("click", () => {
    showView("dashboard");
});

$("#settingsButton").addEventListener("click", openSettings);
$("#connectBanner").addEventListener("click", openSettings);

function openSettings() {
    $("#ollamaUrl").value = settings.url;
    $("#modelName").value = settings.model;
    showView("settings");
}

$("#mobileMenu").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
});

$("#projectDetails").addEventListener("input", () => {
    const length = $("#projectDetails").value.length;
    $("#characterCount").textContent = `${length} / 4000`;
});

function setAIStatus(connected) {
    $("#sidebarAiStatus").textContent = connected
        ? `Local · ${settings.model}`
        : "Demo mode active";

    $("#sidebarDot").classList.toggle("connected", connected);
    $("#modeStat").textContent = connected ? "Local AI" : "Demo";
    $("#modeDescription").textContent = connected
        ? "Using your local Ollama model"
        : "Works without an AI server";
}

function showConnectionMessage(message, type = "") {
    const element = $("#connectionMessage");
    element.textContent = message;
    element.className = `connection-message ${type}`.trim();
}

function normalizeUrl(url) {
    return url.trim().replace(/\/+$/, "");
}

$("#saveSettings").addEventListener("click", () => {
    const url = normalizeUrl($("#ollamaUrl").value);
    const model = $("#modelName").value.trim();

    try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new Error("Invalid protocol");
        }
    } catch {
        showConnectionMessage(
            "Enter a valid URL, such as http://localhost:11434.",
            "error"
        );
        return;
    }

    if (!model || model.length > 150) {
        showConnectionMessage("Enter a valid model name.", "error");
        return;
    }

    settings = { url, model };

    try {
        localStorage.setItem("hustlepilot-settings", JSON.stringify(settings));
    } catch {
        // The current session can still use the selected settings.
    }

    setAIStatus(false);
    showConnectionMessage(
        "Settings saved. Test the connection to check whether Ollama is reachable.",
        ""
    );
    showToast("Local AI settings saved.");
});

async function testOllama() {
    const url = normalizeUrl($("#ollamaUrl").value);
    const model = $("#modelName").value.trim();

    if (!url || !model) {
        showConnectionMessage("Enter both an API address and a model name.", "error");
        return;
    }

    const button = $("#testConnection");
    button.disabled = true;
    button.textContent = "Checking...";

    try {
        const response = await fetch(`${url}/api/tags`, {
            method: "GET",
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`Ollama returned HTTP ${response.status}.`);
        }

        const data = await response.json();
        const models = Array.isArray(data.models) ? data.models : [];
        const found = models.some((item) => item.name === model);

        if (!found) {
            const available = models.map((item) => item.name).slice(0, 8);
            showConnectionMessage(
                `Ollama is reachable, but "${model}" was not found. Available models: ${available.join(", ") || "none downloaded"
                }. Pull your desired model and check its exact name.`,
                "error"
            );
            setAIStatus(false);
            return;
        }

        settings = { url, model };

        try {
            localStorage.setItem("hustlepilot-settings", JSON.stringify(settings));
        } catch {
            // Storage is optional.
        }

        setAIStatus(true);
        showConnectionMessage(
            `Connected successfully. Model "${model}" is available locally.`,
            "success"
        );
    } catch (error) {
        setAIStatus(false);

        const message = error.name === "TimeoutError"
            ? "Connection timed out. Check that Ollama is running."
            : "Could not reach Ollama. Check the API address, start Ollama, and allow your app's browser origin in Ollama's CORS settings if necessary.";

        showConnectionMessage(message, "error");
    } finally {
        button.disabled = false;
        button.textContent = "Test connection";
    }
}

$("#testConnection").addEventListener("click", testOllama);

function getFormData() {
    return {
        business: $("#businessName").value.trim(),
        audience: $("#targetAudience").value.trim(),
        details: $("#projectDetails").value.trim(),
        tone: $("#tone").value,
        length: $("#length").value
    };
}

function buildPrompt(data) {
    const toolInstructions = {
        proposal: `Write a professional client proposal with a compelling title,
project understanding, proposed deliverables, workflow, estimated timeline,
pricing considerations, assumptions, and a clear next step. Do not invent
client facts or promise unsupported results.`,
        product: `Write a clear product listing with an engaging title, a concise
description, key benefits, relevant features, ideal customer, and a call to
action. Never invent certifications, materials, specifications, or claims
that were not provided.`,
        marketing: `Write ready-to-use marketing copy with an attention-grabbing
opening, clear value proposition, audience-relevant message, and call to
action. Provide a suitable headline and optional alternative hooks. Do not
invent discounts, guarantees, or facts.`,
        pricing: `Give a practical pricing analysis for a freelancer. Show the
provided assumptions, estimated labour cost, expenses, contingency, and a
suggested quote range if enough information is available. Explain what the
estimate excludes. Never present an estimate as a guaranteed market rate.`
    };

    return `You are HustlePilot AI, a practical business writing assistant
for freelancers and small businesses.

TASK: ${tools[activeTool].title}
INSTRUCTIONS: ${toolInstructions[activeTool]}

BUSINESS OR BRAND: ${data.business || "Not provided"}
TARGET AUDIENCE: ${data.audience}
USER'S BRIEF: ${data.details}
WRITING TONE: ${data.tone}
LENGTH: ${data.length}

Write useful, specific output. Use readable headings and bullets where
helpful. Do not claim that you completed any action outside this draft.
Do not invent facts. If important details are missing, state reasonable
assumptions clearly or ask the user to verify them.`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value);
}

function makePricingEstimate(data) {
    const text = data.details;
    const hourMatch = text.match(/(?:hours?|hrs?)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    const rateMatch = text.match(/(?:rate|hourly)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    const costMatch = text.match(/(?:costs?|expenses?)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);

    const hours = hourMatch ? Number(hourMatch[1]) : 10;
    const rate = rateMatch ? Number(rateMatch[1]) : 500;
    const expenses = costMatch ? Number(costMatch[1]) : 0;

    if (
        !Number.isFinite(hours) || !Number.isFinite(rate) ||
        !Number.isFinite(expenses) || hours <= 0 || rate <= 0 ||
        expenses < 0 || hours > 100000 || rate > 10000000 ||
        expenses > 100000000
    ) {
        throw new Error(
            "Enter positive hours and hourly rate, plus non-negative expenses. Example: Website design; hours: 20; rate: 800; costs: 2000"
        );
    }

    const labour = hours * rate;
    const subtotal = labour + expenses;
    const contingency = subtotal * 0.10;
    const estimate = subtotal + contingency;

    return `PROJECT PRICING ESTIMATE
${"=".repeat(28)}

Project: ${text.split(/[;\n]/)[0].slice(0, 100)}

ASSUMPTIONS
Estimated work: ${hours} hours
Hourly rate: ${formatCurrency(rate)}
Additional expenses: ${formatCurrency(expenses)}

COST BREAKDOWN
Labour (${hours} × ${formatCurrency(rate)}): ${formatCurrency(labour)}
Additional expenses: ${formatCurrency(expenses)}
10% contingency allowance: ${formatCurrency(contingency)}
--------------------------------
Suggested starting quote: ${formatCurrency(estimate)}

PRACTICAL ADVICE
• Confirm the project scope and number of revisions.
• Agree on payment milestones and delivery dates.
• Account for taxes, platform fees and your business overhead separately.
• Check local market rates and the client's budget before finalising your quote.

This is a simple planning estimate, not a verified market price or financial guarantee.`;
}

function makeDemoResult(data) {
    const brand = data.business || "Your Business";
    const audience = data.audience;
    const details = data.details;

    if (activeTool === "pricing") {
        return makePricingEstimate(data);
    }

    if (activeTool === "proposal") {
        return `${brand.toUpperCase()}
PROJECT PROPOSAL

Prepared for: ${audience}

1. PROJECT OVERVIEW
Based on the brief provided, this project focuses on ${details}

The goal is to deliver a practical solution aligned with the client's
requirements, with clear communication and agreed milestones.

2. PROPOSED APPROACH
• Discovery: Confirm objectives, requirements and success criteria.
• Planning: Agree on deliverables, priorities and timeline.
• Production: Complete the agreed work and share progress updates.
• Review: Collect feedback and make the agreed revisions.
• Delivery: Hand over the final deliverables in the agreed format.

3. DELIVERABLES
The final deliverables will be confirmed with the client before work begins.
Document the exact scope, file formats, revision limits and any exclusions
in the final agreement.

4. TIMELINE
A realistic timeline should be agreed after reviewing project complexity,
available resources and client feedback requirements.

5. INVESTMENT
Provide a written quote after confirming the scope, estimated hours,
expenses, payment milestones and applicable taxes.

6. NEXT STEPS
Arrange a short discussion to confirm the requirements, approve the scope
and agree on the start date.

We look forward to discussing how this project can support your goals.

Prepared by ${brand}

Note: This is a starter template. Replace assumptions with verified project
details before sending it to the client.`;
    }

    if (activeTool === "product") {
        return `${details.toUpperCase()}

PRODUCT DESCRIPTION

Discover a product designed with ${audience} in mind.

WHY IT MAY BE RIGHT FOR YOU
${details}

KEY FEATURES
• Review the product's confirmed features and specifications.
• Explain how the product fits the customer's needs.
• Include only verified details about materials, dimensions and use.
• Describe care instructions or compatibility where relevant.

WHO IS IT FOR?
Consider customers looking for products that fit the needs described above.

BEFORE YOU PUBLISH
Confirm the price, availability, specifications, shipping, returns policy
and all product claims. Add original product photographs where possible.

CALL TO ACTION
Explore the details and decide whether this product is right for you.

Prepared for ${audience} by ${brand}

Note: This demo template uses your brief and does not independently verify
product facts.`;
    }

    return `${brand.toUpperCase()}
MARKETING CONTENT

TARGET AUDIENCE
${audience}

MAIN MESSAGE
${details}

HEADLINE
A better way to discover what works for you.

SOCIAL MEDIA CAPTION
Looking for a solution that fits your needs?

At ${brand}, we're focused on making the experience simpler and more useful
for ${audience}.

Discover the details, explore your options, and find out whether it is the
right fit for you.

CALL TO ACTION
Get in touch to learn more.

ALTERNATIVE HOOKS
• A simpler approach to your next big idea.
• Discover an option built around your needs.
• Let's make your next project happen.

BEFORE PUBLISHING
Replace generic claims with verified benefits, your real offer and a
specific next step. Only mention discounts, guarantees or deadlines if
they are genuine.

Note: This is a starter draft. Test the message with your audience.`;
}

async function generateWithOllama(prompt) {
    const response = await fetch(`${normalizeUrl(settings.url)}/api/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: settings.model,
            prompt,
            stream: false,
            options: {
                temperature: 0.7
            }
        }),
        signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
        throw new Error(
            `Ollama returned HTTP ${response.status}. Check the model and server.`
        );
    }

    const result = await response.json();

    if (!result.response || typeof result.response !== "string") {
        throw new Error("The model returned no text. Try again or check Ollama.");
    }

    return result.response.trim();
}

function showLoading(isLoading) {
    $("#emptyOutput").classList.toggle("hidden", isLoading || Boolean(lastResult));
    $("#loadingOutput").classList.toggle("hidden", !isLoading);
    $("#resultOutput").classList.toggle("hidden", isLoading || !lastResult);

    const button = $("#generateButton");
    button.disabled = isLoading;
    button.innerHTML = isLoading
        ? '<span>✳</span> Generating...'
        : '<span>✳</span> Generate with HustlePilot <span class="button-arrow">→</span>';
}

function displayResult(result, mode) {
    lastResult = result;
    lastResultType = tools[activeTool].resultType;
    lastResultMode = mode;

    $("#resultText").textContent = result;
    $("#resultType").textContent = lastResultType;
    $("#resultMode").textContent = mode;
    $("#resultStatus").textContent = "DRAFT READY";
    $("#resultStatus").classList.add("ready");

    showLoading(false);
    $("#resultOutput").classList.remove("hidden");
    $("#emptyOutput").classList.add("hidden");
}

$("#generatorForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = getFormData();
    const errorBox = $("#formError");

    errorBox.classList.add("hidden");
    errorBox.textContent = "";

    if (!data.audience || !data.details) {
        errorBox.textContent = "Please complete the audience and project description.";
        errorBox.classList.remove("hidden");
        return;
    }

    lastResult = "";
    $("#resultStatus").textContent = "GENERATING";
    $("#resultStatus").classList.remove("ready");
    showLoading(true);

    try {
        let result;
        let mode;

        if (activeTool === "pricing") {
            // Deterministic calculation: no AI server required.
            result = makePricingEstimate(data);
            mode = "CALCULATED ESTIMATE";
        } else {
            try {
                result = await generateWithOllama(buildPrompt(data));
                mode = `LOCAL AI · ${settings.model}`;
                setAIStatus(true);
            } catch (error) {
                // Fall back only to an explicitly labelled demo template.
                if (error.name === "AbortError" || error.name === "TimeoutError") {
                    throw new Error(
                        "Local AI timed out. Try a smaller model, or check whether Ollama is running."
                    );
                }

                result = makeDemoResult(data);
                mode = "DEMO TEMPLATE";
                setAIStatus(false);
                showToast("Ollama unavailable. Showing a demo template instead.");
            }
        }

        displayResult(result, mode);
    } catch (error) {
        showLoading(false);
        $("#resultStatus").textContent = "NEEDS ATTENTION";
        errorBox.textContent = error.message || "Something went wrong. Please try again.";
        errorBox.classList.remove("hidden");
    }
});

$("#copyButton").addEventListener("click", async () => {
    if (!lastResult) return;

    try {
        await navigator.clipboard.writeText(lastResult);
        showToast("Draft copied to clipboard.");
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = lastResult;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const copied = document.execCommand("copy");
            showToast(copied ? "Draft copied." : "Select the draft and copy it manually.");
        } catch {
            showToast("Clipboard unavailable. Select and copy the text manually.");
        }

        textarea.remove();
    }
});

$("#downloadButton").addEventListener("click", () => {
    if (!lastResult) return;

    const blob = new Blob([lastResult], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `hustlepilot-${activeTool}-draft.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast("Your text file is ready.");
});

// Start with the proposal-writing workspace accessible from the dashboard.
setAIStatus(false);
showView("dashboard");