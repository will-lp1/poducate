import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const supabase = createClientComponentClient()

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul>
      {todos?.map((todo: any) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
