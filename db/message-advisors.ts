// db/message-advisors.ts

import { supabase } from "@/lib/supabase/browser-client"
import { Tables, TablesInsert } from "@/supabase/types"

export const createMessageAdvisor = async (
  messageAdvisor: TablesInsert<"message_advisors">
) => {
  const { data: createdMessageAdvisor, error } = await supabase
    .from("message_advisors")
    .insert([messageAdvisor])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdMessageAdvisor
}

export const createMessageAdvisors = async (
  messageAdvisors: TablesInsert<"message_advisors">[]
) => {
  const { data: createdMessageAdvisors, error } = await supabase
    .from("message_advisors")
    .insert(messageAdvisors)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  return createdMessageAdvisors
}

export const getMessageAdvisorsByMessageId = async (messageId: string) => {
  const { data: messageAdvisors, error } = await supabase
    .from("message_advisors")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return messageAdvisors
}

export const getMessageAdvisorsByChatId = async (chatId: string) => {
  const { data: messageAdvisors, error } = await supabase
    .from("message_advisors")
    .select("*")
    .eq("chat_id", chatId)

  if (error) {
    throw new Error(error.message)
  }

  return messageAdvisors
}

export const getMessageAdvisorsByUserId = async (userId: string) => {
  const { data: messageAdvisors, error } = await supabase
    .from("message_advisors")
    .select("*")
    .eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  return messageAdvisors
}
