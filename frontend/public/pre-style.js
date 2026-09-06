(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveTheme = prefersDark ? 'dark' : 'light';
  document.documentElement.classList.add(effectiveTheme);
  const bg = prefersDark ? '#0d0d0d' : '#ffffff';
  document.documentElement.style.backgroundColor = bg;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', bg);
})();