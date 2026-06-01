const releaseRepo = 'ebeeraheem/qurandesk-electron'
const releasesUrl = `https://github.com/${releaseRepo}/releases/latest`

const mobileStoreUrls = {
  android: 'https://play.google.com/store/apps/details?id=com.ebeesolutions.qurandesk',
  // Replace this placeholder with the final App Store URL before deployment.
  ios: 'https://apps.apple.com/app/qurandesk/id0000000000'
}

const platformPatterns = {
  windows: [/setup\.exe$/i, /\.exe$/i],
  mac: [/\.dmg$/i, /mac.*\.zip$/i, /\.zip$/i],
  linux: [/\.AppImage$/i, /\.deb$/i]
}

const header = document.querySelector('.site-header')
const themeToggle = document.querySelector('[data-theme-toggle]')
const releaseStatuses = [...document.querySelectorAll('[data-release-status]')]
const desktopDownloadLinks = [...document.querySelectorAll('[data-desktop-platform]')]
const storeLinks = [...document.querySelectorAll('[data-store-platform]')]
const primaryDownload = document.querySelector('[data-primary-download]')

const platform = detectPlatform()

if (platform) {
  document.querySelector(`[data-platform-card="${platform}"]`)?.classList.add('is-detected')
}

hydrateStoreLinks()

if (desktopDownloadLinks.length > 0 || releaseStatuses.length > 0) {
  await hydrateReleaseDownloads()
}

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

  if (hints.includes('iphone') || hints.includes('ipad') || hints.includes('ipod')) return 'ios'
  if (hints.includes('android')) return 'android'
  if (hints.includes('win')) return 'windows'
  if (hints.includes('mac')) return 'mac'
  if (hints.includes('linux') || hints.includes('x11')) return 'linux'
  return null
}

function hydrateStoreLinks() {
  for (const link of storeLinks) {
    const key = link.dataset.storePlatform
    const url = mobileStoreUrls[key]
    if (!url) continue

    link.href = url
    link.removeAttribute('aria-disabled')
  }

  if (!primaryDownload) return

  if (platform === 'android' && mobileStoreUrls.android) {
    primaryDownload.href = mobileStoreUrls.android
    primaryDownload.textContent = 'Get QuranDesk for Android'
  } else if (platform === 'ios' && mobileStoreUrls.ios) {
    primaryDownload.href = mobileStoreUrls.ios
    primaryDownload.textContent = 'Download QuranDesk for iOS'
  }
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

    for (const link of desktopDownloadLinks) {
      const key = link.dataset.desktopPlatform
      const asset = resolved[key]
      if (!asset) continue
      link.href = asset.browser_download_url
      link.textContent = `Download for ${platformName(key)}`
    }

    if (primaryDownload && isDesktopPlatform(platform) && resolved[platform]) {
      primaryDownload.href = resolved[platform].browser_download_url
      primaryDownload.textContent = `Download for ${platformName(platform)}`
    }

    if (releaseStatuses.length > 0) {
      const published = release.published_at
        ? new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(new Date(release.published_at))
        : 'latest'
      for (const releaseStatus of releaseStatuses) {
        releaseStatus.textContent = `Latest desktop version: ${release.tag_name ?? 'QuranDesk'} · ${published}`
      }
    }
  } catch (error) {
    console.error('Failed to fetch release info:', error)
    for (const link of desktopDownloadLinks) {
      link.href = releasesUrl
    }
    for (const releaseStatus of releaseStatuses) {
      releaseStatus.textContent =
        'Could not load the latest desktop release details. Desktop download buttons will take you to the releases page.'
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

function isDesktopPlatform(value) {
  return value === 'windows' || value === 'mac' || value === 'linux'
}

function platformName(value) {
  return {
    windows: 'Windows',
    mac: 'macOS',
    linux: 'Linux'
  }[value]
}
