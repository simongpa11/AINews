import { supabase } from '@/lib/supabase'
import Newspaper from '@/components/Newspaper'
import { News } from '@/types'

export const revalidate = 3600 // Revalidate every hour

async function getNews() {
  const today = new Date().toISOString().split('T')[0]
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch today's news
  const { data: todayData, error: todayError } = await supabase
    .from('news')
    .select('*')
    .gte('created_at', today)
    .order('relevance_score', { ascending: false })

  // Fetch archive news (last 15 days, excluding today)
  const { data: archiveData, error: archiveError } = await supabase
    .from('news')
    .select('*')
    .lt('created_at', today)
    .gte('created_at', fifteenDaysAgo)
    .order('created_at', { ascending: false })
    .order('relevance_score', { ascending: false })

  if (todayError || archiveError) {
    console.error('Error fetching news:', todayError || archiveError)
    return { today: [], archive: [] }
  }

  return {
    today: (todayData || []) as News[],
    archive: (archiveData || []) as News[]
  }
}

export default async function Home() {
  const { today, archive } = await getNews()

  // Mock data if no news found today (for demo purposes)
  const displayToday = today.length > 0 ? today : [
    {
      id: 'mock-1',
      title: 'Bienvenido a Noticias IA Diarias',
      summary: 'Esta es una demostración de la aplicación Noticias IA Diarias. Una vez conectado a la base de datos y poblado con resúmenes de ChatGPT, tus noticias diarias aparecerán aquí.',
      relevance_score: 10,
      created_at: new Date().toISOString(),
      image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
      original_url: 'https://github.com/simongpa11/AINews'
    }
  ]

  return (
    <main>
      <Newspaper news={displayToday} archive={archive} />
    </main>
  )
}
