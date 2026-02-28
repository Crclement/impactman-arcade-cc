export default defineNuxtRouteMiddleware(async (to) => {
  const apiBase = resolveApiBase()

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('impactarcade_token')
    : null

  if (!token) {
    return navigateTo(`/login?redirect=/missioncontrol`)
  }

  try {
    await $fetch(`${apiBase}/api/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (e: any) {
    const status = e?.response?.status || e?.status
    if (status === 401 || status === 403) {
      return navigateTo(`/login?redirect=/missioncontrol`)
    }
    // Network error — let the page load and handle it
  }
})
