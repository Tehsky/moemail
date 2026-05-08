import { PERMISSIONS, Role, ROLES } from "@/lib/permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"
import { checkPermission, auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { roles, userRoles } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const runtime = "edge"

async function getAdminUserInfo() {
  const session = await auth()
  const db = createDb()

  const emperorRole = await db.query.roles.findFirst({
    where: eq(roles.name, ROLES.EMPEROR),
    with: {
      userRoles: true,
    },
  })

  const adminUserId = emperorRole?.userRoles?.[0]?.userId || null
  const currentUserIsAdmin = Boolean(session?.user?.id && session.user.id === adminUserId)

  return {
    adminUserId,
    currentUserIsAdmin,
  }
}

export async function GET() {
  const env = getRequestContext().env
  const canManageConfig = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  const { adminUserId, currentUserIsAdmin } = await getAdminUserInfo()

  const [
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    turnstileEnabled,
    turnstileSiteKey,
    turnstileSecretKey
  ] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("MAX_EMAILS"),
    env.SITE_CONFIG.get("TURNSTILE_ENABLED"),
    env.SITE_CONFIG.get("TURNSTILE_SITE_KEY"),
    env.SITE_CONFIG.get("TURNSTILE_SECRET_KEY")
  ])

  return Response.json({
    defaultRole: defaultRole || ROLES.CIVILIAN,
    emailDomains: emailDomains || "moemail.app",
    adminContact: adminContact || "",
    adminUserId,
    currentUserIsAdmin,
    maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString(),
    turnstile: canManageConfig ? {
      enabled: turnstileEnabled === "true",
      siteKey: turnstileSiteKey || "",
      secretKey: turnstileSecretKey || "",
    } : undefined
  })
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  if (!canAccess) {
    return Response.json({
      error: "权限不足"
    }, { status: 403 })
  }

  const {
    defaultRole,
    emailDomains,
    adminContact,
    maxEmails,
    turnstile
  } = await request.json() as {
    defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
    emailDomains: string,
    adminContact: string,
    maxEmails: string,
    turnstile?: {
      enabled: boolean,
      siteKey: string,
      secretKey: string
    }
  }
  
  if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(defaultRole)) {
    return Response.json({ error: "无效的角色" }, { status: 400 })
  }

  const turnstileConfig = turnstile ?? {
    enabled: false,
    siteKey: "",
    secretKey: ""
  }

  if (turnstileConfig.enabled && (!turnstileConfig.siteKey || !turnstileConfig.secretKey)) {
    return Response.json({ error: "Turnstile 启用时需要提供 Site Key 和 Secret Key" }, { status: 400 })
  }

  const env = getRequestContext().env
  await Promise.all([
    env.SITE_CONFIG.put("DEFAULT_ROLE", defaultRole),
    env.SITE_CONFIG.put("EMAIL_DOMAINS", emailDomains),
    env.SITE_CONFIG.put("ADMIN_CONTACT", adminContact),
    env.SITE_CONFIG.put("MAX_EMAILS", maxEmails),
    env.SITE_CONFIG.put("TURNSTILE_ENABLED", turnstileConfig.enabled.toString()),
    env.SITE_CONFIG.put("TURNSTILE_SITE_KEY", turnstileConfig.siteKey),
    env.SITE_CONFIG.put("TURNSTILE_SECRET_KEY", turnstileConfig.secretKey)
  ])

  return Response.json({ success: true })
}
