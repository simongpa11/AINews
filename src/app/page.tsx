import { supabase } from '@/lib/supabase'
import Newspaper from '@/components/Newspaper'
import { News } from '@/types'

export const revalidate = 3600 // Revalidate every hour

async function getNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching news:', error)
    return []
  }

  return data as News[]
}

export default async function Home() {
  const news = await getNews()

  // Mock data if no news found (for demo purposes)
  const displayNews = news.length > 0 ? news : [
    {
      id: '1',
      title: 'Bienvenido a Noticias IA Diarias',
      summary: 'Esta es una demostración de la aplicación Noticias IA Diarias. Una vez conectado a la base de datos y poblado con resúmenes de ChatGPT, tus noticias diarias aparecerán aquí.',
      relevance_score: 10,
      created_at: new Date().toISOString(),
      image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995', // AI image placeholder
      original_url: 'https://github.com/simongpa11/AINews'
    },
    {
      id: '2',
      title: 'Lanzamiento de Nano Banana 2.0',
      summary: 'Google ha lanzado Nano Banana 2.0, un modelo de generación de imágenes revolucionario. Promete un mejor razonamiento y renderizado de texto.',
      relevance_score: 9,
      created_at: new Date().toISOString(),
      image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
      original_url: '#'
    }
  ]

  return (
    <main>
      <Newspaper news={displayNews} />
    </main>
  )
}
