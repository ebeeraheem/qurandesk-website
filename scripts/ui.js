// ui.js — chrome shared by every page: theme toggle + header elevation.

const header = document.querySelector('.site-header')
const themeToggle = document.querySelector('[data-theme-toggle]')

themeToggle?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  localStorage.setItem('qurandesk-site-theme', next)
})

document.addEventListener('scroll', () => {
  header?.setAttribute('data-elevated', window.scrollY > 8 ? 'true' : 'false')
})
