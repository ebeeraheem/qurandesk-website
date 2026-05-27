const releaseRepo = 'ebeeraheem/qurandesk-electron'
const releasesUrl = `https://github.com/${releaseRepo}/releases/latest`

const platformPatterns = {
  windows: [/setup\.exe$/i, /\.exe$/i],
  mac: [/\.dmg$/i, /mac.*\.zip$/i, /\.zip$/i],
  linux: [/\.AppImage$/i, /\.deb$/i]
}

const header = document.querySelector('.site-header')
const themeToggle = document.querySelector('[data-theme-toggle]')
const releaseStatus = document.querySelector('[data-release-status]')
const downloadLinks = [...document.querySelectorAll('[data-platform]')]
const primaryDownload = document.querySelector('[data-primary-download]')

const platform = detectPlatform()

if (platform) {
  document.querySelector(`[data-platform-card="${platform}"]`)?.classList.add('is-detected')
}

await hydrateReleaseDownloads()

themeToggle?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  localStorage.setItem('qurandesk-site-theme', next)
})

document.addEventListener('scroll', () => {
  header?.setAttribute('data-elevated', window.scrollY > 8 ? 'true' : 'false')
})

function detectPlatform() {
  const hints = [
    navigator.userAgentData?.platform,
    navigator.userAgent
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (hints.includes('win')) return 'windows'
  if (hints.includes('mac')) return 'mac'
  if (hints.includes('linux') || hints.includes('x11')) return 'linux'
  return null
}

async function hydrateReleaseDownloads() {
  try {
    const response = await fetch(`https://api.github.com/repos/${releaseRepo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    })

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`)
    }

    const release = await response.json()
    const assets = Array.isArray(release.assets) ? release.assets : []
    const resolved = resolveAssets(assets)

    for (const link of downloadLinks) {
      const key = link.dataset.platform
      const asset = resolved[key]
      if (!asset) continue
      link.href = asset.browser_download_url
      link.textContent = `Download for ${platformName(key)}`
    }

    if (primaryDownload && platform && resolved[platform]) {
      primaryDownload.href = resolved[platform].browser_download_url
      primaryDownload.textContent = `Download for ${platformName(platform)}`
    }

    if (releaseStatus) {
      const published = release.published_at
        ? new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(new Date(release.published_at))
        : 'latest'
      releaseStatus.textContent = `Latest version: ${release.tag_name ?? 'QuranDesk'} · ${published}`
    }
  } catch (error) {
    console.error('Failed to fetch release info:', error)
    if (releaseStatus) {
      releaseStatus.textContent =
        'Could not load the latest release details. The download buttons will take you to the releases page.'
    }
  }
}

function resolveAssets(assets) {
  const result = {}
  for (const [platformNameKey, patterns] of Object.entries(platformPatterns)) {
    result[platformNameKey] = assets.find((asset) => {
      return patterns.some((pattern) => pattern.test(asset.name ?? ''))
    })
  }
  return result
}

function platformName(value) {
  return {
    windows: 'Windows',
    mac: 'macOS',
    linux: 'Linux'
  }[value]
}
