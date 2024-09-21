import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default function Page() {
  return <h1>Hello, World!</h1>
}
