import { redirect } from 'next/navigation'

/*
  La raíz "/" redirige a /groups.
  Si el usuario no tiene sesión, el middleware lo redirige a /login.
*/
export default function Home() {
  redirect('/groups')
}
