(() => {
  const CONTENT_SCRIPT_VERSION = "0.1.11";
  const UNSUPPORTED_JOB_PAGE_ERROR =
    "Keine unterstützte Jobseite erkannt. Wenn diese Plattform aufgenommen werden soll, bitte die Job-URL an raf@puco.de senden.";
  const extensionApi = globalThis.browser || globalThis.chrome;
  const usesPromiseApi = Boolean(globalThis.browser);

  if (globalThis.__jobRoomHelperLoaded === CONTENT_SCRIPT_VERSION) {
    return;
  }
  globalThis.__jobRoomHelperLoaded = CONTENT_SCRIPT_VERSION;

  extensionApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (usesPromiseApi) {
      return handleMessage(message);
    }

    handleMessage(message).then(sendResponse);
    return true;
  });

  async function handleMessage(message) {
    if (message.action === "pingV2" || message.action === "ping") {
      return { ok: true, version: CONTENT_SCRIPT_VERSION };
    }

    if (message.action === "readJobV2" || message.action === "readLinkedInV2" || message.action === "readLinkedIn") {
      const data = readJobFromCurrentPlatform();
      if (!data) {
        return { ok: false, error: UNSUPPORTED_JOB_PAGE_ERROR };
      }
      await storageSet({ jobData: data });
      return { ok: true, data };
    }

    if (message.action === "pasteJobRoomV2" || message.action === "pasteJobRoom") {
      const { jobData } = await storageGet("jobData");
      if (!jobData) {
        return { ok: false, error: "No job data stored yet." };
      }
      return pasteIntoJobRoom(jobData);
    }

    return { ok: false, error: `Unknown action: ${message.action || ""}` };
  }

  function storageGet(key) {
    if (usesPromiseApi) {
      return extensionApi.storage.local.get(key);
    }

    return new Promise((resolve) => {
      extensionApi.storage.local.get(key, resolve);
    });
  }

  function storageSet(value) {
    if (usesPromiseApi) {
      return extensionApi.storage.local.set(value);
    }

    return new Promise((resolve) => {
      extensionApi.storage.local.set(value, resolve);
    });
  }

  const JOB_SOURCE_PLUGINS = [
    {
      id: "linkedin",
      label: "LinkedIn",
      matches: (url) => /(^|\.)linkedin\.com$/i.test(url.hostname),
      read: readLinkedInJob
    },
    {
      id: "jobs-ch",
      label: "jobs.ch",
      matches: (url) => /(^|\.)jobs\.ch$/i.test(url.hostname),
      read: readJobsChJob
    }
  ];

  function readJobFromCurrentPlatform() {
    const plugin = jobSourcePluginForUrl(location.href);
    if (!plugin) {
      return null;
    }

    const job = {
      ...plugin.read(),
      source: plugin.id,
      sourceLabel: plugin.label
    };

    if (!job.title || !job.company) {
      return null;
    }

    return job;
  }

  function jobSourcePluginForUrl(url) {
    try {
      const parsed = new URL(url);
      return JOB_SOURCE_PLUGINS.find((plugin) => plugin.matches(parsed)) || null;
    } catch {
      return null;
    }
  }

  function readLinkedInJob() {
    const embeddedData = readLinkedInEmbeddedData();
    const titleParts = parseLinkedInDocumentTitle(document.title);
    const jobLocation = cleanLocation(
      firstValue([
        firstText([
          ".job-details-jobs-unified-top-card__primary-description-container",
          ".jobs-unified-top-card__bullet",
          "[data-test-job-location]"
        ]),
        embeddedData.location
      ])
    );
    const company = cleanCompany(
      firstValue([
        firstText([
          ".job-details-jobs-unified-top-card__company-name",
          ".jobs-unified-top-card__company-name",
          "[data-test-job-company-name]"
        ]),
        embeddedData.company,
        titleParts.company
      ])
    );

    return {
      title: firstValue([
        firstText([
          "h1",
          ".job-details-jobs-unified-top-card__job-title",
          ".jobs-unified-top-card__job-title",
          "[data-test-job-title]"
        ]),
        embeddedData.title,
        titleParts.title
      ]),
      company,
      location: jobLocation,
      city: cityFromLocation(jobLocation, company),
      url: canonicalJobUrl(location.href),
      appliedOn: todayIsoDate(),
      readAt: new Date().toISOString()
    };
  }

  function readJobsChJob() {
    const jobPosting = firstJsonLdNode("JobPosting") || {};
    const address = firstValue([
      jobPosting.jobLocation?.address,
      Array.isArray(jobPosting.jobLocation) ? jobPosting.jobLocation[0]?.address : null
    ]) || {};
    const titleParts = parseJobsChDocumentTitle(document.title);
    const company = cleanCompany(
      firstValue([
        jobPosting.hiringOrganization?.name,
        companyFromJobsChDescription(metaContent('meta[name="description"]')),
        titleParts.company
      ])
    );
    const locationText = cleanLocation(
      firstValue([
        formatPostalAddress(address),
        firstText([
          "[data-cy*='location' i]",
          "[data-testid*='location' i]",
          "[class*='location' i]"
        ])
      ])
    );

    return {
      title: firstValue([
        jobPosting.title,
        firstText(["h1"]),
        titleParts.title,
        metaTitleWithoutSite()
      ]),
      company,
      location: locationText,
      city: cityFromLocation(locationText, company),
      url: canonicalJobUrl(firstValue([
        linkHref('link[rel="canonical"]'),
        absoluteUrl(metaContent('meta[property="og:url"]')),
        location.href
      ])),
      appliedOn: todayIsoDate(),
      readAt: new Date().toISOString()
    };
  }

  function readLinkedInEmbeddedData() {
    const raw = [
      document.title || "",
      document.body?.innerText || "",
      document.documentElement?.innerHTML || ""
    ].join("\n");
    const decoded = decodeHtml(raw);
    const sources = [raw, decoded];
    const company = firstEmbeddedMatch(sources, "companyName");
    const title = firstValue([
      firstEmbeddedMatch(sources, "jobTitle"),
      titleNearCompanyLine(decoded, company).title
    ]);
    const location = firstValue([
      locationFromLinkedInText(document.body?.innerText || ""),
      locationFromLinkedInText(decoded),
      locationNearCompanyLine(raw, company),
      locationNearCompanyLine(decoded, company)
    ]);

    return { title, company, location };
  }

  function pasteIntoJobRoom(job) {
    const normalizedJob = {
      ...job,
      city: cityForJobRoom(job.city || cityFromLocation(job.location, job.company)),
      appliedOn: job.appliedOn || todayIsoDate()
    };

    const attempts = [
      {
        field: "company",
        value: normalizedJob.company,
        selectors: [
          'input[name*="company" i]',
          'input[id*="company" i]',
          'input[aria-label*="company" i]',
          'input[placeholder*="company" i]',
          'input[name*="arbeitgeber" i]',
          'input[id*="arbeitgeber" i]',
          'input[aria-label*="arbeitgeber" i]',
          'input[placeholder*="arbeitgeber" i]',
          'input[name*="firma" i]',
          'input[id*="firma" i]',
          'input[aria-label*="firma" i]',
          'input[placeholder*="firma" i]',
          'input[name*="entreprise" i]',
          'input[id*="entreprise" i]',
          'input[aria-label*="entreprise" i]',
          'input[placeholder*="entreprise" i]'
        ]
      },
      {
        field: "title",
        value: normalizedJob.title,
        selectors: [
          'input[name*="title" i]',
          'input[id*="title" i]',
          'input[aria-label*="title" i]',
          'input[placeholder*="title" i]',
          'input[name*="job" i]',
          'input[id*="job" i]',
          'input[aria-label*="job" i]',
          'input[placeholder*="job" i]',
          'input[name*="beruf" i]',
          'input[id*="beruf" i]',
          'input[aria-label*="beruf" i]',
          'input[placeholder*="beruf" i]',
          'input[name*="position" i]',
          'input[id*="position" i]',
          'input[aria-label*="position" i]',
          'input[placeholder*="position" i]'
        ]
      },
      {
        field: "location",
        value: normalizedJob.location,
        selectors: [
          'input[name*="location" i]',
          'input[id*="location" i]',
          'input[aria-label*="location" i]',
          'input[placeholder*="location" i]'
        ],
        accept: acceptsTextValue
      },
      {
        field: "city",
        value: normalizedJob.city,
        selectors: [
          'input[name*="city" i]',
          'input[id*="city" i]',
          'input[aria-label*="city" i]',
          'input[placeholder*="city" i]',
          'input[aria-label*="ort" i]',
          'input[placeholder*="ort" i]',
          'input[name*="arbeitsort" i]',
          'input[id*="arbeitsort" i]',
          'input[aria-label*="arbeitsort" i]',
          'input[placeholder*="arbeitsort" i]',
          'input[name*="plz" i]',
          'input[id*="plz" i]',
          'input[aria-label*="plz" i]',
          'input[placeholder*="plz" i]',
          'input[aria-label*="lieu" i]',
          'input[placeholder*="lieu" i]',
          '[role="combobox"][aria-label*="plz" i]',
          '[role="combobox"][aria-label*="ort" i]',
          '[role="combobox"][aria-label*="lieu" i]',
          '[aria-autocomplete][aria-label*="plz" i]',
          '[aria-autocomplete][aria-label*="ort" i]',
          '[aria-autocomplete][aria-label*="lieu" i]'
        ],
        labelNeedles: ["plz / ort", "plz/ort", "plz ort", "plz", "lieu", "arbeitsort"],
        labelFirst: true,
        accept: acceptsTextValue,
        setter: setCityField
      },
      {
        field: "url",
        value: normalizedJob.url,
        selectors: [
          'input[type="url"]',
          'input[name*="url" i]',
          'input[id*="url" i]',
          'input[aria-label*="url" i]',
          'input[placeholder*="url" i]',
          'input[name*="link" i]',
          'input[id*="link" i]',
          'input[aria-label*="link" i]',
          'input[placeholder*="link" i]',
          'textarea[name*="url" i]',
          'textarea[id*="url" i]'
        ]
      },
      {
        field: "appliedOn",
        value: normalizedJob.appliedOn,
        selectors: [
          'input[type="date"]',
          'input[name*="applied" i]',
          'input[id*="applied" i]',
          'input[aria-label*="applied" i]',
          'input[placeholder*="applied" i]',
          'input[name*="application" i]',
          'input[id*="application" i]',
          'input[aria-label*="application" i]',
          'input[placeholder*="application" i]',
          'input[name*="bewerb" i]',
          'input[id*="bewerb" i]',
          'input[aria-label*="bewerb" i]',
          'input[placeholder*="bewerb" i]',
          'input[name*="datum" i]',
          'input[id*="datum" i]',
          'input[aria-label*="datum" i]',
          'input[placeholder*="datum" i]'
        ],
        labelNeedles: [
          "bewerbungsdatum",
          "datum der bewerbung",
          "datum bewerbung",
          "beworben am",
          "wann haben sie sich beworben",
          "applied on"
        ],
        labelFirst: true,
        transform: valueForDateField,
        accept: acceptsDateValue
      }
    ];

    const filled = [];
    const missing = [];

    for (const attempt of attempts) {
      if (!attempt.value) {
        missing.push({ field: attempt.field, reason: "empty source value" });
        continue;
      }

      const result = setFirstMatchingField(
        attempt.selectors,
        attempt.value,
        attempt.transform,
        attempt.accept,
        attempt.labelNeedles,
        attempt.labelFirst,
        attempt.setter
      );
      if (result.ok) {
        filled.push({ field: attempt.field, selector: result.selector });
      } else {
        missing.push({ field: attempt.field, reason: "no matching field" });
      }
    }

    const choices = [
      {
        field: "ravAssignment",
        question: ["erfolgte die bewerbung aufgrund einer zuweisung des rav"],
        answer: ["nein"]
      },
      {
        field: "workload",
        question: ["für welches arbeitspensum haben sie sich beworben", "arbeitspensum"],
        answer: ["vollzeit"]
      },
      {
        field: "applicationResult",
        question: ["wie lautet das ergebnis ihrer bewerbung", "ergebnis ihrer bewerbung"],
        answer: ["noch offen"]
      },
      {
        field: "applicationMethod",
        question: ["wie haben sie sich beworben", "bewerbungsart"],
        answer: ["elektronisch", "online", "e-mail", "email"]
      }
    ];

    for (const choice of choices) {
      const result = setChoice(choice.question, choice.answer);
      if (result.ok) {
        filled.push({ field: choice.field, selector: result.selector, method: result.method });
      } else {
        missing.push({ field: choice.field, reason: "choice not found" });
      }
    }

    return {
      ok: filled.length > 0,
      filled,
      missing,
      job: normalizedJob
    };
  }

  function firstText(selectors) {
    for (const selector of selectors) {
      const value = text(selector);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function firstValue(values) {
    return values.find((value) => String(value || "").trim()) || "";
  }

  function text(selector) {
    return document.querySelector(selector)?.innerText?.replace(/\s+/g, " ").trim() || "";
  }

  function metaContent(selector) {
    return document.querySelector(selector)?.getAttribute("content")?.replace(/\s+/g, " ").trim() || "";
  }

  function linkHref(selector) {
    return document.querySelector(selector)?.href || document.querySelector(selector)?.getAttribute("href") || "";
  }

  function cleanCompany(value) {
    return value.replace(/\s*\n\s*/g, " ").trim();
  }

  function cleanLocation(value) {
    const cleaned = String(value || "")
      .replace(/\s*\n\s*/g, " ")
      .replace(/\s*·\s*/g, " · ")
      .trim();

    return firstLinkedInLocationSegment(cleaned);
  }

  function formatPostalAddress(address) {
    if (!address || typeof address !== "object") {
      return "";
    }

    return [
      [address.postalCode, address.addressLocality].filter(Boolean).join(" "),
      address.addressRegion,
      address.addressCountry
    ]
      .filter(Boolean)
      .join(", ");
  }

  function cityFromLocation(value, company = "") {
    const cleaned = cleanLocation(value || "");
    if (!cleaned) {
      return "Zürich";
    }

    const normalizedCompany = normalizeText(company);
    const parts = cleaned
      .split(/\s*(?:·|-|\||,|\/|\(|\))\s*/)
      .map((part) => part.trim())
      .filter(Boolean);

    const city = parts.find((part) => {
      const normalizedPart = normalizeText(part);
      return (
        normalizedPart !== normalizedCompany &&
        !/(schweiz|switzerland|suisse|remote|hybrid|smart working|vor ort|on-site|onsite|full-time|teilzeit|vollzeit|bewerber|applicant)/i.test(part)
      );
    });

    return substitutedCity(city) || "Zürich";
  }

  function firstLinkedInLocationSegment(value) {
    const segments = String(value || "")
      .split(/\s*·\s*/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    const location = segments.find(looksLikeLocation) || segments[0] || "";

    return location
      .replace(/\s+\b(?:\d+\s+)?(?:day|days|week|weeks|month|months|hour|hours|minute|minutes)\s+ago\b.*$/i, "")
      .replace(/\s+\bover\s+\d+\s+applicants\b.*$/i, "")
      .trim();
  }

  function locationFromLinkedInText(value) {
    const lines = String(value || "")
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const line of lines) {
      if (!/\b(?:switzerland|schweiz|suisse)\b/i.test(line)) {
        continue;
      }
      if (!/\b(?:ago|applicants?|bewerber|candidats?)\b/i.test(line) && !line.includes("·")) {
        continue;
      }

      const location = firstLinkedInLocationSegment(line);
      if (location && !/linkedin|notification|job alert/i.test(location)) {
        return location;
      }
    }

    return "";
  }

  function cityForJobRoom(value) {
    return substitutedCity(String(value || "").replace(/^\s*\d{4}\s+/, "")) || "Zürich";
  }

  function substitutedCity(value) {
    const normalized = normalizeText(value);
    const cityMap = [
      { match: /\bgeneva\b|\bgenf\b|\bgeneve\b/, value: "Geneva" },
      { match: /\bzurich\b|\bzuerich\b|\bzurigo\b/, value: "Zürich" },
      { match: /\blausanne\b/, value: "Lausanne" },
      { match: /\bbern\b|\bberne\b/, value: "Bern" }
    ];

    const mapped = cityMap.find((entry) => entry.match.test(normalized));
    return mapped?.value || value || "";
  }

  function looksLikeLocation(value) {
    return /\b(?:switzerland|schweiz|suisse|geneva|genf|geneve|zurich|zürich|zuerich|lausanne|bern|berne)\b/i.test(value);
  }

  function todayIsoDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function valueForDateField(value, el) {
    if (el?.type === "date") {
      return value;
    }
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  function parseLinkedInDocumentTitle(value) {
    const parts = String(value || "")
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => part.toLowerCase() !== "linkedin");

    if (parts.length < 2) {
      return { title: parts[0] || "", company: "" };
    }

    return {
      title: parts.slice(0, -1).join(" | "),
      company: parts.at(-1) || ""
    };
  }

  function parseJobsChDocumentTitle(value) {
    const cleaned = String(value || "").replace(/\s+-\s+jobs\.ch\s*$/i, "").trim();
    const match = cleaned.match(/^(.*?)\s+-\s+Job Offer at\s+(.+)$/i);
    if (match) {
      return {
        title: match[1].trim(),
        company: match[2].trim()
      };
    }

    return { title: cleaned, company: "" };
  }

  function metaTitleWithoutSite() {
    return parseJobsChDocumentTitle(metaContent('meta[property="og:title"]') || document.title).title;
  }

  function companyFromJobsChDescription(value) {
    const match = String(value || "").match(/^(.+?)\s+published the job\b/i);
    return match?.[1]?.trim() || "";
  }

  function firstJsonLdNode(type) {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      const nodes = flattenJsonLd(parseJson(script.textContent || ""));
      const match = nodes.find((node) => jsonLdTypeMatches(node, type));
      if (match) {
        return match;
      }
    }

    return null;
  }

  function parseJson(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function flattenJsonLd(value) {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.flatMap(flattenJsonLd);
    }
    if (typeof value === "object") {
      return [value, ...flattenJsonLd(value["@graph"])];
    }
    return [];
  }

  function jsonLdTypeMatches(node, type) {
    const nodeType = node?.["@type"];
    return Array.isArray(nodeType) ? nodeType.includes(type) : nodeType === type;
  }

  function absoluteUrl(value) {
    if (!value) {
      return "";
    }
    try {
      return new URL(value, location.href).toString();
    } catch {
      return value;
    }
  }

  function firstEmbeddedMatch(sources, key) {
    for (const source of sources) {
      const match = source.match(new RegExp(`\\\\?"${escapeRegex(key)}\\\\?"\\\\s*:\\\\s*\\\\?"((?:\\\\\\\\.|[^"\\\\\\\\])*)\\\\?"`));
      if (match?.[1]) {
        return unescapeLinkedInString(match[1]);
      }
    }
    return "";
  }

  function titleNearCompanyLine(source, company) {
    if (!company) {
      return { title: "" };
    }

    const companyIndex = source.indexOf(company);
    if (companyIndex < 0) {
      return { title: "" };
    }

    const beforeCompany = source.slice(Math.max(0, companyIndex - 1200), companyIndex);
    const matches = Array.from(beforeCompany.matchAll(/children\\?":\\?\[\\?"([^"<>]{6,160})\\?"\]/g));
    const candidate = matches
      .map((match) => unescapeLinkedInString(match[1]))
      .reverse()
      .find((value) => !value.includes("•") && !/linkedin|notifications/i.test(value));

    return { title: candidate || "" };
  }

  function locationNearCompanyLine(source, company) {
    if (!company) {
      return "";
    }

    const escapedCompany = escapeRegex(company);
    const patterns = [
      new RegExp(`${escapedCompany}\\\\s*[•·]\\\\s*([^"<>\\\\\\\\\\n]{2,120})`),
      new RegExp(`${escapedCompany}\\\\s*\\\\\\\\u2022\\\\s*([^"<>\\\\\\\\\\n]{2,120})`)
    ];

    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match?.[1]) {
        return cleanLocation(unescapeLinkedInString(match[1]));
      }
    }

    return "";
  }

  function decodeHtml(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  function unescapeLinkedInString(value) {
    return String(value || "")
      .replace(/\\"/g, '"')
      .replace(/\\u2022/g, "•")
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\\/g, "\\")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function canonicalJobUrl(url) {
    try {
      const parsed = new URL(url);
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return url.split("?")[0].split("#")[0];
    }
  }

  function setFirstMatchingField(
    selectors,
    value,
    transform = (fieldValue) => fieldValue,
    accept = () => true,
    labelNeedles = [],
    labelFirst = false,
    setter = setField
  ) {
    if (labelFirst && labelNeedles.length) {
      const el = findFieldByNearbyLabel(labelNeedles, accept);
      if (setter(el, transform(value, el))) {
        return { ok: true, selector: `label:${labelNeedles[0]}` };
      }
    }

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (!accept(el)) {
        continue;
      }
      if (setter(el, transform(value, el))) {
        return { ok: true, selector };
      }
    }

    if (!labelFirst && labelNeedles.length) {
      const el = findFieldByNearbyLabel(labelNeedles, accept);
      if (setter(el, transform(value, el))) {
        return { ok: true, selector: `label:${labelNeedles[0]}` };
      }
    }

    return { ok: false };
  }

  function findFieldByNearbyLabel(labelNeedles, accept = () => true) {
    const normalizedNeedles = labelNeedles.map(normalizeText);

    for (const field of document.querySelectorAll(fieldSelector())) {
      if (!accept(field)) {
        continue;
      }

      const ownText = [
        field.getAttribute("placeholder"),
        field.getAttribute("aria-label"),
        field.getAttribute("title")
      ].join(" ");

      if (includesAny(ownText, normalizedNeedles)) {
        return field;
      }
    }

    for (const label of document.querySelectorAll("label")) {
      if (!includesAny(label.innerText || label.textContent || "", normalizedNeedles)) {
        continue;
      }

      const target = fieldForLabel(label);
      if (accept(target)) {
        return target;
      }
    }

    const containers = Array.from(document.querySelectorAll("div, section, fieldset, li"))
      .filter((el) => includesAny(el.innerText || el.textContent || "", normalizedNeedles))
      .sort((a, b) => textLength(a) - textLength(b));

    for (const container of containers.slice(0, 12)) {
      const fields = Array.from(container.querySelectorAll(fieldSelector()))
        .filter((candidate) => accept(candidate));
      const field = fields.find((candidate) => {
        const ownText = [
          candidate.getAttribute("placeholder"),
          candidate.getAttribute("aria-label"),
          candidate.getAttribute("title")
        ].join(" ");
        return includesAny(ownText, normalizedNeedles);
      }) || fields[0];

      if (field) {
        return field;
      }
    }

    return null;
  }

  function fieldForLabel(label) {
    if (label.htmlFor) {
      return document.getElementById(label.htmlFor);
    }
    return label.querySelector(fieldSelector());
  }

  function fieldSelector() {
    return "input, textarea, select, [contenteditable='true'], [role='combobox'], [aria-autocomplete]";
  }

  function acceptsTextValue(el) {
    if (!el || isDateLikeField(el)) {
      return false;
    }

    if (el.isContentEditable || el.tagName === "TEXTAREA") {
      return true;
    }

    if (el.tagName !== "INPUT") {
      return el.getAttribute("role") === "combobox" || el.hasAttribute("aria-autocomplete");
    }

    return ["", "text", "search"].includes((el.getAttribute("type") || "text").toLowerCase());
  }

  function acceptsDateValue(el) {
    if (!el || el.disabled || el.readOnly) {
      return false;
    }

    if (el.tagName !== "INPUT") {
      return false;
    }

    return ["", "text", "search", "date"].includes((el.getAttribute("type") || "text").toLowerCase());
  }

  function isDateLikeField(el) {
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (["date", "datetime-local", "month", "time", "week"].includes(type)) {
      return true;
    }

    const attrs = [
      el.name,
      el.id,
      el.getAttribute("aria-label"),
      el.getAttribute("placeholder"),
      el.getAttribute("autocomplete")
    ].join(" ");

    return /(?:date|datum|time|month|year|applied|application|bewerb)/i.test(attrs);
  }

  function setField(el, value) {
    if (!el || isHidden(el) || el.disabled || el.readOnly) {
      return false;
    }

    el.focus();

    if (el.isContentEditable) {
      el.textContent = value;
    } else if (el.tagName === "SELECT") {
      const option = Array.from(el.options).find((candidate) => {
        return candidate.value === value || candidate.text.trim() === value;
      });
      if (!option) {
        return false;
      }
      el.value = option.value;
    } else {
      setNativeValue(el, value);
    }

    dispatchFieldEvents(el);
    return true;
  }

  function setCityField(el, value) {
    if (!el || isHidden(el) || el.disabled || el.readOnly) {
      return false;
    }

    el.click();
    el.focus();

    let target = editableField(el);
    if (!target && editableField(document.activeElement)) {
      target = document.activeElement;
    }
    if (!target && el.matches?.("input, textarea, [contenteditable='true']")) {
      target = el;
    }

    if (!target) {
      clickMatchingCityOption(value);
      return false;
    }

    target.focus();
    if (target.isContentEditable) {
      target.textContent = value;
    } else {
      setNativeValue(target, value);
    }

    dispatchAutocompleteEvents(target, value);
    clickMatchingCityOption(value);
    setTimeout(() => clickMatchingCityOption(value), 150);
    setTimeout(() => clickMatchingCityOption(value), 500);
    return true;
  }

  function editableField(el) {
    if (!el || el === document.body) {
      return null;
    }
    if (el.matches?.("input, textarea, [contenteditable='true']")) {
      return el;
    }
    return el.querySelector?.("input, textarea, [contenteditable='true']") || null;
  }

  function setNativeValue(el, value) {
    const prototype = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor?.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function dispatchFieldEvents(el) {
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Unidentified" }));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Unidentified" }));
    el.blur();
  }

  function dispatchAutocompleteEvents(el, value) {
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
    try {
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    } catch {
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clickMatchingCityOption(value) {
    const option = findMatchingCityOption(value);
    if (!option) {
      return false;
    }

    option.click();
    dispatchFieldEvents(option);
    return true;
  }

  function findMatchingCityOption(value) {
    const cityMatch = String(value || "").match(/\b\d{4}\b/);
    const postalCode = cityMatch?.[0] || "";
    const cityText = normalizeText(String(value || "").replace(/\b\d{4}\b/g, ""));
    const optionSelectors = [
      ".cdk-overlay-pane [role='option']",
      ".mat-autocomplete-panel mat-option",
      ".mat-mdc-autocomplete-panel mat-option",
      "ng-dropdown-panel .ng-option",
      "[role='listbox'] [role='option']",
      "[role='option']"
    ];
    const candidates = optionSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));

    return candidates.find((candidate) => {
      if (isHidden(candidate)) {
        return false;
      }
      const text = normalizeText(candidate.innerText || candidate.textContent || candidate.getAttribute("aria-label") || "");
      if (!text) {
        return false;
      }
      if (postalCode && text.includes(postalCode)) {
        return true;
      }
      return cityText && text.includes(cityText);
    }) || null;
  }

  function setChoice(questionNeedles, answerNeedles) {
    const containers = findQuestionContainers(questionNeedles);

    for (const container of containers) {
      const result =
        setSelectChoice(container, answerNeedles) ||
        clickInputChoice(container, answerNeedles) ||
        clickCustomChoice(container, answerNeedles);

      if (result) {
        return result;
      }
    }

    const documentResult =
      setSelectChoice(document, answerNeedles, questionNeedles) ||
      clickInputChoice(document, answerNeedles, questionNeedles) ||
      clickCustomChoice(document, answerNeedles, questionNeedles);

    return documentResult || { ok: false };
  }

  function findQuestionContainers(questionNeedles) {
    const normalizedNeedles = questionNeedles.map(normalizeText);
    const candidates = Array.from(document.querySelectorAll("fieldset, section, article, form, div, li"));
    const matches = candidates.filter((el) => {
      const normalized = normalizeText(el.innerText || el.textContent || "");
      return normalizedNeedles.some((needle) => normalized.includes(needle));
    });

    return matches
      .sort((a, b) => textLength(a) - textLength(b))
      .slice(0, 8);
  }

  function setSelectChoice(root, answerNeedles, questionNeedles = []) {
    for (const select of root.querySelectorAll?.("select") || []) {
      if (questionNeedles.length && !contextMatches(select, questionNeedles)) {
        continue;
      }

      const option = Array.from(select.options).find((candidate) => {
        return includesAny(candidate.textContent || candidate.value, answerNeedles);
      });

      if (option && setField(select, option.value)) {
        return { ok: true, method: "select", selector: selectorFor(select) };
      }
    }

    return null;
  }

  function clickInputChoice(root, answerNeedles, questionNeedles = []) {
    const inputs = root.querySelectorAll?.('input[type="radio"], input[type="checkbox"]') || [];

    for (const input of inputs) {
      if (input.disabled) {
        continue;
      }

      if (questionNeedles.length && !contextMatches(input, questionNeedles)) {
        continue;
      }

      const label = labelForInput(input);
      const candidateText = `${label?.innerText || ""} ${input.value || ""} ${input.getAttribute("aria-label") || ""}`;
      if (!includesAny(candidateText, answerNeedles)) {
        continue;
      }

      const clickTarget = label || input;
      if (input.type !== "checkbox" || !input.checked) {
        clickTarget.click();
      }
      dispatchFieldEvents(input);
      return { ok: true, method: input.type, selector: selectorFor(input) };
    }

    return null;
  }

  function clickCustomChoice(root, answerNeedles, questionNeedles = []) {
    const candidates = root.querySelectorAll?.(
      'button, [role="radio"], [role="checkbox"], [role="option"], [aria-checked], [aria-selected]'
    ) || [];

    for (const candidate of candidates) {
      if (candidate.getAttribute("aria-disabled") === "true") {
        continue;
      }

      if (questionNeedles.length && !contextMatches(candidate, questionNeedles)) {
        continue;
      }

      if (!includesAny(candidate.innerText || candidate.textContent || candidate.getAttribute("aria-label") || "", answerNeedles)) {
        continue;
      }

      if (candidate.getAttribute("aria-checked") !== "true" && candidate.getAttribute("aria-selected") !== "true") {
        candidate.click();
      }
      dispatchFieldEvents(candidate);
      return { ok: true, method: "custom", selector: selectorFor(candidate) };
    }

    return null;
  }

  function labelForInput(input) {
    if (input.id) {
      const directLabel = document.querySelector(`label[for="${cssEscape(input.id)}"]`);
      if (directLabel) {
        return directLabel;
      }
    }

    return input.closest("label");
  }

  function contextMatches(el, needles) {
    let cursor = el;
    for (let depth = 0; cursor && depth < 6; depth += 1) {
      if (includesAny(cursor.innerText || cursor.textContent || "", needles)) {
        return true;
      }
      cursor = cursor.parentElement;
    }
    return false;
  }

  function includesAny(value, needles) {
    const normalized = normalizeText(value);
    return needles.map(normalizeText).some((needle) => normalized.includes(needle));
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function textLength(el) {
    return (el.innerText || el.textContent || "").length;
  }

  function selectorFor(el) {
    if (!el) {
      return "";
    }
    if (el.id) {
      return `#${cssEscape(el.id)}`;
    }
    if (el.name) {
      return `${el.tagName.toLowerCase()}[name="${cssEscape(el.name)}"]`;
    }
    return el.tagName.toLowerCase();
  }

  function cssEscape(value) {
    if (globalThis.CSS?.escape) {
      return globalThis.CSS.escape(value);
    }
    return String(value).replace(/"/g, '\\"');
  }

  function isHidden(el) {
    const style = getComputedStyle(el);
    return style.display === "none" || style.visibility === "hidden" || el.offsetParent === null;
  }
})();
