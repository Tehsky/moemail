/// <reference types="@cloudflare/workers-types" />


declare global {
  interface CloudflareEnv {
    DB: D1Database;
    SITE_CONFIG: KVNamespace;
  }

  interface Window {
    turnstile?: {
      render: (element: HTMLElement | string, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }

  type Env = CloudflareEnv
}

declare module "next-auth" {
  interface User {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    roles?: { name: string }[]
    username?: string | null
    providers?: string[]
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string | null
  }
}

export type { Env }
