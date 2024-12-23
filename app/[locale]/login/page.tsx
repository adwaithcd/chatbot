import { Brand } from "@/components/ui/brand"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/ui/submit-button"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/supabase/types"
import { createServerClient } from "@supabase/ssr"
import { get } from "@vercel/edge-config"
import { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Login"
}

export default async function Login({
  searchParams
}: {
  searchParams: { message: string }
}) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  const session = (await supabase.auth.getSession()).data.session
  const surveyRequired = process.env.SURVEY_REQUIRED || "1"

  if (session) {
    if (surveyRequired === "1") {
      //check if the survey is complete, else redirect to survey
      const { data: surveyResponse } = await supabase
        .from("survey_responses")
        .select("step_completed")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!surveyResponse || surveyResponse.step_completed < 5) {
        return redirect("/survey")
      }
    }

    // if survey is complete navigate to home workspace
    const { data: homeWorkspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(error.message)
    }

    return redirect(`/${homeWorkspace.id}/chat`)
  }

  const signIn = async (formData: FormData) => {
    "use server"

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return redirect(`/login?message=${error.message}`)
    }

    //check if the survey is complete, else redirect to survey
    const { data: surveyResponse } = await supabase
      .from("survey_responses")
      .select("step_completed")
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!surveyResponse || surveyResponse.step_completed < 5) {
      return redirect("/survey")
    }

    const { data: homeWorkspace, error: homeWorkspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      throw new Error(
        homeWorkspaceError?.message || "An unexpected error occurred"
      )
    }

    return redirect(`/${homeWorkspace.id}/chat`)
  }

  const getEnvVarOrEdgeConfigValue = async (name: string) => {
    "use server"
    if (process.env.EDGE_CONFIG) {
      return await get<string>(name)
    }

    return process.env[name]
  }

  const signUp = async (formData: FormData) => {
    "use server"

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const emailDomainWhitelistPatternsString = await getEnvVarOrEdgeConfigValue(
      "EMAIL_DOMAIN_WHITELIST"
    )
    const emailDomainWhitelist = emailDomainWhitelistPatternsString?.trim()
      ? emailDomainWhitelistPatternsString?.split(",")
      : []
    const emailWhitelistPatternsString =
      await getEnvVarOrEdgeConfigValue("EMAIL_WHITELIST")
    const emailWhitelist = emailWhitelistPatternsString?.trim()
      ? emailWhitelistPatternsString?.split(",")
      : []

    // If there are whitelist patterns, check if the email is allowed to sign up
    if (emailDomainWhitelist.length > 0 || emailWhitelist.length > 0) {
      const domainMatch = emailDomainWhitelist?.includes(email.split("@")[1])
      const emailMatch = emailWhitelist?.includes(email)
      if (!domainMatch && !emailMatch) {
        return redirect(
          `/login?message=Email ${email} is not allowed to sign up.`
        )
      }
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // USE IF YOU WANT TO SEND EMAIL VERIFICATION, ALSO CHANGE TOML FILE
        // emailRedirectTo: `${origin}/auth/callback`
      }
    })

    if (error) {
      console.error(error)
      return redirect(`/login?message=${error.message}`)
    }

    return redirect("/setup")

    // USE IF YOU WANT TO SEND EMAIL VERIFICATION, ALSO CHANGE TOML FILE
    // return redirect("/login?message=Check email to continue sign in process")
  }

  const handleResetPassword = async (formData: FormData) => {
    "use server"

    const origin = headers().get("origin")
    const email = formData.get("email") as string
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/login/password`
    })

    if (error) {
      return redirect(`/login?message=${error.message}`)
    }

    return redirect("/login?message=Check email to reset password")
  }

  return (
    <div className="min-h-screen w-full">
      <Tabs defaultValue="home" className="w-full">
        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            <TabsList className="bg-transparent">
              <TabsTrigger
                value="home"
                className="mx-4 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Home
              </TabsTrigger>
              <TabsTrigger
                value="instructions"
                className="mx-8 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Experiment Instructions
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="mx-4 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Provide Feedback
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Home Tab Content */}
        <TabsContent value="home" className="flex items-center justify-center">
          <div className="flex w-full flex-1 flex-col justify-center gap-2 px-8 sm:max-w-md">
            <Brand />
            <form
              className="animate-in text-foreground flex w-full flex-1 flex-col justify-center gap-2"
              action={signIn}
            >
              <Label className="text-md mt-4" htmlFor="email">
                Email
              </Label>
              <Input
                className="mb-3 rounded-md border bg-inherit px-4 py-2"
                name="email"
                placeholder="you@example.com"
                required
              />

              <Label className="text-md" htmlFor="password">
                Password
              </Label>
              <Input
                className="mb-6 rounded-md border bg-inherit px-4 py-2"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />

              <SubmitButton className="mb-2 rounded-md px-4 py-2">
                Login
              </SubmitButton>

              <SubmitButton
                formAction={signUp}
                className="border-foreground/20 mb-2 rounded-md border px-4 py-2"
              >
                Sign Up
              </SubmitButton>

              <div className="text-muted-foreground mt-1 flex justify-center text-sm">
                <span className="mr-1">Forgot your password?</span>
                <button
                  formAction={handleResetPassword}
                  className="text-primary ml-1 underline hover:opacity-80"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Instructions Tab Content */}
        <TabsContent value="instructions" className="p-4">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-2">
              <div className="rounded bg-slate-50 p-4">
                <h3 className="font-medium">Stage One</h3>
                <p className="text-sm">Placeholder for Stage One.</p>
              </div>
              <div className="rounded bg-slate-50 p-4">
                <h3 className="font-medium">Stage Two</h3>
                <p className="text-sm">Placeholder for Stage Two.</p>
              </div>
              <div className="rounded bg-slate-50 p-4">
                <h3 className="font-medium">Stage Three</h3>
                <p className="text-sm">Placeholder for Stage Three.</p>
              </div>
              <div className="rounded bg-slate-50 p-4">
                <h3 className="font-medium">Stage Four</h3>
                <p className="text-sm">Placeholder for Stage Four.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Feedback Tab Content */}
        <TabsContent value="feedback" className="p-4">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-2">
              <div className="rounded bg-slate-50 p-4">
                <h3 className="font-medium">Comment One</h3>
                <p className="text-sm">Placeholder for Comment One.</p>
              </div>
              <div className="rounded bg-slate-50 p-4">
                <h3 className="font-medium">Comment Two</h3>
                <p className="text-sm">Placeholder for Comment Two.</p>
              </div>
              <div className="rounded bg-slate-50 p-4">
                <h3 className="font-medium">Comment Three</h3>
                <p className="text-sm">Placeholder for Comment Three.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {searchParams?.message && (
        <p className="bg-foreground/10 text-foreground mt-4 p-4 text-center">
          {searchParams.message}
        </p>
      )}
    </div>
  )
}
