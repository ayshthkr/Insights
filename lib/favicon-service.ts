export interface FaviconCache {
  [domain: string]: string | null
}

export class FaviconService {
  private static cache: FaviconCache = {}
  private static pendingRequests: Map<string, Promise<string | null>> = new Map()

  static async getFavicon(url: string): Promise<string | null> {
    try {
      const domain = new URL(url).hostname

      // Return cached result if available
      if (domain in this.cache) {
        return this.cache[domain]
      }

      // If request is already pending, return the existing promise
      if (this.pendingRequests.has(domain)) {
        return this.pendingRequests.get(domain)!
      }

      // Create new request
      const faviconPromise = this.fetchFavicon(domain)
      this.pendingRequests.set(domain, faviconPromise)

      try {
        const faviconUrl = await faviconPromise
        this.cache[domain] = faviconUrl
        this.pendingRequests.delete(domain)
        return faviconUrl
      } catch (error) {
        this.cache[domain] = null
        this.pendingRequests.delete(domain)
        console.log(error)
        return null
      }
    } catch (error) {
      console.error('Error processing favicon URL:', error)
      return null
    }
  }

  private static async fetchFavicon(domain: string): Promise<string | null> {
    return new Promise((resolve) => {
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      const img = new Image()

      img.onload = () => resolve(favicon)
      img.onerror = () => resolve(null)

      // Set a timeout to avoid hanging requests
      setTimeout(() => resolve(null), 5000)

      img.src = favicon
    })
  }

  static async prefetchFavicons(urls: string[]): Promise<void> {
    const prefetchPromises = urls.map(url => this.getFavicon(url))
    await Promise.allSettled(prefetchPromises)
  }

  static getCachedFavicon(url: string): string | null {
    try {
      const domain = new URL(url).hostname
      return this.cache[domain] || null
    } catch {
      return null
    }
  }
}
