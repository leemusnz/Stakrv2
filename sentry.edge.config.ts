import * as Sentry from "@sentry/nextjs"
import { baseSentryOptions } from "@/lib/sentry-init-options"

Sentry.init({
  ...baseSentryOptions(),
})
