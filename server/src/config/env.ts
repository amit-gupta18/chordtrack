import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  cookieSecure:
    process.env.COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production',
  cookieSameSite:
    (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict' | undefined) ??
    (process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
      ? 'none'
      : 'lax'),
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  openaiInsightsModel: process.env.OPENAI_INSIGHTS_MODEL ?? 'gpt-4o',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
}
