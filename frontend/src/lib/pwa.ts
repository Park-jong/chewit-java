/** production 빌드에서만 서비스워커를 등록한다. 실패해도 앱 동작에는 영향이 없다. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('서비스워커 등록에 실패했습니다.', error)
    })
  }
  // 첫 렌더링을 방해하지 않도록 load 이후에 등록한다.
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
