
// ============================================
// QUEUEPAL LANDING PAGE
// ============================================

// CHANGE THIS TO YOUR GITHUB INFORMATION

const CONFIG = {
  githubUsername: "hvnmrk",
  githubRepository: "queuepal-landing-page",

  // Refresh GitHub release stats every 5 minutes.
  refreshInterval: 300000
};

// ============================================
// MOBILE NAVIGATION
// ============================================

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

function closeMobileMenu() {
  navLinks.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
}

menuButton.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuButton.setAttribute(
    "aria-expanded",
    String(isOpen)
  );

  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobileMenu();
});

document.addEventListener("click", event => {
  if (
    !menuButton.contains(event.target) &&
    !navLinks.contains(event.target)
  ) {
    closeMobileMenu();
  }
});

// ============================================
// SCROLL EFFECTS
// ============================================

const header = document.getElementById("header");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 20);
}

window.addEventListener("scroll", updateHeader, {
  passive: true
});

updateHeader();

// ============================================
// REVEAL ANIMATIONS
// ============================================

const revealItems = document.querySelectorAll(".reveal");

if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -25px 0px"
    }
  );

  revealItems.forEach(item => observer.observe(item));

} else {
  revealItems.forEach(item => {
    item.classList.add("visible");
  });
}

// ============================================
// FOOTER YEAR
// ============================================

document.getElementById("year").textContent =
  new Date().getFullYear();

// ============================================
// GITHUB RELEASES
// ============================================

const downloadCount =
  document.getElementById("downloadCount");

const downloadCountStatus =
  document.getElementById("downloadCountStatus");

const apkDownloadButton =
  document.getElementById("apkDownloadButton");

const downloadButtonText =
  document.getElementById("downloadButtonText");

const apkInfo =
  document.getElementById("apkInfo");

const githubAPI =
  `https://api.github.com/repos/` +
  `${CONFIG.githubUsername}/` +
  `${CONFIG.githubRepository}`;

let lastKnownCount = null;

function isApk(asset) {
  return (
    asset.name &&
    asset.name.toLowerCase().endsWith(".apk")
  );
}

async function fetchGitHub(path) {
  const response = await fetch(
    `${githubAPI}${path}`,
    {
      headers: {
        Accept: "application/vnd.github+json"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API returned ${response.status}`
    );
  }

  return response.json();
}

// Count official APK downloads from
// GitHub Releases, including old versions.
// This counts release asset downloads,
// not installations or registered users.

async function fetchReleaseData() {
  let allReleases = [];

  // Up to 3 pages / 300 releases.
  // For a new project this should be ample.
  for (let page = 1; page <= 3; page++) {
    const releases = await fetchGitHub(
      `/releases?per_page=100&page=${page}`
    );

    allReleases.push(...releases);

    if (releases.length < 100) break;
  }

  const publicReleases = allReleases.filter(
    release => !release.draft && !release.prerelease
  );

  let totalDownloads = 0;

  for (const release of publicReleases) {
    for (const asset of release.assets || []) {
      if (isApk(asset)) {
        totalDownloads += asset.download_count || 0;
      }
    }
  }

  const latestRelease = publicReleases[0];

  const latestApk = latestRelease?.assets?.find(isApk);

  return {
    totalDownloads,
    latestApk,
    latestRelease,
    hasReleases: publicReleases.length > 0
  };
}

// ============================================
// NUMBER ANIMATION
// ============================================

function animateNumber(element, from, to) {
  const duration = 700;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min(
      (now - startTime) / duration,
      1
    );

    const eased = 1 - Math.pow(1 - progress, 3);

    const current = Math.round(
      from + (to - from) * eased
    );

    element.textContent =
      current.toLocaleString("en-PH");

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

// ============================================
// DOWNLOAD BUTTON STATE
// ============================================

function setDownloadUnavailable(message) {
  apkDownloadButton.href = "#download";
  apkDownloadButton.setAttribute("aria-disabled", "true");
  apkDownloadButton.removeAttribute("target");
  apkDownloadButton.removeAttribute("rel");

  downloadButtonText.textContent = "Download Unavailable";
  apkInfo.textContent = message;
}

function setDownloadAvailable(asset, release) {
  apkDownloadButton.href = asset.browser_download_url;

  apkDownloadButton.removeAttribute("aria-disabled");

  downloadButtonText.textContent = "Download QueuePal APK";

  apkInfo.textContent =
    `Android APK • ${release.tag_name} • Free download`;

  // Allow normal navigation to the GitHub
  // release asset. No access tokens needed.
}

// ============================================
// LOAD STATS
// ============================================

async function loadDownloadStats() {

  try {
    const data = await fetchReleaseData();

    if (lastKnownCount === null) {
      animateNumber(
        downloadCount,
        0,
        data.totalDownloads
      );
    } else if (
      data.totalDownloads !== lastKnownCount
    ) {
      animateNumber(
        downloadCount,
        lastKnownCount,
        data.totalDownloads
      );
    }

    lastKnownCount = data.totalDownloads;

    downloadCountStatus.textContent =
      "GitHub release downloads";

    if (data.latestApk) {
      setDownloadAvailable(
        data.latestApk,
        data.latestRelease
      );
    } else {
      setDownloadUnavailable(
        "The Android installer hasn't been published yet."
      );
    }

  } catch (error) {

    console.error(
      "Could not load QueuePal releases:",
      error
    );

    downloadCountStatus.textContent =
      lastKnownCount === null
        ? "Statistics unavailable"
        : "Last available count";

    // If GitHub is temporarily unavailable,
    // do not erase a previously valid APK link.
    if (
      apkDownloadButton.getAttribute("aria-disabled") === "true"
    ) {
      setDownloadUnavailable(
        "Please try again later."
      );
    }

  }
}

// ============================================
// GOOGLE ANALYTICS DOWNLOAD EVENTS
// ============================================

apkDownloadButton.addEventListener("click", event => {

  if (
    apkDownloadButton.getAttribute("aria-disabled") === "true"
  ) {
    event.preventDefault();
    return;
  }

  // Only sends an event if Google Analytics
  // is correctly configured in index.html.
  if (typeof window.gtag === "function") {

    window.gtag("event", "apk_download_click", {
      app_name: "QueuePal",
      platform: "Android",
      source: "landing_page"
    });

  }

});

// ============================================
// INITIALIZE
// ============================================

loadDownloadStats();

setInterval(() => {
  if (!document.hidden) {
    loadDownloadStats();
  }
}, CONFIG.refreshInterval);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    loadDownloadStats();
  }
});
