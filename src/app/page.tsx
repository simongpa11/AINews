import { supabase } from '@/lib/supabase'
import Newspaper from '@/components/Newspaper'
import { News } from '@/types'

export const revalidate = 3600 // Revalidate every hour

async function getNews() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true })
    .order('relevance_score', { ascending: false })

  if (error) {
    console.error('Error fetching news:', error)
    return []
  }

  // Group by date
  const grouped = (data || []).reduce((acc: { [key: string]: News[] }, item: News) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  // Convert to array of editions
  return Object.entries(grouped).map(([date, items]) => ({
    date,
    news: items as News[]
  }))
}

export default async function Home() {
  const editions = await getNews()

  // If no news at all, create a mock edition for today
  const finalEditions = editions.length > 0 ? editions : [
    {
      date: new Date().toISOString().split('T')[0],
      news: [
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
    }
  ]

  return (
    <main>
      <Newspaper editions={finalEditions} />
    </main>
  )
}
